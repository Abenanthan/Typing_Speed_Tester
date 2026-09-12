# Typing Speed Tester

A polished, dependency-free typing speed test built with vanilla HTML, CSS, and JavaScript. Practice typing, track your words-per-minute (WPM) and accuracy in real time, and beat your personal best across four typing modes.

## Overview

The app opens straight into the **Normal Text** mode, so a ready-to-type paragraph is the first thing you see. Above it sits a row of tabs — Easy Words, Normal Text, Quotes, and Custom Text — built as a proper [ARIA tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) widget (arrow keys/Home/End move between tabs, the active tab is marked with `aria-selected`). Selecting a tab swaps the whole practice panel below it — description, time limit, typing area, and stats all change together with a short fade transition, like moving to a new page.

The app renders a passage of text and lets you type it into a hidden input while a visible overlay highlights each character as correct, incorrect, or "current" as you go. Stats (WPM, accuracy, errors, and your best score) update live and are announced to screen readers via an `aria-live` status region. When the round ends, a results panel summarizes your performance and flags a new personal best.

## Setup

No build step or dependencies — just open [index.html](index.html) directly in a browser, or serve the folder with any static server, e.g.:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Features

- **Four typing modes, presented as tabs above the practice panel** (default: Normal Text, so you land on a paragraph immediately):
  - **Easy Words** — short, common words for beginners (timed, endless stream).
  - **Normal Text** — natural sentences pulled from a curated bank, not repeated single words (timed, endless stream).
  - **Quotes** — a random well-known quote; the round ends when you finish typing it.
  - **Custom Text** — paste or write your own passage to practice on.
- **Selectable time limits** of 15/30/60/120 seconds for the timed modes (hidden for Quotes/Custom, which end on completion instead).
- **Clear game states** — idle (with a start screen and optional 3-2-1 countdown), running, and finished — so it's always obvious what state the test is in.
- **Live stats**: WPM, accuracy, error count, and your best WPM for the current mode, all updating as you type.
- **Persistent high scores** saved per mode in `localStorage`, with a "New Best!" badge on the results panel and a footer control to reset scores.
- **Accessible by design**: visible focus outlines, labeled controls, keyboard shortcuts (Esc to restart), and a polite `aria-live` region that periodically announces time/WPM/accuracy plus an assertive announcement of final results.
- **Responsive layout** that reflows controls and stat cards for phone-width screens.
- Pasting into the typing box is disabled to keep results honest.

## How scoring works

- Every keystroke is compared against the expected character at that position **the moment it's typed**, and recorded permanently as correct or incorrect — corrections don't erase history, so backspacing over a mistake and retyping it still counts the original error. This keeps accuracy meaningful even with heavy editing.
- **Accuracy** = cumulative correct keystrokes ÷ total keystrokes recorded.
- **Errors** = cumulative incorrect keystrokes recorded (including ones you later fixed).
- **WPM** = (currently-correct characters in your typed text ÷ 5) ÷ minutes elapsed, using the standard "5 characters = 1 word" convention. This part uses the *current* state of your input (not history), so if you fix a mistake, your on-screen progress reflects the corrected text.

## Project structure

```
index.html   Markup: mode tabs, mode panel (description, time select, custom input,
             live stats, typing area, results panel)
style.css    Theming, layout, tab/panel transitions, responsive rules, focus states
script.js    Text banks, state machine, timer, scoring, rendering, storage
```

`script.js` is organized into clear sections: text data, state, DOM refs, high-score storage, text generation, rendering, scoring, the game state machine (idle → countdown → running → finished), and event wiring.

## Future enhancement ideas

- Per-mode *and* per-time-limit high score tracking (currently best score is tracked per mode).
- A WPM-over-time graph rendered after each finished round.
- Multiplayer/race mode comparing against a ghost of a previous run.
- Language/layout options (e.g. punctuation-only mode, numbers mode, non-English word banks).
- Exportable/shareable results (image or shareable link).
