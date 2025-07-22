# swipe_session.py
from typing import List
from .user import User
from .preference import Preference
from .song import Song
from .swipe import Swipe

class SwipeSession:
    def __init__(self, user: User, preferences: Preference) -> None:
        self.session_id: str = ""
        self.user_id: str = user.user_id
        self.target_playlist_length: int = 0
        self.current_swipe_index: int = 0
        self.session_preferences: Preference = preferences
        self.swipes: List[Swipe] = []
        self.candidate_songs: List[Song] = []
        self.liked_songs: List[Song] = []