from flask import Flask, render_template, jsonify
from data.historical_events import historical_data

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/events')
def get_events():
    return jsonify(historical_data)

if __name__ == '__main__':
    app.run(debug=True)