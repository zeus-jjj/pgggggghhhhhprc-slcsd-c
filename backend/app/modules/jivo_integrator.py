import requests
from . import logger
from .. import JIVO_INTEGRATOR_URL

def send_to_jivo(text: str, user_id, **kwargs):
    try:
        data = {
            "message": {
                "text": text,
                "type": "text"
            },
            "sender": {
                "id": f"tg{user_id}",
                "invite": f"Для просмотра истории переписки с пользователем, можете посетить: https://telegram.pokerhub.pro/profile/{user_id}"
                # "invite": "Пользователь получил сообщение рассылкой из веб-панели: бла-бла-бла",
            },
            "service": {
                "source": "telegram",
                "object": "bot",
                "object_id": str(0)
            }
        }

        # Добавляем параметры из kwargs
        data['sender'].update(kwargs)

        response = requests.post(f"{JIVO_INTEGRATOR_URL}/api/v1/jivo/send_message", json=data)
        
        if response.status_code == 200:
            logger.info(f"Сообщение доставлено в JIVO, статускод: {response.status_code}, ответ от сервера: {response.text}")
            return True
        else:
            logger.error(f"Сообщение не доставлено в JIVO. Статускод: {response.status_code}, ошибка: {response.text}")
            return False
    except Exception as error:
        logger.error(f"Произошла ошибка при попытке доставить сообщение в JIVO: {error}. data={data}")
        return None
