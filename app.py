__doc__ = """
"It is of utmost importance to immerse oneself in the context 
of all that history has brought before us, in order to better 
understand the world as it stands today."**
"""

from flask import Flask, render_template, jsonify, send_from_directory
import pandas as pd

app = Flask(__name__)

def load_historical_data():
    df = pd.read_csv('data/historical_events.csv')
    
    # Convert DataFrame to the required dictionary structure
    historical_data = {}
    for _, row in df.iterrows():
        date = row['Date']
        country = row['Country']
        theme = row['Theme']
        event = row['Event']
        
        if date not in historical_data:
            historical_data[date] = {'order': len(historical_data)}
        
        if country not in historical_data[date]:
            historical_data[date][country] = {}
            
        historical_data[date][country][theme] = event
    
    return historical_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/events')
def get_events():
    historical_data = load_historical_data()
    return jsonify(historical_data)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

if __name__ == '__main__':
    app.run(debug=True)