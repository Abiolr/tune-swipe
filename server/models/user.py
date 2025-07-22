# user.py
from datetime import datetime

class User:
    def __init__(self) -> None:
        self.user_id: str = ""
        self.spotify_id: str = ""
        self.display_name: str = ""
        self.email: str = ""
        self.creation_date: datetime = datetime.now()

     