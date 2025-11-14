import re
from json import dumps, loads
from datetime import datetime, timedelta

from flask_cors import cross_origin
from flask import Blueprint, request

from .modules.form_config import *
from .modules.send_tg import tg_send
from .modules.database import create_connect
from .modules.check_data import check_webapp_signature
from .modules.getcourse import add_user
form_router = Blueprint('form', __name__, url_prefix='/form')


def check(date):
    try:
        d = datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return False
    except TypeError:
        return None
    return d


@form_router.post('/add')
@cross_origin()
def form_add():
    data = request.json

    direction = data.get('direction')
    tg_user_info = data.get('user_info')

    if direction == 'null':
        return dumps({'message': 'Hacking attempt, calling in cyber-police #3243!', 'resultCode': 2}), 403

    sign = data.get('sign')
    user = check_webapp_signature(sign)
    
    if not user:
        return dumps({'message': 'Hacking attempt, calling in cyber-police!', 'resultCode': 2}), 403

    for param in params[direction]:
        if param not in type_settings:
            continue

        if type_settings[param]['type'] == 'text' and type_settings[param]['object'] != 'textarea' and not re.fullmatch(type_settings[param]['pattern'], data.get(param, '')):
            return dumps({'message': 'Hacking attempt, calling in cyber-police! #2', 'resultCode': 2}), 403

    result = add_user(data.get('email'), user.get('first_name'), user.get('last_name'), tg_user_info)
    print(result)
    if not result.get('success', False):
        return dumps({'message': 'Произошла ошибка в создании аккаунта.', 'resultCode': 2}), 403

    db, sql = create_connect()
    # sql.execute('INSERT INTO courses (user_id, email, biography) VALUES (%s, %s, %s) ON CONFLICT (user_id) DO NOTHING', (user.get('id'), data.get('email'), data.get('description','Без биографии')))
    sql.execute("INSERT INTO user_history (user_id, text) VALUES (%s, %s)", (user.get('id'),f'Записался на курс по {data.get("direction").upper()}'))
    db.commit()
    db.close()
    # tg_send(f'На почту {data.get("email")} были высланны данные для прохождения курсов по {data.get("direction","").upper()}',
    #         user['id'])

    return {'message': 'ok', 'resultCode': 0}, 200


@form_router.get('/get-form')
@cross_origin()
def get_form():
    if request.args is None:
        return {'message': 'Missing args'}, 400

    direction = request.args.get('direction')
    if direction == 'null':
        return dumps({'message': 'Hacking attempt, calling in cyber-police #35243!', 'resultCode': 2}), 403

    data = {}


    for key in params[direction]:
        data[key] = {
            'name': config[key],
            'data': type_settings[key]
        }

    return dumps({'names': params[direction], 'title': title, 'data': data, 'button': btn_name},
                 ensure_ascii=False), 200



