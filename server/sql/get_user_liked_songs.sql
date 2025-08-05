SELECT 
    s.*, 
    sw.swipe_timestamp,
    ss.session_id,
    ss.target_playlist_length,
    ROW_NUMBER() OVER (PARTITION BY ss.session_id ORDER BY sw.swipe_timestamp) as song_order_in_session
FROM Songs s 
JOIN Swipes sw ON s.song_id = sw.song_id 
JOIN SwipeSessions ss ON sw.session_id = ss.session_id 
WHERE ss.spotify_id = %s AND sw.direction = 'RIGHT'
ORDER BY sw.swipe_timestamp DESC;