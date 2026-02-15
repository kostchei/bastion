const API_BASE = "https://api.talekeeper.org";
const TOKEN_STORAGE_KEY = "tk_pb_token";
const MODEL_STORAGE_KEY = "tk_pb_auth_model";
const RESET_THROTTLE_MS = 5 * 60 * 1000; // per-email local throttle to avoid spam

function setStatus(message, kind = "") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function isLikelyEmail(value) {
  const v = String(value || "").trim();
  return v.includes("@") && v.includes(".") && !/\s/.test(v);
}

function parseTokenInput(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return { token: "", model: null };

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return { token: trimmed.slice(7).trim(), model: null };
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const token = typeof parsed?.token === "string" ? parsed.token.trim() : "";
      const model = parsed?.record || parsed?.model || null;
      return { token, model };
    } catch {
      return { token: trimmed, model: null };
    }
  }

  return { token: trimmed, model: null };
}

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveAuth(token, model = null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (model) {
      localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(model));
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY);
    }
  } catch {
    // ignore storage write errors
  }
}

function authHeaders(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function resetThrottleKey(email) {
  return `tk_pw_reset_last:${String(email || "").trim().toLowerCase()}`;
}

function canSendResetNow(email) {
  if (!isLikelyEmail(email)) return false;
  try {
    const raw = localStorage.getItem(resetThrottleKey(email));
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return Date.now() - last > RESET_THROTTLE_MS;
  } catch {
    return true;
  }
}

function markResetSent(email) {
  try {
    localStorage.setItem(resetThrottleKey(email), String(Date.now()));
  } catch {
    // ignore
  }
}

async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE}/api/collections/users/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(email || "").trim() }),
  });

  // PocketBase commonly returns 204 with no body; treat any 2xx as "accepted".
  if (response.ok) return;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const msg = String(payload?.message || `Reset request failed (${response.status})`);
  throw new Error(msg);
}

async function sendResetEmailFlow(email, { auto = false } = {}) {
  if (!isLikelyEmail(email)) {
    setStatus("Enter an email address to send a password reset link.", "error");
    return;
  }

  if (!canSendResetNow(email)) {
    setStatus("Password reset already requested recently. Please check email or try again later.", "error");
    return;
  }

  setStatus(auto ? "Login failed. Requesting password reset email..." : "Requesting password reset email...", "");

  try {
    await requestPasswordReset(email);
    markResetSent(email);
    setStatus("If that account exists, a password reset email has been sent.", "ok");
  } catch (error) {
    setStatus(`Password reset failed: ${error.message}`, "error");
  }
}

function calcLevel(levels, className = "") {
  if (levels && typeof levels === "object" && !Array.isArray(levels)) {
    const total = Object.values(levels).reduce((sum, value) => {
      const n = Number(value);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    if (total > 0) return Math.round(total);
  }

  const match = String(className || "").match(/\b(\d+)\b/);
  if (match) return Math.max(1, Number(match[1]));

  return 1;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function fetchCharacterPage(token, page) {
  const url = `${API_BASE}/api/collections/users_stats/records?page=${page}&perPage=200&sort=character_name`;
  const response = await fetch(url, { headers: authHeaders(token) });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `List request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function fetchAllCharacters(token) {
  const first = await fetchCharacterPage(token, 1);
  const items = Array.isArray(first?.items) ? [...first.items] : [];
  const totalPages = Number(first?.totalPages || 1);

  if (totalPages > 1) {
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await fetchCharacterPage(token, page);
      if (Array.isArray(next?.items)) items.push(...next.items);
    }
  }

  items.sort((a, b) => {
    const an = String(a.character_name || "").toLowerCase();
    const bn = String(b.character_name || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });

  return items;
}

function renderCharacterRows(items) {
  const tbody = document.getElementById("character-rows");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!items.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No visible characters returned. Use a valid token if records are protected.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const item of items) {
    const row = document.createElement("tr");

    const level = calcLevel(item.levels, item.class_name);

    const openUrl = `index.html?characterId=${encodeURIComponent(item.id)}`;
    const name = String(item.character_name || "Unnamed Hero");
    const className = String(item.class_name || "Commoner");
    const species = String(item.species || "-");

    const nameCell = document.createElement("td");
    nameCell.textContent = name;
    row.appendChild(nameCell);

    const classCell = document.createElement("td");
    classCell.textContent = className;
    row.appendChild(classCell);

    const levelCell = document.createElement("td");
    levelCell.textContent = String(level);
    row.appendChild(levelCell);

    const speciesCell = document.createElement("td");
    speciesCell.textContent = species;
    row.appendChild(speciesCell);

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatDate(item.updated);
    row.appendChild(updatedCell);

    const openCell = document.createElement("td");
    const link = document.createElement("a");
    link.className = "open-link";
    link.href = openUrl;
    link.textContent = "Open Sheet";
    openCell.appendChild(link);
    row.appendChild(openCell);

    tbody.appendChild(row);
  }
}

async function refreshCharacters() {
  const token = readStoredToken();
  setStatus("Loading characters...", "");

  try {
    const items = await fetchAllCharacters(token);
    renderCharacterRows(items);

    if (!items.length && !token) {
      setStatus(
        "Loaded 0 records anonymously. Paste an auth token to view protected characters.",
        "error"
      );
      return;
    }

    setStatus(`Loaded ${items.length} character(s).`, "ok");
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, "error");
  }
}

async function handleUserLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const identity = form.identity.value.trim();
  const password = form.password.value;

  if (!identity || !password) {
    setStatus("Enter user identity and password.", "error");
    return;
  }

  setStatus("Authenticating user...", "");

  try {
    const response = await fetch(`${API_BASE}/api/collections/users/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, password }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const msg = String(payload?.message || "");
      if (response.status === 400 && msg.toLowerCase().includes("failed to authenticate")) {
        // Common case: wrong password or user doesn't have one yet.
        // Don't reveal whether the account exists; offer reset email.
        await sendResetEmailFlow(identity, { auto: true });
        return;
      }
      if (
        response.status === 403 &&
        msg.toLowerCase().includes("not configured to allow password authentication")
      ) {
        throw new Error(
          "User password auth is disabled on this server. Login on talekeeper.org and paste the pocketbase_auth JSON token."
        );
      }
      throw new Error(msg || `Auth failed (${response.status})`);
    }

    const token = String(payload?.token || "");
    if (!token) throw new Error("Auth response did not include a token.");

    saveAuth(token, payload?.record || null);
    document.getElementById("token-input").value = token;
    form.password.value = "";

    setStatus("User auth succeeded. Refreshing character list...", "ok");
    await refreshCharacters();
  } catch (error) {
    setStatus(`User auth failed: ${error.message}`, "error");
  }
}

function handleSaveToken() {
  const tokenInput = document.getElementById("token-input");
  const parsed = parseTokenInput(tokenInput.value);

  if (!parsed.token) {
    setStatus("Token input is empty or invalid.", "error");
    return;
  }

  saveAuth(parsed.token, parsed.model);
  tokenInput.value = parsed.token;
  setStatus("Token saved. Refreshing character list...", "ok");
  refreshCharacters();
}

function handleClearToken() {
  saveAuth("", null);
  const tokenInput = document.getElementById("token-input");
  tokenInput.value = "";
  setStatus("Token cleared. Loading anonymous list...", "");
  refreshCharacters();
}

function init() {
  const storedToken = readStoredToken();
  if (storedToken) {
    document.getElementById("token-input").value = storedToken;
  }

  const resetBtn = document.getElementById("send-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const email = document.getElementById("user-identity")?.value || "";
      void sendResetEmailFlow(email, { auto: false });
    });
  }

  document.getElementById("save-token").addEventListener("click", handleSaveToken);
  document.getElementById("clear-token").addEventListener("click", handleClearToken);
  document.getElementById("refresh-list").addEventListener("click", refreshCharacters);
  document.getElementById("user-login").addEventListener("submit", handleUserLogin);

  refreshCharacters();
}

document.addEventListener("DOMContentLoaded", init);
