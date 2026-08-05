"""
Web/websocket wiring for the Black Body game.

Game rules live in game.py. This file only handles HTTP + the websocket
connection.
"""

import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates

from games.connection_manager import ConnectionManager

from .game import game

TIMEOUT = 30
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=BASE_DIR / "templates")
manager = ConnectionManager()

router = APIRouter()

def scoreboard_payload(name) -> dict:
    try:
        return {"type": "scoreboard", 
                "board": game.scoreboard(),
                "wavelength": game.players[name]["wavelength"],
                "score": game.players[name]["score"],
                }
    except KeyError:
        return {"type": "scoreboard", 
                "board": game.scoreboard(),
                }

@router.get("/games/black_body")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@router.websocket("/games/black_body/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    name = None
    is_spectator = False
    try:
        while True:
            try:
                raw = await asyncio.wait_for(
                        websocket.receive_text(), timeout=TIMEOUT
                    )
            except asyncio.TimeoutError:
                await websocket.close()
                break
            
            msg = json.loads(raw)
            msg_type = msg.get("type")

            # You still here?
            if msg_type == "pong":
                continue

            # New Connection
            if msg_type == "join":
                if msg.get("spectator"):
                    is_spectator = True
                    manager.spectators.add(websocket)
                    await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                    await manager.broadcast(scoreboard_payload(name))
                    continue
                else:
                    name = game.add_player(msg.get("name", ""))
                    manager.connections[name] = websocket
                    await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                    await manager.broadcast(scoreboard_payload(name))

            elif msg_type == "submit" and name:
                game.update_score(name, int(msg["temp"]))
                await manager.broadcast(scoreboard_payload(name))

    except WebSocketDisconnect:
        pass
    finally:
        if is_spectator:
            manager.spectators.discard(websocket)
        if name:
            manager.connections.pop(name, None)
            game.remove_player(name)
            await manager.broadcast(scoreboard_payload(name))