# preference.py
from typing import List

class Preference:
    def __init__(self) -> None:
        self.preferred_genres: List[str] = []
        self.preferred_moods: List[str] = []
        self.preferred_song_count: int = 0