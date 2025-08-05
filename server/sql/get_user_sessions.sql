SELECT 
    ss.session_id,
    ss.spotify_id,
    ss.target_playlist_length,
    ss.session_preferences,
    ss.session_status,
    ss.creation_date,
    ss.completion_date,
    COUNT(sw.swipe_id) as total_swipes,
    COUNT(CASE WHEN sw.direction = 'RIGHT' THEN 1 END) as liked_count,
    COUNT(CASE WHEN sw.direction = 'LEFT' THEN 1 END) as passed_count
FROM SwipeSessions ss
LEFT JOIN Swipes sw ON ss.session_id = sw.session_id
WHERE ss.spotify_id = %s
GROUP BY ss.session_id
ORDER BY ss.creation_date DESC;