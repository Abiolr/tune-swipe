/**
 * App - Main application component and router configuration.
 * 
 * Manages global application state including user authentication, error handling,
 * and Spotify OAuth flow. Provides routing configuration and protected routes.
 * Controls header/footer visibility based on current route.
 * 
 * @returns {JSX.Element} Complete application with routing and authentication
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BACKEND_URL } from './config';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import UserForm from './pages/UserForm';
import History from './pages/History';
import SwipeSession from './pages/SwipeSession';
import PlaylistCreation from './pages/PlaylistCreation';
import './styles/App.css';

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

/**
 * AppContent - Main application content with routing logic.
 * 
 * Handles user state management, Spotify authentication flow, and route protection.
 * Manages localStorage persistence for user data and error state management.
 * 
 * @returns {JSX.Element} Application content with routing and state management
 */
function AppContent() {
    const location = useLocation();
    
    // Initialize user state from localStorage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('tuneswipe_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [error, setError] = useState(null);

    // Determine header/footer visibility based on route
    const showHeaderFooter = ['/', '/dashboard', '/history'].includes(location.pathname);

    // Persist user to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('tuneswipe_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('tuneswipe_user');
        }
    }, [user]);

    /**
     * Initiates Spotify OAuth login flow.
     * Fetches authorization URL from backend and redirects user.
     */
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

    /**
     * Handles user logout process.
     * Opens Spotify logout in new tab and clears local state.
     */
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

    /**
     * ProtectedRoute - Route wrapper for authenticated pages.
     * 
     * @param {Object} props - Component props
     * @param {JSX.Element} props.children - Child components to render if authenticated
     * @returns {JSX.Element} Protected content or redirect to login
     */
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