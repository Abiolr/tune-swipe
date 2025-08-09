// SwipeSession.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaPause, FaHeart, FaTimes, FaSpinner, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import { BACKEND_URL } from '../config';
import '../styles/App.css';
import '../styles/SwipeSession.css';

export default function SwipeSession({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const preferences = location.state?.preferences;

    const [currentTrack, setCurrentTrack] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [likedSongs, setLikedSongs] = useState([]);
    const [swipeDirection, setSwipeDirection] = useState(null);
    
    const audioRef = useRef(null);
    const progressInterval = useRef(null);
    const trackCardRef = useRef(null);
    const swipeTimeout = useRef(null);

    // Redirect if no preferences
    useEffect(() => {
        if (!preferences) {
            navigate('/create-session');
            return;
        }
        initializeSession();
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            if (audioRef.current) audioRef.current.pause();
            if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
        };
    }, [preferences, navigate]);

    const initializeSession = async () => {
        try {
            setError(null);
            
            // Create session
            const sessionResponse = await fetch(`${BACKEND_URL}/api/swipe_sessions`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    spotify_id: user?.spotify_id || 'anonymous',
                    target_playlist_length: Number(preferences.songCount),
                    session_preferences: {
                        genres: Array.isArray(preferences.genres) ? preferences.genres : []
                    }
                })
            });

            let currentSessionId = null;
            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                currentSessionId = sessionData.data.session_id;
                setSessionId(currentSessionId);
            }

            // Fetch initial tracks
            await fetchTracks(currentSessionId);
            
        } catch (error) {
            console.error('Error initializing session:', error);
            setError('Failed to initialize session. Please try again.');
        }
    };

    const fetchTracks = async (sessionIdParam = null) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                genre: preferences.genres.join(','),
                limit: 50,
                spotify_id: user?.spotify_id || 'anonymous',
                session_id: sessionIdParam || sessionId || ''
            });

            const response = await fetch(`${BACKEND_URL}/api/get_song?${params}`, {
                timeout: 15000
            });
            
            const data = await response.json();
            
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to fetch songs');
            }
            
            const newTracks = data.data.tracks || [];
            
            if (newTracks.length === 0) {
                throw new Error('No songs found for your selected genres. Try different genres.');
            }
            
            setTracks(newTracks);
            setCurrentTrack(newTracks[0]);
            setCurrentTrackIndex(0);
            
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Failed to load songs');
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to handle track changes
    useEffect(() => {
        if (!currentTrack) return;
        
        // Reset audio state for new track
        if (audioRef.current) {
            audioRef.current.pause();
            clearInterval(progressInterval.current);
            setIsPlaying(false);
            setProgress(0);
            
            // Only update source if it's different from current track
            if (audioRef.current.src !== currentTrack.previewUrl) {
                audioRef.current.src = currentTrack.previewUrl || '';
                audioRef.current.currentTime = 0;
            }
        }
    }, [currentTrack]);

    // Modified play/pause handler
    const handlePlayPause = () => {
        if (!audioRef.current || !currentTrack?.previewUrl) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            clearInterval(progressInterval.current);
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => {
                console.error('Error playing audio:', err);
            });
            
            progressInterval.current = setInterval(() => {
                if (audioRef.current) {
                    const progressPercent = (audioRef.current.currentTime / 30) * 100;
                    setProgress(progressPercent);
                    
                    if (audioRef.current.currentTime >= 30) {
                        audioRef.current.pause();
                        setIsPlaying(false);
                        clearInterval(progressInterval.current);
                    }
                }
            }, 100);
            
            setIsPlaying(true);
        }
    };

    const recordSwipe = async (direction, track) => {
        if (!sessionId || !track) return;
        
        try {
            await fetch(`${BACKEND_URL}/api/swipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    song_data: track,
                    direction: direction.toUpperCase()
                })
            });
        } catch (error) {
            console.error('Error recording swipe:', error);
        }
    };

    const completeSession = async (finalLikedSongs) => {
        if (!sessionId) return;
        
        try {
            await fetch(`${BACKEND_URL}/api/complete_session/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Session marked as completed');
        } catch (error) {
            console.error('Error completing session:', error);
        }
    };

    const handleSwipe = async (direction) => {
        // Clean up audio
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            clearInterval(progressInterval.current);
        }
        
        setSwipeDirection(direction);
        
        // Update liked songs
        if (direction === 'right') {
            setLikedSongs(prev => [...prev, currentTrack]);
        }
        
        // Record swipe
        await recordSwipe(direction, currentTrack);
        
        // Animation
        if (trackCardRef.current) {
            trackCardRef.current.classList.add(`swipe-animation-${direction}`);
        }
        
        swipeTimeout.current = setTimeout(async () => {
            const newLikedCount = direction === 'right' ? likedSongs.length + 1 : likedSongs.length;
            
            // Check if session complete
            if (newLikedCount >= preferences.songCount) {
                const finalLikedSongs = direction === 'right' ? [...likedSongs, currentTrack] : likedSongs;
                await completeSession(finalLikedSongs);
                navigate('/create-playlist', { state: { likedSongs: finalLikedSongs } });
                return;
            }
            
            // Move to next track
            const nextIndex = currentTrackIndex + 1;
            if (nextIndex < tracks.length) {
                setCurrentTrack(tracks[nextIndex]);
                setCurrentTrackIndex(nextIndex);
            } else {
                // No more tracks - finish session
                const finalLikedSongs = direction === 'right' ? [...likedSongs, currentTrack] : likedSongs;
                await completeSession(finalLikedSongs);
                navigate('/create-playlist', { state: { likedSongs: finalLikedSongs } });
                return;
            }
            
            // Reset animation
            setSwipeDirection(null);
            if (trackCardRef.current) {
                trackCardRef.current.classList.remove(
                    'swipe-animation-left',
                    'swipe-animation-right'
                );
            }
        }, 500);
    };

    const handleFinishEarly = async () => {
        await completeSession(likedSongs);
        navigate('/create-playlist', { state: { likedSongs } });
    };

    // If no preferences, component will redirect
    if (!preferences) {
        return null;
    }

    // Loading state
    if (isLoading && !currentTrack) {
        return (
            <div className="loading-container">
                <div className="loading-message">
                    <FaSpinner className="spinning" size={24} />
                    <h3>Loading your music recommendations...</h3>
                    <p>Finding songs from {preferences.genres.join(', ')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !currentTrack) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <FaExclamationTriangle size={48} color="#ff6b6b" />
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button onClick={initializeSession} className="retry-button">
                        <FaRedo /> Try Again
                    </button>
                    <button onClick={() => navigate('/create-session')} className="back-button">
                        Back to Session Setup
                    </button>
                </div>
            </div>
        );
    }

    // No tracks available
    if (!currentTrack) {
        return (
            <div className="no-tracks-container">
                <div className="no-tracks-message">
                    <h3>No tracks available</h3>
                    <p>Try different genres or refresh the page.</p>
                    <button onClick={initializeSession} className="retry-button">
                        <FaRedo /> Try Again
                    </button>
                    <button onClick={() => navigate('/create-session')} className="back-button">
                        Back to Session Setup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="swipe-session-container">
            <div className="session-progress">
                <div className="progress-stats">
                    <span>Track {currentTrackIndex + 1} of {tracks.length}</span>
                    <span>Liked: {likedSongs.length}/{preferences.songCount}</span>
                </div>
                <div className="progress-bar-container">
                    <div 
                        className="session-progress-bar" 
                        style={{ width: `${(likedSongs.length / preferences.songCount) * 100}%` }}
                    />
                </div>
            </div>
            
            <div 
                className="track-card"
                ref={trackCardRef}
            >
                <div className="track-content">
                    <div className="swipe-feedback right">
                        <FaHeart size={48} />
                    </div>
                    <div className="swipe-feedback left">
                        <FaTimes size={48} />
                    </div>

                    <div className="album-art-container">
                        <img 
                            src={currentTrack.image_url} 
                            alt={`${currentTrack.name} album cover`} 
                            className="album-art"
                            onError={(e) => {
                                e.target.src = '/default-album-art.png';
                            }}
                        />
                        {!currentTrack.previewUrl && (
                            <div className="no-preview-overlay">
                                <span>No Preview</span>
                            </div>
                        )}
                    </div>

                    <div className="track-info">
                        <h2 className="track-name">
                            <a 
                                href={currentTrack.external_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <span className='just-track-name'>{currentTrack.name}</span>
                                {currentTrack.isExplicit && (
                                    <span className="explicit-tag">E</span>
                                )}
                            </a>
                        </h2>
                        <p className="track-artist">{currentTrack.artist}</p>
                        {currentTrack.album && currentTrack.album !== 'Unknown Album' && (
                            <p className="track-album">{currentTrack.album}</p>
                        )}
                    </div>

                    <div className="audio-controls">
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="player-controls">
                            <button 
                                onClick={handlePlayPause}
                                className="play-button"
                                disabled={!currentTrack.previewUrl}
                            >
                                {isPlaying ? <FaPause /> : <FaPlay />}
                            </button>
                            {!currentTrack.previewUrl ? (
                                <span className="no-preview">No preview available</span>
                            ) : (
                                <span className="time-display">
                                    {formatTime(audioRef.current?.currentTime || 0)} / 0:29
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="swipe-actions">
                        <button 
                            onClick={() => handleSwipe('left')}
                            className="swipe-button reject-button"
                            disabled={swipeDirection !== null}
                        >
                            <FaTimes />
                        </button>
                        <button 
                            onClick={() => handleSwipe('right')}
                            className="swipe-button accept-button"
                            disabled={swipeDirection !== null}
                        >
                            <FaHeart />
                        </button>
                    </div>
                </div>

            </div>

            <div className="session-controls">
                <button 
                    onClick={handleFinishEarly}
                    className="finish-button"
                    disabled={likedSongs.length === 0}
                >
                    {likedSongs.length >= preferences.songCount 
                        ? `Create Playlist (${likedSongs.length} songs)` 
                        : `Finish Early (${likedSongs.length} songs)`
                    }
                </button>
            </div>

            <audio 
                ref={audioRef} 
                onEnded={() => {
                    setIsPlaying(false);
                    clearInterval(progressInterval.current);
                }}
                onError={() => {
                    setIsPlaying(false);
                    clearInterval(progressInterval.current);
                }}
                preload="none"
            />
        </div>
    );
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}