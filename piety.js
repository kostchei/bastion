const API_BASE = "https://api.talekeeper.org";
const TOKEN_STORAGE_KEY = "tk_pb_token";

// Keep this in sync with docs/gods.md.
const DEITY_OPTIONS = [
  "Amaunator",
  "Asmodeus",
  "Auril",
  "Azuth",
  "Bane",
  "Beshaba",
  "Bhaal",
  "Chauntea",
  "Cyric",
  "Deneir",
  "Eilistraee",
  "Eldath",
  "Gond",
  "Helm",
  "Ilmater",
  "Kelemvor",
  "Lathander",
  "Leira",
  "Lliira",
  "Lolth",
  "Loviatar",
  "Malar",
  "Mask",
  "Mielikki",
  "Milil",
  "Myrkul",
  "Mystra",
  "Oghma",
  "The Red Knight",
  "Selûne",
  "Shar",
  "Shaundakul",
  "Silvanus",
  "Sune",
  "Talona",
  "Talos",
  "Tempus",
  "Torm",
  "Tymora",
  "Tyr",
  "Umberlee",
  "Waukeen",
];

function setStatus(message, kind = "") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function stripDiacritics(value) {
  try {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return String(value || "");
  }
}

function normalizeKey(value) {
  return stripDiacritics(String(value || ""))
    .trim()
    .toLowerCase()
    .replace(/[\u2019\u2018`]/g, "'")
    .replace(/\s+/g, " ");
}

function buildCanonMap() {
  const map = new Map();
  for (const name of DEITY_OPTIONS) map.set(normalizeKey(name), name);

  // Common no-diacritic variants.
  map.set(normalizeKey("Selune"), "Selûne");

  // Common missing article variant.
  map.set(normalizeKey("Red Knight"), "The Red Knight");

  return map;
}

const CANON_DEITY = buildCanonMap();

function canonizeDeity(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { ok: true, value: "" };
  const canon = CANON_DEITY.get(normalizeKey(trimmed));
  if (canon) return { ok: true, value: canon };
  return { ok: false, value: trimmed };
}

function readAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) return queryToken.trim();

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? stored.trim() : "";
  } catch {
    return "";
  }
}

function authHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchCharacterById(characterId, token) {
  const response = await fetch(
    `${API_BASE}/api/collections/users_stats/records/${encodeURIComponent(characterId)}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `Character load failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function patchCharacterById(characterId, token, body) {
  const response = await fetch(
    `${API_BASE}/api/collections/users_stats/records/${encodeURIComponent(characterId)}`,
    { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(body) }
  );

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `Save failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function fillDeityDatalist() {
  const list = document.getElementById("deity-options");
  if (!list) return;
  list.innerHTML = "";
  for (const name of DEITY_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = name;
    list.appendChild(opt);
  }
}

function readQueryCharacterId() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("characterId") || "").trim();
}

function setQueryCharacterId(characterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("characterId", characterId);
  window.history.replaceState(null, "", url.toString());
}

let currentRecord = null;
let dirty = false;

function markDirty(value) {
  dirty = Boolean(value);
  const saveBtn = document.getElementById("btn-save");
  if (saveBtn) saveBtn.textContent = dirty ? "Save (Unsaved Changes)" : "Save";
}

function applyRecordToInputs(record) {
  const deityInput = document.getElementById("deity-name");
  const scoreInput = document.getElementById("piety-score");

  if (deityInput) deityInput.value = String(record?.piety_deity || "").trim();
  if (scoreInput) {
    const raw = record?.piety_score;
    const n = Number(raw);
    scoreInput.value = Number.isFinite(n) ? String(Math.round(n)) : "";
  }

  markDirty(false);
}

async function loadCharacter() {
  const idInput = document.getElementById("character-id");
  const characterId = String(idInput?.value || "").trim();
  if (!characterId) {
    setStatus("Enter a character record id to load.", "error");
    return;
  }

  setQueryCharacterId(characterId);

  const token = readAuthToken();
  if (!token) {
    setStatus("No auth token found (tk_pb_token). Loading may fail if records are protected.", "error");
  } else {
    setStatus("Loading character...", "");
  }

  try {
    currentRecord = await fetchCharacterById(characterId, token);
    const name = String(currentRecord.character_name || "Unnamed Hero");
    applyRecordToInputs(currentRecord);

    const sheetLink = document.getElementById("sheet-link");
    if (sheetLink) {
      sheetLink.hidden = false;
      sheetLink.href = `index.html?characterId=${encodeURIComponent(characterId)}`;
    }

    const profLink = document.getElementById("proficiencies-link");
    if (profLink) {
      profLink.hidden = false;
      profLink.href = `proficiencies.html?characterId=${encodeURIComponent(characterId)}`;
    }

    setStatus(`Loaded ${name}.`, "ok");
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, "error");
  }
}

function readEdits() {
  const deityRaw = document.getElementById("deity-name")?.value || "";
  const scoreRaw = document.getElementById("piety-score")?.value ?? "";

  const canon = canonizeDeity(deityRaw);
  if (!canon.ok) {
    return {
      ok: false,
      message: `Unknown god "${canon.value}". Pick from the list (docs/gods.md).`,
      body: null,
    };
  }

  const scoreTrim = String(scoreRaw).trim();
  let score = null;
  if (scoreTrim) {
    const n = Number(scoreTrim);
    if (!Number.isFinite(n)) {
      return { ok: false, message: "Piety score must be a number.", body: null };
    }
    score = Math.round(n);
  }

  const body = { piety_deity: canon.value ? canon.value : null };
  if (score === null) body.piety_score = null;
  else body.piety_score = score;

  return { ok: true, message: "", body };
}

async function saveCharacter() {
  const idInput = document.getElementById("character-id");
  const characterId = String(idInput?.value || "").trim();
  if (!characterId) {
    setStatus("Enter a character record id to save.", "error");
    return;
  }

  const token = readAuthToken();
  if (!token) {
    setStatus("No auth token found (tk_pb_token). Cannot save.", "error");
    return;
  }

  const edits = readEdits();
  if (!edits.ok) {
    setStatus(edits.message, "error");
    return;
  }

  setStatus("Saving piety...", "");

  try {
    const saved = await patchCharacterById(characterId, token, edits.body);
    currentRecord = saved;
    applyRecordToInputs(saved);
    setStatus("Saved.", "ok");
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, "error");
  }
}

function revertToLoaded() {
  if (!currentRecord) {
    setStatus("Nothing loaded yet.", "error");
    return;
  }
  applyRecordToInputs(currentRecord);
  setStatus("Reverted local changes.", "ok");
}

function initDirtyTracking() {
  const deityInput = document.getElementById("deity-name");
  const scoreInput = document.getElementById("piety-score");
  for (const el of [deityInput, scoreInput]) {
    if (!el) continue;
    el.addEventListener("input", () => markDirty(true));
    el.addEventListener("change", () => markDirty(true));
  }
}

function init() {
  fillDeityDatalist();
  initDirtyTracking();

  const queryId = readQueryCharacterId();
  const idInput = document.getElementById("character-id");
  if (idInput && queryId) idInput.value = queryId;

  document.getElementById("btn-load")?.addEventListener("click", loadCharacter);
  document.getElementById("btn-save")?.addEventListener("click", saveCharacter);
  document.getElementById("btn-revert")?.addEventListener("click", revertToLoaded);

  // Auto-load when opened from the list with a characterId.
  if (queryId) void loadCharacter();
}

document.addEventListener("DOMContentLoaded", init);
