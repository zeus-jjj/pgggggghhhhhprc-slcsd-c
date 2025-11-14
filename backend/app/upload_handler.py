from json import dumps
from datetime import datetime
from flask import Blueprint, request
from .modules.access_handler import access_handler
from hashlib import sha256
from os import getenv, path
from werkzeug.utils import secure_filename

upload_router = Blueprint('upload', __name__, url_prefix='/upload')


@upload_router.post('/<static_path>', endpoint='upload_handle')
@access_handler((1, 2))
def upload_handle(user, static_path):
    files = request.files

    if not files:
        return dumps({'message': 'Empty files', 'resultCode': 2}, ensure_ascii=False), 200

    file_list = []

    for key, file in files.items():
        secure_name = secure_filename(file.filename)

        file_type = ('.' + secure_name.split('.')[-1]) if '.' in secure_name else ''
        file_name = sha256(file.read()).hexdigest() + file_type

        file.stream.seek(0)
        file.save(path.join(getenv('static_folder'), static_path, file_name))

        file_list.append(file_name)

    return dumps({'files': file_list}, ensure_ascii=False), 200
