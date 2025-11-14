import requests
import json
import re
import pytz
# 
from flask import Blueprint, request, render_template, jsonify
from collections import defaultdict
from os import getenv
from datetime import datetime, timedelta
# 
from .modules.access_handler import access_handler
from .modules.database import create_connect
from .modules import logger
from .modules import jivo_integrator
from . import tg_api_url
from .messages_history import add_message_to_history

tg_api_statuscodes = {
    401: "токен бота невалидный",
    403: "заблокировал бота",
    400: "неподдерживаемое содержимое сообщения",
    429: "сработала антиспам система ТГ",
    500: "ошибка на стороне сервера телеграм",
    502: "проблема на стороне сервера телеграм"

}

users_data_handler = Blueprint('users_data', __name__, url_prefix='/users_data')
# utm-метки, которые собираем
template_utm = ["campaign", "source", "medium", "term", "content"]
# для отправки json в запросах
headers = {'Content-Type': 'application/json'}

# # функции для страницы с фильтрацией юзеров
# # Маршрут для отображения страницы фильтра
# @users_data_handler.get('/')
# def index():
#     return render_template('users_data.html')

def date_to_unix_timestamp(date_str):
    if date_str:
        # Преобразуем строку в объект datetime
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        # Получаем Unix timestamp
        unix_timestamp = int(date_obj.timestamp())
        return unix_timestamp
    else:
        return None

def get_funnel_history(user_ids):
    result = {user_id: [] for user_id in user_ids}
    db, sql = create_connect()
    if user_ids:
        sql.execute("""SELECT user_id, label, datetime
                FROM funnel_history
                WHERE user_id = ANY(%s)
                ORDER BY datetime""", (user_ids,))
    else:
        sql.execute("""SELECT user_id, label, datetime
                FROM funnel_history
                ORDER BY datetime""")
    # Обрабатываем результаты
    for row in sql:
        user_id = row['user_id']
        result[user_id].append({
            'label': row['label'],
            'date': row['datetime']
        })
    db.close()
    
    return result or {}

def get_user_funnel(user_ids):
    result = {user_id: "" for user_id in user_ids}
    db, sql = create_connect()
    if user_ids:
        sql.execute("""SELECT DISTINCT ON (user_id) user_id, label
            FROM user_funnel
            WHERE user_id = ANY(%s)
            ORDER BY user_id, datetime DESC""", (user_ids,))
    else:
        sql.execute("""SELECT DISTINCT ON (user_id) user_id, label
            FROM user_funnel
            ORDER BY user_id, datetime DESC""")
    # Обрабатываем результаты
    for row in sql:
        result[row['user_id']] = row['label']
    db.close()
    
    return result or {}

def get_distinct_values(column_name, sql):
    query = f"SELECT DISTINCT {column_name} FROM lead_resources ORDER BY {column_name};"
    sql.execute(query)
    # Извлекаем все уникальные значения для колонки (включая NULL)
    results = sql.fetchall()
    return [result[column_name] for result in results if result[column_name] not in [None, '']]

# def check_ticket(user_id: int):
#     db, sql = create_connect()
#     query = "SELECT id, status FROM tickets WHERE author_id = $1 LIMIT 1"
#     params = [user_id]
#     sql.execute(query, params)
#     ticket = sql.fetchone()
#     db.close()
#     return ticket if ticket else None

def create_ticket(user_id, msg_text):
    db, sql = create_connect()
    
    # Используем ON CONFLICT для создания или обновления тикета
    sql.execute("""
        INSERT INTO tickets (question, author_id, status) 
        VALUES (%s, %s, 'new')
        ON CONFLICT (author_id) 
        DO UPDATE SET status = CASE WHEN tickets.status = 'closed' THEN 'new' ELSE tickets.status END 
        RETURNING id
    """, (None, user_id))
    
    ticket_id = sql.fetchone()['id']

    # Добавляем пользователя в чат
    sql.execute("INSERT INTO chat_members (user_id, ticket_id) VALUES (-1, %s), (%s, %s) ON CONFLICT DO NOTHING", (ticket_id, user_id, ticket_id))
    
    # Вставляем текст сообщения
    sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s, %s, %s)", (ticket_id, f"Сообщение отправленное рассылкой: {msg_text}", -1))

    db.commit()
    db.close()


def send_user_msg(user_id, msg, buttons=None, files=None):
    inline_keyboard = []
    if buttons:
        for btn in buttons:
            tg_btn = {"text": btn.get("name", "")}
            t = btn.get("type")
            v = btn.get("value", "")
            if t == "callback":
                tg_btn["callback_data"] = v
            elif t == "link":
                tg_btn["url"] = v
            elif t == "webapp":
                tg_btn["web_app"] = {"url": v}
            inline_keyboard.append([tg_btn])

    reply_markup = {"inline_keyboard": inline_keyboard} if inline_keyboard else None

    try:
        if files:
            images = [f for f in files if f.mimetype and f.mimetype.startswith("image/")]
            non_images = [f for f in files if f not in images]

            if len(images) == 1 and not non_images:
                # === 1 картинка: sendPhoto с кнопками ===
                fs = images[0]
                fs.stream.seek(0)
                content = fs.read()
                mime = fs.mimetype or "image/jpeg"
                data = {
                    "chat_id": user_id,
                    "caption": msg,
                    "parse_mode": "Markdown"
                }
                if reply_markup:
                    data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)

                response = requests.post(
                    f"{tg_api_url}/sendPhoto",
                    data=data,
                    files={"photo": (fs.filename, content, mime)}
                )

            elif len(images) > 1 and not non_images:
                # === Несколько картинок: sendMediaGroup + отдельный sendMessage с кнопками ===
                media = []
                files_dict = {}
                for i, fs in enumerate(images[:10]):  # ограничим 10
                    fs.stream.seek(0)
                    content = fs.read()
                    mime = fs.mimetype or "image/jpeg"
                    file_key = f"photo{i}"
                    files_dict[file_key] = (fs.filename, content, mime)
                    media_item = {
                        "type": "photo",
                        "media": f"attach://{file_key}"
                    }
                    media.append(media_item)

                data = {
                    "chat_id": user_id,
                    "media": json.dumps(media, ensure_ascii=False)
                }
                requests.post(f"{tg_api_url}/sendMediaGroup", data=data, files=files_dict)

                # второе сообщение с кнопками
                data2 = {
                    "chat_id": user_id,
                    "text": msg,
                    "parse_mode": "Markdown"
                }
                if reply_markup:
                    data2["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
                response = requests.post(f"{tg_api_url}/sendMessage", data=data2)

            else:
                # === Если есть не-изображения: отправляем как документы ===
                response = None
                for fs in files:
                    fs.stream.seek(0)
                    content = fs.read()
                    mime = fs.mimetype or "application/octet-stream"
                    data = {
                        "chat_id": user_id,
                        "caption": msg if fs == files[0] else None,
                        "parse_mode": "Markdown"
                    }
                    if reply_markup and fs == files[0]:
                        data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)

                    response = requests.post(
                        f"{tg_api_url}/sendDocument",
                        data=data,
                        files={"document": (fs.filename, content, mime)}
                    )

        else:
            # === Без файлов: обычный текст ===
            data = {
                "chat_id": user_id,
                "text": msg,
                "parse_mode": "Markdown"
            }
            if reply_markup:
                data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)

            response = requests.post(f"{tg_api_url}/sendMessage", data=data)

        # Лог в историю
        try:
            db, sql = create_connect()
            sql.execute(
                """INSERT INTO funnel_history (user_id, label) VALUES (%s, %s)""",
                (user_id, f"Получил рассылку с текстом: {msg[:48]}")
            )
            db.commit()
            db.close()
        except Exception as error:
            logger.error(f"Ошибка добавления рассылки в историю воронки юзера: {error}")

        return response.status_code if response else 200
    except Exception as error:
        logger.exception("Ошибка отправки сообщения в ТГ")
        return 0


# Маршрут для отправки сообщения
@users_data_handler.post('/send_msg')
def send_msg():
    # Теперь принимаем multipart/form-data
    data = request.form
    users_str = data.get('users', '[]')
    try:
        users = json.loads(users_str)
    except json.JSONDecodeError:
        return jsonify({"error": "Неверный формат users!"}), 400
    msg = data.get('msg').strip() if data.get('msg') else None  # Исходное сообщение
    buttons_str = data.get('buttons', None)  # buttons как JSON-строка
    files = request.files.getlist('files')  # Список прикрепленных файлов (до 10 изображений)
    custom_ids = data.get('custom_ids', False)
    print(data)

    if custom_ids:
        # Пытаемся распарсить айдишники из строки, если они переданы
        try:
            # Разбить строку по запятым, пробелам и переводам строк с помощью регулярного выражения
            ids = re.split(r'[,\s]+', users.strip())
            # Удалить пустые элементы, если такие есть
            users = [id for id in ids if id]
            if not users:
                return jsonify({"error": "Не удалось извлечь ни одного id из переданного списка id юзеров!"}), 400
        except Exception as error:
            return jsonify({"error": f"Не удалось распарсить список id юзеров! Ошибка: {error}"}), 400
    
    if not users:
        return jsonify({"error": "Не указаны id пользователей!"}), 400
    if not msg:
        return jsonify({"error": "Не указано сообщение!"}), 400

    # Парсим buttons из отдельного поля
    buttons = None
    if buttons_str:
        try:
            buttons = json.loads(buttons_str)
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга buttons: {e}")
            return jsonify({"error": "Неверный формат buttons!"}), 400

    not_sended = []  # сюда попадают id тех кому не удалось отправить
    for user_id in users:
        # отправляем сообщение в ТГ (адаптируйте send_user_msg для файлов)
        result = send_user_msg(user_id=user_id, msg=msg, buttons=buttons, files=files)
        
        if result == 200:
            # Сохраняем сообщение в историю сообщений и в JIVO
            file_info = f" с {len(files)} изображениями" if files else ""
            button_info = f" с кнопками" if buttons else ""
            content = f"Уведомление отправлено из веб-панели: {msg}{file_info}{button_info}"
            result = add_message_to_history(content=content, chat_id=user_id, author_id="-1")
            if result is True:
                logger.debug(f"Сообщение успешно добавлено в историю (user_id={user_id})")
            else:
                logger.error(f"Не удалось добавить сообщение в историю! Ошибка: {result}")
            # Отправляем сообщение в JIVO
            jivo_integrator.send_to_jivo(
                text=content, 
                user_id=user_id,
                url=f"https://telegram.pokerhub.pro/profile/{user_id}")
        else:
            error = tg_api_statuscodes.get(result, None)
            not_sended.append(f"{user_id} - {error or f'необработанная ошибка. Статускод: {result}'}")
    
    # если есть неотправленные сообщения
    if not_sended:
        not_sended_str = "\n".join(not_sended)
        # тут сделать отправку в ДС в алерты
        return jsonify({"message": f"Отправлено сообщений: {len(users)-len(not_sended)}/{len(users)}\n\n{not_sended_str}"}), 400
    # Возвращаем успешный ответ, если все сообщения отправлены
    else:
        return jsonify({"message": "ok"}), 200
    
# возвращает html-код с выпадающими списками, наполненные уник. значениями utm
@users_data_handler.post('/get_utm')
def get_utm():
    # делаем выборку уникальных значений
    db, sql = create_connect()
    #Колонки для которых требуется получить уникальные значения
    utm_columns = ["campaign", "source", "medium", "term", "content"]
    # Словарь для хранения результатов
    utm_values = {"bot": {}, "pokerhub": {}}
    # Получаем уникальные значения для каждой колонки (ютм-ки бота)
    for utm in utm_columns:
        utm_values["bot"][utm] = get_distinct_values(utm, sql) + ["null"]
    db.close()

    # получаем уникальные ютм-ки покерхаба ({"utm_source" : ["1", "2"], "...": [...]})
    try:
        response = requests.get(f"https://pokerhub.pro/api/tg/get-utm")
        if response.status_code == 200:
            utm_values["pokerhub"] = response.json()
        else:
            print(f"[users_data.py] Не удалось запросить UTM-метки с ПХ, ответ от сервера: {response.status_code}")
    except Exception as error:
        print(f"[users_data.py] Не удалось получить уникальные UTM-метки с ПХ: {error}")

    return jsonify(utm_values)

@users_data_handler.post('/gotofunnel')
def gotofunnel():
    data = request.get_json()
    users = data.get('users', [])
    custom_ids = data.get('custom_ids', False)

    if custom_ids:
        # Пытаемся распарсить айдишники из строки, если они переданы
        try:
            # Разбить строку по запятым, пробелам и переводам строк с помощью регулярного выражения
            ids = re.split(r'[,\s]+', users.strip())
            # Удалить пустые элементы, если такие есть
            users = [id for id in ids if id]
            if not users:
                return jsonify({"error": "Не удалось извлечь ни одного id из переданного списка id юзеров!"}), 400
        except Exception as error:
            return jsonify({"error": f"Не удалось распарсить список id юзеров! Ошибка: {error}"}), 400
        
    if not users:
        return jsonify({"error": "Не указаны id пользователей!"}), 400
    
    date_time = data.get('datetime', '')  # Исходное сообщение
    if date_time:
        date_time_unix = datetime.strptime(date_time, "%Y-%m-%dT%H:%M")
        moscow_tz = pytz.timezone('Europe/Moscow')
        dt_moscow = moscow_tz.localize(date_time_unix)
        # Преобразование в timestamp Unix
        timestamp = int(dt_moscow.timestamp())

    funnel = data.get('funnel', '')
    if not users or not date_time or not funnel:
        return {"error": "Заполните все поля!"}, 400
    
    db, sql = create_connect()
    print(f"Продвигаем юзеров: {users} по воронке на этап: {funnel}")
    for user_id in users:
        sql.execute("""
            INSERT INTO notifications (user_id, time_to_send, label, is_active) 
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (user_id, timestamp, funnel, True))
        db.commit()
    db.close()

    return {"message": "Успех!"}, 200

@users_data_handler.post('/get_funnel')
def get_funnel():

    query = f"""
        SELECT label, key FROM funnel;
    """

    db, sql = create_connect()
    sql.execute(query)
    users_data = sql.fetchall()
    if users_data:
        unique_labels = set()
        unique_texts = []
        for row in users_data:
            if row['label'] not in unique_labels:
                unique_texts.append({"label": row['label'], "key": row['key']})
                unique_labels.add(row['label'])
    else:
        unique_texts = []
    db.close()

    return unique_texts

# возвращает инфу по юзерам в json-формате, фильтруя данные
# этот маршрут предназначен для странички с фильтрами по юхерам по utm-меткам, датам и т.д.
@users_data_handler.post('/filter')
def users_data(user=None):
    filter_ = request.json
    params = []  # параметры для SQL запроса
    query_where_parts = []  # части WHERE условия
    print(filter_)

    """
    utm-метки должны быть в виде списка campaign: ["math"]
    is_blocked - в виде списка [0, 1] или без аргумента (тогда все)
    date_start и date_end - строка гггг.мм.дд
    """
    if filter_:
        # брать инфу только по юзерам с ПХ
        user_type = filter_.get("user_type", 'all')
        # даты регистрации
        ph_reg_start = filter_.get("ph_reg_start", None)
        ph_reg_end = filter_.get("ph_reg_end", None)

        # этапы воронки
        funnel = filter_.get("funnel", None)
        revfunnel = filter_.get("revfunnel", None)

        # даты последней активности
        ph_last_activity_start = date_to_unix_timestamp(filter_.get("ph_last_activity_start", None))
        ph_last_activity_end = date_to_unix_timestamp(filter_.get("ph_last_activity_end", None))
        # группы пользователей
        groups = filter_.get("groups", [])
        # ютм-метки с ПХ
        ph_utm = filter_.get("pokerhub_utm", {}) # {'utm_medium': ['test2', 'target'], 'utm_source': ['vkontaktecash', 'vkontaktemtt']}


        # получаем переданные utm-метки
        utm = {key: filter_.get(key, None) for key in template_utm}

        date_start = filter_.get("date_start", None)
        date_end = filter_.get("date_end", None)
        is_blocked = filter_.get("is_blocked", None)


        # добавление фильтров по utm-меткам
        if utm:
            # проходимся по шаблонным названиям utm-меток
            for key, value in utm.items():
                # если не None
                if value:
                    # добавляем выборку по этой метке
                    
                    if "null" in value:
                        query = f'({key}=ANY(%s) OR ({key} IS NULL))'
                        value[value.index("null")] = None
                    else:
                        query = f"{key}=ANY(%s)"

                    query_where_parts.append(query)
                    params.append(value)

        # добавление фильтра, заблочил-ли юзер бота
        if is_blocked:
            query_where_parts.append("user_block=ANY(%s)")
            params.append(is_blocked)

        # добавление фильтра по диапазону дат
        if date_start and date_end:
            query_where_parts.append("(u.timestamp_registration >= %s AND u.timestamp_registration <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day')")
            params.extend([date_start, date_end])
        elif date_start:  # Только начальная дата указана
            query_where_parts.append("u.timestamp_registration >= %s")
            params.append(date_start)
        elif date_end:  # Только конечная дата указана
            query_where_parts.append("u.timestamp_registration <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day'")
            params.append(date_end)

        where_condition = " AND ".join(query_where_parts)  # сформированное WHERE условие
    else:
        where_condition = None

    query = f"""
        SELECT DISTINCT
            u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.user_block,
            u.timestamp_registration AS registration,
            lr.campaign,
            lr.source,
            lr.medium,
            lr.term,
            lr.content,
            lr.referer_url,
            lr.raw_link
        FROM
            users u
        LEFT JOIN
            lead_resources lr ON u.id = lr.user_id
        LEFT JOIN
            notifications n ON u.id = n.user_id
        {f'WHERE {where_condition} AND u.id > 0' if where_condition else 'WHERE u.id > 0'}
        ORDER BY registration ASC
    """

    db, sql = create_connect()
    sql.execute(query, params)
    users_data = sql.fetchall()
    db.close()

    # получаем данные для вкладок
    users = users_tab(users_data=users_data)
    # если есть такие юзеры - делаем запрос на ПХ
    if users:
        # Сохраняю айдишки юзеров для последующих выборок из БД
        user_ids = [user_id.get("id") for user_id in users]
        ph_users = get_users(users=user_ids, 
            authorization={"start": ph_reg_start if ph_reg_start else None, "end": ph_reg_end if ph_reg_end else None}, 
            last_visit={"start": ph_last_activity_start if ph_last_activity_start else None, "end": ph_last_activity_end if ph_last_activity_end else None},  
            groups=groups)
        
        if ph_users and type(ph_users) == list:
            # Преобразование ph_users в словарь для быстрой проверки
            ph_users = {
                int(user['tg_id']): user for user in ph_users
            }
        else:
            logger.error(f"ph_users={ph_users}, но ожидался список юзеров!")
            ph_users = {}

        # если передан флаг, что нужно вернуть только юзеров которые есть на ПХ
        if user_type == 'ph_registered':
            # оставляем только тех юзеров которые есть и в ПХ
            users = [user for user in users if user['id'] in ph_users]
        elif user_type == 'ph_not_registered':
            # оставляем только тех юзеров которые не регнулись в ПХ
            users = [user for user in users if user['id'] not in ph_users]

        # получаем историю действий юзеров в боте
        funnel_history = get_funnel_history(user_ids=user_ids)
        # получаем последний этап воронки для юзера
        user_funnel = get_user_funnel(user_ids=user_ids)

        tmp_users = []
        # добавляем данные для полей
        for user in users:
            ph_user_data = ph_users.get(user['id'], {})
            # Добавление данных в user

            auth_date = ph_user_data.get('authorization_date', '')
            # если есть дата авторизации
            if auth_date:
                auth_date = convert_date(auth_date)

            active_date = ph_user_data.get('last_visit_date', '')
            # если есть дата последней активности
            if active_date:
                active_date = convert_date(active_date)

            # Откуда юзер произвел регистрацию на ПХ
            referer = "" if ph_user_data.get('referer') in ["none", None] else ph_user_data.get('referer')
            db_referer = "" if not user.get('referer') else user.get('referer')

            # print(f"referer={referer}\ndb_referer={db_referer}\n\n")

            user['authorization_date'] = auth_date
            user['last_visit_date'] = active_date
            user['group'] = ph_user_data.get('group', '')
            user['courses'] = ph_user_data.get('courses', {})
            user['referer'] = db_referer or referer
            user['funnel_history'] = funnel_history.get(user['id'], [])
            user['user_funnel'] = user_funnel.get(user['id'], "")

            # отбрасываем пустые ютм-ки, чтобы не захламлять таблицу
            tmp_utms = {}
            for utm_key, utm_value in user.get('utm', {}).items():
                if utm_value:
                    tmp_utms[utm_key] = utm_value
            user['utm'] = tmp_utms
            user['ph_utm'] = ph_user_data.get("utm", None)
            # фильтруем по истории юзеров
            if funnel and not any(d['label'] in funnel for d in user['funnel_history']):
                pass
            elif revfunnel and any(d['label'] in revfunnel for d in user['funnel_history']):
                pass
            else:
                tmp_users.append(user)
        users = tmp_users


        # фильтруем данные, отсеивая по ПХ ЮТМ (если фильтр указан)
        if ph_utm:
            tmp_users = []
            filters_count = len(ph_utm.keys())
            for user in users:
                finded_utm = 0
                for utm_key, utm_value in user.get("utm", {}).items():
                    if utm_value in ph_utm.get(utm_key, []):
                        finded_utm += 1
                if finded_utm == filters_count:
                    tmp_users.append(user)
            users = tmp_users
            
        # print(ph_users)
        # print("\n\n\n")
        # print(users)


    general = general_tab(users=users, delimiter=">", utm="utm")
    ph_utms = general_tab(users=users, delimiter=">", utm="ph_utm")
    charts = charts_tab(date_start=date_start, date_end=date_end, users=users)


    # формированные данные для ответа
    formatted_data = {
                        "users": users,
                        "general": general,
                        "ph_utms": ph_utms,
                        "charts": charts     
                    }

    # возвращаем json в ответ
    # print(general)
    return formatted_data, 200


# Возвращает стату по регам
@users_data_handler.get('/get_stats')
def get_stats(user=None):
    ph_reg_start = request.args.get('date_start')
    ph_reg_end = request.args.get('date_end')

    ph_users = get_users(
        users=None, 
        authorization={"start": ph_reg_start if ph_reg_start else None, "end": ph_reg_end if ph_reg_end else None}, 
        last_visit=None,
        groups=None
        )
    
    if ph_users:
        ph_users = {
            int(user['tg_id']): user for user in ph_users if 'tg_id' in user and user['tg_id']
        }
    else:
        ph_users = {}
    users = []
    # добавляем данные для полей
    for user in ph_users.values():
        auth_date = user.get('authorization_date', '')
        # если есть дата авторизации
        if auth_date:
            user['authorization_date'] = convert_date(auth_date)

        # отбрасываем пустые ютм-ки, чтобы не захламлять таблицу
        user['utm'] = user.get('utm') or {}

        users.append(user)

    general = general_tab(users=users, delimiter="➖")

    return general, 200


# для запроса с ПокерХаб данных о юзерах с фильтрами. Суть: фронтенд (веб-панель)
# посылает запрос сюда, тут формируется запрос для выборки юзеров с PH, отправляется
# запрос, и данные возвращаются в фронт для отображения.

def convert_date(date_str: str):
    # конвертирует дату полученную с ПХ в вид ГГГГ-ММ-ДД
    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    # Извлечение только даты в формате YYYY-MM-DD
    return dt.strftime('%Y-%m-%d')

def get_users(users, authorization, groups, last_visit):
    # получаем JSON из запроса клиента
    # input_data = request.json

    """
    формат данных фильтра:
    {
        "users": [],
        "authorization": {"start": "2021-08-01", "end": "2022-08-01"},
        "groups": [], 
        "lessons_completed": 42,
        "last_visit": {"start": "2021-08-15", "end": "2022-08-15"},
    }

    нужно учитывать, что если я передам дату "2020-01-01" например, то она будет
    конвертирована в кол-во секунд с начала Эпохи до НАЧАЛА этого дня, а не до конца.
    Соответственно, если такая дата попадёт в фильтр end, то не будет работать выборка
    для этого дня ВКЛЮЧИТЕЛЬНО. Соответственно, нужно будет делать для end +1 day
    """

    input_data = {
        "users": users,
        "groups": groups,
        "authorization": authorization,
        "last_visit": last_visit
        }

    try:
        # запрос к API PokerHub
        response = requests.post('https://pokerhub.pro/api/tg/getusers', json=input_data, headers=headers)
        # смотрим статус ответа
        response.raise_for_status()
    except requests.RequestException as e:
        # возвращаем ошибку, если что-то пошло не так
        return jsonify({'error': 'Request failed', 'details': str(e)}), 502
    
    # ответ от PokerHub в виде JSON
    pokerhub_response_data = response.json()

    # возвращаем этот ответ в фронт
    return pokerhub_response_data


def users_tab(users_data):
    # Данные для вкладки Юзеры
    users = [
        {
            "id": record.get("id", None),
            "username": f'@{record.get("username", None)}',
            "first_name": record.get("first_name") or "",
            "last_name": record.get("last_name") or "",
            "registration": record.get('registration').date().isoformat(), # приводим timestamp в ISO-формат, чтобы можно было сериализировать в json
            "is_blocked": record.get('user_block', None),
            "utm": {key: record.get(key, None) for key in template_utm},
            "referer": record.get("referer_url", None),
            "raw_link": record.get("raw_link") or ""
        }
        for record in users_data
    ]

    return users

def utm_to_string(utm):
    return ''.join(f'{key}{value}' for key, value in sorted(utm.items()))

def general_tab(users, delimiter=">", utm="utm"):
    """
    delimiter - символ для отступов для визуализации уровней
    """
    counts = defaultdict(int)
    # Определите порядок меток
    utm_order = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', "campaign", "medium", "source", "content", "term"]

    # Функция для сортировки пользователей по меткам в нужном порядке
    def sort_key(user):
        utm_dict = user.get(utm, {})
        if not utm_dict:
            utm_dict = {}
        # Формируем ключ только из меток, которые есть в utm_order
        sorted_utm = [(key, utm_dict.get(key)) for key in utm_order if key in utm_dict]
        return sorted_utm

    # Сортировка пользователей
    sorted_users = sorted(users, key=sort_key)

    # Учет пользователей, которые не соответствуют utm_order
    unmatched_users = []
    users_count = 0
    # Процесс обработки каждого пользователя
    for record in sorted_users:
        label = ""
        tree_count = 0
        matched = False
        utms = record.get(utm, {})
        if utms:
            users_count += 1
        for utm_key in utm_order:
            utm_value = utms.get(utm_key, None) if utms else None
            if utm_value is not None:  # Если значение есть в utm_order, добавляем
                matched = True
                tree_count += 1
                label += f"{utm_key}: {utm_value if utm_value else 'null'}\n"
                formated_label = f"{delimiter * tree_count} {label.strip()}"
                counts[formated_label] += 1

        # Если метки не соответствуют utm_order, добавляем их в unmatched_users
        if not matched:
            unmatched_users.append(record)

    # Обработка unmatched_users
    for record in unmatched_users:
        label = ""
        tree_count = 0
        if record.get(utm):
            for utm_key, utm_value in record.get(utm, {}).items():
                tree_count += 1
                label += f"{utm_key}: {utm_value if utm_value else 'null'}\n"
                formated_label = f"{delimiter * tree_count} {label.strip()}"
                counts[formated_label] += 1

    # Формирование итогового списка
    general = [{"label": label, "count": count} for label, count in counts.items()]
    general.insert(0, {"label": "Всего", "count": users_count})

    return general

 

def charts_tab(date_start, date_end, users):
    # данные для графиков

    # проверяем дату старта
    if date_start:
        start_date = datetime.strptime(date_start, "%Y-%m-%d")
    else:
        start_date = datetime.strptime(users[0].get("registration"), "%Y-%m-%d") if len(users) else datetime.now() - timedelta(days=30)

    # проверяем дату окончания
    if date_end:
        finish_date = datetime.strptime(date_end, "%Y-%m-%d")
    else:
        finish_date = datetime.strptime(users[-1].get("registration"), "%Y-%m-%d") if len(users) else datetime.now() 

    # проверяем чтобы дата начала не была больше даты окончания
    if start_date > finish_date:
        finish_date = start_date

    # с какого дня будем выводить данные (-1 месяц т.к. в графике отсчёт с 0)
    first_day = {"year": start_date.year, "month": start_date.month-1, "day": start_date.day}

    line_dates_chart_data = {} # сюда попадают кол-во юзеров по дням
    unique_utm_count = {} # сюда попадают кол-ва меток
    default_dates_dict = {} # генерируем сюда дефолтные дни

    # наполняем словарь датами с нулями в значениях
    current_date = start_date
    while current_date <= finish_date:
        default_dates_dict[current_date.strftime("%Y-%m-%d")] = 0
        current_date += timedelta(days=1)

    for user in users:
        utm = "-".join([value if value else 'null' for value in user.get("utm").values()])
        if utm not in line_dates_chart_data:
            line_dates_chart_data[utm] = {key: value for key, value in default_dates_dict.items()}
            unique_utm_count[utm] = 0

        if user.get('registration') in line_dates_chart_data[utm]:
            line_dates_chart_data[utm][user.get('registration')] += 1
            unique_utm_count[utm] += 1
        else:
            line_dates_chart_data[utm][user.get('registration')] = 1
            unique_utm_count[utm] = 1

    # print(line_dates_chart_data)

    # переводим даты в строки для вставки в ответы
    start_date_str = start_date.strftime('%d.%m.%Y')
    finish_date_str = finish_date.strftime('%d.%m.%Y')

    # получаем данные для линейного графика
    line_chart_data = get_line_chart_data(first_day=first_day, 
                                start_date_str=start_date_str, 
                                finish_date_str=finish_date_str, 
                                line_dates_chart_data=line_dates_chart_data
                                )
    # получаем данные для круговых диаграмм
    circle_charts_data = get_charts_data(start_date_str=start_date_str,
                                        finish_date_str=finish_date_str,
                                        users=users)

    # получаем данные для столбчатой диаграммы
    bar_chart_data = get_bar_chart_data(start_date_str=start_date_str,
                                        finish_date_str=finish_date_str,
                                        unique_utm_count=unique_utm_count)

    charts = {
                "line_dates_chart": line_chart_data,
                "circle_charts_data": circle_charts_data,
                "bar_chart_data": bar_chart_data
             }

    return charts

def get_line_chart_data(first_day, start_date_str, finish_date_str, line_dates_chart_data):
    # формируем данные для линейного списка
    data = {"data":
        [
            {
            'name': key,
            'data': [count for count in value.values()]
            } for key, value in line_dates_chart_data.items()
        ] if line_dates_chart_data else 
        [{
            'type': 'line',
            'name': 'none',
            'data': []
        }],
    "start_date": first_day,
    "dots": True if (start_date_str == finish_date_str) else False,
    "title": f"Количество новых пользователей с {start_date_str} по {finish_date_str}" if line_dates_chart_data else "Нет данных для отображения. Измените фильтры"
    }

    return data

def get_charts_data(start_date_str, finish_date_str, users):
    # формируем данные для круговых диаграмм

    # считаем кол-во меток
    utm_counts = defaultdict(lambda: defaultdict(int))
    for user_data in users:
        for key, value in user_data['utm'].items():
            utm_counts[key][value] += 1
    # print(utm_counts)

    data = {"title":f"Процентное соотношение по меткам с {start_date_str} по {finish_date_str}" if users else f"Нет данных для отображения. Измените фильтры",
            "data":[{
            "name":name,
            "center": [100 + 400 * i, 100],
            "size": 200,
            "colorByPoint": True,
            "data":[{'name': key if key else "null", 'y': value} for key, value in utm_counts[name].items()]
            } for i, name in enumerate(template_utm)]
            }
    # print(data)
    return data

def get_bar_chart_data(start_date_str, finish_date_str, unique_utm_count):
    data = {
                "data":[{
                    'name': key if key else 'null',
                    'y': value,
                } for key, value in unique_utm_count.items()],
                "title": f"Пользователей за период с {start_date_str} по {finish_date_str}" if unique_utm_count else f"Нет данных для отображения. Измените фильтры"
            }

    return data


