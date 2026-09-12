# Typing Speed Tester

A polished, dependency-free typing speed test built with vanilla HTML, CSS, and JavaScript. Practice typing, track your words-per-minute (WPM) and accuracy in real time, and beat your personal best across four typing modes.

## Overview

Opening the site drops you straight into a full paragraph of natural text — no splash screen and nothing covering the words. Just start typing; the timer begins with your first keystroke, exactly like MonkeyType.

Each mode is a **separate page with its own link**, so you can bookmark or share any one of them directly:

| Page | Link | What it does |
| --- | --- | --- |
| Paragraph | [`index.html`](index.html) | Landing page — a full paragraph of natural writing, timed |
| Easy Words | [`easy-words.html`](easy-words.html) | Short, common words for beginners, timed |
| Quotes | [`quotes.html`](quotes.html) | A famous quote; ends when you finish typing it |
| Custom Text | [`custom-text.html`](custom-text.html) | Practice on your own pasted text |

The nav bar at the top of every page links to all four, with the current one highlighted via `aria-current="page"`.

As you type, each character is highlighted as correct, incorrect, or "current". Stats (WPM, accuracy, errors, and your best score) update live and are announced to screen readers through an `aria-live` region. When the round ends — time out, or reaching the last character — a results panel summarizes your performance and flags a new personal best.

## Setup

No build step and no dependencies. Open [index.html](index.html) directly in a browser, or serve the folder with any static server:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Because it is plain static files, it can be hosted as-is on GitHub Pages — each mode is then reachable at its own URL (`/`, `/easy-words.html`, `/quotes.html`, `/custom-text.html`).

## Features

- **Text visible immediately** — the whole passage is rendered on load and scrolls with your cursor as you advance; nothing overlays the words.
- **Four modes, four pages**, each with a real URL and shared styling/logic.
- **Selectable time limits** of 15/30/60/120 seconds on the timed pages, and the passage length scales to match the duration. Your choice is remembered across pages.
- **Quotes and Custom Text count up instead**, ending when you type the final character.
- **Optional 3·2·1 countdown** button for a running start — otherwise typing just begins the round.
- **Live stats**: WPM, accuracy, error count, and your best WPM for that mode.
- **Persistent high scores** per mode in `localStorage`, with a "New Best!" badge and a footer control to reset them. Custom text is saved too, so it is still there on your next visit.
- **Accessible by design**: visible focus outlines, labeled controls, `Esc` to restart, a polite `aria-live` region announcing time/WPM/accuracy each second, and an assertive announcement of final results.
- **Responsive layout** that reflows the nav, controls, and stat cards down to phone width.
- Pasting into the typing box is disabled so results stay honest.

## How scoring works

- Every keystroke is compared against the expected character at that position **the moment it is typed**, and recorded permanently as correct or incorrect. Corrections do not erase history, so backspacing over a mistake and retyping it still counts the original error — accuracy stays meaningful even with heavy editing.
- **Accuracy** = cumulative correct keystrokes ÷ total keystrokes recorded.
- **Errors** = cumulative incorrect keystrokes (including ones you later fixed).
- **WPM** = (currently-correct characters ÷ 5) ÷ minutes elapsed, using the standard "5 characters = 1 word" convention. Elapsed time comes from a wall-clock timestamp rather than timer ticks, so finishing between ticks still scores accurately. This half of the calculation reads the *current* state of your input, so fixing a mistake is reflected in your progress.
- Rounds shorter than two seconds (or under ten characters) never claim the high score, so a one-word custom text cannot leave behind an unbeatable number.

## Project structure

```
index.html         Paragraph mode (landing page)
easy-words.html    Easy Words mode
quotes.html        Quotes mode
custom-text.html   Custom Text mode
style.css          Theming, layout, responsive rules, focus states
script.js          Text banks, shared practice UI, state machine, scoring, storage
```

Each page is a thin shell: header, nav, a mode description, and an empty `<div id="practice-root">`. `script.js` reads the mode from `<body data-mode="...">` and injects the shared practice UI (controls, stats, typing area, results) into that root, so the typing interface lives in exactly one place instead of being copy-pasted across four files.

`script.js` is organized into labelled sections: text data, mode configuration, the shared UI template, state, storage, text generation, rendering, scoring, round lifecycle (idle → countdown → running → finished), event handlers, and init.

## Future enhancement ideas

- Per-mode *and* per-time-limit high score tracking (best score is currently tracked per mode).
- A WPM-over-time graph rendered after each finished round.
- A race mode against a ghost replay of your previous run.
- More text banks: punctuation and numbers drills, code snippets, other languages.
- Exportable or shareable results.
