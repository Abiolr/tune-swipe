"""constants.py - TuneSwipe Application Constants.

Centralized configuration constants for the TuneSwipe application.
Handles environment-specific settings, URL configuration, API credentials,
and HTTP status codes used throughout the application.

Configuration includes:
- Environment detection (local vs production)
- Frontend and backend URL configuration
- Spotify API settings
- HTTP status code constants
"""

__author__ = "Abiola"
__version__ = "1.0"
__date__ = "2025-08-09"

import os

# Environment detection (local vs deployed)
IS_LOCAL = os.getenv('IS_LOCAL') == 'development'

# Frontend configuration
if IS_LOCAL:
    FRONTEND_PORT = "5173"
    FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
    BACKEND_URL = "http://127.0.0.1:5000"
else:
    FRONTEND_URL = "https://tune-swipe.vercel.app"
    BACKEND_URL = "https://tune-swipe.onrender.com"

SPOTIFY_REDIRECT_URI = f"{BACKEND_URL}/callback"

# Spotify credentials (should be set in environment variables)
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

# HTTP status codes
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_NOT_FOUND = 404
HTTP_INTERNAL_SERVER_ERROR = 500