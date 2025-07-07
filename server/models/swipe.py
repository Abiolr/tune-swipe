from .song import Song
from .user import User

from enum import Enum

class Swipe:
    def __init__ (self, song: Song, user: User):
        self.swipe_id = ""
        self.user_id = user.user_id
        self.song_id = song.sond_id
        self.swipe_direction: SwipeDirection.NONE

class SwipeDirection(Enum):
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    NONE = "NONE"