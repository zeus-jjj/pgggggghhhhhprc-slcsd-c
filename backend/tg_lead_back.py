import threading
#
from waitress import serve # WSGI-сервер для windows
from dotenv import load_dotenv
import os
#
from app import socketio, app

load_dotenv()

if __name__ == '__main__':
    # socketio.run(app,
    #     port=int(getenv('port')),
    #     debug=True,
    #     # allow_unsafe_werkzeug=True
    # )
    # socketio.run(app, host='0.0.0.0', port=int(getenv('port')), use_reloader=False, debug=True, log_output=True)

    serve(app, host='0.0.0.0', port=int(getenv('port')), threads=8) # для деплоя
