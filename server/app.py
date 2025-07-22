from flask import Flask, request, jsonify, redirect
from flask_cors import CORS  # Add CORS support
import mysql.connector
import os
import uuid
from datetime import datetime
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from urllib.parse import urlencode

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Frontend configuration
FRONTEND_PORT = "5173"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

CORS(app, resources={
    r"/api/*": {
        "origins": [FRONTEND_URL],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Validate Spotify credentials
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
    raise ValueError("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")

# Use Flask server for callback
SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5000/callback'

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv('RLWY_HOST'),
        user=os.getenv('RLWY_USER'),
        password=os.getenv('RLWY_PASS'),
        database=os.getenv('RLWY_DB'),
        port=os.environ.get('RLWY_PORT')
    )

@app.route('/')
def home():
    return "Spotify Auth Service Running"

@app.route('/api/spotify/auth_url', methods=['GET'])
def get_auth_url():
    try:
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope='user-read-email',
            show_dialog=True
        )
        auth_url = sp_oauth.get_authorize_url()
        return jsonify({'auth_url': auth_url})
    except Exception as e:
        print(f"Error in get_auth_url: {e}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/callback')
def callback():
    try:
        code = request.args.get('code')
        error = request.args.get('error')
        
        if error:
            return redirect(f'{FRONTEND_URL}?error={error}')
        
        if not code:
            return redirect(f'{FRONTEND_URL}?error=missing_code')

        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI
        )
        
        token_info = sp_oauth.get_access_token(code)
        sp = spotipy.Spotify(auth=token_info['access_token'])
        user = sp.current_user()

        # Database operations
        conn = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                INSERT INTO Users (user_id, spotify_id, display_name, email, creation_date)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                email = VALUES(email)
            """, (
                str(uuid.uuid4()),
                user['id'],
                user.get('display_name', ''),
                user.get('email', ''),
                datetime.now()
            ))
            conn.commit()

            user_params = urlencode({
                'auth': 'success',
                'spotify_id': user['id'],
                'display_name': user.get('display_name', ''),
                'email': user.get('email', '')
            })
            
            return redirect(f'{FRONTEND_URL}?{user_params}')
            
        except mysql.connector.Error as db_err:
            print(f"Database error: {db_err}")
            return redirect(f'{FRONTEND_URL}?error=database_error')
        finally:
            if conn and conn.is_connected():
                conn.close()
                
    except Exception as e:
        print(f"Error in callback: {e}")
        return redirect(f'{FRONTEND_URL}?error=auth_failed')

if __name__ == '__main__':
    print(f"Starting Flask server...")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Spotify Redirect URI: {SPOTIFY_REDIRECT_URI}")
    app.run(host='127.0.0.1', port=5000, debug=True)