import logging
from os import getenv
from flask import Flask, render_template, url_for, Blueprint, request
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO
from dotenv import load_dotenv
from .modules.access_handler import access_handler
from .modules.database import create_connect
import base64

# на каком домене висит фласк
domain = getenv("DOMAIN")
# токен доступа к АМО
AMO_TOKEN = getenv("AMO_TOKEN")
# ссылка на АМО
AMO_DOMAIN = getenv("AMO_DOMAIN")
# секретный ключ
SECRET_KEY = getenv('SECRET_KEY')
# Endpoint маршрута для отправки сообщений в JIVO
JIVO_INTEGRATOR_URL = getenv("JIVO_INTEGRATOR_URL")

load_dotenv('/root/bots/holms/tg_study/.env')
# Преобразование строки ключа в base64
key_b64 = base64.urlsafe_b64encode(getenv('CRYPT_KEY').encode())
# load_dotenv()

# ограничение на кол-вол символов в столбце text аблицы user_history. Это ограничение задаётся в самой БД,
# чтобы не перегружать её тонной повторяющейся информации, но чтобы можно было понять что за текст получил юзер.
# При записи в бд текст обрезается до этого кол-ва символов SQL-запросом, чтобы те кто будет смотреть историю
# юзера в веб-панели понимали +-, о чем речь вообще. В modules.py у бота тоже самое прописано!
MAX_CHARS_USERS_HISTORY = 255

app = Flask('pokerhub_robot', static_url_path='/api/static', static_folder=getenv('static_folder'), template_folder=getenv('form_folder'))
app.config['SECRET_KEY'] = getenv('SECRET_KEY')
app.config['CORS_HEADERS'] = 'Content-Type'

CORS(app)

socketio = SocketIO(app, cors_allowed_origins='*', ping_timeout=5, ping_interval=5, async_handlers=True)

tg_bot_token = getenv("BOT_TOKEN")
tg_api_url = f'https://api.telegram.org/bot{tg_bot_token}'

ds_token = getenv("DS_TOKEN")
ds_channel = getenv("DS_CHANNEL")

log = logging.getLogger('werkzeug')
log.setLevel(logging.DEBUG)

# Проверка ключа
def is_valid_key(key):
    return key == SECRET_KEY

@app.get('/api/')
@cross_origin()
def form_send():
    return render_template('form.html')

@app.get('/api/test')
@cross_origin()
def test():
    notify_body = {
        'title': 'Новый тикет!',
        'description': f'Socket test'
    }
    socketio.emit('notify', notify_body, namespace='/api/notify')
    return {'msg':'send'}, 200




bp = Blueprint('main',__name__, url_prefix='/api')

# модуль для отслеживания перехода из бота на PH
from .pokerhub_integration import transition_handler
bp.register_blueprint(transition_handler)

# # модуль для аналитики NEFT
# from .analytics import analytics_handler
# bp.register_blueprint(analytics_handler)

from .auth import login_router
bp.register_blueprint(login_router)

from .form import form_router
bp.register_blueprint(form_router)

from .config_handler import config_router
bp.register_blueprint(config_router)

from .upload_handler import upload_router
bp.register_blueprint(upload_router)

# from .dashboard import dashboard_router
# bp.register_blueprint(dashboard_router)

from .messages_history import messages_handler
bp.register_blueprint(messages_handler)

from .alert import alert_handler
bp.register_blueprint(alert_handler)

from .users_data import users_data_handler
bp.register_blueprint(users_data_handler)

# from .amo_leads import leads_handler
# bp.register_blueprint(leads_handler)

# from .static import static_handler
# bp.register_blueprint(static_handler)

app.register_blueprint(bp)
from . import events






