import requests
# 
from flask import Blueprint, request, render_template, jsonify, send_from_directory
from datetime import datetime
from collections import defaultdict
# 
from . import SECRET_KEY, is_valid_key
from .modules.database import create_connect
from .amo_leads import status_mapping
from .users_data import template_utm

analytics_handler = Blueprint('analytics', __name__, url_prefix='/analytics')

# # возвращает страничку с фильтрами. Небезопасно, поэтому отключаю. В веб-панели
# # есть такая-же страничка. Эта использовалась для тестов
# @analytics_handler.get('/')
# def get_page():
#     key = request.args.get('key')
#     if not is_valid_key(key):
#         return "Invalid key", 403

#     return render_template('analytics.html', key=key)

# маошрут для выборки из БД данных о всех юзерах
@analytics_handler.post('/get_users')
def get_users():
    filter_ = request.json
    date_start = filter_.get("date_start", None)
    date_end = filter_.get("date_end", None)

    users_data = get_users_data(date_start=date_start, date_end=date_end)
    return users_data, 200


@analytics_handler.post('/get_data')
def users_data():
    # key = request.args.get('key')
    # if not is_valid_key(key):
    #     return "Invalid key", 403

    filter_ = request.json
    date_start = filter_.get('date_start', None)
    date_end = filter_.get('date_end', None)
    
    users_data = get_users_data(date_start=date_start, date_end=date_end)

    # получаем данные для вкладок
    users = users_tab(users_data=users_data)
    general = general_tab(start_date=date_start, end_date=date_end)

    # формированные данные для ответа
    formatted_data = {
                        "users": users,
                        "general": general,
                        "date_range": get_date_range_text(start_date=date_start, end_date=date_end) 
                    }

    # возвращаем json в ответ
    return formatted_data, 200

# выборка юзеров и данных из бд
def get_users_data(date_start=None, date_end=None):
    params = []  # параметры для SQL запроса
    query_where_parts = []  # части WHERE условия

    """
    utm-метки должны быть в виде списка source: ["math"]
    is_blocked - в виде списка [0, 1] или без аргумента (тогда все)
    date_start и date_end - строка гггг.мм.дд
    """
    if date_start or date_end:
        # добавление фильтра по диапазону дат
        if date_start and date_end:
            query_where_parts.append("(u.timestamp_registration >= %s AND u.timestamp_registration <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day')")
            params.extend([date_start, date_end])
        elif date_start:  # Только начальная дата указана
            query_where_parts.append("u.timestamp_registration >= %s")
            params.append(date_start)
        elif date_end:  # Только конечная дата указана
            query_where_parts.append("u.timestamp_registration <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day'")
            params.append(date_end)

        where_condition = " AND ".join(query_where_parts)  # сформированное WHERE условие
    else:
        where_condition = None

    query = f"""
        WITH latest_amo_leads AS (
        SELECT DISTINCT ON (user_id) user_id, status, created_at
        FROM amo_leads
        ORDER BY user_id, created_at DESC
    ),
    events_grouped AS (
        SELECT user_id, json_object_agg(event_type, event_date) AS events
        FROM events
        GROUP BY user_id
    ),
    latest_funnel AS (
        SELECT f1.*
        FROM user_funnel f1
        JOIN (
            SELECT user_id, MAX(datetime) AS max_datetime
            FROM user_funnel
            GROUP BY user_id
        ) f2 ON f1.user_id = f2.user_id AND f1.datetime = f2.max_datetime
    )
    SELECT
        u.id,
        u.username,
        u.timestamp_registration AS registration,
        lr.campaign,
        lr.source,
        lr.medium,
        lr.term,
        lr.content,
        al.status,
        al.created_at AS amo_leads_created_at,
        COALESCE(eg.events, '{{}}') AS events,
        lf.label
    FROM
        users u
    LEFT JOIN
        lead_resources lr ON u.id = lr.user_id
    LEFT JOIN
        latest_amo_leads al ON u.id = al.user_id
    LEFT JOIN
        events_grouped eg ON u.id = eg.user_id
    LEFT JOIN
        latest_funnel lf ON u.id = lf.user_id
    {f'WHERE {where_condition} AND u.id > 0' if where_condition else 'WHERE u.id > 0'}
    ORDER BY
        registration ASC;

    """

    db, sql = create_connect()
    sql.execute(query, params)
    users_data = sql.fetchall()
    db.close()

    return users_data


def convert_date(date_str: str):
    # конвертирует дату полученную с ПХ в вид ГГГГ-ММ-ДД
    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    # Извлечение только даты в формате YYYY-MM-DD
    return dt.strftime('%Y-%m-%d')

def get_status(status_code):
    if status_code is None:
        return None
    
    status = status_mapping['active'].get(status_code)
    if status is None:
        status = status_mapping['closed'].get(status_code)
    if status is None:
        status = status_code
    
    return status

def users_tab(users_data):
    # Данные для вкладки Юзеры
    users = [
        {
            "id": record.get("id", None),
            "username": f'@{record.get("username", None)}',
            "registration": record.get('registration').date().isoformat(), # приводим timestamp в ISO-формат, чтобы можно было сериализировать в json
            "utm": {key: record.get(key, None) for key in template_utm},
            "events": {key: convert_date(value) for key, value in record.get('events', {}).items()},
            "status": get_status(record.get("status")),
            "label": record.get("label", None)
        }
        for record in users_data
    ]

    return users

# Возвращает данные по аналитике в виде json
def general_tab(start_date=None, end_date=None):
    db, sql = create_connect()
    date_filter = ""
    params = []

    if start_date and end_date:
        date_filter = "{date} >= %s AND {date} <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day'"
        params = [start_date, end_date]
    elif start_date:
        date_filter = "{date} >= %s"
        params = [start_date]
    elif end_date:
        date_filter = "{date} <= TO_DATE(%s,'YYYY-MM-DD') + INTERVAL '1 day'"
        params = [end_date]

    queries = {
        'Зарегистрировалось в боте': f"""
            SELECT u.id, lr.campaign, lr.source, lr.medium, lr.term, lr.content
            FROM users u
            LEFT JOIN lead_resources lr ON u.id = lr.user_id 
            {f'WHERE {date_filter.format(date="u.timestamp_registration")}' if date_filter else 'WHERE u.id != -1'}
            """,
        'Жало на кнопку регистрации на бесплатный курс': f"""
            SELECT e.user_id, lr.campaign, lr.source, lr.medium, lr.term, lr.content
            FROM events e 
            LEFT JOIN lead_resources lr ON e.user_id = lr.user_id 
            WHERE e.event_type = 'course_registration_button_click' 
            {f'AND {date_filter.format(date="e.event_date")}' if date_filter else ''}
            """,
        'Регистраций на бесплатник': f"""
            SELECT e.user_id, lr.campaign, lr.source, lr.medium, lr.term, lr.content
            FROM events e 
            LEFT JOIN lead_resources lr ON e.user_id = lr.user_id 
            WHERE e.event_type = 'course_registration' 
            {f'AND {date_filter.format(date="e.event_date")}' if date_filter else ''}
            """,
        'Жало на кнопку реги на консультацию': f"""
            SELECT e.user_id, lr.campaign, lr.source, lr.medium, lr.term, lr.content
            FROM events e 
            LEFT JOIN lead_resources lr ON e.user_id = lr.user_id 
            WHERE e.event_type = 'consultation_button_click' 
            {f'AND {date_filter.format(date="e.event_date")}' if date_filter else ''}
            """,
        'Заявок на консультацию всего': f"""
            SELECT al.user_id, lr.campaign, lr.source, lr.medium, lr.term, lr.content
            FROM amo_leads al
            LEFT JOIN lead_resources lr ON al.user_id = lr.user_id 
            {f'WHERE {date_filter.format(date="al.created_at")}' if date_filter else ''}""",
    }

    # Получаем уникальные UTM-метки
    utm_query = """
        SELECT DISTINCT campaign, source, medium, term, content
        FROM lead_resources
    """
    sql.execute(utm_query)
    utm_data = sql.fetchall()

    # Создаем список уникальных комбинаций UTM-меток

    unique_utms = [f"{row['campaign']}|{row['source']}|{row['medium']}|{row['term']}|{row['content']}" for row in utm_data]

    results = []
    for key, query in queries.items():
        sql.execute(query, params)
        result = sql.fetchall()
        result_row = {"label": key, "count": len(result), 'utm': {utm: 0 for utm in unique_utms}}
        for user in result:
            utm = f"{user['campaign']}|{user['source']}|{user['medium']}|{user['term']}|{user['content']}"
            result_row['utm'][utm] += 1

        results.append(result_row)

    # Добавляем запрос для получения данных по заявкам
    leads_query = f"""
        SELECT al.status, lr.campaign, lr.source, lr.medium, lr.term, lr.content
        FROM amo_leads al
        LEFT JOIN lead_resources lr ON al.user_id = lr.user_id 
        {f'WHERE {date_filter.format(date="al.created_at")}' if date_filter else ''}
    """
    sql.execute(leads_query, params)
    leads_data = sql.fetchall()

    # Приводим статусы к текстовым именам и добавляем в результаты
    status_counts = defaultdict(lambda: {"count": 0, "utm": {utm: 0 for utm in unique_utms}})
    for row in leads_data:
        status_text = f"Заявок AMO со статусом \"{status_mapping['active'].get(row['status'], None) or status_mapping['closed'].get(row['status'], row['status'])}\""
        utm = f"{row['campaign']}|{row['source']}|{row['medium']}|{row['term']}|{row['content']}"
        status_counts[status_text]['count'] += 1
        status_counts[status_text]['utm'][utm] += 1

    for status_text, counts in status_counts.items():
        results.append({"label": status_text, "count": counts['count'], 'utm': counts['utm']})

    sql.close()
    db.close()
    return results






def get_date_range_text(start_date, end_date):
    if start_date and end_date:
        return f"Данные за период: с {start_date} по {end_date}"
    elif start_date:
        return f"Данные за период: с {start_date} по текущий день включительно"
    elif end_date:
        return f"Данные с начала по {end_date}"
    else:
        return "Данные за всё время"


"""
Я бы как это сформулировал:
1. В виде воронки:
Зарегистрировалось 521
Находится на П1 - 
Находится на П2 - 
Находится на П3 -
Находится на П4 - 
Находится на П5 - 
Находится на П6 - 
Написало в бота - 
Жало на кнопку реги на консультацию 0
Заявок на консультацию 3
Жало на кнопку регистрации на бесплатный курс 1
Регистраций на бесплатник

И еще нужно как то продумать аналитику по UTM меткам, смотреть сколько с какими метками пришло

И сколько с какими метками куда зарегистрировалось.

Это проще было бы сделать БД, чтобы мы могли сделать выгрузку по пользователям или 
посмотреть в интерфейсе по структуре аналитике, + метки, + их сообщения в бота, 
+ жал/не жал на консу, + жал/не жал на бесплатник, + да/нет рега на консультацию и на бесплатник. 
"""