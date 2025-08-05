import '../styles/App.css';
import '../styles/Dashboard.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ 
    userDetails, 
    userState, 
    errorState, 
    onLogout
}) {
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        userState(null);
        errorState(null);
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard">
                {/* Main Profile Section */}
                <div className="profile-header">
                    <div className="profile-info">
                        <h2>Welcome, {userDetails.display_name || 'User'}!</h2>
                    </div>
                    <button 
                        className="settings-btn"
                        onClick={() => setShowSettings(!showSettings)}
                        aria-label="Account settings"
                    >
                        {showSettings ? "Back" : "Settings"}
                    </button>
                </div>

                {showSettings ? (
                    <div className="account-settings">
                        <div className="settings-section">
                            <h3>Account Settings</h3>
                            <p className="user-last-login">Last Logged in: {userDetails.last_login} (UTC)</p>
                            <p className="user-email">Email: {userDetails.email || 'Not provided'}</p>
                            <p className="user-id">Spotify ID: {userDetails.spotify_id}</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="logout-btn"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <div className="user-content">
                        <button
                            className="action-card"
                            onClick={() => navigate('/create-session')}
                        >
                            <h3>Start Swiping</h3>
                            <p>Discover new songs to add to your playlist</p>
                        </button>
                        
                        <button
                            className="action-card"
                            onClick={() => navigate('/history')}
                        >
                            <h3>Your Playlists</h3>
                            <p>View and manage your created playlists</p>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}