import pytest
import json
from uuid import uuid4

def test_home_route(client):
    """Test the home route"""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Spotify Auth Service Running" in response.data

def test_auth_url_route(client):
    """Test the auth URL route"""
    response = client.get('/api/spotify/auth_url')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'auth_url' in data

def test_create_swipe_session(client, db):
    """Test creating a swipe session"""
    # Create a unique test user for this test
    test_user_id = f"test_user_{uuid4().hex[:8]}"  # Unique ID for each test run
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Use INSERT IGNORE to avoid duplicate errors
        cursor.execute(
            "INSERT IGNORE INTO Users (spotify_id, display_name) VALUES (%s, %s)",
            (test_user_id, 'Test User')
        )
        conn.commit()

        test_data = {
            'spotify_id': test_user_id,  # Use the unique test user ID
            'target_playlist_length': 20,
            'session_preferences': {'genre': 'pop'}
        }
        
        response = client.post(
            '/api/swipe_sessions',
            json=test_data,
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'session_id' in data['data']
    finally:
        cursor.close()
        conn.close()