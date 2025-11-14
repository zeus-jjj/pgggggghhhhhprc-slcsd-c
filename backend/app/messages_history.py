import datetime
import requests
from json import dumps, loads
from flask import Blueprint, request
from flask_socketio import join_room
from .modules.access_handler import access_handler
from .modules.database import create_connect
from . import socketio, ds_channel, ds_token, MAX_CHARS_USERS_HISTORY, JIVO_INTEGRATOR_URL
from .modules import logger

messages_handler = Blueprint('messages_history', __name__, url_prefix='/messages_history')


@messages_handler.get('/')
@access_handler((1, 2, 3))
def get_tickets(user):
    db, sql = create_connect()
    filter_ = request.args.get('filter')
    if filter_ is None:
        return {}, 403

    filter_ = loads(filter_)
    id = '%' + str(filter_.get('id')) + '%'
    author_name = '%' + str(filter_.get('author_name')) + '%'
    sort_by_new = filter_.get('sort_by_new')
    limit = filter_.get('limit')

    sql.execute("""
        WITH last_messages AS (
            SELECT DISTINCT ON (chat_id) 
                id, chat_id, author_id, content, type, name, create_at AS last_msg_time
            FROM messages_history
            WHERE id::text LIKE %s
            ORDER BY chat_id, create_at DESC
        )
        SELECT 
            lm.id, lm.chat_id, lm.author_id, lm.content, lm.type, lm.name, lm.last_msg_time,
            CONCAT('@', u.username) AS author_name
        FROM last_messages lm
        JOIN users u ON u.id::TEXT = lm.chat_id
        WHERE u.username LIKE %s
        ORDER BY lm.last_msg_time {}
        LIMIT %s;
    """.format("DESC" if sort_by_new else "ASC"), (id, author_name, limit))
    """
    ТУТ МОЖЕТ БЫТЬ БАГ, КОГДА В ТАБЛИЦЕ ЮЗЕРОВ НЕТ СОВПАДЕНИЯ ПО ЮЗЕР-АЙДИ (Т.К. СООБЩЕНИЯ МОГУТ ПРИХОДИТЬ ИЗ
    ВНЕШНИХ ИСТОЧНИКОВ). НУЖНО В ЭТОМ СЛУЧАЕ ИГНОРИРОВАТЬ ВЫБОРКУ ЮЗЕРНЕЙМА ЕСЛИ СОВПАДЕНИЯ ПО АЙДИ НЕТ
    """
    dialogues = sql.fetchall()
    db.close()

    # 🔹 Конвертируем timestamp в строку только перед отправкой JSON
    for dialogue in dialogues:
        dialogue['last_msg_time'] = dialogue['last_msg_time'].strftime('%Y-%m-%d %H:%M:%S') if dialogue['last_msg_time'] else None

    return dumps(dialogues, ensure_ascii=False), 200


# добавляет сообщение в тикет. Если есть активная заявка в АМО для этого юзера, то не
# отправит сообщение, а отобразит соответствующую информацию в тикете об этом
@messages_handler.post('/add-message')
# @access_handler((1, 2, 3))
def add_message():
    data = request.json
    content = data.get('content')
    type = data.get('type', 'text')
    name = data.get('name', None)
    # Если текста нет - не сохраняем в БД
    if not content:
        print(f"Нет данных в content для записи сообщения в БД, пропускаем! Данные: {data}")
        return {'result': "ignored"}, 200
    chat_id = data.get('chat_id')
    author_id = data.get('author_id')

    result = add_message_to_history(content=content, type=type, name=name, chat_id=chat_id, author_id=author_id)
    if result is True:
        return {'result': "ok"}, 200
    else:
        return {'error': result}, 500

# Функция записывает в БД сообщение в историю
def add_message_to_history(content, chat_id, author_id, type='text', name=None):
    try:
        db, sql = create_connect()
        sql.execute("INSERT INTO messages_history (content, chat_id, author_id, type, name) VALUES (%s,%s,%s,%s,%s)",
                    (content, chat_id, author_id, type, name))
        db.commit()
        db.close()
        return True
    except Exception as error:
        logger.error(f"Ошибка при записи сообщения в БД в историю сообщений: content={content}, chat_id={chat_id}, author_id={author_id}, ошибка: {error}")
        return str(error)








@messages_handler.get('/get-total-msg/<id>')
@access_handler((1, 2, 3))
def get_new_ticket_msg(user, id):
    db, sql = create_connect()

    total = request.args.get('total', default=0, type=int)

    # Проверка на ненегативные значения total
    if total < 0:
        total = 0

    # Получаем общее количество сообщений
    sql.execute("""
        SELECT COUNT(*) as total_count 
        FROM  messages_history m
        WHERE m.chat_id = %s
    """, (id,))
    total_count = sql.fetchone()['total_count']

    # Вычисляем количество новых сообщений для получения
    messages_to_fetch = total_count - total if total_count > total else 0

    # Получаем только новые сообщения
    sql.execute("""
        SELECT
            m.id,
            m.content,
            m.type,
            m.name,
            m.author_id,
            COALESCE(CONCAT(u.first_name, ' ', u.last_name), '') AS username,
            to_char(m.create_at, 'dd.mm.YYYY HH24:MI') AS date,
            COALESCE(photo_code, '') AS user_picture,
            m.create_at
        FROM messages_history m
            LEFT JOIN users u ON u.id::TEXT = m.author_id
        WHERE m.chat_id = %s
        ORDER BY m.create_at DESC
        LIMIT %s
    """, (id, messages_to_fetch))

    messages = sql.fetchall()

    db.close()

    return dumps({
        'messages': messages[::-1],  # Сообщения уже отсортированы от новых к старым
        'total_count': total_count,
        "file_server": JIVO_INTEGRATOR_URL
    }, ensure_ascii=False, default=str), 200











@messages_handler.get('/get-chat/<id>')
@access_handler((1, 2, 3))
def get_ticket_chat(user, id):
    db, sql = create_connect()

    skip = request.args.get('skip', default=0, type=int)
    limit = request.args.get('limit', default=20, type=int)

    # Проверка на отрицательные значения и установление максимальных лимитов
    if skip < 0:
        skip = 0
    if limit < 1 or limit > 100:
        limit = 20  # Значение по умолчанию

    # Получаем общее количество сообщений
    sql.execute("""
        SELECT COUNT(*) as total_count 
        FROM  messages_history m
        WHERE m.chat_id = %s
    """, (id,))
    total_count = sql.fetchone()['total_count']

    # print(f"СООБЩЕНИЙ В ЧАТЕ С ID={id} ВСЕГО: {total_count}")

    sql.execute("""
        SELECT m.author_id, u.first_name, u.last_name 
        FROM messages_history m
        JOIN users u ON m.chat_id = u.id::TEXT
        WHERE m.chat_id = %s
        LIMIT 1
    """, (id,))
    author = sql.fetchone()
    author_id = author['author_id']
    author_name = "".join([f"{author['first_name']}",  f" {author['last_name']}" if author['last_name'] else ''])

    # print(f"АВТОР ДИАЛОГА: {author_name}")

    # Второй SELECT
    sql_query = """
        SELECT
            m.id,
            m.content, 
            m.type, 
            m.name,
            m.author_id,
            COALESCE(CONCAT(u.first_name, ' ', u.last_name), '') AS username,
            to_char(m.create_at, 'dd.mm.YYYY HH24:MI') as date,
            COALESCE(photo_code, '') AS user_picture,
            m.create_at
        FROM messages_history m
            LEFT JOIN users u ON u.id::TEXT = m.author_id
        WHERE m.chat_id = %s
        ORDER BY create_at DESC OFFSET %s LIMIT %s
    """

    # Выполняем запрос
    sql.execute(sql_query, (id, skip, limit))
    messages = sql.fetchall()

    # print(f"СООБЩЕНИЯ В ЧАТЕ: {messages}")
    
    db.close()

    return dumps({
        'author_name': author_name,
        'messages': messages[::-1],
        'total_count': total_count,
        "file_server": JIVO_INTEGRATOR_URL
    }, ensure_ascii=False, default=str), 200




# def discord_send_ticket(channel_id, message):

#     # делаем выборку из БД Url АПИ
#     url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
#     payload = {"content": message}
#     headers = {
#         "Authorization": f"Bot {ds_token}",
#         "Content-Type": "application/json"
#     }
#     response = requests.post(url, json=payload, headers=headers)
#     statuscode = response.status_code
#     if statuscode != 200:
#         print(f"Ошибка отправки уведомления в ДС. Status code = {statuscode}")

#     