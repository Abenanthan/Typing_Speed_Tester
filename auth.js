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
      if (event.persisted && !currentUser()) location.replace("login.html");
    });
    if (!user) {
      const page = location.pathname.split("/").pop() || "index.html";
      location.replace(`login.html?next=${encodeURIComponent(PAGES.has(page) ? page : "index.html")}`);
    } else {
      const header = document.querySelector("header");
      if (header) {
        const accountBar = document.createElement("div");
        accountBar.className = "account-bar";
        const name = document.createElement("span");
        name.textContent = `Signed in as ${accounts()[user].displayName}`;
        const button = document.createElement("button");
        button.className = "account-signout";
        button.type = "button";
        button.textContent = "Sign out";
        button.addEventListener("click", signOut);
        accountBar.append(name, button);
        header.appendChild(accountBar);
      }
      document.body.classList.add("auth-ready");
    }
  }

  return { accounts, currentUser, storageKey, destination, sessionKey: SESSION_KEY, accountsKey: ACCOUNTS_KEY };
})();
