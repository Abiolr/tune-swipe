from .user import User
from .preference import Preference
#from .song import Song
#from .swipe import Swipe

class SwipeSession:
    def __init__(self, user: User, preferences: Preference):
        self.session_id = ""
        self.user_id = user.user_id
        self.target_playlist_length = 0
        self.current_swipe_index = 0
        self.session_preferences = preferences
        self.swipes = []
        self.candidate_songs = []
        self.liked_songs = []