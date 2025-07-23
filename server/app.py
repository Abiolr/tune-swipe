from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import mysql.connector
import os
import uuid
from datetime import datetime
import spotipy
from spotipy.cache_handler import MemoryCacheHandler
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from urllib.parse import urlencode
from models.database import Database
import constants

# Load environment variables
load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [constants.FRONTEND_URL],
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

@app.route('/')
def home():
    return "Spotify Auth Service Running"

@app.route('/api/spotify/auth_url', methods=['GET'])
def get_auth_url():
    try:
        # Generate a unique state parameter for each request
        state = str(uuid.uuid4())
        
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope='user-read-email',
            show_dialog=True,
            cache_handler=MemoryCacheHandler(),  # Use memory cache
            state=state  # Add unique state parameter
        )
        auth_url = sp_oauth.get_authorize_url()
        return jsonify({'auth_url': auth_url})
    except Exception as e:
        print(f"Error in get_auth_url: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/callback')
def callback():
    try:
        code = request.args.get('code')
        error = request.args.get('error')
        state = request.args.get('state')
        
        if error:
            print(f"Spotify auth error: {error}")
            return redirect(f'{constants.FRONTEND_URL}?error={error}')
        
        if not code:
            print("Missing authorization code")
            return redirect(f'{constants.FRONTEND_URL}?error=missing_code')

        # Initialize OAuth with memory cache
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            cache_handler=MemoryCacheHandler(),
            state=state
        )
        
        # Get access token
        token_info = sp_oauth.get_access_token(code, check_cache=False)
        if not token_info:
            print("Failed to obtain access token")
            return redirect(f'{constants.FRONTEND_URL}?error=auth_failed')

        # Get user info
        sp = spotipy.Spotify(auth=token_info['access_token'])
        try:
            user = sp.current_user()
            if not user or 'id' not in user:
                print("Invalid user data from Spotify")
                return redirect(f'{constants.FRONTEND_URL}?error=auth_failed')
        except Exception as e:
            print(f"Spotify API error: {e}")
            return redirect(f'{constants.FRONTEND_URL}?error=spotify_api_error')

        # Database operations
        conn = None
        try:
            db = Database()
            conn = db.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Insert or update user
            cursor.execute("""
                INSERT INTO Users (user_id, spotify_id, display_name, email, creation_date, last_login)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                email = VALUES(email),
                last_login = VALUES(last_login)
            """, (
                str(uuid.uuid4()),
                user['id'],
                user.get('display_name', ''),
                user.get('email', ''),
                datetime.utcnow(),  # creation_date
                datetime.utcnow()   # last_login
            ))
            conn.commit()

            # Prepare success redirect
            user_params = {
                'auth': 'success',
                'spotify_id': user['id'],
                'display_name': user.get('display_name', ''),
                'email': user.get('email', '')
            }
            
            # URL encode and redirect
            return redirect(f'{constants.FRONTEND_URL}?{urlencode(user_params)}')
            
        except mysql.connector.Error as db_err:
            print(f"Database error: {db_err}")
            return redirect(f'{constants.FRONTEND_URL}?error=database_error')
        finally:
            if conn and conn.is_connected():
                conn.close()
                
    except spotipy.SpotifyException as e:
        print(f"Spotify OAuth error: {e}")
        return redirect(f'{constants.FRONTEND_URL}?error=auth_failed')
    except Exception as e:
        print(f"Unexpected error in callback: {e}")
        return redirect(f'{constants.FRONTEND_URL}?error=server_error')

if __name__ == '__main__':
    print(f"Starting Flask server...")
    print(f"Frontend URL: {constants.FRONTEND_URL}")
    print(f"Spotify Redirect URI: {SPOTIFY_REDIRECT_URI}")
    app.run(host='127.0.0.1', port=5000, debug=True)