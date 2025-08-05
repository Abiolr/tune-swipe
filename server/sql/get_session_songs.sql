SELECT 
    s.song_id,
    s.spotify_id,
    s.spotify_uri,
    s.title,
    s.artist,
    s.album_cover,
    s.preview_url,
    s.genre,
    s.mood,
    s.duration,
    s.explicit,
    s.popularity,
    sw.direction,
    sw.swipe_timestamp,
    sw.swipe_order
FROM Songs s
JOIN Swipes sw ON s.song_id = sw.song_id
WHERE sw.session_id = %s
ORDER BY sw.swipe_order ASC;