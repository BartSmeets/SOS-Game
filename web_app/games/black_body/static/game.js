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

function updateReadings() {}

tempSpinBox.onchange = function () {
  ws.send(
    JSON.stringify({
      type: "submit",
      temp: tempSpinBox.value,
    }),
  );
};
