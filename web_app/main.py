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
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from games.registry import GAMES

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI()

# Files in static/ (CSS, JS) are served exactly as they are on disk.
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Wire up every game listed in games/registry.py: its page + websocket
# routes, and its own static files (CSS/JS), mounted under /games/<slug>/.
for game in GAMES:
    app.include_router(game.router)
    app.mount(
        f"/games/{game.slug}/static",
        StaticFiles(directory=game.static_dir),
        name=f"{game.slug}-static",
    )


@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"games": GAMES})
