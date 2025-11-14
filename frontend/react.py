import flask

# app = flask.Flask('react', static_folder='build', static_url_path='/')
app = flask.Flask('react', static_folder='public', static_url_path='/')

@app.errorhandler(404)
def index(e):
    # return flask.send_from_directory('build','index.html')
    return flask.send_from_directory('public','index.html')

app.run(port=3096)
