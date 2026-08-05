// =========================================================================
// Two-level electron system — multiplayer client
//
// Structure:
//   1. DOM references
//   2. WebSocket / networking
//   3. Scoreboard rendering
//   4. Canvas animation (electron decay simulation)
// =========================================================================

// -------------------------------------------------------------------------
// 1. DOM references
// -------------------------------------------------------------------------
let ws;
let myName = null;
let isSpectator = false;

const joinCard = document.getElementById("joinCard");
const nameInput = document.getElementById("nameInput");

const stage = document.getElementById("stage");
const scoreNum = document.getElementById("scoreNum");
const whoLine = document.getElementById("whoLine");

const dialPanel = document.getElementById("dialPanel");
const n2Slider = document.getElementById("n2-slider");
const aInput = document.getElementById("a-input");
const bwInput = document.getElementById("bw-input");
const submitBtn = document.getElementById("submitBtn");

const board = document.getElementById("board");

// -------------------------------------------------------------------------
// 2. WebSocket / networking
// -------------------------------------------------------------------------
let heartbeatTimer;

function startHeartbeat() {
  heartbeatTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  }, 10000); // every 10s, well under your 30s server timeout
}

function stopHeartbeat() {
  clearInterval(heartbeatTimer);
}

function connect(name, spectator) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(proto + "://" + location.host + "/games/einstein/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", name, spectator }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "joined") {
      startHeartbeat();
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
    }
  };

  ws.onclose = () => {
    stopHeartbeat();
    running = false;
    stage.classList.remove("active");
    joinCard.style.display = "";
    whoLine.innerHTML = "Disconnected — please rejoin";
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

// -------------------------------------------------------------------------
// 3. Scoreboard rendering
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// 4. Canvas animation (electron decay simulation)
// -------------------------------------------------------------------------
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

(function () {
  const TOTAL = 100;
  const LEVEL_X0 = 90;

  let A,
    BW = 0.0,
    N0,
    C,
    SS,
    K,
    gain;
  let running = false;
  let lastTime = null;
  let elapsed = 0;
  let electrons = [];
  let nExcited = 0;

  let W = 0,
    H = 0,
    LEVEL_X1 = 0,
    Y_E1 = 0,
    Y_E2 = 0;

  function makeElectrons(nExcitedInit) {
    electrons = [];
    for (let i = 0; i < TOTAL; i++) {
      const excited = i < nExcitedInit;
      electrons.push({
        id: i,
        level: excited ? 2 : 1,
        xFrac: Math.random(), // 0–1, position along the line
        yJitter: (Math.random() - 0.5) * 10,
        bob: Math.random() * Math.PI * 2,
        dropProgress: null,
      });
    }
    nExcited = electrons.filter((e) => e.level === 2).length;
  }

  function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  function advanceFalls() {
    electrons.forEach((e) => {
      if (e.dropProgress !== null) {
        e.dropProgress += 0.06;
        if (e.dropProgress > 1.0) {
          e.level = 1;
          e.dropProgress = null;
        }
      }
    });
  }

  function step() {
    const rate = BW + C;
    const decayFactor = Math.exp(-rate * elapsed);
    const roundedTerm = -K * decayFactor;
    const nDecaying = Math.ceil(N0 - (SS + roundedTerm));

    electrons.forEach((e) => {
      if (e.id <= nDecaying && e.level === 2 && e.dropProgress === null) {
        e.dropProgress = 0;
      }
    });

    advanceFalls();

    nExcited = electrons.filter((e) => e.level === 2).length;
    gain = (BW * nExcited - BW * (TOTAL - nExcited)).toFixed(0);
    scoreNum.textContent = gain;

    ws.send(JSON.stringify({ type: "submit", score: gain }));

    if (nExcited <= SS) running = false;
  }

  function getCss(varName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  }

  function levelY(level, jitter) {
    return (level === 2 ? Y_E2 : Y_E1) + jitter;
  }

  function drawLevel(y, color, label) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LEVEL_X0, y);
    ctx.lineTo(LEVEL_X1, y);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(label, LEVEL_X0 - 12, y + 4);
  }

  function drawElectron(x, y) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 7);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, getCss("--text-bright"));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // just skip this frame

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    W = rect.width;
    H = rect.height;
    Y_E2 = H * 0.1;
    Y_E1 = H * 0.9;
    LEVEL_X1 = W - 90;

    ctx.clearRect(0, 0, W, H);
    drawLevel(Y_E2, getCss("--hot"), "|2⟩");
    drawLevel(Y_E1, getCss("--cold"), "|1⟩");

    ctx.strokeStyle = getCss("--text-muted");
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(LEVEL_X1 + 30, Y_E2);
    ctx.lineTo(LEVEL_X1 + 30, Y_E1);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = getCss("--text-muted");
    ctx.font = "14px Georgia, serif";
    ctx.save();
    ctx.translate(LEVEL_X1 + 46, (Y_E2 + Y_E1) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("hf", 0, 0);
    ctx.restore();

    electrons.forEach((e) => {
      const x = LEVEL_X0 + e.xFrac * (LEVEL_X1 - LEVEL_X0);
      let y;
      if (e.dropProgress !== null) {
        const y2 = levelY(2, e.yJitter);
        const y1 = levelY(1, e.yJitter);
        y = y2 + (y1 - y2) * easeInOut(e.dropProgress);
      } else {
        y = levelY(e.level, e.yJitter) + Math.sin(e.bob) * 1.5;
      }
      drawElectron(x, y);
    });
  }

  function loop(timestamp) {
    if (lastTime !== null) {
      elapsed += (timestamp - lastTime) / 1000;
    }
    lastTime = timestamp;

    electrons.forEach((e) => (e.bob += 0.06));
    if (running) step();
    draw();

    requestAnimationFrame(loop);
  }

  n2Slider.addEventListener("input", () => {
    if (!running) makeElectrons(n2Slider.value);
  });

  submitBtn.onclick = () => {
    A = parseFloat(aInput.value);
    BW = parseFloat(bwInput.value);
    N0 = parseFloat(n2Slider.value);
    C = A + BW;
    SS = Math.floor((TOTAL * BW) / (BW + C));
    K = (TOTAL * BW) / (BW + C) - N0;

    running = true;
    elapsed = 0;
    lastTime = null;

    makeElectrons(n2Slider.value);
  };

  makeElectrons(n2Slider.value); // uses LEVEL_X1 = 0 initially, harmless — repositioned once draw() runs
  loop();
})();
