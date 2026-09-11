"use strict";

/* ---------------------------------------------------------------------- */
/* Text data                                                               */
/* ---------------------------------------------------------------------- */

const EASY_WORDS = [
  "cat","dog","run","jump","play","book","tree","blue","fast","slow",
  "sun","moon","star","fish","bird","desk","lamp","door","wall","road",
  "milk","cake","rain","snow","wind","fire","ring","song","game","team",
  "hand","foot","hair","face","door","gate","farm","barn","cow","hen",
  "red","green","gold","pink","gray","big","small","tall","short","new",
  "old","good","kind","calm","warm","cool","soft","hard","loud","quiet",
  "walk","talk","sing","cook","bake","swim","read","write","draw","paint",
  "time","day","week","year","home","town","city","park","lake","hill"
];

const SENTENCE_BANK = [
  "The quick brown fox jumps over the lazy dog.",
  "A journey of a thousand miles begins with a single step.",
  "Practice makes perfect when you keep trying every day.",
  "Technology continues to change the way we live and work.",
  "She sells seashells by the seashore every summer morning.",
  "The early bird catches the worm before sunrise.",
  "Reading a good book can transport you to another world.",
  "Consistency and patience are the keys to mastering any skill.",
  "The weather today is calm with a gentle breeze from the north.",
  "Good coffee and quiet mornings make for a great start to the day.",
  "Learning to type quickly takes regular and focused practice.",
  "Curiosity is the engine of achievement in every field of study.",
  "The mountains stood silent under a blanket of fresh snow.",
  "A well written sentence can carry a surprising amount of meaning.",
  "Small daily habits often lead to the biggest long term changes.",
  "The old library smelled of dust and quiet adventure.",
  "Clear thinking usually leads to clear and simple writing.",
  "Every expert was once a beginner who refused to give up."
];

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Life is what happens when you are busy making other plans.", author: "John Lennon" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Do not wait for the perfect moment, take the moment and make it perfect.", author: "Unknown" }
];

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */

const GameState = { IDLE: "idle", COUNTDOWN: "countdown", RUNNING: "running", FINISHED: "finished" };

const state = {
  mode: "easy",
  timeLimit: 15,
  gameState: GameState.IDLE,
  targetText: "",
  endless: true,
  countDirection: "down",
  quoteAuthor: null,
  customText: "",
  timeLeft: 15,
  elapsed: 0,
  timerId: null,
  countdownId: null,
  charStatus: [],
  cumulativeCorrect: 0,
  cumulativeIncorrect: 0
};

/* ---------------------------------------------------------------------- */
/* DOM references                                                         */
/* ---------------------------------------------------------------------- */

const dom = {
  modeButtons: document.querySelectorAll(".mode-btn"),
  timeSelect: document.getElementById("time-select"),
  timeButtons: document.querySelectorAll(".time-btn"),
  timeLabel: document.getElementById("time-label"),
  restartBtn: document.getElementById("restart-btn"),

  customPanel: document.getElementById("custom-panel"),
  customTextInput: document.getElementById("custom-text-input"),
  loadCustomBtn: document.getElementById("load-custom-btn"),
  customHint: document.getElementById("custom-hint"),

  timeLeftEl: document.getElementById("time-left"),
  wpmEl: document.getElementById("wpm"),
  accuracyEl: document.getElementById("accuracy"),
  errorsEl: document.getElementById("errors"),
  bestWpmEl: document.getElementById("best-wpm"),
  srStatus: document.getElementById("sr-status"),

  textWrapper: document.getElementById("text-wrapper"),
  textDisplay: document.getElementById("text-display"),
  quoteAuthorEl: document.getElementById("quote-author"),
  textInput: document.getElementById("text-input"),

  idleOverlay: document.getElementById("idle-overlay"),
  startBtn: document.getElementById("start-btn"),
  countdownOverlay: document.getElementById("countdown-overlay"),
  countdownNumber: document.getElementById("countdown-number"),

  resultEl: document.getElementById("result"),
  newBestBadge: document.getElementById("new-best-badge"),
  resultWpmEl: document.getElementById("result-wpm"),
  resultAccuracyEl: document.getElementById("result-accuracy"),
  resultErrorsEl: document.getElementById("result-errors"),
  resultBestEl: document.getElementById("result-best"),
  tryAgainBtn: document.getElementById("try-again-btn"),

  resetScoresBtn: document.getElementById("reset-scores-btn")
};

/* ---------------------------------------------------------------------- */
/* High score storage                                                     */
/* ---------------------------------------------------------------------- */

const HIGH_SCORE_KEY = "typingTester.highScores";

function loadHighScores() {
  try {
    return JSON.parse(localStorage.getItem(HIGH_SCORE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function getHighScore(mode) {
  const scores = loadHighScores();
  return scores[mode] || null;
}

function saveHighScoreIfBetter(mode, result) {
  const scores = loadHighScores();
  const existing = scores[mode];
  if (!existing || result.wpm > existing.wpm) {
    scores[mode] = result;
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
    } catch (err) {
      /* storage unavailable (private mode, quota) - fail silently */
    }
    return true;
  }
  return false;
}

function resetHighScores() {
  try {
    localStorage.removeItem(HIGH_SCORE_KEY);
  } catch (err) {
    /* ignore */
  }
}

/* ---------------------------------------------------------------------- */
/* Text generation                                                        */
/* ---------------------------------------------------------------------- */

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateEasyChunk(wordCount) {
  const words = [];
  for (let i = 0; i < wordCount; i++) words.push(pickRandom(EASY_WORDS));
  return words.join(" ");
}

function generateNormalChunk(minWords) {
  const parts = [];
  let wordCount = 0;
  while (wordCount < minWords) {
    const sentence = pickRandom(SENTENCE_BANK);
    parts.push(sentence);
    wordCount += sentence.split(" ").length;
  }
  return parts.join(" ");
}

function buildTargetForMode(mode) {
  if (mode === "easy") {
    return { text: generateEasyChunk(60), endless: true, countDirection: "down", author: null };
  }
  if (mode === "normal") {
    return { text: generateNormalChunk(45), endless: true, countDirection: "down", author: null };
  }
  if (mode === "quotes") {
    const quote = pickRandom(QUOTES);
    return { text: quote.text, endless: false, countDirection: "up", author: quote.author };
  }
  if (mode === "custom") {
    const text = state.customText.trim().replace(/\s+/g, " ");
    return { text: text || "Enter some custom text above and click “Use This Text” to begin.", endless: false, countDirection: "up", author: null };
  }
  return { text: generateEasyChunk(60), endless: true, countDirection: "down", author: null };
}

function extendEndlessText() {
  const extra = state.mode === "normal" ? generateNormalChunk(20) : generateEasyChunk(20);
  state.targetText += " " + extra;
}

/* ---------------------------------------------------------------------- */
/* Rendering                                                               */
/* ---------------------------------------------------------------------- */

function renderTargetText() {
  dom.textDisplay.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const char of state.targetText) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char;
    fragment.appendChild(span);
  }
  dom.textDisplay.appendChild(fragment);
  const first = dom.textDisplay.querySelector(".char");
  if (first) first.classList.add("current");

  if (state.quoteAuthor) {
    dom.quoteAuthorEl.textContent = "— " + state.quoteAuthor;
    dom.quoteAuthorEl.hidden = false;
  } else {
    dom.quoteAuthorEl.hidden = true;
  }
}

function renderCharacterDiff(typed) {
  const chars = dom.textDisplay.querySelectorAll(".char");
  const charStatus = new Array(typed.length);

  chars.forEach((span, i) => {
    span.classList.remove("correct", "incorrect", "current");
    const typedChar = typed[i];
    if (typedChar == null) return;
    if (typedChar === span.textContent) {
      span.classList.add("correct");
      charStatus[i] = "correct";
    } else {
      span.classList.add("incorrect");
      charStatus[i] = "incorrect";
    }
  });

  if (chars[typed.length]) {
    chars[typed.length].classList.add("current");
  }

  state.charStatus = charStatus;
}

function updateTimeDisplay() {
  if (state.countDirection === "down") {
    dom.timeLeftEl.textContent = state.timeLeft;
    dom.timeLabel.textContent = "Seconds Left";
  } else {
    dom.timeLeftEl.textContent = state.elapsed;
    dom.timeLabel.textContent = "Seconds Elapsed";
  }
}

function computeLiveStats() {
  const netCorrect = state.charStatus.filter((s) => s === "correct").length;
  const elapsedSeconds = state.countDirection === "down"
    ? (state.timeLimit - state.timeLeft)
    : state.elapsed;
  const elapsedMinutes = Math.max(elapsedSeconds, 1) / 60;
  const wpm = Math.max(0, Math.round((netCorrect / 5) / elapsedMinutes));

  const totalKeystrokes = state.cumulativeCorrect + state.cumulativeIncorrect;
  const accuracy = totalKeystrokes === 0 ? 100 : Math.round((state.cumulativeCorrect / totalKeystrokes) * 100);

  return { wpm, accuracy, errors: state.cumulativeIncorrect };
}

function updateLiveStatsUI() {
  const { wpm, accuracy, errors } = computeLiveStats();
  dom.wpmEl.textContent = wpm;
  dom.accuracyEl.textContent = accuracy + "%";
  dom.errorsEl.textContent = errors;
  updateTimeDisplay();
}

function updateBestScoreUI() {
  const best = getHighScore(state.mode);
  dom.bestWpmEl.textContent = best ? best.wpm : "–";
}

function announceStatus(message) {
  dom.srStatus.textContent = message;
}

/* ---------------------------------------------------------------------- */
/* Scoring                                                                 */
/* ---------------------------------------------------------------------- */

function recordKeystrokes(oldValue, newValue) {
  const maxLen = Math.max(oldValue.length, newValue.length);
  for (let i = 0; i < maxLen; i++) {
    const oldChar = oldValue[i];
    const newChar = newValue[i];
    if (newChar === undefined) continue;
    if (oldChar === newChar) continue;
    if (newChar === state.targetText[i]) {
      state.cumulativeCorrect++;
    } else {
      state.cumulativeIncorrect++;
    }
  }
}

/* ---------------------------------------------------------------------- */
/* Game state machine                                                     */
/* ---------------------------------------------------------------------- */

let previousInputValue = "";

function prepareRound() {
  clearInterval(state.timerId);
  clearInterval(state.countdownId);
  state.timerId = null;
  state.countdownId = null;
  state.gameState = GameState.IDLE;
  state.elapsed = 0;
  state.cumulativeCorrect = 0;
  state.cumulativeIncorrect = 0;
  state.charStatus = [];

  const built = buildTargetForMode(state.mode);
  state.targetText = built.text;
  state.endless = built.endless;
  state.countDirection = built.countDirection;
  state.quoteAuthor = built.author;
  state.timeLeft = state.timeLimit;

  previousInputValue = "";
  dom.textInput.value = "";
  dom.textInput.disabled = false;
  dom.textWrapper.classList.remove("disabled");
  dom.resultEl.hidden = true;
  dom.idleOverlay.hidden = false;
  dom.countdownOverlay.hidden = true;

  dom.timeSelect.hidden = state.mode === "quotes" || state.mode === "custom";

  renderTargetText();
  updateTimeDisplay();
  dom.wpmEl.textContent = "0";
  dom.accuracyEl.textContent = "100%";
  dom.errorsEl.textContent = "0";
  updateBestScoreUI();
  announceStatus("Ready. " + (state.endless ? state.timeLimit + " second test." : "Type the full passage to finish."));
}

function beginRun() {
  if (state.gameState === GameState.RUNNING) return;
  state.gameState = GameState.RUNNING;
  dom.idleOverlay.hidden = true;

  state.timerId = setInterval(() => {
    if (state.countDirection === "down") {
      state.timeLeft--;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateLiveStatsUI();
        endRound();
        return;
      }
    } else {
      state.elapsed++;
    }
    updateLiveStatsUI();
    const { wpm, accuracy } = computeLiveStats();
    announceStatus(`${state.countDirection === "down" ? state.timeLeft + " seconds left" : state.elapsed + " seconds elapsed"}. ${wpm} words per minute. ${accuracy}% accuracy.`);
  }, 1000);
}

function runCountdownThenReady() {
  if (state.gameState !== GameState.IDLE) return;
  state.gameState = GameState.COUNTDOWN;
  dom.idleOverlay.hidden = true;
  dom.countdownOverlay.hidden = false;

  let count = 3;
  dom.countdownNumber.textContent = String(count);
  state.countdownId = setInterval(() => {
    count--;
    if (count > 0) {
      dom.countdownNumber.textContent = String(count);
    } else {
      clearInterval(state.countdownId);
      state.countdownId = null;
      dom.countdownOverlay.hidden = true;
      state.gameState = GameState.IDLE;
      dom.textInput.focus();
    }
  }, 700);
}

function endRound() {
  state.gameState = GameState.FINISHED;
  clearInterval(state.timerId);
  state.timerId = null;
  dom.textWrapper.classList.add("disabled");
  dom.textInput.blur();

  const { wpm, accuracy, errors } = computeLiveStats();
  const isBest = saveHighScoreIfBetter(state.mode, { wpm, accuracy, date: new Date().toISOString() });
  const best = getHighScore(state.mode);

  dom.resultWpmEl.textContent = wpm;
  dom.resultAccuracyEl.textContent = accuracy + "%";
  dom.resultErrorsEl.textContent = errors;
  dom.resultBestEl.textContent = best ? best.wpm : wpm;
  dom.newBestBadge.hidden = !isBest;
  dom.resultEl.hidden = false;
  updateBestScoreUI();

  announceStatus(`Test finished. ${wpm} words per minute, ${accuracy}% accuracy, ${errors} errors.` + (isBest ? " New best score!" : ""));
}

/* ---------------------------------------------------------------------- */
/* Event handlers                                                         */
/* ---------------------------------------------------------------------- */

function handleTextInput() {
  if (state.gameState === GameState.FINISHED) return;
  if (state.gameState === GameState.COUNTDOWN) return;

  const newValue = dom.textInput.value;

  if (state.gameState === GameState.IDLE && newValue.length > 0) {
    beginRun();
  }

  recordKeystrokes(previousInputValue, newValue);
  previousInputValue = newValue;

  if (state.endless && newValue.length >= state.targetText.length - 15) {
    extendEndlessText();
    renderTargetText();
  }

  if (!state.endless && newValue.length >= state.targetText.length) {
    dom.textInput.value = newValue.slice(0, state.targetText.length);
    renderCharacterDiff(dom.textInput.value);
    updateLiveStatsUI();
    endRound();
    return;
  }

  renderCharacterDiff(newValue);
  updateLiveStatsUI();
}

function setMode(mode) {
  state.mode = mode;
  dom.modeButtons.forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  dom.customPanel.hidden = mode !== "custom";
  prepareRound();
}

function setTimeLimit(time) {
  state.timeLimit = time;
  dom.timeButtons.forEach((btn) => {
    const active = Number(btn.dataset.time) === time;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  prepareRound();
}

function initEventListeners() {
  dom.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  dom.timeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setTimeLimit(Number(btn.dataset.time)));
  });

  dom.loadCustomBtn.addEventListener("click", () => {
    const value = dom.customTextInput.value.trim();
    if (!value) {
      dom.customHint.textContent = "Please enter some text first.";
      return;
    }
    state.customText = value;
    dom.customHint.textContent = "Custom text loaded. Click into the box below and start typing.";
    prepareRound();
  });

  dom.textInput.addEventListener("input", handleTextInput);

  dom.textInput.addEventListener("paste", (event) => {
    event.preventDefault();
  });

  dom.textWrapper.addEventListener("click", () => {
    if (state.gameState !== GameState.FINISHED) dom.textInput.focus();
  });

  dom.startBtn.addEventListener("click", runCountdownThenReady);

  dom.restartBtn.addEventListener("click", prepareRound);
  dom.tryAgainBtn.addEventListener("click", prepareRound);

  dom.resetScoresBtn.addEventListener("click", () => {
    resetHighScores();
    updateBestScoreUI();
    announceStatus("High scores have been reset.");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      prepareRound();
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Init                                                                    */
/* ---------------------------------------------------------------------- */

function init() {
  initEventListeners();
  prepareRound();
}

init();
