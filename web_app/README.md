# Target Practice — live multiplayer slider game

A small FastAPI app for the "hot/cold" slider challenge: each student has a slider,
there's a hidden target number, and everyone's score updates live on a shared
leaderboard the instant anyone moves their slider. No polling, no lag — it pushes
updates over a WebSocket.

## Run it locally (for testing on your own laptop)

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://localhost:8000 — click "Join & Play" in one browser tab and another
in a different tab (or incognito window) to see two "players" update each other's
scoreboard live.

## Running it for the actual class

You have two good options:

**1. Same Wi-Fi, no internet needed**
Run `uvicorn main:app --host 0.0.0.0 --port 8000` on your laptop, find your
laptop's local IP (e.g. `192.168.1.42`), and have students open
`http://192.168.1.42:8000` on their own devices, as long as they're on the same
classroom Wi-Fi network.

**2. Put it online (works from anywhere, more robust)**
Push this folder to a free host like Render, Railway, or Fly.io — they all support
FastAPI + WebSockets out of the box. Once deployed you'll get a permanent URL
(or QR code) you can reuse for every session of the summer school.

## How students use it

- They open the link, type their name, hit **Join & Play**.
- You (the teacher) can open the same link and click **"Just watching (project
  this)"** instead — that gives you a slider-free, leaderboard-only view, perfect
  for projecting on the classroom screen.
- On the spectator view there's a **🔄 New Round** button — click it to pick a new
  hidden target and reset everyone's slider, so you can replay the activity.

## Project structure

```
target-practice/
├── main.py              # FastAPI app: routes + the websocket connection
├── game.py              # Pure game logic: scoring, players, reset — no web code at all
├── templates/
│   └── index.html       # The page structure
├── static/
│   ├── style.css        # All the styling
│   └── game.js          # All the interactivity (WebSocket, slider, leaderboard rendering)
├── requirements.txt
└── README.md
```

## Customising it

Look for the comments marked `CUSTOMISE ME` in `game.py`:

- **`SLIDER_MIN` / `SLIDER_MAX`** — change the slider's range.
- **`Game._score()`** — change how score is calculated. Right now it's pure
  distance-to-target, but you could replace it with something tied to your
  actual lesson content (e.g. a slider represents a parameter in a formula,
  and the score reflects how well it fits some target data — a nice way to
  give students an intuitive feel for "tuning a parameter using only feedback,"
  if that connects to anything you're teaching).
- **Colors/fonts** — all in `static/style.css`, controlled by CSS variables at
  the top (`--hot`, `--cold`, `--bg-deep`, etc).
- **Multiple sliders per player** — currently it's one slider per student. If you
  want two or three sliders (e.g. tuning multiple parameters at once), duplicate
  the `<input type="range">` block in `templates/index.html` and extend the
  `"slide"` message in `static/game.js` to include multiple values; the
  broadcast/score logic in `game.py` generalizes easily.

## Why not Streamlit for this part?

Streamlit reruns the whole page on every interaction and has no built-in way to
push updates to *other* people's browsers — it's built for single-user
dashboards. A live shared scoreboard needs something that can push state to
everyone the instant it changes, which is what the WebSocket here does. You can
absolutely keep using Streamlit for the rest of your summer school content (slides,
explanations, individual exercises) and just drop in this separate app for the
multiplayer moment.
