-- schema_setup.sql
-- Drop tables if they exist (in reverse order of dependency)
DROP TABLE IF EXISTS PlaylistSongs;
DROP TABLE IF EXISTS Swipes;
DROP TABLE IF EXISTS Playlists;
DROP TABLE IF EXISTS Songs;
DROP TABLE IF EXISTS SwipeSessions;
DROP TABLE IF EXISTS Users;

-- Create Users table with spotify_id as primary key and token storage
CREATE TABLE Users (
    spotify_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    creation_date DATETIME,
    last_login DATETIME
);

-- Create SwipeSessions table - now references spotify_id directly
CREATE TABLE SwipeSessions (
    session_id VARCHAR(36) PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL,
    target_playlist_length INT NOT NULL,
    current_swipe_index INT DEFAULT 0,
    session_preferences JSON,
    session_status ENUM('ACTIVE', 'COMPLETED', 'ABANDONED') DEFAULT 'ACTIVE',
    creation_date DATETIME NOT NULL,
    completion_date DATETIME,
    FOREIGN KEY (spotify_id) REFERENCES Users(spotify_id) ON DELETE CASCADE,
    INDEX idx_user_status (spotify_id, session_status),
    INDEX idx_creation_date (creation_date)
);

-- Create Songs table with better deduplication
CREATE TABLE Songs (
    song_id VARCHAR(36) PRIMARY KEY,
    spotify_uri VARCHAR(255),
    spotify_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    preview_url VARCHAR(500),
    genre VARCHAR(100),
    mood VARCHAR(100),
    duration INT,
    album_cover VARCHAR(500),
    explicit BOOLEAN DEFAULT FALSE,
    popularity INT,
    last_updated DATETIME NOT NULL,
    UNIQUE KEY unique_spotify_track (spotify_uri),
    UNIQUE KEY unique_spotify_id (spotify_id),
    INDEX idx_title_artist (title, artist),
    INDEX idx_last_updated (last_updated)
);

-- Create Playlists table - now references spotify_id directly
CREATE TABLE Playlists (
    playlist_id VARCHAR(36) PRIMARY KEY,
    spotify_id VARCHAR(255) NOT NULL,
    spotify_playlist_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creation_date DATETIME NOT NULL,
    FOREIGN KEY (spotify_id) REFERENCES Users(spotify_id) ON DELETE CASCADE,
    INDEX idx_user_creation (spotify_id, creation_date)
);

-- Create Swipes table with better tracking
CREATE TABLE Swipes (
    swipe_id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    song_id VARCHAR(36) NOT NULL,
    direction ENUM('LEFT', 'RIGHT') NOT NULL,
    swipe_timestamp DATETIME NOT NULL,
    swipe_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES SwipeSessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_song (session_id, song_id),
    INDEX idx_session_direction (session_id, direction),
    INDEX idx_song_session (song_id, session_id),
    INDEX idx_timestamp (swipe_timestamp),
    INDEX idx_session_order (session_id, swipe_order)
);

-- Create PlaylistSongs junction table
CREATE TABLE PlaylistSongs (
    playlist_id VARCHAR(36) NOT NULL,
    song_id VARCHAR(36) NOT NULL,
    position INT,
    added_at DATETIME NOT NULL,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES Playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES Songs(song_id) ON DELETE CASCADE,
    INDEX idx_playlist_position (playlist_id, position)
);