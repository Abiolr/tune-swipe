# song.py
class Song:
    def __init__(self) -> None:
        self.song_id: str = ""
        self.spotify_uri: str = ""
        self.title: str = ""
        self.artist: str = ""
        self.preview_url: str = ""
        self.genre: str = ""
        self.mood: str = ""
        self.duration: int = 0
        self.album_cover: str = ""
        self.explicit: bool = False