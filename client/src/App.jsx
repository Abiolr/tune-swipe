import { useState, useEffect } from 'react';
import './components/App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/spotify/auth_url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get Spotify auth URL`);
      }
      
      const data = await response.json();
      
      if (data.auth_url) {
        // Redirect to Spotify auth in the same tab
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
        
        if (spotifyId) {
          setUser({
            spotify_id: spotifyId,
            display_name: displayName || '',
            email: email || ''
          });
          setIsLoading(false);
        }
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="app-container">
      {user ? (
        <div className="user-profile">
          <h2>Welcome, {user.display_name || 'User'}!</h2>
          <p>Spotify ID: {user.spotify_id}</p>
          <p>Email: {user.email || 'Not provided'}</p>
          <button onClick={() => {
            setUser(null);
            setError(null);
          }}>
            Logout
          </button>
        </div>
      ) : (
        <>
          <button 
            onClick={handleSpotifyLogin}
            disabled={isLoading}
            className="spotify-connect-btn"
          >
            {isLoading ? 'Connecting...' : 'Connect with Spotify'}
          </button>
          
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
            <p>Frontend running on: {window.location.origin}</p>
            <p>Backend expected at: http://127.0.0.1:5000</p>
          </div>
        </>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginTop: '10px', 
          padding: '10px', 
          border: '1px solid red', 
          borderRadius: '4px',
          backgroundColor: '#ffebee'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;