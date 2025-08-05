import pytest
from datetime import datetime
import uuid

def test_db_connection(db):
    """Test database connection can be established"""
    conn = db.get_db_connection()
    assert conn.is_connected()
    conn.close()

def test_add_song_to_session(db):
    """Test adding a song to the database"""
    test_track = {
        'name': 'Test Song',
        'artists': [{'name': 'Test Artist'}],
        'album': {'images': [{'url': 'http://test.com/image.jpg'}]},
        'preview_url': 'http://test.com/preview.mp3',
        'popularity': 50
    }
    
    song_id = db.add_song_to_session(
        session_id=str(uuid.uuid4()),
        spotify_id='test123',
        track_data=test_track
    )
    
    assert song_id is not None

def test_record_swipe(db):
    """Test recording a swipe"""
    # First create a test user
    test_user_id = 'test_user_' + str(uuid.uuid4())[:8]  # Unique test user ID
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create test user
        cursor.execute(
            "INSERT INTO Users (spotify_id, display_name) VALUES (%s, %s)",
            (test_user_id, 'Test User')
        )
        conn.commit()

        # Create test session
        session_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO SwipeSessions 
               (session_id, spotify_id, creation_date, target_playlist_length) 
               VALUES (%s, %s, %s, %s)""",
            (session_id, test_user_id, datetime.utcnow(), 20)
        )
        conn.commit()
        
        # Add a test song
        test_track = {
            'name': 'Test Song',
            'artists': [{'name': 'Test Artist'}],
            'album': {'images': [{'url': 'http://test.com/image.jpg'}]},
            'preview_url': 'http://test.com/preview.mp3',
            'popularity': 50
        }
        song_id = db.add_song_to_session(session_id, 'test123', test_track)
        
        # Record swipe
        swipe_id = db.record_swipe(session_id, song_id, 'RIGHT')
        assert swipe_id is not None
    finally:
        cursor.close()
        conn.close()