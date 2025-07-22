# swipe.py
from enum import Enum
from .song import Song
from .user import User

class SwipeDirection(Enum):
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    NONE = "NONE"

class Swipe:
    def __init__(self, song: Song, user: User) -> None:
        self.swipe_id: str = ""
        self.user_id: str = user.user_id
        self.song_id: str = song.song_id
        self.swipe_direction: SwipeDirection = SwipeDirection.NONE