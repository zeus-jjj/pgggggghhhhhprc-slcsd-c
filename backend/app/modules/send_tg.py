from requests import post
from json import dumps
from time import sleep
from threading import Thread
import sys
import os
import json
# 
from .. import tg_bot_token
from .database import create_connect
from . import logger
from ..messages_history import add_message_to_history
from . import jivo_integrator


class ReturnValueThread(Thread):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.result = None

    def run(self):
        if self._target is None:
            return  # could alternatively raise an exception, depends on the use case
        try:
            self.result = self._target(*self._args, **self._kwargs)
        except Exception as exc:
            print(f'{type(exc).__name__}: {exc}', file=sys.stderr)  # properly handle the exception

    def join(self, *args, **kwargs):
        super().join(*args, **kwargs)
        return self.result


def send(chat_id, text, files):
    images = {}
    photos = []

    medias = {}
    media = []

    filenames = []

    isOk = {'text': 'ok', 'media': 'ok', 'photos': 'ok'}

    r = post(f"https://api.telegram.org/bot{tg_bot_token}/sendMessage",
             json={'text': text, 'chat_id': chat_id, 'parse_mode': 'html'})

    if r.status_code != 200:

        isOk['text'] = 'error'

    for i, file in enumerate(files.getlist('filenames[]')):
        name = 'file-' + str(i)
        filenames.append(str(i))

        if file.content_type.startswith('image'):
            images[name] = file
            photos.append(dict(type='photo', media=f'attach://{name}'))
        else:
            file.name = file.filename
            medias[name] = file

            media.append(dict(type='document', media=f'attach://{name}'))

    if len(photos) > 0:
        r = post(f"https://api.telegram.org/bot{tg_bot_token}/sendMediaGroup",
                 data={'chat_id': chat_id, 'media': dumps(photos)}, files=images)

        if r.status_code != 200:

            isOk['photos'] = 'error'

    if len(media) > 0:
        r = post(f"https://api.telegram.org/bot{tg_bot_token}/sendMediaGroup",
                 data={'chat_id': chat_id, 'media': dumps(media)}, files=medias)

        if r.status_code != 200:
            isOk['media'] = 'error'
    
    # print(isOk)
    if isOk['text'] == 'ok' or isOk['photos'] == 'ok' or isOk['media'] == 'ok':
        msg_filenames = '\nФайлы в сообщении: '
        msg_filenames += ", ".join(filenames)
        msg_text = f"{text if isOk['text'] == 'ok' else 'в сообщении нет текста, а только прикреплённые файлы!'}{msg_filenames if filenames else ''}"

        result = add_message_to_history(content==f"Уведомление отправлено из веб-панели: {text}", chat_id=chat_id, author_id="-1")
        if result is True:
            logger.debug(f"Сообщение успешно добавлено в историю (user_id={chat_id})")
        else:
            logger.error(f"Не удалось добавить сообщение в историю! Ошибка: {result}")
        
        # Отправляем сообщение в JIVO
        jivo_integrator.send_to_jivo(text=f"Уведомление отправлено из веб-панели: {text}", 
            user_id=chat_id,
            url=f"https://telegram.pokerhub.pro/profile/{chat_id}")

    return isOk


def send_to_group(users: list, text: str, files: list) -> dict:
    logger.debug(f"[send_tg] Сейчас будет массовая рассылка для пользователей: {users}.\nТекст сообщения: {text}")
    isOk = {
        'text': 0,
        'media': 0,
        'photos': 0,
    }

    threads = []
    for index, user in enumerate(users):
        print(user)
        if index % 30 == 0:
            for thr in threads:
                result = thr.join(timeout=0.001)

                isOk['text'] += 1 if result['text'] == 'error' else 0
                isOk['media'] += 1 if result['media'] == 'error' else 0
                isOk['photos'] += 1 if result['photos'] == 'error' else 0
            threads = []
            sleep(1)

        thread = ReturnValueThread(target=send, args=(user.get('id'), text, files))
        thread.start()
        threads.append(thread)
    else:
        for thr in threads:
            result = thr.join(timeout=0.001)
            isOk['text'] += 1 if result['text'] == 'error' else 0
            isOk['media'] += 1 if result['media'] == 'error' else 0
            isOk['photos'] += 1 if result['photos'] == 'error' else 0

    return isOk

def tg_send(message, chat_id, reply_to_message_id=None, parseMode='HTML'):
    return post(url=f'https://api.telegram.org/bot{tg_bot_token}/sendMessage', data={'chat_id': chat_id, 'text': message, 'parse_mode':parseMode,'reply_to_message_id':reply_to_message_id}).json()


# эта функция для отправки сообщения (и возможно с файлами) для amo_leads.py
def send_tg_message(chat_id, message, files=[]):
    if not files:
        url = f"https://api.telegram.org/bot{tg_bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"
        }

        response = post(url, json=payload)

        if response.status_code != 200:
            return False, get_error_message(response)
        return True, "Сообщение успешно отправлено"
    
    media_group = []
    files_data = {}

    for i, (original_filename, file) in enumerate(files):
        file_path = os.path.join("uploaded_files", file.split("/")[-1])

        media_group.append({
            "type": "document",
            "media": f"attach://file{i}",
            "parse_mode": "HTML"
        })
        files_data[f"file{i}"] = (original_filename, open(file_path, "rb"))

    # Добавляем сообщение в подпись к последнему файлу
    if media_group and message:
        media_group[-1]["caption"] = message

    url = f"https://api.telegram.org/bot{tg_bot_token}/sendMediaGroup"
    media_payload = {
        "chat_id": chat_id,
        "media": json.dumps(media_group)
    }

    response = post(url, data=media_payload, files=files_data)
    if response.status_code != 200:
        return False, get_error_message(response)

    return True, "Сообщение успешно отправлено"


def get_error_message(response):
    error_messages = {
        403: "Бот заблокирован у пользователя.",
        429: "Слишком много запросов. Пожалуйста, попробуйте позже.",
        500: "Ошибка на сервере Telegram.",
        400: "Неподдерживаемый контент или ошибка в запросе."
    }

    error_code = response.status_code
    if error_code in error_messages:
        return error_messages[error_code]
    else:
        return f"Неизвестная ошибка. Код ошибки: {error_code}"