from json import dumps
from datetime import datetime, timedelta
from flask import Blueprint, request
from .modules.database import create_connect
from .modules.access_handler import access_handler

dashboard_router = Blueprint('dashboard', __name__, url_prefix='/dashboard')


def get_avg_cnt(cnt):
    avg_active = cnt['active'] + cnt['ready'] + cnt['closed']
    avg_ready = cnt['ready'] + cnt['closed']
    avg_closed = cnt['closed']

    return avg_active or 1, avg_ready or 1, avg_closed or 1


@dashboard_router.get('/', endpoint='dashboard_handle')
@access_handler((1, 2, 3))
def dashboard_handle(user):
    # db, sql = create_connect()
    data = request.args

    date = datetime.now()
    start = data.get('start') or (date - timedelta(days=7)).strftime('%Y-%m-%d')
    stop = data.get('stop') or date.strftime('%Y-%m-%d')


    return dumps({}, ensure_ascii=False, default=str), 200
