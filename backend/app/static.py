# # возвращает ТГ аватарку юзера по маршруту
# # аватарки сохраняет бот в static_folder

# import os
# from flask import Blueprint, send_from_directory, abort

# static_folder = os.getenv('static_folder')
# static_handler = Blueprint('static', __name__, url_prefix='/static')

# @static_handler.route('/img/avatars/avatar_<user_id>.jpg', methods=['GET'])
# def get_avatar(user_id):
#     avatar_directory = os.path.join(static_folder, 'img', 'avatars')
#     avatar_filename = f'avatar_{user_id}.jpg'
#     if os.path.exists(os.path.join(avatar_directory, avatar_filename)):
#         return send_from_directory(directory=avatar_directory, path=avatar_filename)
#     else:
#         return send_from_directory(directory=avatar_directory, path="unknown_user.jpg")
