import '../styles/App.css'

export default function Connection (props) {
    return (
        <div className="connection"> 
            <button 
                onClick={props.spotifyHandling}
                disabled={props.loadingState}
                className="spotify-connect-btn"
            >
            {props.loadingState ? 'Connecting...' : 'Connect with Spotify'}
            </button>
            <div className="url-message">
                <p>Frontend running on: {props.window.location.origin}</p>
                <p>Backend expected at: http://127.0.0.1:5000</p>
            </div>
        </div>
    )
}