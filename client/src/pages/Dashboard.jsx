import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaCog, FaArrowLeft, FaPlayCircle, FaListUl, 
    FaSignOutAlt, FaUser, FaEnvelope, FaIdBadge, FaClock 
} from 'react-icons/fa';
import '../styles/App.css';
import '../styles/Dashboard.css';

export default function Dashboard({ 
    userDetails, 
    userState, 
    errorState, 
    onLogout
}) {
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) onLogout();
        userState(null);
        errorState(null);
        navigate('/');
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard">
                {/* ================================================================
                   PROFILE HEADER
                   ================================================================ */}
                <header className="profile-header">
                    <div>
                        <h2>Welcome, {userDetails.display_name || 'User'}!</h2>
                    </div>
                    <button 
                        className="settings-btn"
                        onClick={() => setShowSettings(!showSettings)}
                        aria-label="Account settings"
                    >
                        {showSettings ? (
                            <>
                                <FaArrowLeft style={{ marginRight: '8px' }} /> Back
                            </>
                        ) : (
                            <>
                                <FaCog style={{ marginRight: '8px' }} /> Settings
                            </>
                        )}
                    </button>
                </header>

                {/* ================================================================
                   MAIN CONTENT
                   ================================================================ */}
                {showSettings ? (
                    <section className="account-settings">
                        <h3>Account Settings</h3>
                        <div className="settings-grid">
                            <div className="settings-item">
                                <FaUser className="settings-icon" />
                                <span>Display Name:</span>
                                <p>{userDetails.display_name || 'Not provided'}</p>
                            </div>
                            <div className="settings-item">
                                <FaEnvelope className="settings-icon" />
                                <span>Email:</span>
                                <p>{userDetails.email || 'Not provided'}</p>
                            </div>
                            <div className="settings-item">
                                <FaIdBadge className="settings-icon" />
                                <span>Spotify ID:</span>
                                <p>{userDetails.spotify_id || 'Not provided'}</p>
                            </div>
                            <div className="settings-item">
                                <FaClock className="settings-icon" />
                                <span>Last Login:</span>
                                <p>{userDetails.last_login || 'Unknown'} (UTC)</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="logout-btn"
                        >
                            <FaSignOutAlt style={{ marginRight: '8px' }} /> Log Out
                        </button>
                    </section>
                ) : (
                    <section className="user-content">
                        <button
                            className="action-card"
                            onClick={() => navigate('/create-session')}
                        >
                            <FaPlayCircle className="action-icon" />
                            <h3>Start Swiping</h3>
                            <p>Discover new songs to add to your playlist</p>
                        </button>
                        
                        <button
                            className="action-card"
                            onClick={() => navigate('/history')}
                        >
                            <FaListUl className="action-icon" />
                            <h3>Your Playlists</h3>
                            <p>View and manage your created playlists</p>
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}
