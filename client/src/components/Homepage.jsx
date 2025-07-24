import React from 'react';
import '../styles/App.css';
import '../styles/Homepage.css';

export default function Homepage(props) {

    return (
        <div className="homepage">
            <div className="container">
                <section className="hero">
                    <div className="hero-content">
                        <h1>Swipe Your Way to Perfect Playlists</h1>
                        <p>
                            Discover your next favorite songs with our fun, Tinder-style music discovery app. 
                            Swipe right on tracks you love, left on ones you don't, and watch as we create 
                            the perfect personalized playlist just for you.
                        </p>
                        
                        <div className="cta-section">
                            <button 
                                onClick={props.spotifyHandling}
                                disabled={props.loadingState}
                                className="spotify-connect-btn"
                            >
                                <svg className="spotify-icon" viewBox="0 0 24 24">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                                {props.loadingState ? 'Connecting...' : 'Connect with Spotify'}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="features">
                    <div className="feature">
                        <span className="feature-icon">👆</span>
                        <h3>Simple Swiping</h3>
                        <p>Just like your favorite dating app, but for music! Swipe right to love a song, left to pass. It's that easy.</p>
                    </div>
                    
                    <div className="feature">
                        <span className="feature-icon">🎧</span>
                        <h3>Preview Every Track</h3>
                        <p>Listen to song snippets as you swipe. Get a real feel for each track before making your choice.</p>
                    </div>
                    
                    <div className="feature">
                        <span className="feature-icon">📱</span>
                        <h3>Instant Playlist Creation</h3>
                        <p>Your personalized playlist is automatically saved to your Spotify account, ready to enjoy anywhere.</p>
                    </div>
                </section>

                <section className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h4>Connect Your Spotify</h4>
                            <p>Link your Spotify account securely to get started</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-number">2</div>
                            <h4>Set Your Preferences</h4>
                            <p>Tell us your mood, genre preferences, and playlist length</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-number">3</div>
                            <h4>Start Swiping</h4>
                            <p>Listen and swipe through curated song recommendations</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-number">4</div>
                            <h4>Enjoy Your Playlist</h4>
                            <p>Your custom playlist is automatically saved to your Spotify</p>
                        </div>
                    </div>
                </section>

                <div className="url-message">
                    <p>Frontend running on: {props.window.location.origin}</p>
                    <p>Backend expected at: http://127.0.0.1:5000</p>
                </div>

                
            </div>
        </div>
    );
}