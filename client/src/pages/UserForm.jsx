/**
 * UserForm - Session preferences configuration component.
 * 
 * Allows users to set genre preferences and target playlist size
 * before starting a swipe session. Provides genre selection interface
 * with tag-based UI and playlist size slider. Validates preferences
 * before navigating to swipe session.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object for context
 * @returns {JSX.Element} Preferences form with genre selection and playlist sizing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/App.css';
import '../styles/UserForm.css';

export default function UserForm() {
    const navigate = useNavigate();
    
    const [preferences, setPreferences] = useState({
        genres: [],
        songCount: 20,
    });

    /**
     * Handles form input changes for non-genre fields.
     * 
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: parseInt(value) || value
        }));
    };

    /**
     * Handles genre selection from dropdown.
     * Adds genre to preferences if not already selected.
     * 
     * @param {Event} e - Select change event
     */
    const handleGenreChange = (e) => {
        const value = e.target.value.toLowerCase(); 
        if (value && !preferences.genres.includes(value)) {
            setPreferences(prev => ({
                ...prev,
                genres: [...prev.genres, value]
            }));
            // Reset the select to show placeholder
            e.target.value = "";
        }
    };

    /**
     * Removes a genre from the selected preferences.
     * 
     * @param {string} genreToRemove - Genre string to remove from selection
     */
    const removeGenre = (genreToRemove) => {
        setPreferences(prev => ({
            ...prev,
            genres: prev.genres.filter(genre => genre !== genreToRemove)
        }));
    };

    /**
     * Validates preferences and navigates to swipe session.
     * Ensures at least one genre is selected and song count is within limits.
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (preferences.genres.length === 0) {
            alert('Please select at least one genre');
            return;
        }
        if (preferences.songCount < 5 || preferences.songCount > 50) {
            alert('Please select between 5 and 50 songs');
            return;
        }
        
        // Navigate to swipe session with preferences
        navigate('/swipe-session', { state: { preferences } });
    };

    return (
        <div className="user-form-container">
            <button onClick={() => navigate('/dashboard')} className="back-btn">
                &larr; Back to Dashboard
            </button>
            
            <form onSubmit={handleSubmit} className="preferences-form">
                <h1>Create Your Swipe Session</h1>
                <p className="form-description">
                    Select your preferred genres to discover music
                </p>
                
                <div className="form-group">
                    <label htmlFor="genre">Preferred Genres</label>
                    <select 
                        id="genre" 
                        name="genre" 
                        onChange={handleGenreChange}
                        defaultValue=""
                    >
                        <option value="" disabled>Select genres...</option>
                        <option value="pop">Pop</option>
                        <option value="rock">Rock</option>
                        <option value="hiphop">Hip Hop</option>
                        <option value="electronic">Electronic</option>
                        <option value="jazz">Jazz</option>
                        <option value="classical">Classical</option>
                        <option value="r&b">R&B</option>
                        <option value="country">Country</option>
                        <option value="alternative">Alternative</option>
                        <option value="indie">Indie</option>
                    </select>
                    <div className="selected-tags">
                        {preferences.genres.map(genre => (
                            <span key={genre} className="tag">
                                {genre}
                                <button 
                                    type="button" 
                                    onClick={() => removeGenre(genre)}
                                    className="tag-remove"
                                    aria-label={`Remove ${genre}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    {preferences.genres.length === 0 && (
                        <p className="form-hint">Select at least one genre to continue</p>
                    )}
                </div>
                
                <div className="form-group">
                    <label htmlFor="songCount">
                        Target Playlist Size: {preferences.songCount} songs
                    </label>
                    <input 
                        type="range" 
                        id="songCount" 
                        name="songCount" 
                        min="5" 
                        max="50" 
                        value={preferences.songCount}
                        onChange={handleChange}
                    />
                    <div className="range-labels">
                        <span>5</span>
                        <span>50</span>
                    </div>
                </div>
                
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={preferences.genres.length === 0}
                >
                    Start Swiping
                </button>
            </form>
        </div>
    );
}