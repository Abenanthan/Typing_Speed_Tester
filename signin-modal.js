"use strict";

/* =========================================================================
   SignInModal — drop this script on any page and call SignInModal.open().
   It mounts a full-screen overlay with sign-in / create-account tabs,
   uses the same PBKDF2 password hashing as login.js, and resolves a
   Promise with the signed-in username so callers can react immediately.
   ========================================================================= */
const SignInModal = (() => {
  /* ── helpers ─────────────────────────────────────────────────────────── */
  function toHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: Uint8Array.from(salt.match(/../g), (b) => parseInt(b, 16)),
        iterations: 100_000,
        hash: "SHA-256",
      },
      key,
      256
    );
    return toHex(new Uint8Array(bits));
  }

  /* ── DOM builder ─────────────────────────────────────────────────────── */
  function buildModal() {
    const overlay = document.createElement("div");
    overlay.id = "signin-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sm-title");
    overlay.innerHTML = `
      <div class="sm-backdrop" id="sm-backdrop"></div>
      <div class="sm-card" role="document">
        <button class="sm-close" id="sm-close" aria-label="Close sign in">✕</button>

        <div class="sm-eyebrow">YOUR PRACTICE SPACE</div>
        <h2 class="sm-heading" id="sm-title">Sign in to continue</h2>

        <div class="sm-tabs" role="group" aria-label="Account action">
          <button type="button" id="sm-tab-signin" class="sm-tab active" aria-pressed="true">Sign in</button>
          <button type="button" id="sm-tab-create" class="sm-tab" aria-pressed="false">Create account</button>
        </div>

        <p class="sm-support" id="sm-support">Pick up where you left off.</p>

        <form id="sm-form" novalidate>
          <label class="sm-label" for="sm-username">Username</label>
          <input id="sm-username" class="sm-input" name="username" type="text"
            autocomplete="username" minlength="3" maxlength="24"
            pattern="[A-Za-z0-9_]+" spellcheck="false" required
            aria-describedby="sm-username-hint" placeholder="e.g. john_doe">
          <p id="sm-username-hint" class="sm-hint">3–24 letters, numbers, or underscores.</p>

          <label class="sm-label" for="sm-password">Password</label>
          <div class="sm-pw-wrap">
            <input id="sm-password" class="sm-input" name="password" type="password"
              autocomplete="current-password" minlength="8" required placeholder="At least 8 characters">
            <button type="button" class="sm-pw-toggle" id="sm-pw-toggle" aria-label="Show password">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <div id="sm-confirm-wrap" hidden>
            <label class="sm-label" for="sm-confirm">Confirm password</label>
            <input id="sm-confirm" class="sm-input" name="confirm-password" type="password"
              autocomplete="new-password" minlength="8" placeholder="Re-enter your password">
          </div>

          <p id="sm-message" class="sm-message" role="status" aria-live="polite"></p>

          <button id="sm-submit" class="sm-submit" type="submit">Sign in</button>
        </form>

        <p class="sm-note">Accounts are saved only in this browser. Use a password you do not use elsewhere.</p>
      </div>
    `;
    return overlay;
  }

  /* ── state ───────────────────────────────────────────────────────────── */
  let _overlay = null;
  let _resolve = null;
  let _mode = "sign-in";
  let _previouslyFocused = null;

  /* ── focus trap ──────────────────────────────────────────────────────── */
  function trapFocus(e) {
    if (!_overlay) return;
    const focusable = Array.from(
      _overlay.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === "Escape") close(null);
  }

  /* ── mode switching ──────────────────────────────────────────────────── */
  function setMode(next) {
    _mode = next;
    const creating = _mode === "create";
    const tabSignIn = _overlay.querySelector("#sm-tab-signin");
    const tabCreate = _overlay.querySelector("#sm-tab-create");
    tabSignIn.classList.toggle("active", !creating);
    tabCreate.classList.toggle("active", creating);
    tabSignIn.setAttribute("aria-pressed", String(!creating));
    tabCreate.setAttribute("aria-pressed", String(creating));

    _overlay.querySelector("#sm-support").textContent = creating
      ? "Make an account for your practice results."
      : "Pick up where you left off.";

    const pw = _overlay.querySelector("#sm-password");
    pw.autocomplete = creating ? "new-password" : "current-password";

    const confirmWrap = _overlay.querySelector("#sm-confirm-wrap");
    const confirmInput = _overlay.querySelector("#sm-confirm");
    confirmWrap.hidden = !creating;
    confirmInput.required = creating;
    confirmInput.value = "";
    pw.value = "";

    _overlay.querySelector("#sm-submit").textContent = creating
      ? "Create account"
      : "Sign in";
    _overlay.querySelector("#sm-message").textContent = "";
  }

  /* ── open / close ─────────────────────────────────────────────────────  */
  function open(opts = {}) {
    // If already open, just return the existing promise
    if (_overlay) return _pendingPromise;

    _previouslyFocused = document.activeElement;

    _overlay = buildModal();
    document.body.appendChild(_overlay);

    // Animate in
    requestAnimationFrame(() => _overlay.classList.add("sm-visible"));

    // Wire up events
    _overlay.querySelector("#sm-close").addEventListener("click", () => close(null));
    _overlay.querySelector("#sm-backdrop").addEventListener("click", () => close(null));
    _overlay.querySelector("#sm-tab-signin").addEventListener("click", () => setMode("sign-in"));
    _overlay.querySelector("#sm-tab-create").addEventListener("click", () => setMode("create"));

    // Password visibility toggle
    const pwInput = _overlay.querySelector("#sm-password");
    _overlay.querySelector("#sm-pw-toggle").addEventListener("click", () => {
      const show = pwInput.type === "password";
      pwInput.type = show ? "text" : "password";
    });

    // Form submit
    _overlay.querySelector("#sm-form").addEventListener("submit", handleSubmit);

    document.addEventListener("keydown", trapFocus);

    // Focus first input
    setTimeout(() => _overlay.querySelector("#sm-username").focus(), 50);

    _pendingPromise = new Promise((res) => { _resolve = res; });
    return _pendingPromise;
  }

  let _pendingPromise = null;

  function close(result) {
    if (!_overlay) return;
    document.removeEventListener("keydown", trapFocus);
    _overlay.classList.remove("sm-visible");
    _overlay.addEventListener(
      "transitionend",
      () => {
        _overlay?.remove();
        _overlay = null;
      },
      { once: true }
    );
    if (_previouslyFocused) _previouslyFocused.focus();
    if (_resolve) { _resolve(result); _resolve = null; }
  }

  /* ── form handler ────────────────────────────────────────────────────── */
  async function handleSubmit(event) {
    event.preventDefault();
    const usernameInput = _overlay.querySelector("#sm-username");
    const passwordInput = _overlay.querySelector("#sm-password");
    const confirmInput = _overlay.querySelector("#sm-confirm");
    const message = _overlay.querySelector("#sm-message");
    const submitBtn = _overlay.querySelector("#sm-submit");

    const displayName = usernameInput.value.trim();
    const user = displayName.toLowerCase();
    const password = passwordInput.value;
    message.textContent = "";

    if (!/^[a-z0-9_]{3,24}$/i.test(displayName) || password.length < 8) {
      message.textContent =
        "Enter a valid username and a password with at least 8 characters.";
      return;
    }
    if (_mode === "create" && password !== confirmInput.value) {
      message.textContent = "Passwords do not match.";
      return;
    }
    if (!window.crypto?.subtle) {
      message.textContent =
        "Secure browser features unavailable. Open via localhost and try again.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = _mode === "create" ? "Creating…" : "Signing in…";

    try {
      const accounts = TypingAuth.accounts();
      if (_mode === "create") {
        if (Object.hasOwn(accounts, user)) {
          message.textContent =
            "That username is already taken in this browser.";
          return;
        }
        const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
        accounts[user] = {
          displayName,
          salt,
          hash: await hashPassword(password, salt),
        };
        localStorage.setItem(TypingAuth.accountsKey, JSON.stringify(accounts));
      } else {
        const account = accounts[user];
        if (!account || (await hashPassword(password, account.salt)) !== account.hash) {
          message.textContent = "Username or password is incorrect.";
          return;
        }
      }
      sessionStorage.setItem(TypingAuth.sessionKey, user);

      // Show brief success state, then close and resolve
      submitBtn.textContent = "✓ Success!";
      submitBtn.style.background = "var(--accent)";
      setTimeout(() => {
        close(user);
        // Reload the page so auth.js can inject the account bar
        location.reload();
      }, 600);
    } catch (err) {
      message.textContent =
        "Could not save / open your account. Check browser storage and try again.";
    } finally {
      if (submitBtn.disabled) {
        submitBtn.disabled = false;
        if (!submitBtn.textContent.startsWith("✓")) {
          submitBtn.textContent = _mode === "create" ? "Create account" : "Sign in";
        }
      }
    }
  }

  return { open, close };
})();
