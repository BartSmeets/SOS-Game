"""
Generic per-game connection bookkeeping: who is playing, who is just
watching, and how to push a JSON payload to everyone at once.
"""

import json

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}   # player name -> websocket
        self.spectators: set[WebSocket] = set()       # websockets that are just watching

    async def broadcast(self, payload: dict) -> None:
        text = json.dumps(payload)
        dead: list[str] = []
        for name, ws in self.connections.items():
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(name)
        for ws in list(self.spectators):
            try:
                await ws.send_text(text)
            except Exception:
                self.spectators.discard(ws)
        for name in dead:
            self.connections.pop(name, None)

        return dead