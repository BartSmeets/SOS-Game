"""
FastAPI app for Target Practice.

This file only handles the *web* side of things: routes, the websocket
connection, and broadcasting updates. All the actual game rules live in
game.py. The page itself lives in templates/index.html, styled by
static/style.css and made interactive by static/game.js.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload
Then open http://localhost:8000
"""

import json
import os

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .game import game

os.chdir(".\\web_app")
app = FastAPI()

# Files in static/ (CSS, JS) are served exactly as they are on disk.
app.mount("/static", StaticFiles(directory="static"), name="static")

# HTML in templates/ is passed through Jinja2 before being sent to the browser
# (we don't use any dynamic {{ values }} yet, but this is the standard place
# for it if you add some later).
templates = Jinja2Templates(directory="templates")

connections: dict[str, WebSocket] = {}   # player name -> websocket
spectators: set[WebSocket] = set()       # websockets that are just watching


async def broadcast(payload: dict) -> None:
    text = json.dumps(payload)
    dead = []
    for name, ws in connections.items():
        try:
            await ws.send_text(text)
        except Exception:
            dead.append(name)
    for ws in list(spectators):
        try:
            await ws.send_text(text)
        except Exception:
            spectators.discard(ws)
    for name in dead:
        connections.pop(name, None)
        game.remove_player(name)


def scoreboard_payload() -> dict:
    return {"type": "scoreboard", "board": game.scoreboard()}


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.websocket("/ws")
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
                    spectators.add(websocket)
                    await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                    await broadcast(scoreboard_payload())
                    continue

                name = game.add_player(msg.get("name", ""))
                connections[name] = websocket
                await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                await broadcast(scoreboard_payload())

            elif msg_type == "slide" and name:
                game.update_value(name, msg["value"])
                await broadcast(scoreboard_payload())

            elif msg_type == "reset":
                game.reset_round()
                await broadcast({"type": "round_reset"})
                await broadcast(scoreboard_payload())

    except WebSocketDisconnect:
        pass
    finally:
        if is_spectator:
            spectators.discard(websocket)
        if name:
            connections.pop(name, None)
            game.remove_player(name)
            await broadcast(scoreboard_payload())
