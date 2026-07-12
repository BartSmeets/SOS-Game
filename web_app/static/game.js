let ws,
  myName = null,
  isSpectator = false;

const joinCard = document.getElementById("joinCard");
const nameInput = document.getElementById("nameInput");

const stage = document.getElementById("stage");
const scoreNum = document.getElementById("scoreNum");
console.log("init ran, scoreNum now:", JSON.stringify(scoreNum.textContent));
console.log("scoreNum set to:", scoreNum.textContent);
const whoLine = document.getElementById("whoLine");

const dialPanel = document.getElementById("dialPanel");
const n2Slider = document.getElementById("n2-slider");
const aInput = document.getElementById("a-input");
const bwInput = document.getElementById("bw-input");
const submitBtn = document.getElementById;

const board = document.getElementById("board");

// FUNCTIONS
function connect(name, spectator) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(proto + "://" + location.host + "/ws");

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join", name: name, spectator: spectator }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "joined") {
      myName = msg.name;
      whoLine.innerHTML = isSpectator
        ? "Spectator view"
        : "Playing as <b>" + myName + "</b>";
      joinCard.style.display = "none";
      stage.classList.add("active");
      if (isSpectator) {
        dialPanel.style.display = "none";
      }
    } else if (msg.type === "scoreboard") {
      renderBoard(msg.board);
    }
  };
}

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
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, r.score)}%"></div></div>
      </div>
      <div class="score-pill">${r.score}</div>
    </div>`;
    })
    .join("");

  if (!isSpectator) {
    const mine = rows.find((r) => r.name === myName);
    if (mine) {
      if (mine.score != null) {
        scoreNum.textContent = mine.score;
      }
    }
  }
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

(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;

  const TOTAL = 100;
  const Y_E2 = H * 0.1; // upper level y
  const Y_E1 = H * 0.9; // lower level y
  const LEVEL_X0 = 90,
    LEVEL_X1 = W - 90;

  let A,
    BW = 0.0,
    N0,
    C,
    SS,
    K;

  let animId = null;
  let running = false;
  let lastTime = null;
  let elapsed = 0;
  let electrons = [];
  makeElectrons(n2Slider.value);

  let nExcited = electrons.filter((e) => e.level === 2).length;

  function makeElectrons(nExcited) {
    electrons = [];
    for (let i = 0; i < TOTAL; i++) {
      const excited = i < nExcited;
      electrons.push({
        id: i,
        level: excited ? 2 : 1,
        x: LEVEL_X0 + Math.random() * (LEVEL_X1 - LEVEL_X0),
        yJitter: (Math.random() - 0.5) * 10,
        bob: Math.random() * Math.PI * 2,
        dropProgress: null, // set when transitioning
      });
    }
  }

  function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  function step() {
    const rate = BW + C;
    // const rate = 0.1;
    console.log("elapsed:", elapsed);
    const exp = Math.exp(-rate * elapsed);
    console.log("exp:", exp);
    console.log("k:", K);
    const roundedTerm = Math.round(-K * exp);
    console.log("rounded term:", roundedTerm);
    const nDecaying = N0 - (SS + roundedTerm);

    electrons.forEach((e) => {
      if (e.id <= nDecaying && e.level === 2 && e.dropProgress === null) {
        e.dropProgress = 0;
      }
    });

    electrons.forEach((e) => {
      if (e.dropProgress !== null) {
        e.dropProgress += 0.06;
        if (e.dropProgress > 1.0) {
          e.level = 1;
          e.dropProgress = null;
        }
      }
    });

    nExcited = electrons.filter((e) => e.level === 2).length;
    if (nExcited <= SS) running = false;
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
    ctx.clearRect(0, 0, W, H);
    drawLevel(Y_E2, getCss("--hot"), "|2⟩");
    drawLevel(Y_E1, getCss("--cold"), "|1⟩");

    // energy gap arrow
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

    // electrons
    electrons.forEach((e) => {
      let y;
      if (e.dropProgress !== null) {
        const y2 = levelY(2, e.yJitter);
        const y1 = levelY(1, e.yJitter);
        y = y2 + (y1 - y2) * easeInOut(e.dropProgress);
      } else {
        y = levelY(e.level, e.yJitter) + Math.sin(e.bob) * 1.5;
      }
      drawElectron(e.x, y);
    });
  }

  function loop(timestamp) {
    if (lastTime !== null) {
      elapsed += (timestamp - lastTime) / 1000; // convert ms to seconds
    }
    lastTime = timestamp;

    electrons.forEach((e) => (e.bob += 0.06));
    if (running) step();
    draw();
    scoreNum.textContent = (BW * nExcited - BW * (TOTAL - nExcited)).toFixed(0);
    animId = requestAnimationFrame(loop);
  }

  n2Slider.addEventListener("input", () => {
    if (!running) makeElectrons(n2Slider.value); // instant response, only pre-submit
  });

  document.getElementById("submitBtn").onclick = () => {
    ws.send(
      JSON.stringify({
        type: "submit",
        values: {
          n2: n2Slider.value,
          a: aInput.value,
          bw: bwInput.value,
        },
      }),
    );

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

  loop();
})();
