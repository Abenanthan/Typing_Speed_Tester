"use strict";

/* Browser-local accounts for this static student project. This is not server authentication. */
const TypingAuth = (() => {
  const ACCOUNTS_KEY = "typingTester.accounts";
  const SESSION_KEY = "typingTester.currentUser";
  const PAGES = new Set(["index.html", "easy-words.html", "quotes.html", "custom-text.html", "results.html"]);

  function accounts() {
    try {
      const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY));
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (err) {
      return {};
    }
  }

  function currentUser() {
    try {
      const name = sessionStorage.getItem(SESSION_KEY);
      return name && Object.hasOwn(accounts(), name) ? name : null;
    } catch (err) {
      return null;
    }
  }

  function storageKey(name) {
    const user = currentUser();
    if (!user) throw new Error("Sign in before accessing practice data.");
    return `typingTester.user.${user}.${name}`;
  }

  function destination() {
    const requested = new URLSearchParams(location.search).get("next");
    return PAGES.has(requested) ? requested : "index.html";
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = "login.html";
  }

  const user = currentUser();
  if (document.body.dataset.page !== "login") {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted && !currentUser()) _showSignInPrompt();
    });
    if (!user) {
      _showSignInPrompt();
    } else {
      _injectAccountBar(user);
      document.body.classList.add("auth-ready");
    }
  }

  function _injectAccountBar(username) {
    const header = document.querySelector("header");
    if (!header) return;
    const accountBar = document.createElement("div");
    accountBar.className = "account-bar";
    const name = document.createElement("span");
    name.textContent = `Signed in as ${accounts()[username].displayName}`;
    const button = document.createElement("button");
    button.className = "account-signout";
    button.type = "button";
    button.textContent = "Sign out";
    button.addEventListener("click", signOut);
    accountBar.append(name, button);
    header.appendChild(accountBar);
  }

  function _showSignInPrompt() {
    // Inject a "Sign in" button into the header (visible even though body is hidden)
    const header = document.querySelector("header");
    if (header && !header.querySelector(".account-bar")) {
      const bar = document.createElement("div");
      bar.className = "account-bar";
      const btn = document.createElement("button");
      btn.className = "signin-trigger-btn";
      btn.type = "button";
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>Sign in`;
      btn.addEventListener("click", () => {
        if (typeof SignInModal !== "undefined") SignInModal.open();
      });
      bar.appendChild(btn);
      header.appendChild(bar);
    }
    // Make only the header visible so users can see and click "Sign in"
    document.body.style.setProperty("--auth-overlay-opacity", "1");
  }

  return { accounts, currentUser, storageKey, destination, sessionKey: SESSION_KEY, accountsKey: ACCOUNTS_KEY };
})();
