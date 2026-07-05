let ws,
  myName = null,
  isSpectator = false;

const joinCard = document.getElementById("joinCard");
const nameInput = document.getElementById("nameInput");

const stage = document.getElementById("stage");
const scoreNum = document.getElementById("scoreNum");
const tempTag = document.getElementById("tempTag");
const whoLine = document.getElementById("whoLine");

const dialPanel = document.getElementById("dialPanel");
const n2Slider = document.getElementById("n2-slider");
const aInput = document.getElementById("a-input");
const bwInput = document.getElementById("bw-input");

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
    } else if (msg.type === "round_reset") {
      slider.value = 50;
    }
  };
}

function tempFor(score) {
  if (score >= 90) return ["🏆 BULLSEYE", "var(--hot)"];
  if (score >= 65) return ["🔥 ON FIRE", "var(--hot)"];
  if (score >= 35) return ["😎 WARM", "#d6a14e"];
  return ["🥶 ICY", "var(--cold)"];
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
      scoreNum.textContent = mine.score;
      const [label, color] = tempFor(mine.score);
      tempTag.textContent = label;
      scoreNum.style.color = color;
      tempTag.style.color = color;
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

slider.addEventListener("input", () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "slide", value: slider.value }));
  }
});
