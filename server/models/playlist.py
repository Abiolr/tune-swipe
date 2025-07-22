# playlist.py
from datetime import datetime
from typing import List
from .user import User
from .song import Song

class Playlist:
    def __init__(self, user: User) -> None:
        self.playlist_id: str = ""
        self.user_id: str = user.user_id
        self.name: str = ""
        self.description: str = ""
        self.songs: List[Song] = []
        self.creation_date: datetime = datetime.now()