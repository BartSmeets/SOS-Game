import { waveLengthToRGB } from "/static/colors.js";

let ws;
let myName = null;
let isSpectator = false;

const joinCard = document.getElementById("joinCard");
const nameInput = document.getElementById("nameInput");

const stage = document.getElementById("stage");
const whoLine = document.getElementById("whoLine");

const waveRead = document.getElementById("wave-read");
const scoreNum = document.getElementById("score");

// Connection
function connect(name, spectator) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(proto + "://" + location.host + "/games/black_body/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", name, spectator }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "joined") {
      myName = msg.name;
      whoLine.innerHTML = isSpectator
        ? "Spectator view"
        : `Playing as <b>${myName}</b>`;

      joinCard.style.display = "none";
      stage.classList.add("active");

      if (isSpectator) {
        dialPanel.style.display = "none";
        document.querySelector(".grid").classList.add("spectator-mode");
      }
    } else if (msg.type === "scoreboard") {
      renderBoard(msg.board);
      scoreNum.textContent = msg.score;
      waveRead.textContent = msg.wavelength;
      draw();
    }
  };
}

document.getElementById("joinBtn").onclick = () => {
  isSpectator = false;
  connect(nameInput.value, isSpectator);
};

document.getElementById("watchBtn").onclick = () => {
  isSpectator = true;
  connect("Spectator", isSpectator);
};

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("joinBtn").click();
  }
});

// SCORING
const board = document.getElementById("board");
const tempSpinBox = document.getElementById("tempSpinBox");

function renderBoard(rows) {
  if (!rows.length) {
    board.innerHTML = '<div class="empty-state">Waiting for players…</div>';
    return;
  }

  board.innerHTML = rows
    .map((r, i) => {
      const mine = r.name === myName;
      return `<div class="row ${mine ? "me" : ""} ${i === 0 ? "rank1" : ""}">
      <div class="rank">${i + 1}</div>
      <div>
        <div class="name">${r.name}${mine ? " (you)" : ""}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.min(100, ((rows.length - i) / rows.length) * 100)}%"></div>
        </div>
      </div>
      <div class="score-pill">${r.score}</div>
    </div>`;
    })
    .join("");

  if (!isSpectator) {
    const mine = rows.find((r) => r.name === myName);
    if (mine && mine.score != null) {
      scoreNum.textContent = mine.score;
    }
  }
}

tempSpinBox.onchange = function () {
  ws.send(
    JSON.stringify({
      type: "submit",
      temp: tempSpinBox.value,
    }),
  );
};

// Drawing
const WIEN = 2898000; // nm * K
const TARGET_T = 5800; // must match TARGET in game.py

const FRAUNHOFER_LINES = [
  { wl: 393.4, depth: 0.55, width: 3 },
  { wl: 396.8, depth: 0.5, width: 3 },
  { wl: 434.0, depth: 0.35, width: 2.5 },
  { wl: 486.1, depth: 0.4, width: 3 },
  { wl: 517.3, depth: 0.35, width: 2 },
  { wl: 589.0, depth: 0.45, width: 1.8 },
  { wl: 656.3, depth: 0.55, width: 3 },
  { wl: 686.7, depth: 0.15, width: 1.5 },
  { wl: 759.4, depth: 0.15, width: 1.5 },
];

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

function planck(wavelengthNm, temperature) {
  const wl = wavelengthNm * 1e-9;
  const h = 6.626e-34,
    c = 3e8,
    k = 1.38e-23;
  const term1 = (2 * h * c * c) / Math.pow(wl, 5);
  const term2 = 1 / (Math.exp((h * c) / (wl * k * temperature)) - 1);
  return term1 * term2;
}

function absorptionFactor(wavelengthNm) {
  let factor = 1;
  for (const line of FRAUNHOFER_LINES) {
    const d = (wavelengthNm - line.wl) / line.width;
    factor *= 1 - line.depth * Math.exp(-(d * d));
  }
  return factor;
}

function linspace(a, b, n) {
  const arr = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(a + i * step);
  return arr;
}

function getCss(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  const pad = 34;
  const xMin = 300,
    xMax = 1000;
  const T = parseFloat(tempSpinBox.value);

  const xs = linspace(xMin, xMax, 1000);
  const targetYs = xs.map((x) => planck(x, TARGET_T) * absorptionFactor(x));
  const guessYs = xs.map((x) => planck(x, T));
  const trueMax = Math.max(...xs.map((x) => planck(x, TARGET_T)), ...guessYs);

  function toPixel(x, y) {
    const px = pad + ((x - xMin) / (xMax - xMin)) * (W - pad - 10);
    const py = H - pad - (y / trueMax) * (H - pad - 14);
    return [px, py];
  }

  ctx.clearRect(0, 0, W, H);

  // visible-spectrum background band
  for (let wl = 380; wl < 780; wl += 4) {
    const [r, g, b] = waveLengthToRGB(wl);
    const [px] = toPixel(wl, 0);
    const [px2] = toPixel(wl + 4, 0);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
    ctx.fillRect(px, pad - 6, px2 - px + 1, H - pad - (pad - 6));
  }

  // observed solar spectrum (with Fraunhofer dips)
  ctx.strokeStyle = "rgba(144, 153, 196, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  xs.forEach((x, i) => {
    const [px, py] = toPixel(x, targetYs[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // player's guessed Planck curve, colored by its own peak wavelength
  ctx.strokeStyle = getCss("--cold");
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  xs.forEach((x, i) => {
    const [px, py] = toPixel(x, guessYs[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // x-axis tick labels
  ctx.fillStyle = "#9099c4";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  [400, 500, 600, 700, 800, 900].forEach((w) => {
    const [px] = toPixel(w, 0);
    ctx.fillText(w, px, H - 8);
  });
}

draw();
