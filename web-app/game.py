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
        self.target = self._new_target()
        self.players: dict[str, dict] = {}

    def _new_target(self) -> int:
        return random.randint(SLIDER_MIN + 10, SLIDER_MAX - 10)

    def _score(self, value: int) -> float:
        """Closer to the target = higher score. CUSTOMISE ME: change the
        formula, or tie it to your own lesson content."""
        distance = abs(value - self.target)
        span = SLIDER_MAX - SLIDER_MIN
        return max(0.0, round(100 - (distance / span) * 130, 1))

    def add_player(self, requested_name: str) -> str:
        """Registers a new player and returns the name actually assigned
        (handles empty names and de-duplicates clashes)."""
        name = (requested_name or "").strip()[:18] or f"Player{random.randint(1, 999)}"
        base, i = name, 2
        while name in self.players:
            name = f"{base} ({i})"
            i += 1
        start_value = (SLIDER_MIN + SLIDER_MAX) // 2
        self.players[name] = {"value": start_value, "score": self._score(start_value)}
        return name

    def remove_player(self, name: str) -> None:
        self.players.pop(name, None)

    def update_value(self, name: str, value: int) -> None:
        value = max(SLIDER_MIN, min(SLIDER_MAX, int(value)))
        self.players[name]["value"] = value
        self.players[name]["score"] = self._score(value)

    def reset_round(self) -> None:
        """Picks a new hidden target and puts every slider back to the middle."""
        self.target = self._new_target()
        mid = (SLIDER_MIN + SLIDER_MAX) // 2
        for p in self.players.values():
            p["value"] = mid
            p["score"] = self._score(mid)

    def scoreboard(self) -> list[dict]:
        """Returns players ranked highest score first."""
        ranked = sorted(self.players.items(), key=lambda kv: kv[1]["score"], reverse=True)
        return [{"name": n, "value": p["value"], "score": p["score"]} for n, p in ranked]


# One shared game, used by every connected player.
game = Game()
