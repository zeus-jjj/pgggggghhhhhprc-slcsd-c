import json
from flask import request as r
from flask_cors import cross_origin
from .database import create_connect
from flask_socketio import ConnectionRefusedError


def get_user(auth_token, roles):
    db, sql = create_connect()

    if len(roles) > 0:
        role_access = f" AND role_id IN %s"
        params = (auth_token, roles)
    else:
        role_access = ""
        params = (auth_token,)

    sql.execute(
        f"""SELECT u.id, first_name, last_name, username, role_id, r.name as role, photo_code
                                FROM users u LEFT JOIN roles r on r.id = u.role_id 
                                LEFT JOIN sessions s on u.id = s.user_id AND s.is_active = true
                                WHERE token=%s {role_access}""",
        params
    )
    user = sql.fetchone()
    db.close()
    return user


def access_handler(roles: tuple = ()):
    def handle(func):
        @cross_origin()
        def inner(**kwargs):
            auth_token = r.headers.get('Authorization', '')

            # # для авторизации j1xis
            # if auth_token == "rot_ebal":
            #     user = get_user(auth_token, roles)
            #     return func(user=user, **kwargs)

            if len(auth_token) != 64:
                return {'message': 'Undefined token', 'resultCode': 2}, 200

            user = get_user(auth_token, roles)

            if user is not None:
                return func(user=user, **kwargs)

            return json.dumps({'message': 'Нет доступа!', 'resultCode': 2}, ensure_ascii=False), 200
        inner.__name__ = func.__name__
        return inner

    return handle


def socket_handler(roles: tuple = ()):
    def handle(func):
        @cross_origin()
        def inner(*args, **kwargs):
            auth_token = r.args.get('Authorization', '')

            if len(auth_token) != 64:
                raise ConnectionRefusedError('Access denied!')

            user = get_user(auth_token, roles)

            if user is not None:
                return func(**kwargs)
            raise ConnectionRefusedError('Access denied!')

        return inner
    return handle
