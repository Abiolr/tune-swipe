from .user import User

from datetime import datetime

class Playlist:
    def __init__(self, user: User):
        self.playlist_id = ""
        self.user_id = user.user_id
        self.name = ""
        self.description = ""
        self.songs = []
        self.creation_date = datetime.now()