// App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BACKEND_URL } from './config';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import UserForm from './components/UserForm';
import History from './components/History';
import SwipeSession from './components/SwipeSession';
import PlaylistCreation from './components/PlaylistCreation';
import './styles/App.css';

function AppContent() {
    const location = useLocation();
    
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('tuneswipe_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [error, setError] = useState(null);

    // Boolean to control header/footer display
    const showHeaderFooter = ['/', '/dashboard', '/history'].includes(location.pathname);

    // Persist user to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('tuneswipe_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('tuneswipe_user');
        }
    }, [user]);

    const handleSpotifyLogin = async () => {
        setError(null);
        
        try {
            const response = await fetch(
                `${BACKEND_URL}/api/spotify/auth_url`, {
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
                setError(`Cannot connect to server. Make sure the app is running on ${BACKEND_URL}`);
            } else {
                setError(`Login failed: ${err.message}`);
            }
        }
    };

    const handleLogout = () => {
        window.open('https://accounts.spotify.com/en/logout', '_blank');
        
        setUser(null);
        setError(null);
    };

    // Handle auth callbacks
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

                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
                return;
            }

            // Handle auth success
            if (authSuccess === 'success') {
                const spotifyId = urlParams.get('spotify_id');
                const displayName = urlParams.get('display_name');
                const email = urlParams.get('email');
                const lastLogin = urlParams.get('last_login');

                if (spotifyId) {
                    const newUser = {
                        spotify_id: spotifyId,
                        display_name: displayName || '',
                        email: email || '',
                        last_login: lastLogin || ''
                    };
                    
                    setUser(newUser);
                }

                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        };

        handleAuth();
    }, []);

    // Protected Route Component
    const ProtectedRoute = ({ children }) => {
        return user ? children : <Navigate to="/" replace />;
    };

    return (
        <div className="app">
            {showHeaderFooter && <Header />}
            
            <main className={showHeaderFooter ? 'with-layout' : 'full-page'}>
                <div className="app-container">
                    <Routes>
                        {/* Public routes */}
                        <Route 
                            path="/" 
                            element={
                                user ? 
                                <Navigate to="/dashboard" replace /> : 
                                <Homepage 
                                    spotifyHandling={handleSpotifyLogin}
                                    loadingState={false}
                                    window={window}
                                />
                            } 
                        />
                        
                        {/* Protected routes */}
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute>
                                    <Dashboard 
                                        userDetails={user}
                                        userState={setUser}
                                        errorState={setError}
                                        onLogout={handleLogout}
                                    />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route 
                            path="/create-session" 
                            element={
                                <ProtectedRoute>
                                    <UserForm user={user} />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route 
                            path="/swipe-session" 
                            element={
                                <ProtectedRoute>
                                    <SwipeSession user={user} />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route 
                            path="/create-playlist" 
                            element={
                                <ProtectedRoute>
                                    <PlaylistCreation user={user} />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route 
                            path="/history" 
                            element={
                                <ProtectedRoute>
                                    <History user={user} />
                                </ProtectedRoute>
                            } 
                        />
                        
                        {/* Catch all route */}
                        <Route 
                            path="*" 
                            element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
                        />
                    </Routes>
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            </main>

            {showHeaderFooter && <Footer />}
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}