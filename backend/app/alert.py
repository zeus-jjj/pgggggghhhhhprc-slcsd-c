from flask import Blueprint, request
from .modules.access_handler import access_handler
from json import dumps
from .modules.send_tg import send, ReturnValueThread, send_to_group
from .modules.database import create_connect

alert_handler = Blueprint('alert', __name__, url_prefix='/send-notify')

@alert_handler.post('/')
@access_handler((1, 2, 3))
def send_alert(user):
    files = request.files
    text = request.form.get('text')
    chat_id = request.form.get('chat_id')

    text = f'Уведомление от {user["first_name"]} {user["last_name"]}: \n{text}'
    isOk = send(chat_id, text, files)
    return dumps(isOk, ensure_ascii=False), 200

@alert_handler.post('/group')
@access_handler((1, 2, 3))
def send_group_alert(user):
    files = request.files
    text = request.form.get('text')
    directions = request.form.getlist('directions[]')

    if len(directions) == 0:
        return dumps({'message': 'Направление не выбрано', 'resultCode': 2}, ensure_ascii=False), 200

    db, sql = create_connect()
    if 'all' in directions:
        sql.execute("SELECT id FROM users WHERE id > 0")
    else:
        sql.execute("SELECT u.id "
                    "FROM users u "
                    "LEFT JOIN lead_resources lr on u.id = lr.user_id "
                    "LEFT JOIN directions d on d.id = lr.direction_id "
                    f"WHERE d.code = ANY(%s) {'OR lr.direction_id is NULL' if 'null' in directions else ''}", (directions,))
    users = sql.fetchall()

    db.close()

    thread = ReturnValueThread(target=send_to_group, args=(users, text, files))
    thread.start()
    isOk = thread.join(timeout=1)
    return dumps(isOk, ensure_ascii=False), 200