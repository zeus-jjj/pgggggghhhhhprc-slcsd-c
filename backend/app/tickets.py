import datetime
import requests
from json import dumps, loads
from flask import Blueprint, request
from flask_socketio import join_room
from .modules.access_handler import access_handler
from .modules.send_tg import tg_send
from .modules.database import create_connect
from .amo_leads import is_have_amo_lead
from . import socketio, ds_channel, ds_token, MAX_CHARS_USERS_HISTORY

tickets_handler = Blueprint('tickets', __name__, url_prefix='/tickets')


@tickets_handler.get('/')
@access_handler((1, 2, 3))
def get_tickets(user):
    db, sql = create_connect()
    filter_ = request.args.get('filter')
    if filter_ is None:
        return {}, 403

    filter_ = loads(filter_)
    id = '%' + str(filter_.get('id')) + '%'
    support_name = '%' + str(filter_.get('support_name')) + '%'
    author_name = '%' + str(filter_.get('author_name')) + '%'
    statuses = filter_.get('statuses')
    sort_by_new = filter_.get('sort_by_new')
    limit = filter_.get('limit')

    sql.execute(f"""
        SELECT 
            t.id,
            COALESCE(  
                (SELECT text FROM ticket_messages tm
                 WHERE tm.ticket_id = t.id
                 ORDER BY tm.create_at DESC
                 LIMIT 1), 
                t.question
            ) AS text,
            t.status,
            CONCAT('@', a.username, ' (', a.id, ')') AS author_name,
            CASE 
                WHEN s.id IS NULL THEN ''
                ELSE CONCAT(s.first_name, ' ', s.last_name)
            END AS support_name,
            MAX(tm.create_at) AS last_msg_time
        FROM tickets t
            INNER JOIN users a ON a.id = t.author_id
            LEFT JOIN users s ON s.id = t.support_id
            LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
        WHERE
            t.id::text LIKE %s AND 
            a.username LIKE %s AND 
            (CONCAT(s.first_name, ' ', s.last_name, ' ', s.username) LIKE %s {' OR s.id IS NULL) ' if support_name == '%%' else ')' }
            AND t.status = ANY(%s) 
        GROUP BY t.id, t.question, t.status, t.create_at, a.username, a.id, s.id, s.first_name, s.last_name
        ORDER BY MAX(tm.create_at) {'DESC' if sort_by_new else 'ASC'}  
        LIMIT %s
        """, (id, author_name, support_name, statuses, limit))

    tickets = sql.fetchall()
    db.close()

    # 🔹 Конвертируем timestamp в строку только перед отправкой JSON
    for ticket in tickets:
        ticket['last_msg_time'] = ticket['last_msg_time'].strftime('%Y-%m-%d %H:%M:%S') if ticket['last_msg_time'] else None

    return dumps(tickets, ensure_ascii=False), 200



@tickets_handler.get('/get-total-msg/<int:id>')
@access_handler((1, 2, 3))
def get_new_ticket_msg(user, id):
    db, sql = create_connect()

    total = request.args.get('total', default=0, type=int)

    # Проверка на ненегативные значения total
    if total < 0:
        total = 0

    # Получаем общее количество сообщений
    sql.execute("""
        SELECT COUNT(*) as total_count FROM (
            SELECT 1
            FROM tickets t
            WHERE t.id = %s

            UNION ALL

            SELECT 1
            FROM ticket_messages t
            WHERE t.ticket_id = %s
        ) AS total
    """, (id, id))
    total_count = sql.fetchone()['total_count']

    # Вычисляем количество новых сообщений для получения
    messages_to_fetch = total_count - total if total_count > total else 0

    # Получаем только новые сообщения
    sql.execute("""
        SELECT
            t.id,
            text,
            user_id,
            CONCAT(first_name, ' ', last_name, ' (', u.id, ')') AS username,
            to_char(t.create_at, 'dd.mm.YYYY HH24:MI') AS date,
            photo_code AS user_picture,
            t.create_at
        FROM ticket_messages t
            INNER JOIN users u ON u.id = t.user_id
        WHERE t.ticket_id = %s
        ORDER BY t.create_at DESC
        LIMIT %s
    """, (id, messages_to_fetch))

    messages = sql.fetchall()

    # Если есть дополнительные сообщения от AMO
    sql.execute("""
        SELECT t.author_id, u.first_name, u.last_name 
        FROM tickets t
        JOIN users u ON t.author_id = u.id
        WHERE t.id = %s
    """, (id,))
    author = sql.fetchone()
    author_id = author['author_id']

    amo_lead = is_have_amo_lead(user_id=author_id)
    amo_text = ''
    
    if amo_lead:
        amo_text = f'У пользователя есть активная заявка в AMO CRM!\nПодождите, пока заявка в АМО будет закрыта, и только после этого можно будет продолжить общение с ним через систему тикетов!\nСсылка на АМО: https://firestormteam.amocrm.ru/leads/detail/{amo_lead}'

    # Получение участников чата
    sql.execute("SELECT user_id FROM chat_members WHERE ticket_id = %s", (id,))
    chat_members = sql.fetchall()

    # Получение статуса тикета
    sql.execute("SELECT status FROM tickets WHERE id = %s", (id,))
    status = sql.fetchone()['status']

    db.close()

    return dumps({
        'messages': messages[::-1],  # Сообщения уже отсортированы от новых к старым
        'total_count': total_count,
        'chat_members': [user['user_id'] for user in chat_members],
        'status': 'amo' if amo_lead else status,
        'amo_text': amo_text
    }, ensure_ascii=False, default=str), 200





@tickets_handler.get('/get-chat/<int:id>')
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
        SELECT COUNT(*) as total_count FROM (
            SELECT 1
            FROM tickets t
            WHERE t.id = %s

            UNION ALL

            SELECT 1
            FROM ticket_messages t
            WHERE t.ticket_id = %s
        ) AS total
    """, (id, id))
    total_count = sql.fetchone()['total_count']

    #
    sql.execute("""
        SELECT t.author_id, u.first_name, u.last_name 
        FROM tickets t
        JOIN users u ON t.author_id = u.id
        WHERE t.id = %s
    """, (id,))
    author = sql.fetchone()
    author_id = author['author_id']
    author_name = "".join([f"{author['first_name']}",  f" {author['last_name']}" if author['last_name'] else ''])

    # Список SELECT-запросов
    selects = []

    # Первый SELECT
    selects.append("""
        SELECT -1 as id,
            question as text,
            author_id as user_id,
            CONCAT(first_name, ' ', last_name, ' (', u.id, ')') as username,
            to_char(create_at, 'dd.mm.YYYY HH24:MI') as date,
            photo_code as user_picture,
            create_at
        FROM tickets t
            INNER JOIN users u ON u.id = t.author_id
        WHERE t.id = %s
    """)

    # Второй SELECT
    selects.append("""
        SELECT
            t.id,
            text,
            user_id,
            CONCAT(first_name, ' ', last_name, ' (', u.id, ')') as username,
            to_char(t.create_at, 'dd.mm.YYYY HH24:MI') as date,
            photo_code as user_picture,
            t.create_at
        FROM ticket_messages t
            INNER JOIN users u ON u.id = t.user_id
        WHERE t.ticket_id = %s
    """)

    params = [id, id]

    # Объединяем SELECT-запросы
    sql_query = "SELECT * FROM (" + " UNION ALL ".join(selects) + ") AS t ORDER BY create_at DESC OFFSET %s LIMIT %s"
    params.extend([skip, limit])

    # Выполняем запрос
    sql.execute(sql_query, params)
    messages = sql.fetchall()



    # Если есть дополнительные сообщения от AMO
    amo_lead = is_have_amo_lead(user_id=author_id)
    amo_text = ''

    if amo_lead:
        amo_text = f'У пользователя есть активная заявка в AMO CRM!\nПодождите, пока заявка в АМО будет закрыта, и только после этого можно будет продолжить общение с ним через систему тикетов!\nСсылка на АМО: https://firestormteam.amocrm.ru/leads/detail/{amo_lead}'

    # Получение статуса тикета
    sql.execute("SELECT status FROM tickets WHERE id = %s", (id,))
    status = sql.fetchone()['status']

    # Получение участников чата
    sql.execute("SELECT user_id FROM chat_members WHERE ticket_id = %s", (id,))
    chat_members = sql.fetchall()
    db.close()
    return dumps({
        'author_name': author_name,
        'status': 'amo' if amo_lead else status,
        'messages': messages[::-1],
        'total_count': total_count,
        'chat_members': [user['user_id'] for user in chat_members],
        'amo_text': amo_text
    }, ensure_ascii=False, default=str), 200


@tickets_handler.get('/join-chat/<int:ticket_id>')
@access_handler((1, 2, 3))
def join_to_ticket(user, ticket_id):
    system_msg = "".join([user['first_name'], f" {user.get('last_name')}" if user.get('last_name') else "", " присоединился к чату"])

    db, sql = create_connect()

    sql.execute("INSERT INTO chat_members (user_id, ticket_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (user['id'], ticket_id))
    sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s, %s, -1)", (ticket_id, system_msg))
    sql.execute("UPDATE tickets SET support_id = %s, status='active' WHERE status='new' AND id=%s", (user['id'],ticket_id))
    db.commit()

    if sql.rowcount == 1:
        socketio.emit('changeStatus', {'id': ticket_id, 'status': 'active'}, namespace='/api/tickets')


    sql.execute("SELECT author_id FROM tickets WHERE id=%s", (ticket_id,))
    ticket_chat_id = sql.fetchone()
    db.close()

    socketio.emit('message', {'id': ticket_chat_id['author_id'], 'user_id': -1, 'text': system_msg},
                  room=str(ticket_id), namespace='/api/chat')

    # # тут отправляем сообщение, что такой-то юзер присоединился к чату (пока отключил)
    # tg_send('**' + system_msg + '**', ticket_chat_id['author_id'], parseMode='markdown')

    return dumps({'status': True}, ensure_ascii=False), 200


@socketio.on('join_chat', namespace='/api/chat')
def join_chat(data):
    join_room(data.get('ticket'), namespace='/api/chat')


@tickets_handler.post('/add')
@access_handler((1,))
def create_ticket(user):
    data = request.json
    user_id = data.get('user_id')
    username = data.get('username')
    question = data.get('question')

    db, sql = create_connect()

    # sql.execute("INSERT INTO tickets (question, author_id) VALUES (%s, %s) RETURNING id", (question, user_id))

    sql.execute("""
        INSERT INTO tickets (question, author_id, status) 
        VALUES (%s, %s, 'new')
        ON CONFLICT (author_id) 
        DO UPDATE SET status = CASE WHEN tickets.status = 'closed' THEN 'new' ELSE tickets.status END 
        RETURNING id
    """, (None, user_id))

    ticket_id = sql.fetchone()['id']

    # sql.execute("INSERT INTO chat_members (user_id, ticket_id) VALUES (-1, %s), (%s,%s)",
    #             (ticket_id, user_id, ticket_id))

    sql.execute("INSERT INTO chat_members (user_id, ticket_id) VALUES (-1, %s), (%s, %s) ON CONFLICT DO NOTHING", (ticket_id, user_id, ticket_id))

    # Вставляем текст сообщения
    sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s, %s, %s)", (ticket_id, question, user_id))

    db.commit()

    notify_body = {
        'title': 'Новый тикет!',
        'description': f'Поступило новое обращение от @{username} ({user_id})!'
    }
    create_at = datetime.datetime.now().strftime('%H:%M %d.%m.%Y')
    body = {
        'id': ticket_id,
        'text': question,
        'author_name': f"@{username} ({user_id})",
        'support_name': '',
        'status': 'new',
        'create_at': create_at
    }

    if ds_channel:
        # если в переменных окружения был передан id DS-канала, куда отправлять уведомления, то попадаем сюда
        output_str = f'```ТГ юзера: @{username}\nСоздан в: {create_at}\nСообщение: \n{question}```'
        message = f"?Новый тикет (id{ticket_id}) из ТГ-бота\n{output_str}"
        # отправляем уведомление в дс
        try:
            discord_send_ticket(channel_id=ds_channel, message=message)
        except Exception as error:
            print(f"Сообщение в ДС не отправлено. Ошибка: {error}")

    socketio.emit('addTicket', body, namespace=f'/api/tickets')
    socketio.emit('notify', notify_body, namespace='/api/notify')

    return dumps({'id': ticket_id}, ensure_ascii=False), 200


# добавляет сообщение в тикет. Если есть активная заявка в АМО для этого юзера, то не
# отправит сообщение, а отобразит соответствующую информацию в тикете об этом
@tickets_handler.post('/add-message')
@access_handler((1, 2, 3))
def add_message(user):
    data = request.json
    # проверяем, кто отправил (юзер или сотрудник)
    if user['id'] == -1 and data.get('is_messanger'):
        user = data['user']

    ticket_id = data.get('id')
    text = data.get('text')

    if not isinstance(ticket_id, int) or not isinstance(text, str):
        return dumps({'message': 'hacking attempt', 'resultCode': 2}, ensure_ascii=False), 200

    db, sql = create_connect()

    sql.execute(f"SELECT status, author_id FROM tickets WHERE id = %s", (ticket_id,))
    is_active = sql.fetchone()
    if not is_active:
        db.close()
        return dumps({'message': 'Тикет не найден в БД!', 'resultCode': 2}, ensure_ascii=False), 200
    else:
        # получем активный лид АМО по id юзера, который создал тикет
        amo_lead = is_have_amo_lead(user_id=is_active['author_id'])
        # если у юзера есть активная заявка в АМО
        if amo_lead:
            db.close()
            return dumps({'message': 'У пользователя открыта заявка в АМО!', 'resultCode': 2}, ensure_ascii=False), 200

    # если тикет закрыт - открываем его!
    if is_active['status'] == 'closed':
        sql.execute("UPDATE tickets SET status = 'new' WHERE id = %s", (ticket_id,))
        # sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s,%s,%s)",
        #         (ticket_id, "Тикет открыт", -1))

    sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s,%s,%s) RETURNING id",
                (ticket_id, text, user['id']))
    msg_id = sql.fetchone()['id']
    db.commit()
    message = {
        'id': msg_id,
        'text': text,
        'user_id': user['id'],
        'username': f"{user['first_name']} {user['last_name']}",
        'date': datetime.datetime.now().strftime('%H:%M'),
        'user_picture': user['photo_code']
    }
    socketio.emit('message', message, room=str(ticket_id), namespace='/api/chat')

    if not data.get('is_messanger'):
        sql.execute("SELECT author_id FROM tickets WHERE id=%s", (ticket_id,))
        user_id = sql.fetchone()['author_id']

        # # тут отправляем с именем отправившего сообщение (пока отключил, т.к. не думаю что это вообще нужно)
        # tg_send(f"{message['username']}: {text}", user_id)
        tg_send(f"{text}", user_id)

        # записываем в историю юзера
        sql.execute("INSERT INTO user_history (user_id, text) VALUES (%s, LEFT(%s, %s))",
                        (user_id, f"Ответ пользователю от {message['username']}: {text}", MAX_CHARS_USERS_HISTORY))
        db.commit()

    db.close()
    return dumps(message, ensure_ascii=False), 200


@tickets_handler.get('/close-ticket/<int:id>')
@access_handler((1, 2, 3))
def close_ticket(user, id):
    system_msg = "".join([user['first_name'], f" {user.get('last_name')}" if user.get('last_name') else "", " закрыл тикет."])
    if user['id'] == -1:
        system_msg = 'Пользователь закрыл тикет'

    db, sql = create_connect()
    sql.execute("SELECT author_id FROM tickets WHERE status='closed' AND id=%s", (id,))
    result = sql.fetchone()
    # если тикет уже закрыт
    if result:
        db.close()
        return dumps({'status': 'ok'}, ensure_ascii=False), 200

    sql.execute(
        "UPDATE tickets SET status='closed' WHERE id=%s AND (SELECT TRUE FROM chat_members WHERE ticket_id=%s AND user_id=%s)",
        (id, id, user['id']))
    sql.execute("INSERT INTO ticket_messages (ticket_id, text, user_id) VALUES (%s, %s, -1)", (id, system_msg))
    db.commit()

    sql.execute("SELECT author_id FROM tickets WHERE id=%s", (id,))
    ticket_chat_id = sql.fetchone()
    

    socketio.emit('message', {'id': ticket_chat_id['author_id'] + 1, 'user_id': -1, 'text': system_msg}, room=str(id),
                  namespace='/api/chat')
    socketio.emit('onClose', room=str(id), namespace='/api/chat')

    # if user['id'] != -1:
    #     tg_send('**' + system_msg + '**', ticket_chat_id['author_id'], parseMode='markdown')
    
    socketio.emit('changeStatus', {'id': id, 'status': 'closed'}, namespace='/api/tickets')

    # записываем в историю юзера, если тикет закрыл саппорт (т.к. если юзер, то в боте уже есть запись этого действия)
    if user['id'] != -1:
        sql.execute("INSERT INTO user_history (user_id, text) VALUES (%s, %s)",
                        (ticket_chat_id['author_id'], system_msg))
        db.commit()

    db.close()

    return dumps({'status': 'ok'}, ensure_ascii=False), 200


def discord_send_ticket(channel_id, message):

    # делаем выборку из БД Url АПИ
    url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
    payload = {"content": message}
    headers = {
        "Authorization": f"Bot {ds_token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    statuscode = response.status_code
    if statuscode != 200:
        print(f"Ошибка отправки уведомления в ДС. Status code = {statuscode}")

    