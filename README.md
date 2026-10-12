# Typing Speed Tester

A polished, dependency-free typing speed test built with vanilla HTML, CSS, and JavaScript. Practice typing, track your words-per-minute (WPM) and accuracy in real time, and beat your personal best across four typing modes.

## Overview

Open the site at `login.html`. Create a browser-local account, then choose a typing mode. The timer begins with your first keystroke.

Each mode is a **separate page with its own link**, so you can bookmark or share any one of them directly:

| Page | Link | What it does |
| --- | --- | --- |
| Login | [`login.html`](login.html) | Create a local account or sign in |
| Paragraph | [`index.html`](index.html) | Landing page — a full paragraph of natural writing, timed |
| Easy Words | [`easy-words.html`](easy-words.html) | Short, common words for beginners, timed |
| Quotes | [`quotes.html`](quotes.html) | A famous quote; ends when you finish typing it |
| Custom Text | [`custom-text.html`](custom-text.html) | Practice on your own pasted text |
| Results | [`results.html`](results.html) | Graphs and a summary of your latest test |

The nav bar on each practice and results page links to the other sections, with the current one highlighted via `aria-current="page"`.

## Mini-project modules

The project has **two functional modules beyond login**:

1. **Typing practice and assessment:** four practice modes, time controls, live WPM and accuracy calculation, and custom text.
2. **Results and progress tracking:** test summaries, personal bests, saved history, and two performance charts.

The four modes are useful features within the first module rather than four separate modules. If your faculty uses a narrower definition of *module*, confirm these boundaries with them.

## Browser-local login

`login.html` offers account creation and sign-in. Passwords are stored as salted PBKDF2 hashes in browser storage. The signed-in account is kept for the current tab session, and the app redirects unsigned users to the login page. Practice data is stored under separate keys for each account in the same browser.

This is a **static-site demonstration**, not secure server-side authentication. Anyone with access to this browser's developer tools or storage can alter local accounts and results. Do not use a real password. For production authentication, use a backend and server-managed sessions.

As you type, each character is highlighted as correct, incorrect, or "current". Stats (WPM, accuracy, errors, and your best score) update live and are announced to screen readers through an `aria-live` region. When the round ends — time out, or reaching the last character — you are taken to the results page automatically.

## Results page

`results.html` shows the test you just finished:

- **Summary cards** — WPM, accuracy, errors, correct/typed characters, time taken, and your best WPM for that mode, with a "New Best!" badge when you set one.
- **Speed over time** — a line chart of your WPM for each second of the test. Seconds where you made a new mistake are marked with a red ✕.
- **Recent tests** — a bar chart of your last 10 results, with this test highlighted.
- **Try Again** goes back to the mode you just played; **Clear history** wipes the bar chart's past results.

The charts are drawn with the plain Canvas 2D API (no chart library). They redraw sharply on high-DPI screens and when the window is resized, and each canvas has an `aria-label` describing its data for screen readers. With no finished test yet, the page shows a short message and a link to start one.

## Setup

No build step and no dependencies. Serve the folder with any static server so browser cryptography and storage work consistently:

```bash
python -m http.server 8000
# then open http://localhost:8000/login.html
```

Because it is plain static files, it can be hosted as-is on GitHub Pages. The root page redirects unsigned visitors to `login.html`.

## Features

- **Text visible immediately** — the whole passage is rendered on load and scrolls with your cursor as you advance; nothing overlays the words.
- **Four modes, four pages**, each with a real URL and shared styling/logic.
- **Selectable time limits** of 15/30/60/120 seconds on the timed pages, and the passage length scales to match the duration. Your choice is remembered across pages.
- **Quotes and Custom Text count up instead**, ending when you type the final character.
- **Optional 3·2·1 countdown** button for a running start — otherwise typing just begins the round.
- **Live stats**: WPM, accuracy, error count, and your best WPM for that mode.
- **Results page with graphs** of your speed through the test and your recent history.
- **Browser-local accounts** with sign-in, sign-out, and separate practice data for each username.
- **Persistent high scores** per mode and account in `localStorage`, with a "New Best!" badge and a footer control to reset them. Custom text is saved too, so it is still there on your next visit.
- **Accessible by design**: visible focus outlines, labeled controls, `Esc` to restart, a polite `aria-live` region announcing time/WPM/accuracy each second, and described charts on the results page.
- **Responsive layout** that reflows the nav, controls, and stat cards down to phone width.
- Pasting into the typing box is disabled so results stay honest.

## Design

The look is a dark slate theme with a green accent, kept deliberately simple so every rule is ordinary hand-written CSS:

- **Colours** — slate background (`#0f172a`), green for progress and the primary action (`#22c55e`), amber for the "New Best!" badge, red for mistakes. All of them are defined once as CSS variables at the top of [style.css](style.css), so changing the theme means editing a few lines.
- **Fonts** — Lexend for headings and numbers, Source Sans 3 for body text, and JetBrains Mono for the passage you type (a monospace font keeps the characters from shifting as you go). They load from Google Fonts, with normal system fonts listed as fallbacks.
- **Hierarchy** — WPM is the number that matters most, so its card is outlined and larger than the others; the passage is the biggest element on the page; supporting text is muted grey.
- **Details** — the current character has a blinking underline as a caret, navigation is a pill bar showing the current page, buttons and links have hover and focus styles, and all tap targets are at least 40px tall.
- **Contrast** — every text/background pair was checked against the WCAG AA minimum of 4.5:1 (the lowest is the untyped passage text at 6.4:1).
- Animations are switched off automatically for anyone who has "reduce motion" turned on.

`style.css` is split into ten numbered sections with comments (tokens, base, header, controls, stats, typing area, results, footer, responsive) so it is easy to find things.

## How scoring works

- Every keystroke is compared against the expected character at that position **the moment it is typed**, and recorded permanently as correct or incorrect. Corrections do not erase history, so backspacing over a mistake and retyping it still counts the original error — accuracy stays meaningful even with heavy editing.
- **Accuracy** = cumulative correct keystrokes ÷ total keystrokes recorded.
- **Errors** = cumulative incorrect keystrokes (including ones you later fixed).
- **WPM** = (currently-correct characters ÷ 5) ÷ minutes elapsed, using the standard "5 characters = 1 word" convention. Elapsed time comes from a wall-clock timestamp rather than timer ticks, so finishing between ticks still scores accurately. This half of the calculation reads the *current* state of your input, so fixing a mistake is reflected in your progress.
- Rounds shorter than two seconds (or under ten characters) never claim the high score, so a one-word custom text cannot leave behind an unbeatable number.

## Project structure

```
index.html         Paragraph mode (landing page)
login.html         Browser-local sign-in and account creation
easy-words.html    Easy Words mode
quotes.html        Quotes mode
custom-text.html   Custom Text mode
results.html       Results page with graphs
style.css          Theming, layout, responsive rules, focus states
auth.js            Session check, account helpers, per-account storage keys
login.js           Form behavior and browser-local password verification
script.js          Text banks, shared practice UI, state machine, scoring, storage
results.js         Reads the saved result and draws the canvas charts
```

Each test page is a thin shell: header, nav, a mode description, and an empty `<div id="practice-root">`. `script.js` reads the mode from `<body data-mode="...">` and injects the shared practice UI (controls, stats, typing area) into that root, so the typing interface lives in exactly one place instead of being copy-pasted across four files.

While a test runs, `script.js` records your WPM and error count once per second. When the test ends it saves the full result and adds a short entry to the last 20 results under the signed-in account's storage keys, then opens `results.html`, where `results.js` reads that data and draws the charts.

`script.js` is organized into labelled sections: text data, mode configuration, the shared UI template, state, storage, text generation, rendering, scoring, round lifecycle (idle → countdown → running → finished), event handlers, and init.

## Future enhancement ideas

- Per-mode *and* per-time-limit high score tracking (best score is currently tracked per mode).
- Hover tooltips on the charts showing the exact value at each second.
- A race mode against a ghost replay of your previous run.
- More text banks: punctuation and numbers drills, code snippets, other languages.
- Exportable or shareable results.
