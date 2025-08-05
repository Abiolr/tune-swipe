# database.py
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid
import json
from pathlib import Path

load_dotenv()

class Database:

    def __init__(self):
        self.host = os.environ.get('RLWY_HOST')
        self.user = os.environ.get('RLWY_USER')
        self.password = os.environ.get('RLWY_PASS')
        self.database = os.environ.get('RLWY_DB')
        self.port = os.environ.get('RLWY_PORT')
        self.sql_dir = Path(__file__).parent / "sql"

    def _load_sql_query(self, filename):
        """Load SQL query from file"""
        sql_path = self.sql_dir / filename
        with open(sql_path, 'r') as f:
            return f.read().strip()
    
    def get_db_connection(self):
        return mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port,
            time_zone='+00:00'
        )

    def create_database_tables(self):
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            current_dir = os.path.dirname(__file__)
            sql_path = os.path.join(current_dir, "./sql/table_setup.sql")
            
            with open(sql_path, 'r') as sql_file:
                sql_commands = sql_file.read().split(';')
                for command in sql_commands:
                    if command.strip():
                        cursor.execute(command)
            
            conn.commit()
            print("Database tables created successfully!")
        except Exception as err:
            print(f"Error: {err}")
            conn.rollback()
        finally:
            if conn.is_connected():
                cursor.close()
                conn.close()

    def get_user_seen_songs(self, spotify_id):
        """Get all songs a user has seen across all sessions with better deduplication"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = self._load_sql_query('get_user_seen_songs.sql')
            cursor.execute(query, (spotify_id,))
            
            result = cursor.fetchall()
            conn.close()
            return result
            
        except Exception as e:
            print(f"Error fetching seen songs: {e}")
            return []

    def get_user_liked_songs(self, spotify_id, limit=None):
        """Get songs a user has liked (swiped right) with session info"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = self._load_sql_query('get_user_liked_songs.sql')
            
            if limit:
                query += f" LIMIT {limit}"
                
            cursor.execute(query, (spotify_id,))
            result = cursor.fetchall()
            conn.close()
            return result
            
        except Exception as e:
            print(f"Error fetching liked songs: {e}")
            return []

    def complete_session(self, session_id):
        """Mark a session as completed and return session stats"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # First check if session exists and is not already completed
            cursor.execute("""
                SELECT session_status, target_playlist_length
                FROM SwipeSessions 
                WHERE session_id = %s
            """, (session_id,))
            
            session_info = cursor.fetchone()
            if not session_info:
                return {'success': False, 'error': 'Session not found'}
            
            if session_info['session_status'] == 'COMPLETED':
                print(f"Session {session_id} is already completed")
                # Still return stats even if already completed
            
            # Get session stats
            cursor.execute("""
                SELECT 
                    ss.target_playlist_length,
                    COUNT(CASE WHEN sw.direction = 'RIGHT' THEN 1 END) as liked_count,
                    COUNT(sw.swipe_id) as total_swipes
                FROM SwipeSessions ss
                LEFT JOIN Swipes sw ON ss.session_id = sw.session_id
                WHERE ss.session_id = %s
                GROUP BY ss.session_id
            """, (session_id,))
            
            stats = cursor.fetchone()
            
            # Mark session as completed (only if not already completed)
            if session_info['session_status'] != 'COMPLETED':
                cursor.execute("""
                    UPDATE SwipeSessions 
                    SET session_status = 'COMPLETED', completion_date = %s 
                    WHERE session_id = %s
                """, (datetime.utcnow(), session_id))
                
                conn.commit()
                print(f"Session {session_id} marked as completed")
            
            conn.close()
            
            return {
                'success': True,
                'stats': stats or {
                    'liked_count': 0, 
                    'total_swipes': 0, 
                    'target_playlist_length': session_info['target_playlist_length']
                }
            }
            
        except Exception as e:
            print(f"Error completing session: {e}")
            if 'conn' in locals() and conn.is_connected():
                conn.rollback()
                conn.close()
            return {'success': False, 'error': str(e)}

    def check_song_exists(self, spotify_uri=None, spotify_id=None):
        """Check if a song already exists in the database"""
        if not spotify_uri and not spotify_id:
            return None
            
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            if spotify_uri:
                cursor.execute("SELECT song_id FROM Songs WHERE spotify_uri = %s", (spotify_uri,))
            else:
                cursor.execute("SELECT song_id FROM Songs WHERE spotify_id = %s", (spotify_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result['song_id'] if result else None
            
        except Exception as e:
            print(f"Error checking song existence: {e}")
            return None

    def get_session_progress(self, session_id):
        """Get current progress of a swipe session"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = self._load_sql_query('get_session_progress.sql')
            cursor.execute(query, (session_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                result['progress_percentage'] = (result['liked_count'] / result['target_playlist_length']) * 100
                result['is_complete'] = result['liked_count'] >= result['target_playlist_length']
            
            return result
            
        except Exception as e:
            print(f"Error getting session progress: {e}")
            return None

    def get_session_seen_songs(self, spotify_id, session_id):
        """Get spotify_ids of songs already seen in this session"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT DISTINCT s.spotify_id 
                FROM Songs s 
                JOIN Swipes sw ON s.song_id = sw.song_id 
                WHERE sw.session_id = %s AND s.spotify_id IS NOT NULL
            """, (session_id,))
            
            return {row[0] for row in cursor.fetchall()}
            
        except Exception as e:
            print(f"Error getting session seen songs: {e}")
            return set()
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def add_song_to_session(self, session_id, spotify_id, track_data):
        """Add song to database when served to user"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Check if song exists
            cursor.execute("SELECT song_id FROM Songs WHERE spotify_id = %s", (spotify_id,))
            existing_song = cursor.fetchone()
            
            if existing_song:
                song_id = existing_song[0]
            else:
                # Insert new song with safe data handling
                song_id = str(uuid.uuid4())
                
                artist_name = 'Unknown Artist'
                if track_data.get('artists') and len(track_data['artists']) > 0:
                    artist_name = track_data['artists'][0].get('name', 'Unknown Artist')
                
                album_image = ''
                if track_data.get('album', {}).get('images'):
                    album_image = track_data['album']['images'][0].get('url', '')
                
                cursor.execute("""
                    INSERT INTO Songs (
                        song_id, spotify_id, title, artist, preview_url,
                        album_cover, popularity, last_updated
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    song_id,
                    spotify_id,
                    track_data.get('name', 'Unknown Title'),
                    artist_name,
                    track_data.get('preview_url'),
                    album_image,
                    track_data.get('popularity', 0),
                    datetime.utcnow()
                ))
            
            conn.commit()
            return song_id
            
        except Exception as e:
            print(f"Error adding song to session: {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def record_swipe(self, session_id, song_id, direction):
        """Record swipe with proper error handling"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Get next swipe order
            cursor.execute("""
                SELECT COALESCE(MAX(swipe_order), 0) + 1 
                FROM Swipes WHERE session_id = %s
            """, (session_id,))
            next_order = cursor.fetchone()[0]
            
            # Insert swipe
            swipe_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO Swipes (
                    swipe_id, session_id, song_id,
                    direction, swipe_order, swipe_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                swipe_id, session_id, song_id,
                direction, next_order, datetime.utcnow()
            ))
            
            conn.commit()
            return swipe_id
            
        except Exception as e:
            print(f"Error recording swipe: {e}")
            if conn:
                conn.rollback()
            raise  # Re-raise the exception so the API endpoint can handle it
        finally:
            if cursor:
                cursor.close()
            if conn and conn.is_connected():
                conn.close()

    def get_user_sessions(self, spotify_id):
        """Get all swipe sessions for a user with stats"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = self._load_sql_query('get_user_sessions.sql')
            cursor.execute(query, (spotify_id,))
            
            sessions = cursor.fetchall()
            
            sessions = cursor.fetchall()
            
            # Process the results
            for session in sessions:
                if session['session_preferences']:
                    try:
                        session['session_preferences'] = json.loads(session['session_preferences'])
                    except:
                        session['session_preferences'] = {}
                else:
                    session['session_preferences'] = {}
            
            conn.close()
            return sessions
            
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []   

    def get_user(self, spotify_id):
        """Get user by spotify_id including access token"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM Users WHERE spotify_id = %s", (spotify_id,))
            return cursor.fetchone()
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
        finally:
            if conn and conn.is_connected():
                conn.close()

    def update_user_tokens(self, spotify_id, access_token, refresh_token, expires_at):
        """Update user's access and refresh tokens"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE Users 
                SET access_token = %s, refresh_token = %s, token_expires_at = %s
                WHERE spotify_id = %s
            """, (access_token, refresh_token, expires_at, spotify_id))
            conn.commit()
        except Exception as e:
            print(f"Error updating user tokens: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn and conn.is_connected():
                conn.close()

    def save_playlist(self, playlist_id, spotify_id, spotify_playlist_id, name, description):
        """Save playlist to database"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Playlists (
                    playlist_id, spotify_id, spotify_playlist_id,
                    name, description, creation_date
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                playlist_id, spotify_id, spotify_playlist_id,
                name, description, datetime.utcnow()
            ))
            conn.commit()
        except Exception as e:
            print(f"Error saving playlist: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn and conn.is_connected():
                conn.close()     

    def get_session_songs(self, session_id):
        """Get all songs from a specific session with swipe details"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = self._load_sql_query('get_session_songs.sql')
            cursor.execute(query, (session_id,))
            
            songs = cursor.fetchall()
            
            # Process the results
            for song in songs:
                # Convert datetime to ISO string for JSON serialization
                if song['swipe_timestamp']:
                    song['swipe_timestamp'] = song['swipe_timestamp'].isoformat()
                
                # Add helpful boolean flags
                song['is_liked'] = song['direction'] == 'RIGHT'
                song['is_passed'] = song['direction'] == 'LEFT'
            
            conn.close()
            return songs
            
        except Exception as e:
            print(f"Error getting session songs: {e}")
            return []

if __name__ == "__main__":
    db = Database()
    db.create_database_tables()