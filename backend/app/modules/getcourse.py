import requests
import json
import base64

def add_user(email: str, first_name: str, last_name: str, tg_user_info: str) -> dict:
    url = 'https://pure-skill.getcourse.ru/pl/api/users'
    action = 'add'
    secret_key = 'hFsGVc3AF4xLXptqKdHM2TzA7UapWDHbrsWAo98J7REImA8wN7BcAWM2Ooc5wv2hQ04O73DhIbHng6MM4HeKN4LvDJJwtpkDRfVCO0sG2vowcjffgXk1chLB4SKlduP3'

    user = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "group_name": ['Регистрация "Безлимитный холдем для начинающих"'],
        "addfields": {"amo_leadid": tg_user_info}
    }

    system = {
        "refresh_if_exists": 1,
        "partner_email": ""
    }

    session = {
        "utm_source": "",
        "utm_medium": "",
        "utm_content": "",
        "utm_campaign": "",
        "utm_group": "",
        "gcpc": "",
        "gcao": "",
        "referer": ""
    }

    params = {
        "user": user,
        "system": system,
        "session": session
    }
    params_json = json.dumps(params).encode('utf-8')
    params_base64 = base64.b64encode(params_json).decode('utf-8')


    headers = {
        'Accept': 'application/json; q=1.0, */*; q=0.1'
    }
    payload = {
        'action': action,
        'key': secret_key,
        'params': params_base64
    }
    response = requests.post(url, headers=headers, data=payload)

    return response.json()
