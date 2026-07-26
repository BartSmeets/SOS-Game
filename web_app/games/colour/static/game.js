import { waveLengthToRGB } from "./colors.js";

const hc = 1240; // eV*nm

const waveSlider = document.getElementById("wave-slider");
const waveRead = document.getElementById("wave-read");
const energySlider = document.getElementById("energy-slider");
const energyRead = document.getElementById("energy-read");

function updateReadouts() {
  energyRead.textContent = parseFloat(energySlider.value).toFixed(2);
  waveRead.textContent = waveSlider.value;
}

waveSlider.oninput = function () {
  energySlider.value = hc / waveSlider.value;
  updateReadouts();
  draw();
};

energySlider.oninput = function () {
  waveSlider.value = hc / energySlider.value;
  updateReadouts();
  draw();
};

// ANIMATION

function draw() {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr; // <-- actually SET the buffer size
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // <-- scale drawing commands to match

  const W = rect.width;
  const H = rect.height;

  const pad = 30;
  const xMin = -3000,
    xMax = 3000;

  const wavelength = waveSlider.value;

  function linspace(a, b, n) {
    const arr = [];
    const step = (b - a) / (n - 1);
    for (let i = 0; i < n; i++) arr.push(a + i * step);
    return arr;
  }

  function wave(x) {
    const packet = Math.exp(-(x ** 2) / 2e6);
    const omega = (2 * Math.PI) / wavelength;
    return packet * Math.sin(omega * x);
  }

  const xPlot = linspace(xMin, xMax, Math.round(2e3));
  const yPlot = xPlot.map((x) => wave(x));
  const yMin = Math.min(...yPlot) - 0.5;
  const yMax = Math.max(...yPlot) + 0.5;

  function toPixel(x, y) {
    const px = pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
    const py = H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);
    return [px, py];
  }

  // Colour
  const [r, g, b] = waveLengthToRGB(wavelength);
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 5;

  // Draw
  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  xPlot.forEach((x, i) => {
    const [px, py] = toPixel(x, yPlot[i]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

updateReadouts();
draw();
