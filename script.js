const WORDS = [
  "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are",
  "as","with","his","they","i","at","be","this","have","from","or","one","had","by",
  "word","but","not","what","all","were","we","when","your","can","said","there","use",
  "an","each","which","she","do","how","their","if","will","up","other","about","out",
  "many","then","them","these","so","some","her","would","make","like","him","into",
  "time","has","look","two","more","write","go","see","number","no","way","could",
  "people","my","than","first","water","been","call","who","oil","its","now","find",
  "long","down","day","did","get","come","made","may","part","over","new","sound",
  "take","only","little","work","know","place","year","live","me","back","give",
  "most","very","after","thing","our","just","name","good","sentence","man","think",
  "say","great","where","help","through","much","before","line","right","too","mean",
  "old","any","same","tell","boy","follow","came","want","show","also","around",
  "form","three","small","set","put","end","does","another","well","large","must",
  "big","even","such","because","turn","here","why","ask","went","men","read","need",
  "land","different","home","us","move","try","kind","hand","picture","again","change",
  "off","play","spell","air","away","animal","house","point","page","letter","mother",
  "answer","found","study","still","learn","should","world"
];

const textDisplay = document.getElementById("text-display");
const textInput = document.getElementById("text-input");
const textWrapper = document.getElementById("text-wrapper");
const timeLeftEl = document.getElementById("time-left");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const errorsEl = document.getElementById("errors");
const restartBtn = document.getElementById("restart-btn");
const tryAgainBtn = document.getElementById("try-again-btn");
const resultEl = document.getElementById("result");
const timeButtons = document.querySelectorAll(".time-btn");

const resultWpmEl = document.getElementById("result-wpm");
const resultAccuracyEl = document.getElementById("result-accuracy");
const resultErrorsEl = document.getElementById("result-errors");

let timeLimit = 15;
let timeLeft = timeLimit;
let timer = null;
let started = false;
let finished = false;
let totalTypedChars = 0;
let totalErrors = 0;
let targetText = "";

function randomWords(count) {
  const chosen = [];
  for (let i = 0; i < count; i++) {
    chosen.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return chosen.join(" ");
}

function renderText() {
  textDisplay.innerHTML = "";
  for (const char of targetText) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char;
    textDisplay.appendChild(span);
  }
  const first = textDisplay.querySelector(".char");
  if (first) first.classList.add("current");
}

function setupTest() {
  clearInterval(timer);
  timer = null;
  started = false;
  finished = false;
  timeLeft = timeLimit;
  totalTypedChars = 0;
  totalErrors = 0;
  targetText = randomWords(60);
  timeLeftEl.textContent = timeLeft;
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  errorsEl.textContent = "0";
  textWrapper.classList.remove("disabled");
  resultEl.hidden = true;
  textInput.value = "";
  renderText();
  textInput.focus();
}

function startTimer() {
  started = true;
  timer = setInterval(() => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    updateLiveStats();
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

function updateLiveStats() {
  const elapsedMinutes = (timeLimit - timeLeft) / 60 || (1 / 60);
  const correctChars = totalTypedChars - totalErrors;
  const wpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
  const accuracy = totalTypedChars === 0 ? 100 : Math.round((correctChars / totalTypedChars) * 100);
  wpmEl.textContent = wpm;
  accuracyEl.textContent = accuracy + "%";
  errorsEl.textContent = totalErrors;
}

function endTest() {
  finished = true;
  clearInterval(timer);
  textWrapper.classList.add("disabled");
  textInput.blur();
  updateLiveStats();
  resultWpmEl.textContent = wpmEl.textContent;
  resultAccuracyEl.textContent = accuracyEl.textContent;
  resultErrorsEl.textContent = totalErrors;
  resultEl.hidden = false;
}

textInput.addEventListener("input", () => {
  if (finished) return;
  if (!started) startTimer();

  const typed = textInput.value;

  if (typed.length > totalTypedChars) {
    totalTypedChars = typed.length;
  }

  if (typed.length >= targetText.length - 15) {
    targetText += " " + randomWords(30);
    renderText();
  }

  const chars = textDisplay.querySelectorAll(".char");
  let errors = 0;

  chars.forEach((span, i) => {
    const typedChar = typed[i];
    span.classList.remove("correct", "incorrect", "current");
    if (typedChar == null) {
      return;
    }
    if (typedChar === span.textContent) {
      span.classList.add("correct");
    } else {
      span.classList.add("incorrect");
      errors++;
    }
  });

  totalErrors = errors;

  if (chars[typed.length]) {
    chars[typed.length].classList.add("current");
    chars[typed.length].scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  updateLiveStats();
});

textWrapper.addEventListener("click", () => {
  if (!finished) textInput.focus();
});

timeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    timeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    timeLimit = parseInt(btn.dataset.time, 10);
    setupTest();
  });
});

restartBtn.addEventListener("click", setupTest);
tryAgainBtn.addEventListener("click", setupTest);

setupTest();
