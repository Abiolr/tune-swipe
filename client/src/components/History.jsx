// History.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaTimes, FaMusic, FaChartBar, FaCalendarAlt, FaListUl, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';
import { BACKEND_URL } from '../config';
import '../styles/App.css';
import '../styles/History.css';

export default function History({ user }) {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionSongs, setSessionSongs] = useState([]);
    const [songsLoading, setSongsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'liked', 'passed'

    useEffect(() => {
        if (user?.spotify_id) {
            fetchUserSessions();
        }
    }, [user]);

    useEffect(() => {
        if (selectedSession) {
            fetchSessionSongs(selectedSession.session_id);
        }
    }, [selectedSession]);

    const fetchUserSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${BACKEND_URL}/api/swipe_sessions?spotify_id=${user.spotify_id}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                const completedSessions = (data.sessions || []).filter(
                    session => session.session_status === 'COMPLETED'
                );
                setSessions(completedSessions);
            } else {
                throw new Error(data.message || 'Failed to load sessions');
            }
            
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionSongs = async (sessionId) => {
        try {
            setSongsLoading(true);
            
            const response = await fetch(`${BACKEND_URL}/api/session_songs/${sessionId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch session songs');
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setSessionSongs(data.songs || []);
            } else {
                throw new Error(data.message || 'Failed to load songs');
            }
            
        } catch (err) {
            console.error('Error fetching session songs:', err);
            setSessionSongs([]);
        } finally {
            setSongsLoading(false);
        }
    };

    const getGenreStats = () => {
        const genreMap = {};
        
        sessions.forEach(session => {
            const prefs = session.session_preferences || {};
            const genres = prefs.genres || [];
            
            genres.forEach(genre => {
                genreMap[genre] = (genreMap[genre] || 0) + 1;
            });
        });
        
        return Object.entries(genreMap)
            .sort((a, b) => b[1] - a[1])
            .map(([genre, count]) => ({ genre, count }));
    };

    const getSessionStats = () => {
        const stats = {
            totalSessions: sessions.length,
            completedSessions: sessions.length,
            totalSongs: 0,
            likedSongs: 0,
            swipeRatio: 0
        };
        
        sessions.forEach(session => {
            stats.totalSongs += session.total_swipes || 0;
            stats.likedSongs += session.liked_count || 0;
        });
        
        if (stats.totalSongs > 0) {
            stats.swipeRatio = Math.round((stats.likedSongs / stats.totalSongs) * 100);
        }
        
        return stats;
    };

    const getFilteredSongs = () => {
        if (activeTab === 'liked') {
            return sessionSongs.filter(song => song.is_liked);
        } else if (activeTab === 'passed') {
            return sessionSongs.filter(song => song.is_passed);
        }
        return sessionSongs;
    };

    if (loading) {
        return (
            <div className="history-container">
                <div className="history-loading">
                    <div className="spinner"></div>
                    <p>Loading your swipe history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="history-container">
                <div className="history-error">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading History</h3>
                    <p>{error}</p>
                    <button onClick={fetchUserSessions} className="retry-button">
                        Retry
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="back-button">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (selectedSession) {
        const likedSongs = sessionSongs.filter(song => song.is_liked);
        const passedSongs = sessionSongs.filter(song => song.is_passed);
        const filteredSongs = getFilteredSongs();

        return (
            <div className="history-container">
                <div className="history-header">
                    <h1>Session Details</h1>
                    <button onClick={() => setSelectedSession(null)} className="back-button">
                        ← Back to History
                    </button>
                </div>
                
                <div className="session-meta">
                    <p><FaCalendarAlt /> {new Date(selectedSession.creation_date).toLocaleString()}</p>
                    <p><FaListUl /> Completed</p>
                    <p><FaHeart /> {selectedSession.liked_count} liked</p>
                    <p><FaTimes /> {selectedSession.total_swipes - selectedSession.liked_count} passed</p>
                </div>
                
                <div className="session-preferences">
                    <h3>Session Preferences</h3>
                    <div className="preferences-grid">
                        <div>
                            <h4>Genres</h4>
                            <ul>
                                {(selectedSession.session_preferences?.genres || []).map(genre => (
                                    <li key={genre}>{genre}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4>Target Songs</h4>
                            <p><b>| {selectedSession.target_playlist_length}</b></p>
                        </div>
                    </div>
                </div>
                
                <div className="session-songs">
                    <div className="songs-header">
                        <h3>Songs</h3>
                        <div className="session-tabs">
                            <button 
                                className={activeTab === 'all' ? 'active' : ''}
                                onClick={() => setActiveTab('all')}
                            >
                                All ({sessionSongs.length})
                            </button>
                            <button 
                                className={activeTab === 'liked' ? 'active' : ''}
                                onClick={() => setActiveTab('liked')}
                            >
                                <FaHeart /> Liked ({likedSongs.length})
                            </button>
                            <button 
                                className={activeTab === 'passed' ? 'active' : ''}
                                onClick={() => setActiveTab('passed')}
                            >
                                <FaTimes /> Passed ({passedSongs.length})
                            </button>
                        </div>
                    </div>
                    
                    {songsLoading ? (
                        <div className="songs-loading">
                            <div className="spinner"></div>
                            <p>Loading songs...</p>
                        </div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="no-songs">
                            <p>No songs found for this filter.</p>
                        </div>
                    ) : (
                        <div className="songs-list">
                            {filteredSongs.map((song, index) => (
                                <div key={song.song_id} className="song-item">
                                    <div className="song-index">
                                        {song.swipe_order}
                                    </div>
                                    
                                    <div className="song-artwork">
                                        <img 
                                            src={song.album_cover || '/default-album-art.png'} 
                                            alt={`${song.title} album cover`}
                                            onError={(e) => {
                                                e.target.src = '/default-album-art.png';
                                            }}
                                        />
                                        {song.preview_url && (
                                            <div className="preview-overlay">
                                                <FaPlay />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="song-details">
                                        <div className="song-title">
                                            {song.title}
                                        </div>
                                        <div className="song-artist">{song.artist}</div>
                                        {song.genre && (
                                            <div className="song-genre">{song.genre}</div>
                                        )}
                                    </div>
                                    
                                    <div className="song-actions">
                                        <div className={`swipe-indicator ${song.is_liked ? 'liked' : 'passed'}`}>
                                            {song.is_liked ? <FaHeart /> : <FaTimes />}
                                        </div>
                                        
                                        {song.spotify_uri && (
                                            <a 
                                                href={`https://open.spotify.com/track/${song.spotify_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="spotify-link"
                                                title="Open in Spotify"
                                            >
                                                <FaExternalLinkAlt />
                                            </a>
                                        )}
                                    </div>
                                    
                                    <div className="song-timestamp">
                                        {new Date(song.swipe_timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>Your Swipe History</h1>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    Back to Dashboard
                </button>
            </div>
            
            <div className="history-stats">
                <div className="stat-card">
                    <FaMusic />
                    <h3>{getSessionStats().totalSessions}</h3>
                    <p>Completed Sessions</p>
                </div>
                <div className="stat-card">
                    <FaChartBar />
                    <h3>{getSessionStats().totalSongs}</h3>
                    <p>Total Songs Reviewed</p>
                </div>
                <div className="stat-card">
                    <FaHeart />
                    <h3>{getSessionStats().likedSongs}</h3>
                    <p>Songs Liked</p>
                </div>
                <div className="stat-card">
                    <FaTimes />
                    <h3>{getSessionStats().swipeRatio}%</h3>
                    <p>Like Ratio</p>
                </div>
            </div>
            
            {getGenreStats().length > 0 && (
                <div className="genre-distribution">
                    <h2>Top Genres</h2>
                    <div className="genre-tags">
                        {getGenreStats().slice(0, 5).map(({ genre, count }) => (
                            <div key={genre} className="genre-tag">
                                <span>{genre}</span>
                                <span className="genre-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="session-list">
                {sessions.length === 0 ? (
                    <div className="no-sessions">
                        <p>No completed sessions found</p>
                        <p>Complete a swipe session to see your history!</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div 
                            key={session.session_id} 
                            className="session-card"
                            onClick={() => setSelectedSession(session)}
                        >
                            <div className="session-card-header">
                                <h3>
                                    {new Date(session.creation_date).toLocaleDateString()}
                                </h3>
                                <span className="status-badge completed">
                                    COMPLETED
                                </span>
                            </div>
                            <div className="session-card-stats">
                                <div>
                                    <FaHeart className="liked" />
                                    <span>{session.liked_count || 0} liked</span>
                                </div>
                                <div>
                                    <FaTimes className="passed" />
                                    <span>{(session.total_swipes || 0) - (session.liked_count || 0)} passed</span>
                                </div>
                                <div>
                                    <FaMusic />
                                    <span>Target: {session.target_playlist_length}</span>
                                </div>
                            </div>
                            <div className="session-card-genres">
                                {(session.session_preferences?.genres || []).slice(0, 3).map(genre => (
                                    <span key={genre} className="genre-chip">{genre}</span>
                                ))}
                                {(session.session_preferences?.genres || []).length > 3 && (
                                    <span className="genre-chip more">
                                        +{(session.session_preferences?.genres || []).length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}