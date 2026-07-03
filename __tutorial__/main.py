import json

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from __tutorial__.game import game

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

connections = {}    # name -> websocket

async def broadcast(payload: dict):
    text = json.dumps(payload)

    for ws in connections.values():
        await ws.send_text(text)


def scoreboard():
    ranked = sorted(game.players.items(), key=lambda kv: kv[1]["score"], reverse=True)
    return {
        "type": "scoreboard",
        "board": [{"name": n, "score": p["score"]} for n, p in ranked]
        }

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("A browser connected!")
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "join":
                name = game.add_player(msg["name"])
                connections[name] = websocket
                await websocket.send_text(json.dumps({
                    "type": "joined",
                    "name": name
                    }))
                await broadcast(scoreboard())
                
            elif msg["type"] == "slide" and name:
                game.update_value(name, msg["value"])
                await broadcast(scoreboard())

    except WebSocketDisconnect:
        pass
    finally:
        if name:
            game.remove_player(name)