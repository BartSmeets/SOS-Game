import random

SLIDER_MIN, SLIDER_MAX = 0, 100

class Game:
    def __init__(self):
        self.target = random.randint(10, 90)
        self.players = {}   # name -> {"value": int, "score": float}


    def add_player(self, name:str) -> str:
        name = name.strip()[:18] or "Anonymous"
        self.players[name] = {"value": 50, "score": self._score(50)}
        return name
    

    def remove_player(self, name: str):
        self.players.pop(name, None)

    
    def update_value(self, name: str, value: int):
        value = max(SLIDER_MIN, min(SLIDER_MAX, int(value)))
        self.players[name]["value"] = value
        self.players[name]["score"] = self._score(value)

    
    def _score(self, value: int) -> float:
        distance = abs(value - self.target)
        span = SLIDER_MAX - SLIDER_MIN
        return max(0.0, round(100 - (distance / span) * 130, 1))
    
game = Game()