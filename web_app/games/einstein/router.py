"""
Web/websocket wiring for the Einstein Coefficients game.

Game rules live in game.py. This file only handles HTTP + the websocket
connection.
"""

import json
from pathlib import Path

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates

from games.connection_manager import ConnectionManager

from .game import game

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")
manager = ConnectionManager()

router = APIRouter()

def scoreboard_payload() -> dict:
    return {"type": "scoreboard", "board": game.scoreboard()}


@router.get("/games/einstein")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@router.websocket("/games/einstein/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    name = None
    is_spectator = False
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            # New Connection
            if msg_type == "join":
                if msg.get("spectator"):
                    is_spectator = True
                    manager.spectators.add(websocket)
                    await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                    await manager.broadcast(scoreboard_payload())
                    continue
                else:
                    name = game.add_player(msg.get("name", ""))
                    manager.connections[name] = websocket
                    await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                    await manager.broadcast(scoreboard_payload())

            elif msg_type == "submit" and name:
                game.update_score(name, int(msg["score"]))
                await manager.broadcast(scoreboard_payload())

    except WebSocketDisconnect:
        pass
    finally:
        if is_spectator:
            manager.spectators.discard(websocket)
        if name:
            manager.connections.pop(name, None)
            game.remove_player(name)
            await manager.broadcast(scoreboard_payload())