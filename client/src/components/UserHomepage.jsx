import '../styles/App.css'

export default function UserHomepage(props) {
    const handleLogout = () => {
        if (props.onLogout) {
            props.onLogout();
        }
        props.userState(null);
        props.errorState(null);
    };

    return (
        <div className="user-homepage">
            <h2>Welcome, {props.userDetails.display_name || 'User'}!</h2>
            <p>Spotify ID: {props.userDetails.spotify_id}</p>
            <p>Email: {props.userDetails.email || 'Not provided'}</p>
            <button 
                onClick={handleLogout}
                className="logout-btn"
            >
                Logout
            </button>
        </div>
    )
}