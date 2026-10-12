"use strict";

const form = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const confirmWrap = document.getElementById("confirm-wrap");
const message = document.getElementById("form-message");
const submitButton = document.getElementById("submit-account");
const signInTab = document.getElementById("sign-in-tab");
const createTab = document.getElementById("create-tab");
let mode = "sign-in";

if (TypingAuth.currentUser()) location.replace(TypingAuth.destination());

function setMode(nextMode) {
  mode = nextMode;
  const creating = mode === "create";
  signInTab.classList.toggle("active", !creating);
  createTab.classList.toggle("active", creating);
  signInTab.setAttribute("aria-pressed", String(!creating));
  createTab.setAttribute("aria-pressed", String(creating));
  document.getElementById("form-title").textContent = creating ? "Start practising" : "Welcome back";
  document.getElementById("form-support").textContent = creating
    ? "Make an account for your practice results."
    : "Pick up where you left off.";
  passwordInput.autocomplete = creating ? "new-password" : "current-password";
  confirmWrap.hidden = !creating;
  confirmInput.required = creating;
  confirmInput.value = "";
  submitButton.textContent = creating ? "Create account" : "Sign in";
  message.textContent = "";
  passwordInput.value = "";
}

signInTab.addEventListener("click", () => setMode("sign-in"));
createTab.addEventListener("click", () => setMode("create"));

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: Uint8Array.from(salt.match(/../g), (byte) => parseInt(byte, 16)), iterations: 100000, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(bits));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const displayName = usernameInput.value.trim();
  const user = displayName.toLowerCase();
  const password = passwordInput.value;
  message.textContent = "";
  if (!/^[a-z0-9_]{3,24}$/i.test(displayName) || password.length < 8) {
    message.textContent = "Enter a valid username and a password with at least 8 characters.";
    return;
  }
  if (mode === "create" && password !== confirmInput.value) {
    message.textContent = "Passwords do not match.";
    return;
  }
  if (!window.crypto || !crypto.subtle) {
    message.textContent = "Secure browser features are unavailable. Open this project through localhost and try again.";
    return;
  }

  submitButton.disabled = true;
  try {
    const accounts = TypingAuth.accounts();
    if (mode === "create") {
      if (Object.hasOwn(accounts, user)) {
        message.textContent = "That username is already taken in this browser. Sign in or choose another.";
        return;
      }
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      accounts[user] = { displayName, salt, hash: await hashPassword(password, salt) };
      localStorage.setItem(TypingAuth.accountsKey, JSON.stringify(accounts));
    } else {
      const account = accounts[user];
      if (!account || (await hashPassword(password, account.salt)) !== account.hash) {
        message.textContent = "Username or password is incorrect.";
        return;
      }
    }
    sessionStorage.setItem(TypingAuth.sessionKey, user);
    location.replace(TypingAuth.destination());
  } catch (err) {
    message.textContent = "Your account could not be saved or opened. Check browser storage and try again.";
  } finally {
    submitButton.disabled = false;
  }
});
