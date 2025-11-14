import hmac
from os import getenv
from re import fullmatch
from hashlib import sha256
from operator import itemgetter
from urllib.parse import parse_qsl
from json import loads


def check_response(data: dict) -> bool:
    d = data.copy()
    d_list = []

    if not isinstance(d.get('id'),int):
        return False

    elif not fullmatch(r'[a-z0-9]{64}', d.get('hash')):
        return False

    del d['hash']
    for key in sorted(d.keys()):
        if d.get(key, None):
            d_list.append(key + '=' + str(d[key]))

    data_string = bytes('\n'.join(d_list), 'utf-8')

    secret_key = sha256(getenv('BOT_TOKEN').encode('utf-8')).digest()
    hmac_string = hmac.new(secret_key, data_string, sha256).hexdigest()

    return hmac_string == data['hash']


def check_webapp_signature(init_data: str) -> dict:

    # parsed_data = dict(parse_qsl(init_data))
    parsed_data = init_data

    if 'hash' not in parsed_data:
        return {}
    hash_ = parsed_data.pop('hash')

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed_data.items(), key=itemgetter(0))
    )
    secret_key = hmac.new(
        key=b"WebAppData", msg=getenv('BOT_TOKEN').encode(), digestmod=sha256
    )
    calculated_hash = hmac.new(
        key=secret_key.digest(), msg=data_check_string.encode(), digestmod=sha256
    ).hexdigest()

    if secret_key.hexdigest() == hash_:
        return parsed_data['user']

    return {}