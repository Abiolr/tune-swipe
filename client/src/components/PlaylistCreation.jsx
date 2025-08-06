// PlaylistCreation.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSpotify, FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/App.css';
import '../styles/PlaylistCreation.css';

export default function PlaylistCreation({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Initialize state - try multiple sources with better restoration logic
    const [likedSongs, setLikedSongs] = useState(() => {
        // First try location state
        if (location.state?.likedSongs?.length > 0) {
            console.log('Loading liked songs from location state:', location.state.likedSongs.length);
            return location.state.likedSongs;
        }
        
        console.log('No liked songs found in location state');
        return [];
    });
    
    const [playlistName, setPlaylistName] = useState(() => {
        return location.state?.playlistName || '';
    });
    
    const [playlistDescription, setPlaylistDescription] = useState(() => {
        return location.state?.playlistDescription || '';
    });
    
    const [isCreating, setIsCreating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Handle initialization and auth checking
    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            console.log('Initializing PlaylistCreation component');
            
            // If no user, wait or redirect
            if (!user?.spotify_id) {
                console.log('No user found, redirecting to home');
                navigate('/');
                return;
            }

            // Check auth status
            try {
                await checkAuthStatus();
            } catch (error) {
                console.error('Error checking auth:', error);
                setError('Failed to verify authentication. Please try logging in again.');
            }

            if (mounted) {
                setIsInitialized(true);
            }
        };

        initialize();

        return () => {
            mounted = false;
        };
    }, [user, navigate]);

    // Set default playlist name when user and songs are available
    useEffect(() => {
        if (user && !playlistName && likedSongs.length > 0) {
            setPlaylistName(`${user.display_name}'s TuneSwipe Playlist`);
        }
    }, [user, playlistName, likedSongs.length]);

    const checkAuthStatus = async () => {
        if (!user?.spotify_id) {
            setError('User authentication required');
            setCheckingAuth(false);
            return;
        }

        try {
            setCheckingAuth(true);
            console.log('Checking auth status for playlist creation...');
            
            const response = await fetch(`/api/check_auth/${user.spotify_id}`);
            const data = await response.json();
            
            console.log('Auth check response:', data);
            
            if (data.needs_auth) {
                setError('Your session has expired. Please log in again to create playlists.');
            } else {
                setError(null);
            }
        } catch (err) {
            console.error('Error checking auth:', err);
            setError('Unable to verify authentication status');
        } finally {
            setCheckingAuth(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!playlistName.trim()) {
            setError('Please enter a playlist name');
            return;
        }

        if (likedSongs.length === 0) {
            setError('No songs selected to add to playlist');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            // Create playlist
            const createResponse = await fetch('/api/create_playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spotify_id: user.spotify_id,
                    name: playlistName,
                    description: playlistDescription || `Playlist created by ${user.display_name} using TuneSwipe`,
                    public: true
                })
            });

            const createData = await createResponse.json();

            if (!createResponse.ok) {
                if (createData.needs_auth) {
                    setError('Your session has expired. Please log out and log in again.');
                    return;
                }
                throw new Error(createData.message || 'Failed to create playlist');
            }

            const playlistId = createData.playlist_id;
            setPlaylistUrl(createData.external_url);

            // Add tracks to playlist
            const trackUris = likedSongs.map(song => song.uri).filter(uri => uri);
            
            if (trackUris.length > 0) {
                const addTracksResponse = await fetch(`/api/add_tracks_to_playlist/${playlistId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        spotify_id: user.spotify_id,
                        track_uris: trackUris
                    })
                });

                const addTracksData = await addTracksResponse.json();

                if (!addTracksResponse.ok) {
                    if (addTracksData.needs_auth) {
                        setError('Your session has expired. Please log out and log in again.');
                        return;
                    }
                    throw new Error(addTracksData.message || 'Failed to add tracks to playlist');
                }
            }

            setIsSuccess(true);
        } catch (err) {
            console.error('Error creating playlist:', err);
            setError(err.message || 'Failed to create playlist');
        } finally {
            setIsCreating(false);
        }
    };

    // Show loading if not initialized yet
    if (!isInitialized || checkingAuth) {
        return (
            <div className="playlist-creation-container">
                <div className="loading-message">
                    <FaSpinner className="spinning" size={24} />
                    <h3>Loading playlist creation...</h3>
                </div>
            </div>
        );
    }

    // Redirect to create session if no songs
    if (likedSongs.length === 0) {
        return (
            <div className="playlist-creation-container">
                <div className="no-songs-message">
                    <h2>No Songs Found</h2>
                    <p>No liked songs were found for playlist creation.</p>
                    <p>You'll need to complete a swipe session first.</p>
                    <button 
                        onClick={() => navigate('/create-session')} 
                        className="back-to-session-btn"
                    >
                        Start New Session
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="back-button"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Show error if authentication failed
    if (error && error.includes('session has expired')) {
        return (
            <div className="playlist-creation-container">
                <button onClick={() => navigate('/dashboard')} className="back-btn">
                    &larr; Back to Dashboard
                </button>

                <div className="auth-required">
                    <FaExclamationTriangle size={48} color="#ff6b6b" />
                    <h2>Session Expired</h2>
                    <p>Your authentication session has expired.</p>
                    <p>Please log out and log in again to create playlists.</p>
                    <button 
                        onClick={() => {
                            // Clear user state and redirect to home
                            localStorage.removeItem('tuneswipe_user');
                            navigate('/');
                        }} 
                        className="auth-button"
                    >
                        Log Out and Log In Again
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="playlist-success-container">
                <div className="success-message">
                    <FaCheck className="success-icon" size={48} />
                    <h2>Playlist Created Successfully!</h2>
                    <p>Your playlist "{playlistName}" has been created on Spotify with {likedSongs.length} songs.</p>
                    {playlistUrl && (
                        <a 
                            href={playlistUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="spotify-link"
                        >
                            <FaSpotify /> Open in Spotify
                        </a>
                    )}
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="back-to-dashboard"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Main playlist creation form
    return (
        <div className="playlist-creation-container">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
                &larr; Back to Dashboard
            </button>

            <div className="playlist-form">
                <h1>Create Your Spotify Playlist</h1>
                <p className="form-description">
                    {likedSongs.length} songs selected · Customize your playlist details below
                </p>

                <div className="form-group">
                    <label htmlFor="playlistName">Playlist Name</label>
                    <input
                        type="text"
                        id="playlistName"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder="Enter playlist name"
                        maxLength="100"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="playlistDescription">Description (optional)</label>
                    <textarea
                        id="playlistDescription"
                        value={playlistDescription}
                        onChange={(e) => setPlaylistDescription(e.target.value)}
                        placeholder="What's this playlist about?"
                        maxLength="300"
                        rows="3"
                    />
                </div>

                <div className="songs-preview">
                    <h3>Songs in your playlist:</h3>
                    <div className="songs-list">
                        {likedSongs.slice(0, 5).map((song, index) => (
                            <div key={index} className="song-preview">
                                <img 
                                    src={song.image_url} 
                                    alt={song.name} 
                                    className="song-image"
                                    onError={(e) => {
                                        e.target.src = '/default-album-art.png';
                                    }}
                                />
                                <div className="song-info">
                                    <p className="song-name">{song.name}</p>
                                    <p className="song-artist">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                        {likedSongs.length > 5 && (
                            <p className="more-songs">+ {likedSongs.length - 5} more songs</p>
                        )}
                    </div>
                </div>

                {error && !error.includes('session has expired') && (
                    <p className="error-message">{error}</p>
                )}

                <button
                    onClick={handleCreatePlaylist}
                    className="create-playlist-btn"
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <>
                            <FaSpinner className="spinning" /> Creating...
                        </>
                    ) : (
                        <>
                            <FaSpotify /> Create on Spotify
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}