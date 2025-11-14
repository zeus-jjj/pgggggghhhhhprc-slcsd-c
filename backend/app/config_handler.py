from json import dumps, loads
from flask import Blueprint, request
from .modules.database import create_connect
from .modules.access_handler import access_handler
from datetime import datetime

config_router = Blueprint('config', __name__, url_prefix='/config')



@config_router.get('/users', endpoint='get_users')
@access_handler((1, 2, 3))
def get_users(user):
    db, sql = create_connect()
    filter_ = request.args.get('filter')
    if filter_ is None:
        return {}, 403

    filter_ = loads(filter_)
    time_start = filter_.get('time_start') or '0001-1-1T0:0'
    time_end = filter_.get('time_end') or datetime.now().strftime('%Y-%m-%dT%H:%M')

    name = '%' + filter_.get('name','').lower() + '%'

    roles = []
    for role in filter_.get('roles'):
        if role.isdigit():
            roles.append(int(role) )

    directions = []
    for direction in filter_.get('directions'):
        if direction.isdigit():
            directions.append(int(direction) )
    q_string = ''
    q_arr = ()

    if name or len(roles) > 0 or len(directions) > 0 :
        q_string = f"WHERE (LOWER(username) LIKE %s OR LOWER(first_name) LIKE %s OR LOWER(last_name) LIKE %s OR u.id::text LIKE %s) AND (role_id = ANY(%s) {'OR role_id is NULL' if '-1' in filter_.get('roles') else ''}) AND (d.id = ANY(%s) {'OR d.id is NULL' if '-1' in filter_.get('directions') else ''}) AND timestamp_registration > %s AND timestamp_registration < %s"
        q_arr = (name,name,name,name, roles, directions, time_start, time_end)

    sql.execute(f"""SELECT u.id, username, first_name, last_name, photo_code, COALESCE(role_id, -1) as role_id, COALESCE(r.name, 'Без роли') as role, COALESCE(code, 'Нет') as direction FROM users u LEFT JOIN roles r on r.id = u.role_id LEFT JOIN lead_resources lr on u.id = lr.user_id
    LEFT JOIN directions d on d.id = lr.direction_id
    {q_string}
    ORDER BY u.role_id LIMIT {filter_.get('limit', 50)}
    """, q_arr)
    users = sql.fetchall()

    db.close()
    return dumps(users, ensure_ascii=False), 200


@config_router.put('/users', endpoint='edit_users')
@access_handler((1,))
def edit_users(user):
    db, sql = create_connect()
    data = request.json

    if data.get('role_id') <= -1:
        data['role_id'] = None

    if data.get('direction_id') <= -1:
        data['direction_id'] = None

    sql.execute("UPDATE users SET last_name=%s, first_name=%s, role_id=%s WHERE id=%s",
                (data.get('last_name', ''), data.get('first_name', ''), data.get('role_id'), data.get('id')))
    sql.execute("UPDATE lead_resources SET direction_id = %s WHERE user_id=%s", (data.get('direction_id'), data.get('id')))
    db.commit()

    db.close()
    return dumps(data, ensure_ascii=False), 200


@config_router.get('/roles', endpoint='get_roles')
@access_handler((1, 2, 3))
def get_roles(user):
    db, sql = create_connect()

    sql.execute("SELECT * FROM roles ORDER BY id")
    roles = sql.fetchall()
    db.close()
    return dumps(roles, ensure_ascii=False), 200


@config_router.get('/directions', endpoint='get_directions')
@access_handler((1, 2, 3))
def get_directions(user):
    db, sql = create_connect()

    sql.execute("SELECT * FROM directions ORDER BY id")
    directions = sql.fetchall()
    directions.append({'id':-1, 'title':"Без направления", 'code':'null'})
    db.close()
    return dumps(directions, ensure_ascii=False), 200

@config_router.get('/profile/<user_id>')
@access_handler((1,2,3))
def get_profile(user, user_id):

    db, sql = create_connect()
    user_id = int(user_id) if user_id.isdigit() or user_id == '-1' else user.get('id')

    sql.execute("""SELECT u.id, username, first_name, last_name, photo_code, to_char(timestamp_registration, 'HH24:MI DD.MM.YYYY') as create_at,
       COALESCE(role_id, -1) as role_id, COALESCE(r.name, 'Без роли') as role, COALESCE(d.id, -1) as direction_id, COALESCE(code, 'Без направления') as direction, campaign, source, medium, term, content,
       COALESCE(biography, 'Нет') as biography, COALESCE(email, 'Нет') as email
    FROM users u
    LEFT JOIN roles r on r.id = u.role_id
    LEFT JOIN lead_resources lr on u.id = lr.user_id
    LEFT JOIN directions d on d.id = lr.direction_id
    LEFT JOIN courses c on c.user_id = u.id
        WHERE u.id = %s
""", (user_id, ))
    user_data = sql.fetchone()

    sql.execute("""
    SELECT t.id,
       question as text,
       status,
       to_char(create_at, 'HH24:MI dd.mm.YYYY') as create_at,
       CONCAT('@', a.username, ' (', a.id,')') as author_name,
       CASE WHEN s.id IS NULL THEN
            ''
             ELSE
             CONCAT(s.first_name, ' ', s.last_name)
             END as support_name
    FROM tickets t
        INNER JOIN users a on a.id = t.author_id
        LEFT JOIN users s on s.id = t.support_id

        WHERE a.id = %s""", (user_id, ))
    user_tickets = sql.fetchall()

    sql.execute("SELECT id, text, to_char(timestamp, 'HH24:MI dd.mm.YYYY') as create_at FROM user_history WHERE user_id = %s ORDER BY id DESC", (user_id, ))
    user_history = sql.fetchall()

    sql.execute("SELECT * FROM directions ORDER BY id")
    directions = sql.fetchall()
    directions.append({'id': -1, 'title': "Без направления", 'code': 'null'})

    sql.execute("SELECT * FROM roles ORDER BY id")
    roles = sql.fetchall()

    db.close()
    return dumps({
        **user_data,
        'tickets':user_tickets,
        'history':user_history,
        'directions': directions,
        'roles': roles,
    }, ensure_ascii=False), 200