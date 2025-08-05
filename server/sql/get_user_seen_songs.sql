SELECT DISTINCT 
    s.spotify_uri, 
    s.spotify_id,
    s.song_id, 
    s.title, 
    s.artist,
    MAX(sw.swipe_timestamp) as last_seen
FROM Songs s 
JOIN Swipes sw ON s.song_id = sw.song_id 
JOIN SwipeSessions ss ON sw.session_id = ss.session_id 
WHERE ss.spotify_id = %s 
AND (s.spotify_uri IS NOT NULL OR s.spotify_id IS NOT NULL)
GROUP BY s.spotify_uri, s.spotify_id, s.song_id
ORDER BY last_seen DESC;