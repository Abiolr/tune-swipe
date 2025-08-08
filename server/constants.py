# constants.py
import os

# Environment detection (local vs deployed)
IS_LOCAL = os.getenv('IS_LOCAL') == 'development'

# Frontend configuration
if IS_LOCAL:
    FRONTEND_PORT = "5173"
    FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
    BACKEND_URL = "http://127.0.0.1:5000"
    SPOTIFY_REDIRECT_URI = f"{BACKEND_URL}/callback"
else:
    FRONTEND_URL = "https://tune-swipe.vercel.app"
    BACKEND_URL = "https://tune-swipe.onrender.com"
    SPOTIFY_REDIRECT_URI = f"{BACKEND_URL}/callback"

# Spotify credentials (should be set in environment variables)
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')