"use strict";

const LAST_RESULT_KEY = "typingTester.lastResult";
const HISTORY_KEY = "typingTester.history";

const MODE_PAGES = {
  normal: { label: "Paragraph", page: "index.html" },
  easy: { label: "Easy Words", page: "easy-words.html" },
  quotes: { label: "Quotes", page: "quotes.html" },
  custom: { label: "Custom Text", page: "custom-text.html" }
};

/* ---------------------------------------------------------------------- */
/* Data                                                                    */
/* ---------------------------------------------------------------------- */

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (err) {
    return fallback;
  }
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ---------------------------------------------------------------------- */
/* Canvas helpers                                                          */
/* ---------------------------------------------------------------------- */

/* Sizes the canvas to its box and the screen's pixel density so lines stay sharp. */
function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.parentElement.clientWidth;
  const height = canvas.parentElement.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return { ctx, width, height };
}

function niceMax(value) {
  if (value <= 10) return 10;
  const step = value <= 50 ? 10 : value <= 150 ? 25 : 50;
  return Math.ceil(value / step) * step;
}

function drawGrid(ctx, area, maxValue, colors) {
  const lines = 5;
  ctx.font = "12px Segoe UI, Roboto, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= lines; i++) {
    const value = (maxValue / lines) * i;
    const y = area.bottom - (area.bottom - area.top) * (i / lines);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(area.left, y);
    ctx.lineTo(area.right, y);
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.fillText(String(Math.round(value)), area.left - 8, y);
  }
}

/* ---------------------------------------------------------------------- */
/* Charts                                                                  */
/* ---------------------------------------------------------------------- */

function drawSpeedChart(canvas, result) {
  const { ctx, width, height } = setupCanvas(canvas);
  const colors = {
    grid: cssVar("--border"),
    muted: cssVar("--muted"),
    line: cssVar("--accent"),
    error: cssVar("--error")
  };

  const samples = result.samples.length
    ? result.samples
    : [{ second: Math.max(1, Math.round(result.duration)), wpm: result.wpm, errors: result.errors }];
  const points = [{ second: 0, wpm: 0, errors: 0 }].concat(samples);

  const area = { left: 44, right: width - 16, top: 16, bottom: height - 34 };
  const maxSecond = Math.max(points[points.length - 1].second, 1);
  const maxWpm = niceMax(Math.max(...points.map((p) => p.wpm)));

  const x = (second) => area.left + (area.right - area.left) * (second / maxSecond);
  const y = (wpm) => area.bottom - (area.bottom - area.top) * (wpm / maxWpm);

  drawGrid(ctx, area, maxWpm, colors);

  ctx.fillStyle = colors.muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const tickEvery = Math.max(1, Math.ceil(maxSecond / 8));
  for (let s = 0; s <= maxSecond; s += tickEvery) {
    ctx.fillText(s + "s", x(s), area.bottom + 8);
  }

  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, colors.line + "55");
  gradient.addColorStop(1, colors.line + "00");
  ctx.beginPath();
  ctx.moveTo(x(points[0].second), area.bottom);
  points.forEach((p) => ctx.lineTo(x(p.second), y(p.wpm)));
  ctx.lineTo(x(points[points.length - 1].second), area.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(x(p.second), y(p.wpm));
    else ctx.lineTo(x(p.second), y(p.wpm));
  });
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  points.slice(1).forEach((p, i) => {
    const previous = points[i];
    const px = x(p.second);
    const py = y(p.wpm);
    if (p.errors > previous.errors) {
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 5, py - 5);
      ctx.lineTo(px + 5, py + 5);
      ctx.moveTo(px + 5, py - 5);
      ctx.lineTo(px - 5, py + 5);
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.line;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawHistoryChart(canvas, history) {
  const { ctx, width, height } = setupCanvas(canvas);
  const colors = {
    grid: cssVar("--border"),
    muted: cssVar("--muted"),
    bar: cssVar("--surface-raised"),
    barEdge: cssVar("--muted"),
    current: cssVar("--accent")
  };

  const recent = history.slice(-10);
  const area = { left: 44, right: width - 16, top: 22, bottom: height - 34 };
  const maxWpm = niceMax(Math.max(...recent.map((h) => h.wpm), 1));
  drawGrid(ctx, area, maxWpm, colors);

  const slot = (area.right - area.left) / Math.max(recent.length, 1);
  const barWidth = Math.min(44, slot * 0.6);

  recent.forEach((entry, i) => {
    const isCurrent = i === recent.length - 1;
    const barHeight = (area.bottom - area.top) * (entry.wpm / maxWpm);
    const bx = area.left + slot * i + (slot - barWidth) / 2;
    const by = area.bottom - barHeight;

    ctx.fillStyle = isCurrent ? colors.current : colors.bar;
    ctx.fillRect(bx, by, barWidth, barHeight);
    if (!isCurrent) {
      ctx.strokeStyle = colors.barEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, barWidth - 1, Math.max(barHeight - 1, 0));
    }

    ctx.fillStyle = isCurrent ? colors.current : colors.muted;
    ctx.font = (isCurrent ? "bold " : "") + "12px Segoe UI, Roboto, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(String(entry.wpm), bx + barWidth / 2, by - 4);

    ctx.fillStyle = colors.muted;
    ctx.font = "12px Segoe UI, Roboto, Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(isCurrent ? "Now" : "#" + (i + 1), bx + barWidth / 2, area.bottom + 8);
  });
}

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

function describeSpeedChart(result) {
  const samples = result.samples;
  if (!samples.length) return `Finished at ${result.wpm} words per minute.`;
  const peak = samples.reduce((a, b) => (b.wpm > a.wpm ? b : a));
  return `Words per minute over ${samples[samples.length - 1].second} seconds. `
    + `Peak ${peak.wpm} at ${peak.second} seconds, finished at ${result.wpm}. ${result.errors} errors.`;
}

function renderSummary(result) {
  const info = MODE_PAGES[result.mode] || MODE_PAGES.normal;
  const when = new Date(result.date).toLocaleString();
  const limit = result.timeLimit ? ` · ${result.timeLimit}s test` : "";

  document.getElementById("result-meta").textContent = `${info.label}${limit} · ${when}`;
  document.getElementById("sum-wpm").textContent = result.wpm;
  document.getElementById("sum-accuracy").textContent = result.accuracy + "%";
  document.getElementById("sum-errors").textContent = result.errors;
  document.getElementById("sum-chars").textContent = `${result.correctChars}/${result.typedChars}`;
  document.getElementById("sum-time").textContent = result.duration + "s";
  document.getElementById("sum-best").textContent = result.best != null ? result.best : "–";
  document.getElementById("new-best-badge").hidden = !result.isBest;

  const tryAgain = document.getElementById("try-again-link");
  tryAgain.href = info.page;
  tryAgain.textContent = `Try ${info.label} Again`;
}

function init() {
  const result = readJson(LAST_RESULT_KEY, null);
  const emptyState = document.getElementById("empty-state");
  const view = document.getElementById("results-view");

  if (!result) {
    emptyState.hidden = false;
    return;
  }

  view.hidden = false;
  renderSummary(result);

  const speedCanvas = document.getElementById("speed-chart");
  const historyCanvas = document.getElementById("history-chart");
  speedCanvas.setAttribute("aria-label", describeSpeedChart(result));

  const draw = () => {
    const history = readJson(HISTORY_KEY, []);
    drawSpeedChart(speedCanvas, result);
    drawHistoryChart(historyCanvas, history.length ? history : [result]);
    const recent = (history.length ? history : [result]).slice(-10).map((h) => h.wpm);
    historyCanvas.setAttribute("aria-label", "Words per minute in recent tests, oldest first: " + recent.join(", "));
  };

  draw();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 120);
  });

  document.getElementById("clear-history-btn").addEventListener("click", () => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([
        { date: result.date, mode: result.mode, wpm: result.wpm, accuracy: result.accuracy }
      ]));
    } catch (err) {
      /* ignore */
    }
    draw();
  });
}

init();
