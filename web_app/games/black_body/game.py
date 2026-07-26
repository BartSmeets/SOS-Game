import math
import random

WIEN = 2898e3 # nm * K
TARGET = 5800   # K
SENSITIVITY = 15
START = 300

class Game:
    """Holds the hidden target and every player's current slider value/score."""

    def __init__(self):
        self.players: dict[str, dict] = {}

    def add_player(self, requested_name: str) -> str:
        """Registers a new player and returns the name actually assigned
        (handles empty names and de-duplicates clashes)."""
        name = (requested_name or "").strip()[:18] or f"Player{random.randint(1, 999)}"
        base, i = name, 2
        while name in self.players:
            name = f"{base} ({i})"
            i += 1
        self.players[name] = {"temp": START, "wavelength": _peak_wavelength(START), "score": _score(START)}
        return name

    def remove_player(self, name: str) -> None:
        self.players.pop(name, None)

    def update_score(self, name: str, temp: int) -> None:
        self.players[name]["temp"] = str(temp)
        self.players[name]["score"] = str(_score(temp))
        self.players[name]["wavelength"] = _peak_wavelength(temp)
        
    def scoreboard(self) -> list[dict]:
        """Returns players ranked highest score first."""
        ranked = sorted(self.players.items(), key=lambda kv: float(kv[1]["score"]), reverse=True)
        return [{"name": n, "score": p["score"]} for n, p in ranked]

def _peak_wavelength(temperature):
    return int(WIEN / temperature)

def _score(temperature):
    percentage = abs(temperature - TARGET) / TARGET * 100
    score = 100 * math.exp(-(percentage ** 2) / (2 * SENSITIVITY ** 2))
    return round(score)

# One shared game, used by every connected player.
game = Game()