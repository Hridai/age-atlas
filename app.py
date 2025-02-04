__doc__ = """
"It is of utmost importance to immerse oneself in the context 
of all that history has brought before us, in order to better 
understand the world as it stands today."**
"""

from flask import Flask, render_template, jsonify
from data.historical_events import historical_data

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/events')
def get_events():
    ordered_data = {
        date: {'order': idx, **events} 
        for idx, (date, events) in enumerate(historical_data.items())
    }
    return jsonify(ordered_data)

if __name__ == '__main__':
    app.run(debug=True)