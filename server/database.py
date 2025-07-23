# database.py
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def create_database_tables():
    try:
        # Establish database connection
        conn = mysql.connector.connect(
            host=os.environ.get('RLWY_HOST'),
            user=os.environ.get('RLWY_USER'),
            password=os.environ.get('RLWY_PASS'),
            database=os.environ.get('RLWY_DB'),
            port=os.environ.get('RLWY_PORT')
        )
        cursor = conn.cursor()

        # Drop tables if they exist (in reverse order of dependency)
        cursor.execute("DROP TABLE IF EXISTS PlaylistSongs")
        cursor.execute("DROP TABLE IF EXISTS Swipes")
        cursor.execute("DROP TABLE IF EXISTS Playlists")
        cursor.execute("DROP TABLE IF EXISTS SwipeSessions")
        cursor.execute("DROP TABLE IF EXISTS Songs")
        cursor.execute("DROP TABLE IF EXISTS Users")
        conn.commit()

        # Create Users table
        cursor.execute("""
        CREATE TABLE Users (
            user_id VARCHAR(255) PRIMARY KEY,
            spotify_id VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            email VARCHAR(255),
            creation_date DATETIME,
            last_login DATETIME
        )
        """)

        # Create Songs table (cache for Spotify song metadata)
        cursor.execute("""
        CREATE TABLE Songs (
            song_id VARCHAR(36) PRIMARY KEY,
            spotify_uri VARCHAR(255) UNIQUE,
            title VARCHAR(255) NOT NULL,
            artist VARCHAR(255) NOT NULL,
            preview_url VARCHAR(255),
            genre VARCHAR(100),
            mood VARCHAR(100),
            duration INT,
            album_cover VARCHAR(255),
            explicit BOOLEAN DEFAULT FALSE,
            popularity INT,
            last_updated DATETIME NOT NULL
        )
        """)

        # Create SwipeSessions table
        cursor.execute("""
        CREATE TABLE SwipeSessions (
            session_id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            target_playlist_length INT NOT NULL,
            current_swipe_index INT DEFAULT 0,
            session_preferences JSON,
            session_status ENUM('ACTIVE', 'COMPLETED', 'ABANDONED') DEFAULT 'ACTIVE',
            creation_date DATETIME NOT NULL,
            completion_date DATETIME,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
        """)

        # Create Playlists table
        cursor.execute("""
        CREATE TABLE Playlists (
            playlist_id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            spotify_playlist_id VARCHAR(255),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            creation_date DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        )
        """)

        # Create Swipes table (records all swipe actions)
        cursor.execute("""
        CREATE TABLE Swipes (
            swipe_id VARCHAR(36) PRIMARY KEY,
            session_id VARCHAR(36) NOT NULL,
            song_id VARCHAR(36) NOT NULL,
            direction ENUM('LEFT', 'RIGHT') NOT NULL,
            swipe_timestamp DATETIME NOT NULL,
            FOREIGN KEY (session_id) REFERENCES SwipeSessions(session_id) ON DELETE CASCADE,
            FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE
        )
        """)

        # Create PlaylistSongs junction table (many-to-many relationship)
        cursor.execute("""
        CREATE TABLE PlaylistSongs (
            playlist_id VARCHAR(36) NOT NULL,
            song_id VARCHAR(36) NOT NULL,
            position INT,
            added_at DATETIME NOT NULL,
            PRIMARY KEY (playlist_id, song_id),
            FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id) ON DELETE CASCADE,
            FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE
        )
        """)

        # Create indexes for performance
        cursor.execute("CREATE INDEX idx_swipes_session ON Swipes(session_id)")
        cursor.execute("CREATE INDEX idx_swipes_song ON Swipes(song_id)")
        cursor.execute("CREATE INDEX idx_playlists_user ON Playlists(user_id)")
        cursor.execute("CREATE INDEX idx_sessions_user ON SwipeSessions(user_id)")

        conn.commit()
        print("Database tables created successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    create_database_tables()