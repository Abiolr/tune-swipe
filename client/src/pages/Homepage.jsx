/**
 * Homepage - Landing page component for unauthenticated users.
 * 
 * Displays app features, benefits, and how-it-works section.
 * Provides Spotify authentication entry point with loading states.
 * Serves as marketing page to introduce users to TuneSwipe functionality.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.spotifyHandling - Function to initiate Spotify OAuth
 * @param {boolean} props.loadingState - Loading state for authentication process
 * @returns {JSX.Element} Landing page with features and authentication
 */

import React from 'react';
import { FaHandPointer, FaPlayCircle, FaListAlt, FaSpotify, FaUserCheck, FaSlidersH, FaMusic, FaSmile } from 'react-icons/fa';
import '../styles/App.css';
import '../styles/Homepage.css';

export default function Homepage(props) {
    return (
        <div className="homepage">
            <div className="container">
                {/* Hero */}
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
                                <FaSpotify size={20} />
                                {props.loadingState ? 'Connecting...' : 'Connect with Spotify'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="features">
                    <div className="feature">
                        <FaHandPointer className="feature-icon" />
                        <h3>Simple Swiping</h3>
                        <p>Just like your favorite dating app, but for music! Swipe right to love a song, left to pass. It's that easy.</p>
                    </div>
                    
                    <div className="feature">
                        <FaPlayCircle className="feature-icon" />
                        <h3>Preview Every Track</h3>
                        <p>Listen to song snippets as you swipe. Get a real feel for each track before making your choice.</p>
                    </div>
                    
                    <div className="feature">
                        <FaListAlt className="feature-icon" />
                        <h3>Instant Playlist Creation</h3>
                        <p>Your personalized playlist is automatically saved to your Spotify account, ready to enjoy anywhere.</p>
                    </div>
                </section>

                {/* How It Works */}
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
            </div>
        </div>
    );
}
