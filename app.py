__doc__ = """
"It is of utmost importance to immerse oneself in the context 
of all that history has brought before us, in order to better 
understand the world as it stands today."**
"""

from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, send_from_directory, request
from pathlib import Path
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
import pandas as pd

env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)

def load_historical_data():
    df = pd.read_csv('data/historical_events.csv', sep='|')
    
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

@app.route('/api/submit-fact', methods=['POST'])
def submit_fact():
    data = request.json
    message = Mail(
        from_email=os.environ.get('SENDGRID_VERIFIED_SENDER'),
        to_emails=os.environ.get('SENDGRID_TO_EMAIL'),
        subject='New Historical Fact Submission',
        html_content=f"""
            <strong>Country:</strong> {data['country']}<br>
            <strong>Time Period:</strong> {data['timePeriod']}<br>
            <strong>Theme:</strong> {data['theme']}<br>
            <strong>Source:</strong> {data['source']}<br>
            <strong>Submitter Email:</strong> {data['email']}<br>
            <strong>Fact:</strong> {data['fact']}<br>
        """)
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)