import pytest
from app import app as flask_app
from database import Database
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

@pytest.fixture
def app():
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db():
    test_db = Database()
    yield test_db
    
    # Cleanup - tables are deleted in reverse order of dependencies
    tables_to_clean = [
        'Swipes',
        'Playlists',
        'SwipeSessions',
        'Songs',
        'Users'
    ]
    
    conn = None
    try:
        conn = test_db.get_db_connection()
        cursor = conn.cursor()
        
        # Disable foreign key checks temporarily
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