"""test_routes.py - API Route Integration Tests.

Integration tests for Flask API endpoints including authentication,
session management, and data retrieval. Tests verify proper HTTP
responses, JSON formatting, and error handling across all routes.

Test coverage includes:
- Health check endpoints
- Spotify authentication flow
- Session creation and management
- Data validation and error responses
"""

__author__ = "Abiola Raji"
__version__ = "1.0"
__date__ = "2025-08-09"

import pytest
import json
from uuid import uuid4

def test_home_route(client):
    """Test the home route health check.
    
    Verifies that the application is running and responds
    correctly to health check requests with proper JSON.
    
    Args:
        client (FlaskClient): Flask test client fixture.
    """
    response = client.get('/')
    assert response.status_code == 200
    assert b"TuneSwipe API" in response.data

def test_auth_url_route(client):
    """Test the Spotify authorization URL generation.
    
    Verifies that the authentication endpoint returns a valid
    Spotify authorization URL for the OAuth flow.
    
    Args:
        client (FlaskClient): Flask test client fixture.
    """
    response = client.get('/api/spotify/auth_url')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'auth_url' in data

def test_create_swipe_session(client, db):
    """Test creating a swipe session.
    
    Verifies that new swipe sessions can be created with proper
    user data and session configuration. Tests JSON request
    handling and response formatting.
    
    Args:
        client (FlaskClient): Flask test client fixture.
        db (Database): Database fixture for setup and cleanup.
    """
    # Create a unique test user for this test to avoid conflicts
    test_user_id = f"test_user_{uuid4().hex[:8]}"
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Use INSERT IGNORE to avoid duplicate key errors
        cursor.execute(
            "INSERT IGNORE INTO Users (spotify_id, display_name) VALUES (%s, %s)",
            (test_user_id, 'Test User')
        )
        conn.commit()

        # Test session creation with proper data structure
        test_data = {
            'spotify_id': test_user_id,
            'target_playlist_length': 20,
            'session_preferences': {'genre': 'pop'}
        }
        
        response = client.post(
            '/api/swipe_sessions',
            json=test_data,
            content_type='application/json'
        )
        
        # Verify successful session creation
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'session_id' in data['data']
        
    finally:
        cursor.close()
        conn.close()