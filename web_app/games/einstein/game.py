"""
Pure game logic for Target Practice — no FastAPI, no websockets, no HTML.

This file only knows about: the hidden target, players, and scoring.
It doesn't know or care how a player's move reaches it (that's main.py's job).
Keeping it this way means you can test or tweak the game rules without
touching any networking code.
"""

import random

SLIDER_MIN, SLIDER_MAX = 0, 100  # CUSTOMISE ME: slider range


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
        start_value = (SLIDER_MIN + SLIDER_MAX) // 2
        self.players[name] = {"value": start_value, "score": "0.0"}
        return name

    def remove_player(self, name: str) -> None:
        self.players.pop(name, None)

    def update_score(self, name: str, gain: int) -> None:
        self.players[name]["score"] = str(gain)
        
    def scoreboard(self) -> list[dict]:
        """Returns players ranked highest score first."""
        ranked = sorted(self.players.items(), key=lambda kv: float(kv[1]["score"]), reverse=True)
        return [{"name": n, "score": p["score"]} for n, p in ranked]


# One shared game, used by every connected player.
game = Game()
