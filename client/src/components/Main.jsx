import { useState, useEffect } from 'react';
import '../styles/App.css';
import Homepage from './Homepage';
import Dashboard from './Dashboard';

export default function Main() {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('tuneswipe_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            localStorage.setItem('tuneswipe_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('tuneswipe_user');
        }
    }, [user]);

    const handleSpotifyLogin = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(
                'http://127.0.0.1:5000/api/spotify/auth_url', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
          
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to get Spotify auth URL`);
            }
          
            const data = await response.json();
          
            if (data.auth_url) {
                window.location.href = data.auth_url;
            } else {
                throw new Error('No auth URL received from server');
            }
        } catch (err) {
            console.error('Login error:', err);
            
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError('Cannot connect to server. Make sure the Flask app is running on http://127.0.0.1:5000');
            } else {
                setError(`Login failed: ${err.message}`);
            }
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        window.open('https://accounts.spotify.com/en/logout', '_blank');
        
        setUser(null);
        setIsLoading(false);
        setError(null);
    };

    useEffect(() => {
        const handleAuth = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const authSuccess = urlParams.get('auth');
            const error = urlParams.get('error');

            if (error) {
                let errorMessage = 'Authentication failed';
                switch (error) {
                    case 'access_denied':
                        errorMessage = 'Access denied. You need to authorize the app to continue.';
                        break;
                    case 'missing_code':
                        errorMessage = 'Authentication code missing.';
                        break;
                    case 'database_error':
                        errorMessage = 'Database error occurred. Please try again.';
                        break;
                    case 'auth_failed':
                        errorMessage = 'Authentication failed. Please try again.';
                        break;
                    default:
                        errorMessage = `Authentication failed: ${error}`;
                }
                setError(errorMessage);
                setIsLoading(false);

                window.history.replaceState({}, '', window.location.pathname);
                return;
            }

            // Handle auth success
            if (authSuccess === 'success') {
                const spotifyId = urlParams.get('spotify_id');
                const displayName = urlParams.get('display_name');
                const email = urlParams.get('email');
                const lastLogin = urlParams.get('last_login')

                if (spotifyId) {
                    setUser({
                        spotify_id: spotifyId,
                        display_name: displayName || '',
                        email: email || '',
                        last_login: lastLogin || ''
                    });
                    setIsLoading(false);
                }

                window.history.replaceState({}, '', window.location.pathname);
            }
        };

        handleAuth();
    }, []);

    return (
        <div className="app-container">
            {user ? (
                <Dashboard 
                    userDetails={user}
                    userState={setUser}
                    errorState={setError}
                    onLogout={handleLogout}
                />
            ) : (
                <Homepage
                    spotifyHandling={handleSpotifyLogin}
                    loadingState={isLoading}
                    window={window}
                />
            )}
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
}