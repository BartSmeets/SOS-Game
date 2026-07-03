# Building Target Practice — Step by Step

This tutorial builds the multiplayer slider game from scratch, one small piece at a time.
At every step you can run the app and see exactly what your new code does.

**Before you start**, install the dependencies once:

```bash
pip install fastapi "uvicorn[standard]" jinja2
```

Create a fresh folder for this tutorial:

```bash
my-game/
```

All files in this tutorial go inside that folder.

---

## Step 1 — A server that says hello

**What we're building:** the simplest possible FastAPI server. One file, one route, one line of HTML.

**Create `main.py`:**

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def index():
    return {"message": "Hello!"}
```

**Run it:**

```txt
uvicorn main:app --reload
```

**Test it:** open <http://localhost:8000> in your browser.
You should see:

```json
{"message": "Hello!"}
```

**What to notice:** `@app.get("/")` registers a route. When the browser visits `/`, FastAPI calls `index()` and sends back whatever it returns. The `--reload` flag means uvicorn restarts automatically every time you save a file — you won't need to stop and restart manually during this tutorial.

---

## Step 2 — Serve a real HTML page

**What we're building:** instead of JSON, serve a proper HTML page from a file. This introduces the `templates/` folder.

**Create the folder and file:**

```txt
my-game/
├── main.py
└── templates/
    └── index.html
```

**Edit `templates/index.html`:**

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
</head>
<body>
  <h1>Target Practice</h1>
  <p>Hello from HTML!</p>
</body>
</html>
```

**Edit `main.py`:**

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")
```

**Run it:** (if still running, it reloads automatically — just refresh the browser)

**Test it:** <http://localhost:8000> — you should see "Target Practice" as a heading and "Hello from HTML!" below it.

**What to notice:** `Jinja2Templates` reads the file from the `templates/` folder and sends it to the browser as a proper HTML page. The `request` object is passed in so FastAPI knows where the request came from — it's required even though we're not using it for anything yet.

---

## Step 3 — Add a slider

**What we're building:** put an actual slider on the page and display its current value. This is your first bit of JavaScript.

**Edit `templates/index.html`:**

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
</head>
<body>
  <h1>Target Practice</h1>

  <input type="range" id="slider" min="0" max="100" value="50" />
  <p>Value: <span id="valueDisplay">50</span></p>

  <script>
    const slider = document.getElementById('slider');
    const valueDisplay = document.getElementById('valueDisplay');

    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });
  </script>
</body>
</html>
```

**`main.py` stays the same.**

**Test it:** drag the slider — the number next to "Value:" should update as you move it.

**What to notice:**

- `document.getElementById('slider')` finds the `<input>` element by its `id`.
- `addEventListener('input', () => { ... })` means: every time the slider moves, run this function.
- `slider.value` is the current position of the slider as a string.
- This all happens entirely in the browser — no server involved yet.

---

## Step 4 — Add some basic styling

**What we're building:** move the styling into its own CSS file so the page looks presentable. This introduces the `static/` folder.

**Create the folder and file:**

```txt
my-game/
├── main.py
├── templates/
│   └── index.html
└── static/
    └── style.css
```

**Create `static/style.css`:**

```css
body {
  font-family: sans-serif;
  background: #1a1a2e;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

input[type=range] {
  width: 300px;
  margin: 20px 0;
}

#valueDisplay {
  font-size: 48px;
  font-weight: bold;
}
```

**Edit `main.py`** to tell FastAPI to serve the static folder:

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")
```

**Edit `templates/index.html`** to link the CSS file:

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <h1>Target Practice</h1>

  <input type="range" id="slider" min="0" max="100" value="50" />
  <p>Value: <span id="valueDisplay">50</span></p>

  <script>
    const slider = document.getElementById('slider');
    const valueDisplay = document.getElementById('valueDisplay');

    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });
  </script>
</body>
</html>
```

**Test it:** refresh — the page should now have a dark background, white text, and a large number showing the slider value.

**What to notice:** `<link rel="stylesheet" href="/static/style.css">` tells the browser to fetch the CSS file separately. The browser makes a second request for `/static/style.css`, which FastAPI serves from the `static/` folder unchanged.

---

## Step 5 — Open a WebSocket connection

**What we're building:** connect the browser to the server over a WebSocket and show when the connection is live. Nothing visible happens with the slider yet — this step is just about establishing the wire.

**Edit `main.py`** to add a WebSocket route:

```python
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("A browser connected!")
    try:
        while True:
            message = await websocket.receive_text()
            print("Received:", message)
            await websocket.send_text("Server got: " + message)
    except WebSocketDisconnect:
        print("Browser disconnected")
```

**Edit `templates/index.html`** to open the WebSocket from JS:

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <h1>Target Practice</h1>
  <p id="status">Connecting...</p>

  <input type="range" id="slider" min="0" max="100" value="50" />
  <p>Value: <span id="valueDisplay">50</span></p>

  <script>
    const slider = document.getElementById('slider');
    const valueDisplay = document.getElementById('valueDisplay');
    const status = document.getElementById('status');

    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      status.textContent = 'Connected!';
      ws.send('hello from browser');
    };

    ws.onmessage = (event) => {
      console.log('Server said:', event.data);
    };

    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });
  </script>
</body>
</html>
```

**Test it:** refresh the page. You should see "Connected!" on screen.
In your terminal where uvicorn is running, you should see:

```txt
A browser connected!
Received: hello from browser
```

Open your browser's developer tools (F12 → Console tab) and you should see:

```txt
Server said: Server got: hello from browser
```

**What to notice:** the WebSocket is a two-way wire that stays open. `ws.send()` sends text to Python. `ws.onmessage` fires whenever Python sends something back. The `while True` loop in Python keeps the connection alive — it sits and waits for messages.

---

## Step 6 — Send the slider value to the server

**What we're building:** when you move the slider, send its value over the WebSocket to Python. Python prints it. No scoring yet — just confirming the data flows.

**Edit `templates/index.html`** — update the slider listener:

```js
slider.addEventListener('input', () => {
  valueDisplay.textContent = slider.value;
  ws.send(JSON.stringify({ type: 'slide', value: slider.value }));
});
```

**Edit `main.py`** — update the message handler to parse JSON:

```python
import json

# (rest of the imports stay the same)

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            print("Slider value:", msg["value"])
            await websocket.send_text("Got value: " + str(msg["value"]))
    except WebSocketDisconnect:
        print("Browser disconnected")
```

**Test it:** drag the slider and watch your terminal. You should see a stream of:

```txt
Slider value: 47
Slider value: 52
Slider value: 58
```

**What to notice:** `JSON.stringify()` in JS turns a dictionary into a string like `'{"type":"slide","value":"58"}'`. `json.loads()` in Python turns it back into a dictionary. This is how the two sides pass structured data across the wire.

---

## Step 7 — Add a scoring function

**What we're building:** a separate `game.py` with a hidden target and a scoring formula. Python calculates a score from the slider value and sends it back.

**Create `game.py`:**

```python
import random

SLIDER_MIN, SLIDER_MAX = 0, 100
TARGET = random.randint(10, 90)

print(f"Target is: {TARGET}")  # for testing — remove this later!

def compute_score(value: int) -> float:
    distance = abs(value - TARGET)
    span = SLIDER_MAX - SLIDER_MIN
    return max(0.0, round(100 - (distance / span) * 130, 1))
```

**Edit `main.py`** to use the score:

```python
import json
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from game import compute_score

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            score = compute_score(int(msg["value"]))
            await websocket.send_text(json.dumps({"type": "score", "score": score}))
    except WebSocketDisconnect:
        pass
```

**Edit `templates/index.html`** — display the score when it comes back from the server:

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <h1>Target Practice</h1>
  <p id="status">Connecting...</p>

  <input type="range" id="slider" min="0" max="100" value="50" />
  <p>Slider: <span id="valueDisplay">50</span></p>
  <p>Score: <span id="scoreDisplay">-</span></p>

  <script>
    const slider = document.getElementById('slider');
    const valueDisplay = document.getElementById('valueDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const status = document.getElementById('status');

    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => { status.textContent = 'Connected!'; };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'score') {
        scoreDisplay.textContent = msg.score;
      }
    };

    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
      ws.send(JSON.stringify({ type: 'slide', value: slider.value }));
    });
  </script>
</body>
</html>
```

**Test it:** drag the slider — you should see the score update. Check the terminal for the printed target, then drag the slider towards that number and watch the score rise towards 100.

**What to notice:** `game.py` knows nothing about WebSockets. It's just a function that takes a number and returns a score. This is the separation we talked about earlier — keeping the game logic away from the networking code.

---

## Step 8 — Add a join screen with a name

**What we're building:** a name input before the game starts. The server tracks which name belongs to which connection. This is preparation for multiplayer.

**Edit `game.py`** — replace the standalone function with a class that tracks players:

```python
import random

SLIDER_MIN, SLIDER_MAX = 0, 100

class Game:
    def __init__(self):
        self.target = random.randint(10, 90)
        self.players = {}  # name -> {"value": int, "score": float}

    def add_player(self, name: str) -> str:
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
```

**Edit `main.py`:**

```python
import json
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from game import game

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    name = None
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "join":
                name = game.add_player(msg["name"])
                await websocket.send_text(json.dumps({"type": "joined", "name": name}))

            elif msg["type"] == "slide" and name:
                game.update_value(name, msg["value"])
                score = game.players[name]["score"]
                await websocket.send_text(json.dumps({"type": "score", "score": score}))

    except WebSocketDisconnect:
        pass
    finally:
        if name:
            game.remove_player(name)
```

**Edit `templates/index.html`** — add a join card before the slider:

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>

  <div id="joinCard">
    <h1>Target Practice</h1>
    <input type="text" id="nameInput" placeholder="Your name" />
    <button id="joinBtn">Join</button>
  </div>

  <div id="gameArea" style="display:none">
    <h1>Target Practice</h1>
    <p id="whoLine"></p>
    <input type="range" id="slider" min="0" max="100" value="50" />
    <p>Score: <span id="scoreDisplay">-</span></p>
  </div>

  <script>
    const joinCard = document.getElementById('joinCard');
    const gameArea = document.getElementById('gameArea');
    const nameInput = document.getElementById('nameInput');
    const slider = document.getElementById('slider');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const whoLine = document.getElementById('whoLine');

    let myName = null;
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'joined') {
        myName = msg.name;
        whoLine.textContent = 'Playing as: ' + myName;
        joinCard.style.display = 'none';
        gameArea.style.display = 'block';
      }

      if (msg.type === 'score') {
        scoreDisplay.textContent = msg.score;
      }
    };

    document.getElementById('joinBtn').onclick = () => {
      ws.send(JSON.stringify({ type: 'join', name: nameInput.value }));
    };

    slider.addEventListener('input', () => {
      ws.send(JSON.stringify({ type: 'slide', value: slider.value }));
    });
  </script>
</body>
</html>
```

**Test it:** type your name, click Join — the join card disappears and the game appears with your name. Move the slider and see your score change.

**What to notice:** `style="display:none"` hides the game area by default. When JS receives the `"joined"` message back from the server, it sets `display = 'block'` to reveal it. The server now knows *which player* sent each slide message via the `name` variable.

---

## Step 9 — Add multiplayer: broadcast to everyone

**What we're building:** when any player moves their slider, *all* connected players see the updated scoreboard. This is the multiplayer step.

**Edit `main.py`** — add a `connections` dictionary and a `broadcast` function:

```python
import json
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from game import game

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

connections = {}  # name -> websocket

async def broadcast(payload: dict):
    text = json.dumps(payload)
    for ws in connections.values():
        await ws.send_text(text)

def scoreboard():
    ranked = sorted(game.players.items(), key=lambda kv: kv[1]["score"], reverse=True)
    return {"type": "scoreboard", "board": [
        {"name": n, "score": p["score"]} for n, p in ranked
    ]}

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    name = None
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "join":
                name = game.add_player(msg["name"])
                connections[name] = websocket
                await websocket.send_text(json.dumps({"type": "joined", "name": name}))
                await broadcast(scoreboard())

            elif msg["type"] == "slide" and name:
                game.update_value(name, msg["value"])
                await broadcast(scoreboard())

    except WebSocketDisconnect:
        pass
    finally:
        if name:
            connections.pop(name, None)
            game.remove_player(name)
            await broadcast(scoreboard())
```

**Edit `templates/index.html`** — add a leaderboard panel and handle the scoreboard message:

```html
<!doctype html>
<html>
<head>
  <title>Target Practice</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>

  <div id="joinCard">
    <h1>Target Practice</h1>
    <input type="text" id="nameInput" placeholder="Your name" />
    <button id="joinBtn">Join</button>
  </div>

  <div id="gameArea" style="display:none">
    <h1>Target Practice</h1>
    <p id="whoLine"></p>
    <input type="range" id="slider" min="0" max="100" value="50" />
    <hr>
    <h2>Leaderboard</h2>
    <div id="board"></div>
  </div>

  <script>
    const joinCard = document.getElementById('joinCard');
    const gameArea = document.getElementById('gameArea');
    const nameInput = document.getElementById('nameInput');
    const slider = document.getElementById('slider');
    const whoLine = document.getElementById('whoLine');
    const board = document.getElementById('board');

    let myName = null;
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'joined') {
        myName = msg.name;
        whoLine.textContent = 'Playing as: ' + myName;
        joinCard.style.display = 'none';
        gameArea.style.display = 'block';
      }

      if (msg.type === 'scoreboard') {
        board.innerHTML = msg.board.map((row, i) =>
          `<p>${i + 1}. ${row.name} — ${row.score}</p>`
        ).join('');
      }
    };

    document.getElementById('joinBtn').onclick = () => {
      ws.send(JSON.stringify({ type: 'join', name: nameInput.value }));
    };

    slider.addEventListener('input', () => {
      ws.send(JSON.stringify({ type: 'slide', value: slider.value }));
    });
  </script>
</body>
</html>
```

**Test it:** open <http://localhost:8000> in two different browser tabs. Join with a different name in each. Move the slider in one tab — you should see the leaderboard update in *both* tabs instantly.

**What to notice:** `connections` is a dictionary that maps each player's name to their WebSocket. `broadcast()` loops through all of them and sends the same message to everyone. When any one player moves, the whole scoreboard is recalculated and pushed to every browser simultaneously.

---

## Step 10 — Move the JS into its own file

**What we're building:** exactly what you have now — tidy file separation. Nothing changes functionally, just organization.

**Create `static/game.js`** and paste all the `<script>` contents there (without the `<script>` tags themselves).

**In `templates/index.html`**, replace the `<script>...</script>` block with:

```html
<script src="/static/game.js"></script>
```

**Test it:** refresh — everything should work exactly as before.

**What to notice:** this is a purely cosmetic change from the browser's perspective. The browser makes one extra HTTP request for `game.js`, but the behaviour is identical. The benefit is just readability — each file now has one job.

---

## Where you are now

```txt
my-game/
├── main.py          ← web routing and WebSocket
├── game.py          ← scoring logic, no web code
├── templates/
│   └── index.html   ← page structure only
└── static/
    ├── style.css    ← visual styling
    └── game.js      ← all interactivity
```

The full finished version of the game (with better styling and the spectator mode) follows exactly this same structure — it's just the same ten steps with more CSS in `style.css` and a few more message types handled in `main.py` and `game.js`.

If you get stuck at any step, the most useful thing to do is open your browser's developer tools (F12), click the **Console** tab, and look for red error messages — that's where JS errors appear. For Python errors, look at the terminal where uvicorn is running.
