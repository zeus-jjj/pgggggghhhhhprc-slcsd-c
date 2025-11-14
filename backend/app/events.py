from . import socketio
from .modules.access_handler import socket_handler
from flask import request
@socketio.on('connect', namespace='/api/chat')
@socketio.on('connect', namespace='/api/notify')
@socketio.on('connect', namespace='/api/tickets')
@socket_handler((1,2,3))
def on_connect():
    print('socket_data', request.args)
    return {'message':'Connect to socket'}

