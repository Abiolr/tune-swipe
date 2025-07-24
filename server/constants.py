import os

# Frontend configuration
FRONTEND_PORT = "5173"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"

# Validate Spotify credentials
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')