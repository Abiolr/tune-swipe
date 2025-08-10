"""app.py - TuneSwipe Flask API Application.

Main Flask application providing Spotify authentication, music discovery,
and playlist creation functionality. Handles user sessions, song swiping,
and integration with Spotify and Deezer APIs.

Main components:
- Spotify OAuth authentication flow
- Music search and recommendation
- Swipe session management
- Playlist creation and management
- Database integration for user data
"""

__author__ = "Abiola Raji"
__version__ = "1.0"
__date__ = "2025-08-09"

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import mysql.connector
import uuid
from datetime import datetime, timedelta
import spotipy
from spotipy.cache_handler import MemoryCacheHandler
from spotipy.oauth2 import SpotifyOAuth, SpotifyClientCredentials
from dotenv import load_dotenv
from urllib.parse import urlencode
from database import Database
from constants import *
import random
import json
import requests

load_dotenv()

app = Flask(__name__)
CORS(app, 
    origins=[FRONTEND_URL, BACKEND_URL],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True
)

if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
    raise ValueError("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")

def search_deezer_preview(track_name, artist_name):
    """Search Deezer API for a track and return its preview URL.
    
    Attempts to find a 30-second preview URL for the specified track
    by searching Deezer's public API. Falls back to general search
    if exact match isn't found.
    
    Args:
        track_name (str): Name of the track to search for.
        artist_name (str): Name of the artist.
        
    Returns:
        str or None: Preview URL if found, None otherwise.
    """
    try:
        # Try exact search first
        search_url = f"https://api.deezer.com/search?q=track:\"{track_name}\" artist:\"{artist_name}\""
        response = requests.get(search_url)
        response.raise_for_status()
        
        data = response.json()
        if data.get('data'):
            # Return the first matching track's preview URL
            return data['data'][0].get('preview')
        
        # If no exact match, try a more general search
        search_url = f"https://api.deezer.com/search?q={track_name} {artist_name}"
        response = requests.get(search_url)
        response.raise_for_status()
        
        data = response.json()
        if data.get('data'):
            return data['data'][0].get('preview')
            
        return None
    except Exception as e:
        print(f"Error searching Deezer for {track_name} by {artist_name}: {e}")
        return None

def get_fresh_spotify_token(user_data):
    """Get a fresh access token for the user, refreshing if necessary.
    
    Checks token expiration and refreshes if needed using the stored
    refresh token. Updates the database with new token information.
    
    Args:
        user_data (dict): User data including tokens and expiration.
        
    Returns:
        str: Valid access token.
        
    Raises:
        Exception: If token refresh fails or no refresh token available.
    """
    try:
        # Check if token is still valid (with 5 minute buffer)
        if user_data['token_expires_at'] and user_data['token_expires_at'] > datetime.utcnow() + timedelta(minutes=5):
            return user_data['access_token']
        
        # Token expired, refresh it
        if not user_data['refresh_token']:
            raise Exception("No refresh token available")
        
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope='user-read-email playlist-modify-public playlist-modify-private',  # Always use full scope
            cache_handler=MemoryCacheHandler()
        )
        
        # Refresh the token
        token_info = sp_oauth.refresh_access_token(user_data['refresh_token'])
        
        # Update database with new token
        db = Database()
        db.update_user_tokens(
            spotify_id=user_data['spotify_id'],
            access_token=token_info['access_token'],
            refresh_token=token_info.get('refresh_token', user_data['refresh_token']),
            expires_at=datetime.utcnow() + timedelta(seconds=token_info['expires_in'])
        )
        
        return token_info['access_token']
        
    except Exception as e:
        print(f"Error refreshing token: {e}")
        raise Exception("Authentication required. Please sign in again.")

@app.route('/')
def home():
    """Health check endpoint.
    
    Returns:
        dict: Service status and version information.
    """
    return jsonify({
        "status": "ok",
        "service": "TuneSwipe API",
        "version": "1.0"
        })

@app.route('/api/spotify/auth_url', methods=['GET'])
def get_auth_url():
    """Generate Spotify OAuth authorization URL.
    
    Creates a unique state parameter and generates the full Spotify
    authorization URL with required scopes for playlist management.
    
    Returns:
        dict: JSON response containing the authorization URL.
        
    Status Codes:
        200: Success - auth URL generated
        500: Internal server error
    """
    try:
        state = str(uuid.uuid4())
        scopes = 'user-read-email playlist-modify-public playlist-modify-private'
        
        print(f"Auth URL request - requesting full scopes: {scopes}")
        
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope=scopes,
            show_dialog=True,
            cache_handler=MemoryCacheHandler(),
            state=state
        )
        auth_url = sp_oauth.get_authorize_url()
        
        print(f"Generated auth URL: {auth_url}")
        return jsonify({'auth_url': auth_url})
        
    except Exception as e:
        print(f"Error in get_auth_url: {e}")
        return jsonify({'error': str(e)}), HTTP_INTERNAL_SERVER_ERROR

@app.route('/callback')
def callback():
    """Handle Spotify OAuth callback.
    
    Processes the authorization code from Spotify, exchanges it for
    access and refresh tokens, retrieves user information, and stores
    everything in the database. Redirects to frontend with user data.
    
    Returns:
        Response: Redirect to frontend URL with success/error parameters.
    """
    try:
        code = request.args.get('code')
        error = request.args.get('error')
        state = request.args.get('state')
        
        print(f"Callback received - code: {bool(code)}, error: {error}")
        
        if error:
            print(f"Spotify auth error: {error}")
            return redirect(f'{FRONTEND_URL}?error={error}')
        
        if not code:
            print("Missing authorization code")
            return redirect(f'{FRONTEND_URL}?error=missing_code')

        # Initialize OAuth with memory cache - always use full scope
        sp_oauth = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope='user-read-email playlist-modify-public playlist-modify-private',
            cache_handler=MemoryCacheHandler(),
            state=state
        )
        
        token_info = sp_oauth.get_access_token(code, check_cache=False)
        if not token_info:
            print("Failed to obtain access token")
            return redirect(f'{FRONTEND_URL}?error=auth_failed')

        # Get user info
        sp = spotipy.Spotify(auth=token_info['access_token'])
        try:
            user = sp.current_user()
            if not user or 'id' not in user:
                print("Invalid user data from Spotify")
                return redirect(f'{FRONTEND_URL}?error=auth_failed')
        except Exception as e:
            print(f"Spotify API error: {e}")
            return redirect(f'{FRONTEND_URL}?error=spotify_api_error')

        conn = None
        try:
            db = Database()
            conn = db.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Calculate token expiry
            expires_at = datetime.utcnow() + timedelta(seconds=token_info.get('expires_in', 3600))
            
            cursor.execute("""
                INSERT INTO Users (
                    spotify_id, display_name, email, access_token, 
                    refresh_token, token_expires_at, creation_date, last_login
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                email = VALUES(email),
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token),
                token_expires_at = VALUES(token_expires_at),
                last_login = VALUES(last_login)
            """, (
                user['id'],
                user.get('display_name', ''),
                user.get('email', ''),
                token_info['access_token'],
                token_info.get('refresh_token'),
                expires_at,
                datetime.utcnow(),
                datetime.utcnow()
            ))
            conn.commit()

            # Get the updated user data
            cursor.execute("""
                SELECT last_login FROM Users WHERE spotify_id = %s
            """, (user['id'],))
            user_data = cursor.fetchone()

            # Prepare success redirect parameters
            user_params = {
                'auth': 'success',
                'spotify_id': user['id'],
                'display_name': user.get('display_name', ''),
                'email': user.get('email', ''),
                'last_login': user_data['last_login'].strftime("%Y-%m-%d %-H:%M:%S")
            }
            
            redirect_url = f'{FRONTEND_URL}?{urlencode(user_params)}'
            
            print(f"Final redirect URL: {redirect_url}")
            return redirect(redirect_url)
            
        except mysql.connector.Error as db_err:
            print(f"Database error: {db_err}")
            return redirect(f'{FRONTEND_URL}?error=database_error')
        finally:
            if conn and conn.is_connected():
                conn.close()
                
    except spotipy.SpotifyException as e:
        print(f"Spotify OAuth error: {e}")
        return redirect(f'{FRONTEND_URL}?error=auth_failed')
    except Exception as e:
        print(f"Unexpected error in callback: {e}")
        return redirect(f'{FRONTEND_URL}?error=server_error')

@app.route('/api/get_song', methods=['GET'])
def get_song():
    """Fetch unique songs from Spotify search based on genres.
    
    Searches Spotify for tracks matching specified genres, filters out
    previously seen songs, and enriches with Deezer preview URLs.
    Tracks seen songs per session to avoid duplicates.
    
    Query Parameters:
        genre (str): Comma-separated list of genres (default: 'pop')
        limit (int): Maximum number of songs to return (max 50, default: 20)
        spotify_id (str): User's Spotify ID (default: 'anonymous')
        session_id (str): Current session ID for filtering seen songs
    
    Returns:
        dict: JSON response with tracks array and metadata.
        
    Status Codes:
        200: Success - songs returned
        400: Bad request - no songs found for genres
        500: Internal server error
    """
    try:
        # Get basic parameters
        genres = request.args.get('genre', 'pop').split(',')
        genres = [g.strip() for g in genres if g.strip()]
        if not genres:
            genres = ['pop']
            
        limit = min(int(request.args.get('limit', 20)), 50)
        spotify_id = request.args.get('spotify_id', 'anonymous')
        session_id = request.args.get('session_id', '')
        
        print(f"Fetching songs for genres: {genres}, limit: {limit}")
        
        # Initialize Spotify client
        try:
            sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
                client_id=SPOTIFY_CLIENT_ID,
                client_secret=SPOTIFY_CLIENT_SECRET
            ))
        except Exception as e:
            print(f"Spotify API error: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Spotify API connection failed: {str(e)}'
            }), HTTP_INTERNAL_SERVER_ERROR

        # Get already seen songs from this session
        seen_songs = set()
        if session_id:
            try:
                db = Database()
                seen_songs_data = db.get_session_seen_songs(spotify_id, session_id)
                seen_songs = {song for song in seen_songs_data}
                print(f"Filtering out {len(seen_songs)} already seen songs")
            except Exception as e:
                print(f"Database error getting seen songs: {e}")

        # Simple search queries - one per genre
        all_tracks = []
        for genre in genres:
            try:
                # Simple search with random offset for variety
                if random.random() < 0.65:
                    offset = random.randint(0, 200)
                else:
                    offset = random.randint(200, 400)
                
                results = sp.search(
                    q=f'genre:"{genre}"',
                    type='track',
                    limit=50,
                    offset=offset,
                    market='US'
                )
                
                tracks = results.get('tracks', {}).get('items', [])
                print(f"Genre '{genre}' returned {len(tracks)} tracks")
                
                # Add valid tracks
                for track in tracks:
                    if (track.get('id') and 
                        track.get('id') not in seen_songs and
                        track.get('name') and 
                        track.get('artists')):
                        all_tracks.append(track)
                
            except Exception as e:
                print(f"Search failed for genre '{genre}': {e}")
                continue

        # If no tracks from genre search, try basic fallback
        if not all_tracks:
            try:
                print("No tracks from genre search, trying fallback")
                results = sp.search(
                    q=' OR '.join(genres),
                    type='track',
                    limit=50,
                    offset=0,
                    market='US'
                )
                
                tracks = results.get('tracks', {}).get('items', [])
                for track in tracks:
                    if (track.get('id') and 
                        track.get('id') not in seen_songs and
                        track.get('name') and 
                        track.get('artists')):
                        all_tracks.append(track)
                        
            except Exception as e:
                print(f"Fallback search failed: {e}")

        # Remove duplicates and shuffle
        unique_tracks = list({t['id']: t for t in all_tracks}.values())
        random.shuffle(unique_tracks)
        
        # Return error if no tracks found
        if not unique_tracks:
            return jsonify({
                'status': 'error',
                'message': f'No songs found for genres: {", ".join(genres)}'
            }), HTTP_BAD_REQUEST

        # Take only what we need
        selected_tracks = unique_tracks[:limit]
        
        # Process tracks
        processed = []
        for track in selected_tracks:
            try:
                # Get Deezer preview URL
                preview_url = None
                if track.get('artists'):
                    artist_name = track['artists'][0]['name']
                    try:
                        preview_url = search_deezer_preview(track['name'], artist_name)
                    except Exception:
                        pass  # Continue without preview
                
                # Add to database if we have a session
                if session_id:
                    try:
                        db = Database()
                        db.add_song_to_session(
                            session_id=session_id,
                            spotify_id=track['id'],
                            track_data=track
                        )
                    except Exception as e:
                        print(f"Database insert error: {e}")
                
                # Create processed track
                processed_track = {
                    'id': str(uuid.uuid4()),
                    'spotify_id': track['id'],
                    'name': track.get('name', 'Unknown Title'),
                    'artist': track['artists'][0]['name'] if track.get('artists') else 'Unknown Artist',
                    'previewUrl': preview_url,
                    'image_url': '',
                    'uri': track.get('uri', ''),
                    'popularity': track.get('popularity', 0),
                    'album': track.get('album', {}).get('name', 'Unknown Album'),
                    'release_date': track.get('album', {}).get('release_date'),
                    'external_url': track.get('external_urls', {}).get('spotify', ''),
                    'isExplicit': track.get('explicit', False)
                }
                
                # Get album image
                album_images = track.get('album', {}).get('images', [])
                if album_images:
                    processed_track['image_url'] = album_images[0]['url']
                
                processed.append(processed_track)
                
            except Exception as e:
                print(f"Error processing track {track.get('id')}: {e}")
                continue

        print(f"Returning {len(processed)} processed tracks")
        
        return jsonify({
            'status': 'success',
            'data': {
                'tracks': processed,
                'total': len(processed),
                'next_offset': None
            }
        })

    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/swipe', methods=['POST'])
def record_swipe():
    """Record a user's swipe action on a song.
    
    Stores the user's swipe decision (left/right) for a specific song
    in a session. Ensures the song exists in the database before
    recording the swipe.
    
    Request Body:
        session_id (str): Session identifier
        song_data (dict): Song information including spotify_id
        direction (str): Swipe direction ('LEFT' or 'RIGHT')
    
    Returns:
        dict: JSON response with swipe ID on success.
        
    Status Codes:
        200: Success - swipe recorded
        500: Internal server error
    """
    try:
        data = request.get_json()
        session_id = data['session_id']
        song_data = data['song_data']
        direction = data['direction']
        
        db = Database()
        
        # First ensure song exists in database and get the database song_id
        song_id = db.add_song_to_session(
            session_id=session_id,
            spotify_id=song_data['spotify_id'],  # Use the correct key from processed track
            track_data=song_data
        )
        
        if not song_id:
            raise ValueError("Failed to add song to database")
        
        # Record swipe using the database song_id
        swipe_id = db.record_swipe(
            session_id=session_id,
            song_id=song_id,
            direction=direction
        )
        
        return jsonify({'status': 'success', 'swipe_id': swipe_id})
        
    except Exception as e:
        print(f"Error in record_swipe: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/swipe_sessions', methods=['POST'])
def create_swipe_session():
    """Create a new swipe session for a user.
    
    Initializes a new swiping session with specified preferences
    and target playlist length. Each session tracks songs shown
    and user swipe decisions.
    
    Request Body:
        spotify_id (str): User's Spotify ID
        target_playlist_length (int): Desired number of liked songs (default: 20)
        session_preferences (dict): User preferences like genres (default: {})
    
    Returns:
        dict: JSON response with new session details.
        
    Status Codes:
        200: Success - session created
        400: Bad request - missing Spotify ID
        500: Internal server error
    """
    try:
        data = request.get_json()
        spotify_id = data.get('spotify_id')
        target_playlist_length = data.get('target_playlist_length', 20)
        session_preferences = data.get('session_preferences', {})
        
        if not spotify_id:
            return jsonify({
                'status': 'error',
                'message': 'Spotify ID is required'
            }), HTTP_BAD_REQUEST
        
        session_id = str(uuid.uuid4())
        
        db = Database()
        conn = db.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO SwipeSessions (
                session_id, spotify_id, target_playlist_length, 
                session_preferences, creation_date
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            session_id,
            spotify_id,
            target_playlist_length,
            json.dumps(session_preferences),
            datetime.utcnow()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': {
                'session_id': session_id,
                'spotify_id': spotify_id,
                'target_playlist_length': target_playlist_length
            },
            'message': 'Swipe session created successfully'
        })
        
    except Exception as e:
        print(f"Error creating swipe session: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to create swipe session: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/swipe_sessions', methods=['GET'])
def get_swipe_sessions():
    """Get swipe sessions for a user with aggregated statistics.
    
    Retrieves all swipe sessions for a user including session metadata
    and aggregated swipe statistics (total swipes, likes, passes).
    
    Query Parameters:
        spotify_id (str): User's Spotify ID
    
    Returns:
        dict: JSON response with sessions array and total count.
        
    Status Codes:
        200: Success - sessions returned
        400: Bad request - missing Spotify ID
        500: Internal server error
    """
    try:
        spotify_id = request.args.get('spotify_id')
        
        if not spotify_id:
            return jsonify({
                'status': 'error',
                'message': 'Spotify ID is required'
            }), HTTP_BAD_REQUEST
        
        db = Database()
        conn = db.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get sessions with aggregated stats
        cursor.execute("""
            SELECT 
                ss.session_id,
                ss.spotify_id,
                ss.target_playlist_length,
                ss.session_preferences,
                ss.session_status,
                ss.creation_date,
                ss.completion_date,
                COUNT(sw.swipe_id) as total_swipes,
                COUNT(CASE WHEN sw.direction = 'RIGHT' THEN 1 END) as liked_count,
                COUNT(CASE WHEN sw.direction = 'LEFT' THEN 1 END) as passed_count
            FROM SwipeSessions ss
            LEFT JOIN Swipes sw ON ss.session_id = sw.session_id
            WHERE ss.spotify_id = %s
            GROUP BY ss.session_id
            ORDER BY ss.creation_date DESC
        """, (spotify_id,))
        
        sessions = cursor.fetchall()
        
        # Convert JSON strings back to objects and format dates
        for session in sessions:
            if session['session_preferences']:
                try:
                    session['session_preferences'] = json.loads(session['session_preferences'])
                except:
                    session['session_preferences'] = {}
            else:
                session['session_preferences'] = {}
            
            # Format dates for frontend
            if session['creation_date']:
                session['creation_date'] = session['creation_date'].isoformat()
            if session['completion_date']:
                session['completion_date'] = session['completion_date'].isoformat()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'sessions': sessions,
            'total': len(sessions)
        })
        
    except Exception as e:
        print(f"Error getting swipe sessions: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get swipe sessions: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/session_progress/<session_id>', methods=['GET'])
def get_session_progress(session_id):
    """Get current progress of a swipe session.
    
    Returns session progress including number of liked songs vs target,
    total swipes, and completion status.
    
    Args:
        session_id (str): Session identifier from URL path
    
    Returns:
        dict: JSON response with progress data.
        
    Status Codes:
        200: Success - progress returned
        404: Not found - session doesn't exist
        500: Internal server error
    """
    try:
        db = Database()
        progress = db.get_session_progress(session_id)
        
        if not progress:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), HTTP_NOT_FOUND
            
        return jsonify({
            'status': 'success',
            'data': progress
        })
        
    except Exception as e:
        print(f"Error getting session progress: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get session progress: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/complete_session/<session_id>', methods=['POST'])
def complete_session(session_id):
    """Mark a swipe session as completed.
    
    Updates session status to completed and returns final statistics.
    Can be called multiple times safely (idempotent operation).
    
    Args:
        session_id (str): Session identifier from URL path
    
    Returns:
        dict: JSON response with completion status and statistics.
        
    Status Codes:
        200: Success - session completed
        400: Bad request - missing session ID
        500: Internal server error
    """
    try:
        if not session_id:
            return jsonify({
                'status': 'error',
                'message': 'Session ID is required'
            }), HTTP_BAD_REQUEST
        
        db = Database()
        result = db.complete_session(session_id)
        
        if result['success']:
            return jsonify({
                'status': 'success',
                'message': 'Session completed successfully',
                'data': {
                    'session_id': session_id,
                    'stats': result['stats']
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to complete session: {result.get("error", "Unknown error")}'
            }), HTTP_INTERNAL_SERVER_ERROR
            
    except Exception as e:
        print(f"Error completing session: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/check_auth/<spotify_id>', methods=['GET'])
def check_auth(spotify_id):
    """Check if user needs to re-authenticate for playlist creation.
    
    Validates user's stored tokens and tests playlist permissions
    by attempting to access Spotify's playlist API.
    
    Args:
        spotify_id (str): User's Spotify ID from URL path
    
    Returns:
        dict: JSON response indicating authentication status.
        
    Status Codes:
        200: Success - user is authenticated
        404: Not found - user doesn't exist
        401: Unauthorized - authentication required
        500: Internal server error
    """
    try:
        db = Database()
        user = db.get_user(spotify_id)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found',
                'needs_auth': True
            }), HTTP_NOT_FOUND
        
        # Check if user has valid tokens
        has_valid_token = (
            user.get('access_token') and 
            user.get('refresh_token') and
            user.get('token_expires_at')
        )
        
        if not has_valid_token:
            return jsonify({
                'status': 'error',
                'message': 'Authentication required',
                'needs_auth': True
            })
        
        # Try to get a fresh token (this will test if the token can be refreshed)
        try:
            fresh_token = get_fresh_spotify_token(user)
            
            # Test if the token has playlist permissions by trying to get user's playlists
            sp = spotipy.Spotify(auth=fresh_token)
            sp.current_user_playlists(limit=1)  # Test playlist access
            
            return jsonify({
                'status': 'success',
                'needs_auth': False,
                'message': 'User is authenticated with playlist permissions'
            })
        except Exception as e:
            print(f"Token validation failed: {e}")
            return jsonify({
                'status': 'error',
                'message': 'Authentication or permissions invalid',
                'needs_auth': True
            })
            
    except Exception as e:
        print(f"Error checking auth: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Server error',
            'needs_auth': True
        }), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/create_playlist', methods=['POST'])
def create_playlist():
    """Create a new Spotify playlist for the user.
    
    Creates a playlist on the user's Spotify account using their
    stored authentication tokens. Saves playlist information to
    the local database.
    
    Request Body:
        spotify_id (str): User's Spotify ID
        name (str): Playlist name
        description (str): Playlist description (optional)
        public (bool): Whether playlist should be public (default: True)
    
    Returns:
        dict: JSON response with playlist ID and external URL.
        
    Status Codes:
        200: Success - playlist created
        401: Unauthorized - authentication required
        404: Not found - user doesn't exist
        500: Internal server error
    """
    try:
        data = request.get_json()
        spotify_id = data['spotify_id']
        name = data['name']
        description = data.get('description', '')
        public = data.get('public', True)

        # Get user's access token from database
        db = Database()
        user = db.get_user(spotify_id)
        if not user:
            return jsonify({
                'status': 'error', 
                'message': 'User not found',
                'needs_auth': True
            }), HTTP_NOT_FOUND

        # Get fresh token and create playlist
        try:
            fresh_token = get_fresh_spotify_token(user)
            sp = spotipy.Spotify(auth=fresh_token)
            
            # Correct spotipy API usage - positional arguments only
            playlist = sp.user_playlist_create(
                spotify_id,  # user_id as positional argument
                name,        # name as positional argument
                public=public,
                description=description
            )

            # Save playlist to database
            playlist_id = str(uuid.uuid4())
            db.save_playlist(
                playlist_id=playlist_id,
                spotify_id=spotify_id,
                spotify_playlist_id=playlist['id'],
                name=name,
                description=description
            )

            return jsonify({
                'status': 'success',
                'playlist_id': playlist['id'],
                'external_url': playlist['external_urls']['spotify']
            })

        except spotipy.SpotifyException as spotify_error:
            print(f"Spotify API error: {spotify_error}")
            return jsonify({
                'status': 'error',
                'message': f'Spotify API error: {str(spotify_error)}',
                'needs_auth': True
            }), HTTP_UNAUTHORIZED
        except Exception as auth_error:
            print(f"Authentication error: {auth_error}")
            return jsonify({
                'status': 'error',
                'message': str(auth_error),
                'needs_auth': True
            }), HTTP_UNAUTHORIZED

    except Exception as e:
        print(f"Error creating playlist: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/add_tracks_to_playlist/<playlist_id>', methods=['POST'])
def add_tracks_to_playlist(playlist_id):
    """Add tracks to an existing Spotify playlist.
    
    Adds multiple tracks to a specified playlist using the user's stored
    authentication tokens. Handles Spotify's API limits by batching requests.
    
    Args:
        playlist_id (str): Spotify playlist ID from URL path
    
    Request Body:
        spotify_id (str): User's Spotify ID
        track_uris (list): Array of Spotify track URIs to add
        
    Returns:
        dict: JSON response with number of tracks added.
        
    Status Codes:
        200: Success - tracks added (or no tracks to add)
        401: Unauthorized - authentication required
        404: Not found - user doesn't exist
        500: Internal server error
    """
    try:
        data = request.get_json()
        spotify_id = data['spotify_id']
        track_uris = data['track_uris']

        if not track_uris:
            return jsonify({'status': 'success', 'message': 'No tracks to add'})

        # Get user's access token from database
        db = Database()
        user = db.get_user(spotify_id)
        if not user:
            return jsonify({
                'status': 'error', 
                'message': 'User not found',
                'needs_auth': True
            }), HTTP_NOT_FOUND

        try:
            # Get fresh token and add tracks
            fresh_token = get_fresh_spotify_token(user)
            sp = spotipy.Spotify(auth=fresh_token)
            
            # Add tracks in batches of 100 (Spotify API limit)
            for i in range(0, len(track_uris), 100):
                batch = track_uris[i:i+100]
                sp.playlist_add_items(playlist_id, batch)

            return jsonify({'status': 'success', 'added': len(track_uris)})

        except spotipy.SpotifyException as spotify_error:
            print(f"Spotify API error adding tracks: {spotify_error}")
            return jsonify({
                'status': 'error',
                'message': f'Spotify API error: {str(spotify_error)}',
                'needs_auth': True
            }), HTTP_UNAUTHORIZED
        except Exception as auth_error:
            print(f"Authentication error adding tracks: {auth_error}")
            return jsonify({
                'status': 'error',
                'message': str(auth_error),
                'needs_auth': True
            }), HTTP_UNAUTHORIZED

    except Exception as e:
        print(f"Error adding tracks to playlist: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), HTTP_INTERNAL_SERVER_ERROR

@app.route('/api/session_songs/<session_id>', methods=['GET'])
def get_session_songs(session_id):
    """Get all songs from a specific swipe session with swipe data.
    
    Retrieves complete track information for all songs shown during a session,
    including whether they were liked (right swipe) or passed (left swipe).
    
    Args:
        session_id (str): Session identifier from URL path
    
    Returns:
        dict: JSON response with songs array and total count.
        
    Status Codes:
        200: Success - songs returned
        400: Bad request - missing session ID
        500: Internal server error
    """
    try:
        if not session_id:
            return jsonify({
                'status': 'error',
                'message': 'Session ID is required'
            }), HTTP_BAD_REQUEST
        
        db = Database()
        songs = db.get_session_songs(session_id)
        
        return jsonify({
            'status': 'success',
            'songs': songs,
            'total': len(songs)
        })
        
    except Exception as e:
        print(f"Error getting session songs: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to get session songs: {str(e)}'
        }), HTTP_INTERNAL_SERVER_ERROR
        
if __name__ == '__main__':
    print("Starting Flask server...")
    print(f"Environment: {'Local Development' if IS_LOCAL else 'Production'}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Spotify Redirect URI: {SPOTIFY_REDIRECT_URI}")
    
    if IS_LOCAL:
        app.run(host='127.0.0.1', port=5000, debug=True)
    else:
        port = int(os.getenv('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)