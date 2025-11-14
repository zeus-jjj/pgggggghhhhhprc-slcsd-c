import requests
# 
from flask import Blueprint, request
from flask_cors import cross_origin
# 
from .modules.database import create_connect
from .crypt import decrypt_message as decrypt
from . import key_b64

# для приёма шифрованного id юзера ТГ с покерхаба
transition_handler = Blueprint('transition_handler', __name__, url_prefix='/transition_tracking')

@transition_handler.get('/')
@cross_origin()
# чтобы отследить переход на него из бота
def pokerhub_trace():
    user_id = request.args.get('user_id', None)
    if not user_id:
        return {"status":"not found data"}, 400
    # расшифровываем
    decrypt_id = decrypt(user_id, key_b64)
    if not decrypt_id:
        return {"status":"crypted data as broken"}, 400
    db, sql = create_connect()

    sql.execute(f"""
        SELECT username FROM users WHERE id=%s
        """,(decrypt_id, ))
    result = sql.fetchone()
    if result:
        sql.execute(f"""
            INSERT INTO user_history (user_id, text) VALUES (%s, %s)
            """,(decrypt_id, "Пользователь перешел на PokerHub",))
        # делаем отметку что юзер перешел на покерхаб (вставляем по actions -> id, но можем и по label)
        sql.execute(f"""
            INSERT INTO users_actions (user_id, action_id) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING
            """,(decrypt_id, 1,))
        db.commit()
    db.close()

    if result:
        return {"status":"ok"}, 200
    else:
        return {"status":"user not found"}, 400
