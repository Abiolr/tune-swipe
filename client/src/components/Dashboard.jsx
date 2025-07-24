import '../styles/App.css';
import '../styles/Dashboard.css'
import { useState } from 'react';

export default function Dashboard(props) {
    const [showSettings, setShowSettings] = useState(false);

    const handleLogout = () => {
        if (props.onLogout) {
            props.onLogout();
        }
        props.userState(null);
        props.errorState(null);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard">
                {/* Main Profile Section */}
                <div className="profile-header">
                    <div className="profile-info">
                        <h2>Welcome, {props.userDetails.display_name || 'User'}!</h2>
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
                            <p className="user-last-login">Logged in at: {props.userDetails.last_login}</p>
                            <p className="user-email">Email: {props.userDetails.email || 'Not provided'}</p>
                            <p className="user-id">Spotify ID: {props.userDetails.spotify_id}</p>
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
                        <div className="action-card">
                            <h3>Start Swiping</h3>
                            <p>Discover new songs to add to your playlist</p>
                        </div>
                        
                        <div className="action-card">
                            <h3>Your Playlists</h3>
                            <p>View and manage your created playlists</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}