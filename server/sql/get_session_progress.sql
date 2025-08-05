SELECT 
    ss.target_playlist_length,
    ss.session_status,
    COUNT(CASE WHEN sw.direction = 'RIGHT' THEN 1 END) as liked_count,
    COUNT(sw.swipe_id) as total_swipes,
    MAX(sw.swipe_order) as current_swipe_index
FROM SwipeSessions ss
LEFT JOIN Swipes sw ON ss.session_id = sw.session_id
WHERE ss.session_id = %s
GROUP BY ss.session_id;