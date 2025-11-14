import re
import requests
import hashlib
import shutil
# 
from flask import Blueprint, request, render_template, jsonify, send_from_directory
from collections import defaultdict
from werkzeug.utils import secure_filename
from os import getenv, path
from datetime import datetime
# 
from .modules.access_handler import access_handler
from .modules.database import create_connect
from . import tg_api_url, domain, AMO_TOKEN, AMO_DOMAIN, SECRET_KEY, is_valid_key
from .modules.send_tg import send_tg_message

leads_handler = Blueprint('amo_leads', __name__, url_prefix='/amo_leads')

# все статусы
status_mapping = {
    "active": {
        29327683: "Неразобранное",
        29327686: "Получена заявка",
        49045516: "Связаться повторно!",
        29327689: "Первичный контакт",
        49008214: "Связаться позже",
        29327692: "Анализ данных и составление КП",
        29327695: "Презентация и отправка КП",
        29329477: "Ждем решения, работа с возражениями",
        29329480: "Ждем документы",
        29329483: "Проверка документов, подтверждение личности",
        29329486: "Подписание договора",
        29329489: "Ввод игрока в проект"
    },
    "closed": {
        142: "Успешно реализовано",
        143: "Закрыто и не реализовано",
        -1: "Заявка удалена"
    }
}
# данные для инициации заявки в АМО из веб-панели (вкладка Пользователи)
status_id = 29327686
pipeline_id = 1976686

def get_headers():
    return {
        'Authorization': f'Bearer {AMO_TOKEN}',
        'Content-Type': 'application/json'
    }
 
@leads_handler.route('/')
def amo_leads():
    key = request.args.get('key')
    if not is_valid_key(key):
        return "Invalid key", 403
    return render_template('amo_leads.html', key=key, domain=domain, status_mapping=status_mapping)


@leads_handler.get('/get_leads')
def get_amo_leads():
    key = request.args.get('key')
    if not is_valid_key(key):
        return "Invalid key", 403

    db, sql = create_connect()

    status = request.args.getlist('status[]')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    inverse = request.args.get('inverse', 'false').lower() == 'true'

    # print(f"{status}\n{category}\n{inverse}\n")
    
    query = "SELECT lead_id, user_id, status, created_at FROM amo_leads WHERE 1=1"
    params = []

    if status:
        # то делаем выборку по статусам
        if inverse:
            query += " AND status NOT IN %s"
        else:
            query += " AND status IN %s"
        params.append(tuple(status))

    if start_date:
        query += " AND created_at >= %s"
        params.append(start_date)

    if end_date:
        query += " AND created_at <= %s"
        params.append(end_date)

    sql.execute(query, params)
    leads = sql.fetchall()

    sql.close()
    db.close()

    return jsonify(leads)


# вебхук для изменения статуса заявки в БД при изменении его в АМО
@leads_handler.post('/webhook')
def webhook():
    key = request.args.get('key')
    if not is_valid_key(key):
        return jsonify({"error": "Unauthorized"}), 403

    if request.content_type == 'application/x-www-form-urlencoded':
        data = request.form.to_dict()
        # print(data)
        leads = {}
        for key, value in data.items():
            if key.startswith('leads[status]'):
                match = re.match(r'leads\[status\]\[(\d+)\]\[(\w+)\]', key)
                if match:
                    index = int(match.group(1))
                    field = match.group(2)
                    if index not in leads:
                        leads[index] = {}
                    leads[index][field] = value
            elif key.startswith('leads[delete]'):
                match = re.match(r'leads\[delete\]\[(\d+)\]\[(\w+)\]', key)
                if match:
                    index = int(match.group(1))
                    field = match.group(2)
                    if index not in leads:
                        leads[index] = {}
                    leads[index][field] = value
                    leads[index]['deleted'] = True

        if leads:
            db, sql = create_connect()
            
            for lead in leads.values():
                lead_id = lead['id']
                if 'deleted' in lead:
                    status = -1
                else:
                    status = lead['status_id']
                query = "UPDATE amo_leads SET status = %s WHERE lead_id = %s"
                sql.execute(query, (status, lead_id))

            db.commit()
            sql.close()
            db.close()
        
        return jsonify({"status": "success"}), 200
    else:
        return jsonify({"error": "Request must be JSON"}), 400


@leads_handler.get('/get_lead_data')
def get_lead_data():
    key = request.args.get('key')
    lead_id = request.args.get('lead_id')
    if not is_valid_key(key):
        return "Invalid key", 403

    url = f'{AMO_DOMAIN}/api/v4/leads/{lead_id}'
    response = requests.get(url, headers=get_headers())

    if response.status_code == 200:
        lead_data = response.json()
        custom_fields = lead_data.get('custom_fields_values', [])

        selected_fields = {}
        for field in custom_fields:
            field_name = field.get('field_name')
            field_value = field.get('values', [{}])[0].get('value')

            if field_name in [
                'Ваше имя',
                'Месседжер',
                'Номер телефона для связи',
                'На каком этапе отвалился',
                'Причина отказа'
            ]:
                selected_fields[field_name] = field_value

        if not selected_fields:
            selected_fields['empty'] = "в АМО нет данных для этого пользователя"

        return jsonify(selected_fields), 200
    else:
        return jsonify({"error": f"не удалось запросить данные из АМО. Статус-код ответа от АМО: {response.status_code}"}), 200



@leads_handler.get('/dialog')
def amo_dialog():
    key = request.args.get('key')
    lead_id = request.args.get('lead_id')
    if not is_valid_key(key):
        return "Invalid key", 403

    db, sql = create_connect()
    query = "SELECT 1 FROM amo_leads WHERE lead_id = %s"
    sql.execute(query, (lead_id,))
    lead_exists = sql.fetchone()
    sql.close()
    db.close()

    if not lead_exists:
        return render_template('lead_not_found.html', lead_id=lead_id)

    return render_template('amo_dialog.html', lead_id=lead_id, key=key, domain=domain)


@leads_handler.get('/get_messages')
def get_messages():
    key = request.args.get('key')
    lead_id = request.args.get('lead_id')
    if not is_valid_key(key):
        return "Invalid key", 403

    db, sql = create_connect()
    query = "SELECT msg, is_user, timestamp FROM amo_msg WHERE lead_id = %s ORDER BY timestamp ASC"
    sql.execute(query, (lead_id,))
    messages = sql.fetchall()

    sql.close()
    db.close()

    return jsonify(messages)


# для создания лида в БД
@leads_handler.post('/add_lead')
def add_lead():
    key = request.json.get('key')
    user_id = request.json.get('user_id')
    lead_id = request.json.get('lead_id')
    status = request.json.get('status')

    if not is_valid_key(key):
        return jsonify({"error": "Invalid key"}), 403
    db, sql = create_connect()
    query = "INSERT INTO amo_leads (user_id, lead_id, status) VALUES (%s, %s, %s)"
    sql.execute(query, (user_id, lead_id, status))

    db.commit()
    sql.close()
    db.close() 
    return jsonify({"success": True}), 200

@leads_handler.post("/create_amo_lead")
def create_amo_lead():
    user_id = request.json.get('user_id')
    first_name = request.json.get('first_name')
    username = request.json.get('username')

    url = f'{AMO_DOMAIN}/api/v4/leads'

    # проверяем, нет-ли у юзера уже заявки
    result = is_have_amo_lead(user_id=user_id)
    if result:
        return jsonify({"message": f"У пользователя уже есть активная заявка. ID заявки: {result}"}), 400

    # создаём пустую заявку
    payload = {
        "data": None
    }
    response = requests.get(url, json=payload, headers=get_headers())

    if not response.status_code == 200:
        return jsonify({"message": f"Ошибка при создании заявки. Статускод: {response.status_code}"}), 400
    else:
        server_answer = response.json()
        lead_id = server_answer['_embedded']['leads'][0]['id']

    payload = {
        'name': f"Заявка #{lead_id} на консультацию в команду из ТГ-бота @FireStormRobot",
        'status_id': status_id,
        'pipeline_id': pipeline_id,
        'custom_fields_values': [
        {"field_id": 610331, "values": [{"value": first_name}]},
        {"field_id": 616985, "values": [{"value": f"@{username}"}]},
        {"field_id": 1080611, "values": [{"value": f"https://telegram.firestorm.team/profile/{user_id}"}]} # ссылка на профиль в веб-панели
        ]
    }

    # обновляем данные в новой заявке
    response = requests.patch(f"{url}/{lead_id}", json=payload, headers=get_headers())
    if response.status_code == 200:
        # если успешно создана заявка, добавляем в БД
        db, sql = create_connect()
        query = "INSERT INTO amo_leads (user_id, lead_id, status) VALUES (%s, %s, %s)"
        sql.execute(query, (user_id, lead_id, status_id))
        db.commit()
        sql.close()
        db.close()
        return jsonify({"message": f"Заявка создана успешно! ID: {lead_id}"}), 200
    else:
        return jsonify({"message": f"Ошибка при обновлении заявки. Статускод: {response.status_code}"}), 400


    # print(f"{user_id}\n{first_name}\n{username}")

# генерирует хеш скачиваемого файла, чтобы не дублировать одинаковые файлы на сервере
def generate_file_hash(file):
    hasher = hashlib.md5()
    buf = file.read(65536)
    while len(buf) > 0:
        hasher.update(buf)
        buf = file.read(65536)
    file.seek(0)
    return hasher.hexdigest()


# маршрут возвращает юзеру файл из папки uploaded_files
@leads_handler.get('/uploads/<filename>')
def download_file(filename):
    uploads_dir = 'uploaded_files'
    safe_filename = path.basename(filename)

    try:
        # проверяем наличие файла
        if not path.exists(path.join(uploads_dir, safe_filename)):
            return jsonify({"error": "Файл не найден на сервере"}), 404
        return send_from_directory(uploads_dir, safe_filename, as_attachment=True)
    except Exception as error:
        return jsonify({"error": str(error)}), 400


@leads_handler.post('/send_message')
def send_message():
    # json приходит от бота, form из веб-панели. Файлы из бота не передаются в веб
    # панель. Файлы можно отправлять только ИЗ веб-панели (возможно потом нужно будет
    # сделать, чтобы бот тоже файлы сохранял и отображал от юзера)
    if request.is_json:
        data = request.json
        is_user = data.get('is_user')
        files = [] # оставляем пустым, т.к. через json мы файлы не передаём
    else:
        data = request.form
        is_user = data.get('is_user', 'false').lower() == 'true'
        files = request.files.getlist('files')

    # считываем остальные значения
    key = data.get('key')
    lead_id = data.get('lead_id')
    message = data.get('message')
    
    if not is_valid_key(key):
        return jsonify({"error": "Invalid key"}), 403

    db, sql = create_connect()
    query = "SELECT user_id FROM amo_leads WHERE lead_id = %s"
    sql.execute(query, (lead_id,))
    lead_exists = sql.fetchone()

    if not lead_exists:
        sql.close()
        db.close()
        return jsonify({"error": "Lead not found"}), 400

    file_links = []
    for file in files:
        filename = secure_filename(file.filename)
        file_hash = generate_file_hash(file)
        unique_filename = f"{file_hash}_{filename}"
        file_path = path.join("uploaded_files", unique_filename)

        # Проверяем, существует ли файл с таким именем
        if not path.exists(file_path):
            file.save(file_path)
        file_links.append((filename, f"uploads/{unique_filename}"))

    if not is_user:
        result, error_text = send_tg_message(chat_id=lead_exists.get('user_id'), message=message, files=file_links)
        if not result:
            sql.close()
            db.close()
            return jsonify({"error": error_text}), 400

    message_with_links = "\n".join([f'<a href="{link}">{original_filename}</a>' for original_filename, link in file_links]) + f"\n{message}"
    query = "INSERT INTO amo_msg (lead_id, msg, is_user, timestamp) VALUES (%s, %s, %s, %s)"
    sql.execute(query, (lead_id, message_with_links, is_user, datetime.utcnow()))
    db.commit()

    sql.close()
    db.close()

    return jsonify({"success": True}), 200



# для запроса, есть ли активная заявка в АМО. Возвращает id заявки
@leads_handler.post('/is_have_amo_lead')
def check_amo_lead():
    key = request.json.get('key')
    user_id = request.json.get('user_id')

    if not is_valid_key(key):
        return jsonify({"error": "Invalid key"}), 403

    result = is_have_amo_lead(user_id=user_id)
    return jsonify({"lead_id": result}), 200

@leads_handler.get('/disk_space')
def get_disk_space():
    key = request.args.get('key')
    if not is_valid_key(key):
        return jsonify({"error": "Invalid key"}), 403
    
    total, used, free = shutil.disk_usage("/")
    used_percent = (used / total) * 100
    free_percent = (free / total) * 100
    
    return jsonify({
        "total": total,
        "used": used,
        "free": free,
        "used_percent": used_percent,
        "free_percent": free_percent
    }), 200

# проверка на активную заявку в АМО
def is_have_amo_lead(user_id):
    db, sql = create_connect()
    query = """
            SELECT lead_id 
            FROM amo_leads 
            WHERE user_id = %s 
            AND status = ANY(%s)
            LIMIT 1
            """
    sql.execute(query, (user_id, list(status_mapping['active'].keys())))
    lead = sql.fetchone()
    db.close()

    if lead:
        return lead.get('lead_id')

    return False

