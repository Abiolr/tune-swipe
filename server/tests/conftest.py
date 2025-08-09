"""conftest.py - PyTest Configuration and Fixtures.

Provides shared test fixtures and configuration for the TuneSwipe test suite.
Handles application setup, database connection, and test cleanup to ensure
isolated and repeatable test execution.

Key fixtures:
- app: Flask application instance for testing
- client: Flask test client for API endpoint testing
- db: Database instance with automatic cleanup
"""

__author__ = "Abiola Raji"
__version__ = "1.0"
__date__ = "2025-08-09"

import pytest
from app import app as flask_app
from database import Database
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()


@pytest.fixture
def app():
    """Provide Flask application instance for testing.
    
    Yields the main Flask application configured for testing.
    No additional setup required as the app uses the same
    configuration as the main application.
    
    Yields:
        Flask: Application instance ready for testing.
    """
    yield flask_app


@pytest.fixture
def client(app):
    """Provide Flask test client for API endpoint testing.
    
    Creates a test client that can make HTTP requests to the
    application endpoints without starting a real server.
    
    Args:
        app (Flask): Flask application fixture.
        
    Returns:
        FlaskClient: Test client for making API requests.
    """
    return app.test_client()


@pytest.fixture
def db():
    """Provide Database instance with automatic cleanup.
    
    Creates a Database instance for testing and automatically
    cleans up all test data after each test to ensure isolation.
    Tables are cleaned in reverse dependency order to handle
    foreign key constraints properly.
    
    Yields:
        Database: Database instance for test operations.
    """
    test_db = Database()
    yield test_db
    
    # Cleanup - tables are deleted in reverse order of dependencies
    # This order respects foreign key constraints
    tables_to_clean = [
        'Swipes',        # References Songs and SwipeSessions
        'Playlists',     # References Users
        'SwipeSessions', # References Users
        'Songs',         # No dependencies
        'Users'          # Referenced by other tables
    ]
    
    conn = None
    try:
        conn = test_db.get_db_connection()
        cursor = conn.cursor()
        
        # Disable foreign key checks temporarily for cleanup
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        for table in tables_to_clean:
            try:
                cursor.execute(f"DELETE FROM {table} WHERE 1=1")
                print(f"Cleaned up {table} table")
            except Exception as e:
                print(f"Error cleaning {table}: {e}")
                conn.rollback()
        
        # Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        conn.commit()
        
    except Exception as e:
        print(f"Cleanup error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()