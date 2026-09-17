"use strict";

/* ---------------------------------------------------------------------- */
/* Text data                                                               */
/* ---------------------------------------------------------------------- */

const EASY_WORDS = [
  "cat","dog","run","jump","play","book","tree","blue","fast","slow",
  "sun","moon","star","fish","bird","desk","lamp","door","wall","road",
  "milk","cake","rain","snow","wind","fire","ring","song","game","team",
  "hand","foot","hair","face","gate","farm","barn","cow","hen","boat",
  "red","green","gold","pink","gray","big","small","tall","short","new",
  "old","good","kind","calm","warm","cool","soft","hard","loud","quiet",
  "walk","talk","sing","cook","bake","swim","read","write","draw","paint",
  "time","day","week","year","home","town","city","park","lake","hill"
];

const PARAGRAPHS = [
  "The best way to get faster at typing is to slow down first. Accuracy comes before speed, because every mistake costs more time to fix than it would have taken to type the word correctly. Start by keeping your fingers on the home row and looking only at the screen. Speed arrives on its own once your hands stop guessing where the keys are.",
  "Morning light moved slowly across the kitchen table while the kettle warmed on the stove. There was no rush to anything, and for once the day felt wide open. A neighbour walked past the window with a dog that stopped at every fence post. Small ordinary mornings like this one are easy to forget, though they are often the ones worth keeping.",
  "Libraries have a particular kind of quiet. It is not the silence of an empty room but the hush of many people thinking at once. Pages turn, chairs shift, and somewhere a pencil taps against a notebook. Walking between the shelves you pass a hundred subjects you will never study, and somehow that feels less like a loss than an invitation.",
  "Good software is mostly about deleting things. The first version of any program is full of ideas that seemed clever at the time, and the work of improving it is largely the work of removing them. What remains should read plainly enough that someone else can change it a year later without asking you what you meant.",
  "The train followed the coast for almost an hour. Fields gave way to grey water, then to a long stretch of beach where nobody was walking. Passengers dozed with their bags on their knees while the light flickered between the carriages. Travelling slowly like this makes a country feel larger than any map suggests it could be.",
  "Learning anything new follows a familiar shape. At first everything is difficult and nothing makes sense, then one day the pieces fit together without you noticing when it happened. The trick is to keep going through the long middle part, where progress is real but too slow to feel. Patience is a skill like any other, and it can be practised.",
  "Walking through the dense forest, the sound of the city fades away entirely. Only the rustling of leaves and the occasional call of a bird break the silence. There is a profound sense of peace that comes from being surrounded by towering trees that have stood for centuries. Nature has a way of putting our daily worries into perspective, reminding us of the larger world we inhabit.",
  "Cooking a meal from scratch requires a certain level of patience and focus. Measuring ingredients, chopping vegetables, and watching a pot simmer are small, deliberate actions that demand your full attention. The kitchen becomes a sanctuary where the chaos of the day is temporarily forgotten. In the end, the reward is not just a delicious dish, but the satisfaction of having created something with your own two hands.",
  "Music has the extraordinary ability to transport us to different times and places. A single melody can evoke memories we thought we had forgotten, bringing back feelings with vivid intensity. Whether it is a classical symphony or an upbeat pop song, rhythms and harmonies resonate with our emotions on a profound level. Listening closely allows us to experience the world through the artist's unique perspective."
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
/* Mode configuration                                                     */
/* ---------------------------------------------------------------------- */

/* Each page sets its own mode through <body data-mode="...">. */
const MODES = {
  easy: { timed: true, countDirection: "down" },
  normal: { timed: true, countDirection: "down" },
  quotes: { timed: false, countDirection: "up" },
  custom: { timed: false, countDirection: "up" }
};

const TIME_LIMIT_KEY = "typingTester.timeLimit";
const CUSTOM_TEXT_KEY = "typingTester.customText";
const HIGH_SCORE_KEY = "typingTester.highScores";
const LAST_RESULT_KEY = "typingTester.lastResult";
const HISTORY_KEY = "typingTester.history";
const HISTORY_LIMIT = 20;

/* ---------------------------------------------------------------------- */
/* Practice UI markup (shared by every page)                              */
/* ---------------------------------------------------------------------- */

const PRACTICE_TEMPLATE = `
  <div class="panel-controls">
    <div class="time-select" id="time-select" role="group" aria-label="Select time limit">
      <button class="time-btn" data-time="15" aria-pressed="false">15s</button>
      <button class="time-btn" data-time="30" aria-pressed="false">30s</button>
      <button class="time-btn" data-time="60" aria-pressed="false">60s</button>
      <button class="time-btn" data-time="120" aria-pressed="false">120s</button>
    </div>
    <div class="control-actions">
      <button id="countdown-btn" title="Start with a 3-2-1 countdown">3&#8239;&middot;&#8239;2&#8239;&middot;&#8239;1 Start</button>
      <button id="restart-btn" title="Load a new round">&#8635; New Round</button>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="stat-value" id="time-left">0</span>
      <span class="stat-label" id="time-label">Seconds Left</span>
    </div>
    <div class="stat">
      <span class="stat-value" id="wpm">0</span>
      <span class="stat-label">WPM</span>
    </div>
    <div class="stat">
      <span class="stat-value" id="accuracy">100%</span>
      <span class="stat-label">Accuracy</span>
    </div>
    <div class="stat">
      <span class="stat-value" id="errors">0</span>
      <span class="stat-label">Errors</span>
    </div>
    <div class="stat">
      <span class="stat-value" id="best-wpm">&ndash;</span>
      <span class="stat-label">Best WPM</span>
    </div>
  </div>

  <div id="sr-status" class="sr-only" role="status" aria-live="polite"></div>

  <div class="typing-area">
    <div class="text-wrapper" id="text-wrapper">
      <p id="text-display" aria-hidden="true"></p>
      <p id="quote-author" class="quote-author" hidden></p>
      <label class="sr-only" for="text-input">Typing input. Type the text shown above as accurately as you can.</label>
      <textarea id="text-input" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="sr-status"></textarea>

      <div class="countdown-overlay" id="countdown-overlay" hidden aria-hidden="true">
        <span id="countdown-number">3</span>
      </div>
    </div>

    <p class="typing-hint">
      <span class="type-note">The timer starts with your first keystroke. Press <kbd>Esc</kbd> to restart.</span>
      <span class="focus-note">Click the text above to focus it, then start typing.</span>
    </p>
  </div>
`;

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */

const GameState = { IDLE: "idle", COUNTDOWN: "countdown", RUNNING: "running", FINISHED: "finished" };

const state = {
  mode: "normal",
  timeLimit: 30,
  gameState: GameState.IDLE,
  targetText: "",
  countDirection: "down",
  quoteAuthor: null,
  timeLeft: 30,
  elapsed: 0,
  startTimestamp: null,
  timerId: null,
  countdownId: null,
  charStatus: [],
  cumulativeCorrect: 0,
  cumulativeIncorrect: 0,
  samples: []
};

let previousInputValue = "";
const dom = {};

/* ---------------------------------------------------------------------- */
/* Storage                                                                 */
/* ---------------------------------------------------------------------- */

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    /* storage unavailable (private mode, quota) - fail silently */
  }
}

function loadHighScores() {
  try {
    return JSON.parse(readStored(HIGH_SCORE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function getHighScore(mode) {
  return loadHighScores()[mode] || null;
}

function saveHighScoreIfBetter(mode, result) {
  const scores = loadHighScores();
  const existing = scores[mode];
  if (existing && result.wpm <= existing.wpm) return false;
  scores[mode] = result;
  writeStored(HIGH_SCORE_KEY, JSON.stringify(scores));
  return true;
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

function wordTargetFor(seconds) {
  return Math.round(seconds * 2.2) + 12;
}

function trimToWords(text, wordCount) {
  const words = text.split(/\s+/);
  return words.length <= wordCount ? text : words.slice(0, wordCount).join(" ");
}

function generateEasyText(wordCount) {
  const words = [];
  for (let i = 0; i < wordCount; i++) words.push(pickRandom(EASY_WORDS));
  return words.join(" ");
}

function generateParagraph(wordCount) {
  let text = pickRandom(PARAGRAPHS);
  while (text.split(/\s+/).length < wordCount) {
    text += " " + pickRandom(PARAGRAPHS);
  }
  return trimToWords(text, wordCount);
}

function buildRoundText() {
  if (state.mode === "easy") {
    return { text: generateEasyText(wordTargetFor(state.timeLimit)), author: null };
  }
  if (state.mode === "normal") {
    return { text: generateParagraph(wordTargetFor(state.timeLimit)), author: null };
  }
  if (state.mode === "quotes") {
    const quote = pickRandom(QUOTES);
    return { text: quote.text, author: quote.author };
  }
  const stored = (readStored(CUSTOM_TEXT_KEY) || "").trim().replace(/\s+/g, " ");
  return {
    text: stored || "Add your own text in the box above, then press Use This Text to start practising it.",
    author: null
  };
}

/* ---------------------------------------------------------------------- */
/* Rendering                                                               */
/* ---------------------------------------------------------------------- */

function renderTargetText() {
  const fragment = document.createDocumentFragment();
  for (const char of state.targetText) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char;
    fragment.appendChild(span);
  }
  dom.textDisplay.innerHTML = "";
  dom.textDisplay.appendChild(fragment);
  dom.textDisplay.scrollTop = 0;

  const first = dom.textDisplay.firstElementChild;
  if (first) first.classList.add("current");

  if (state.quoteAuthor) {
    dom.quoteAuthorEl.textContent = "— " + state.quoteAuthor;
    dom.quoteAuthorEl.hidden = false;
  } else {
    dom.quoteAuthorEl.hidden = true;
  }
}

function keepCurrentCharVisible(index) {
  const el = dom.textDisplay.children[index];
  if (!el) return;
  const lineHeight = el.offsetHeight || 24;
  const top = el.offsetTop;
  const view = dom.textDisplay;
  if (top < view.scrollTop) {
    view.scrollTop = Math.max(0, top - lineHeight);
  } else if (top + lineHeight > view.scrollTop + view.clientHeight) {
    view.scrollTop = top + lineHeight - view.clientHeight;
  }
}

function renderCharacterDiff(typed) {
  const chars = dom.textDisplay.children;
  const charStatus = new Array(typed.length);

  for (let i = 0; i < chars.length; i++) {
    const span = chars[i];
    span.classList.remove("correct", "incorrect", "current");
    const typedChar = typed[i];
    if (typedChar == null) continue;
    if (typedChar === span.textContent) {
      span.classList.add("correct");
      charStatus[i] = "correct";
    } else {
      span.classList.add("incorrect");
      charStatus[i] = "incorrect";
    }
  }

  if (chars[typed.length]) {
    chars[typed.length].classList.add("current");
    keepCurrentCharVisible(typed.length);
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

/* Wall-clock elapsed time, so WPM stays accurate when a round ends
   between timer ticks (e.g. finishing a short quote early). */
function elapsedSeconds() {
  return state.startTimestamp ? (Date.now() - state.startTimestamp) / 1000 : 0;
}

function computeLiveStats() {
  const netCorrect = state.charStatus.filter((s) => s === "correct").length;
  const elapsedMinutes = Math.max(elapsedSeconds(), 1) / 60;
  const wpm = Math.max(0, Math.round((netCorrect / 5) / elapsedMinutes));

  const totalKeystrokes = state.cumulativeCorrect + state.cumulativeIncorrect;
  const accuracy = totalKeystrokes === 0
    ? 100
    : Math.round((state.cumulativeCorrect / totalKeystrokes) * 100);

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
/* Round lifecycle                                                        */
/* ---------------------------------------------------------------------- */

function prepareRound() {
  clearInterval(state.timerId);
  clearInterval(state.countdownId);
  state.timerId = null;
  state.countdownId = null;
  state.gameState = GameState.IDLE;
  state.elapsed = 0;
  state.startTimestamp = null;
  state.timeLeft = state.timeLimit;
  state.cumulativeCorrect = 0;
  state.cumulativeIncorrect = 0;
  state.charStatus = [];
  state.samples = [];

  const round = buildRoundText();
  state.targetText = round.text;
  state.quoteAuthor = round.author;

  previousInputValue = "";
  dom.textInput.value = "";
  dom.textWrapper.classList.remove("disabled");
  dom.countdownOverlay.hidden = true;

  renderTargetText();
  updateTimeDisplay();
  dom.wpmEl.textContent = "0";
  dom.accuracyEl.textContent = "100%";
  dom.errorsEl.textContent = "0";
  updateBestScoreUI();
  announceStatus("Ready. " + (MODES[state.mode].timed
    ? state.timeLimit + " second test. Start typing to begin."
    : "Type the whole passage to finish."));
}

function beginRun() {
  if (state.gameState === GameState.RUNNING) return;
  state.gameState = GameState.RUNNING;
  state.startTimestamp = Date.now();

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
    recordSample();
    const { wpm, accuracy } = computeLiveStats();
    const clock = state.countDirection === "down"
      ? state.timeLeft + " seconds left"
      : state.elapsed + " seconds elapsed";
    announceStatus(`${clock}. ${wpm} words per minute. ${accuracy}% accuracy.`);
  }, 1000);
}

function runCountdown() {
  if (state.gameState === GameState.RUNNING || state.gameState === GameState.COUNTDOWN) return;
  prepareRound();
  state.gameState = GameState.COUNTDOWN;
  dom.countdownOverlay.hidden = false;

  let count = 3;
  dom.countdownNumber.textContent = String(count);
  state.countdownId = setInterval(() => {
    count--;
    if (count > 0) {
      dom.countdownNumber.textContent = String(count);
      return;
    }
    clearInterval(state.countdownId);
    state.countdownId = null;
    dom.countdownOverlay.hidden = true;
    state.gameState = GameState.IDLE;
    dom.textInput.focus();
  }, 700);
}

function recordSample() {
  const second = Math.round(elapsedSeconds());
  const last = state.samples[state.samples.length - 1];
  if (second < 1 || (last && last.second === second)) return;
  const { wpm, errors } = computeLiveStats();
  state.samples.push({ second, wpm, errors });
}

function saveRoundResult(result) {
  writeStored(LAST_RESULT_KEY, JSON.stringify(result));
  let history = [];
  try {
    history = JSON.parse(readStored(HISTORY_KEY)) || [];
  } catch (err) {
    history = [];
  }
  history.push({ date: result.date, mode: result.mode, wpm: result.wpm, accuracy: result.accuracy });
  writeStored(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_LIMIT)));
}

function endRound() {
  state.gameState = GameState.FINISHED;
  clearInterval(state.timerId);
  state.timerId = null;
  dom.textWrapper.classList.add("disabled");
  dom.textInput.blur();

  recordSample();
  const { wpm, accuracy, errors } = computeLiveStats();
  const duration = Math.round(elapsedSeconds() * 10) / 10;
  /* Very short rounds (a one-word custom text, say) can't produce a
     meaningful rate, so they never claim the high score. */
  const scoreCounts = elapsedSeconds() >= 2 && state.charStatus.length >= 10;
  const date = new Date().toISOString();
  const isBest = scoreCounts && saveHighScoreIfBetter(state.mode, { wpm, accuracy, date });
  const best = getHighScore(state.mode);

  saveRoundResult({
    date,
    mode: state.mode,
    timeLimit: MODES[state.mode].timed ? state.timeLimit : null,
    wpm,
    accuracy,
    errors,
    correctChars: state.charStatus.filter((s) => s === "correct").length,
    typedChars: state.charStatus.length,
    duration,
    isBest,
    best: best ? best.wpm : null,
    samples: state.samples
  });

  announceStatus(`Test finished. ${wpm} words per minute, ${accuracy}% accuracy. Opening your results.`);
  window.location.href = "results.html";
}

/* ---------------------------------------------------------------------- */
/* Event handlers                                                         */
/* ---------------------------------------------------------------------- */

function handleTextInput() {
  if (state.gameState === GameState.FINISHED || state.gameState === GameState.COUNTDOWN) return;

  const newValue = dom.textInput.value;

  if (state.gameState === GameState.IDLE && newValue.length > 0) beginRun();

  recordKeystrokes(previousInputValue, newValue);
  previousInputValue = newValue;

  if (newValue.length >= state.targetText.length) {
    dom.textInput.value = newValue.slice(0, state.targetText.length);
    renderCharacterDiff(dom.textInput.value);
    updateLiveStatsUI();
    endRound();
    return;
  }

  renderCharacterDiff(newValue);
  updateLiveStatsUI();
}

function setTimeLimit(seconds) {
  state.timeLimit = seconds;
  writeStored(TIME_LIMIT_KEY, String(seconds));
  dom.timeButtons.forEach((btn) => {
    const active = Number(btn.dataset.time) === seconds;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  prepareRound();
}

function initCustomTextPanel() {
  const input = document.getElementById("custom-text-input");
  const loadBtn = document.getElementById("load-custom-btn");
  const hint = document.getElementById("custom-hint");
  if (!input || !loadBtn) return;

  const stored = readStored(CUSTOM_TEXT_KEY);
  if (stored) input.value = stored;

  loadBtn.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) {
      hint.textContent = "Please enter some text first.";
      return;
    }
    writeStored(CUSTOM_TEXT_KEY, value);
    hint.textContent = "Custom text loaded. Click the text below and start typing.";
    prepareRound();
    dom.textInput.focus();
  });
}

function initEventListeners() {
  dom.timeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setTimeLimit(Number(btn.dataset.time)));
  });

  dom.textInput.addEventListener("input", handleTextInput);
  dom.textInput.addEventListener("paste", (event) => event.preventDefault());

  dom.textWrapper.addEventListener("click", () => {
    if (state.gameState !== GameState.FINISHED) dom.textInput.focus();
  });

  dom.countdownBtn.addEventListener("click", runCountdown);
  dom.restartBtn.addEventListener("click", () => {
    prepareRound();
    dom.textInput.focus();
  });

  const resetBtn = document.getElementById("reset-scores-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetHighScores();
      updateBestScoreUI();
      announceStatus("High scores have been reset.");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    prepareRound();
    dom.textInput.focus();
  });
}

/* ---------------------------------------------------------------------- */
/* Init                                                                    */
/* ---------------------------------------------------------------------- */

function cacheDom() {
  dom.timeSelect = document.getElementById("time-select");
  dom.timeButtons = Array.from(document.querySelectorAll(".time-btn"));
  dom.timeLabel = document.getElementById("time-label");
  dom.countdownBtn = document.getElementById("countdown-btn");
  dom.restartBtn = document.getElementById("restart-btn");

  dom.timeLeftEl = document.getElementById("time-left");
  dom.wpmEl = document.getElementById("wpm");
  dom.accuracyEl = document.getElementById("accuracy");
  dom.errorsEl = document.getElementById("errors");
  dom.bestWpmEl = document.getElementById("best-wpm");
  dom.srStatus = document.getElementById("sr-status");

  dom.textWrapper = document.getElementById("text-wrapper");
  dom.textDisplay = document.getElementById("text-display");
  dom.quoteAuthorEl = document.getElementById("quote-author");
  dom.textInput = document.getElementById("text-input");
  dom.countdownOverlay = document.getElementById("countdown-overlay");
  dom.countdownNumber = document.getElementById("countdown-number");
}

function init() {
  const root = document.getElementById("practice-root");
  if (!root) return;

  state.mode = document.body.dataset.mode || "normal";
  const config = MODES[state.mode] || MODES.normal;
  state.countDirection = config.countDirection;

  const storedLimit = Number(readStored(TIME_LIMIT_KEY));
  if ([15, 30, 60, 120].includes(storedLimit)) state.timeLimit = storedLimit;

  root.innerHTML = PRACTICE_TEMPLATE;
  cacheDom();

  dom.timeSelect.hidden = !config.timed;
  dom.timeButtons.forEach((btn) => {
    const active = Number(btn.dataset.time) === state.timeLimit;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  initCustomTextPanel();
  initEventListeners();
  prepareRound();
  dom.textInput.focus();
}

init();
