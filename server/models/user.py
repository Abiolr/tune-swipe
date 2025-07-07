from datetime import datetime

class User:
    def __init__(self):
        self.user_id = ""
        self.spotify_id = ""
        self.display_name = ""
        self.email = ""
        self.creation_date = datetime.now()