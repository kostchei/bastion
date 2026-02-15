const API_BASE = "https://api.talekeeper.org";
const TOKEN_STORAGE_KEY = "tk_pb_token";

// Keep this in sync with docs/factions.md.
const FACTION_OPTIONS = [
  "Cult of the Dragon",
  "Emerald Enclave",
  "Harpers",
  "Lords' Alliance",
  "Order of the Gauntlet",
  "The Purple Dragon Knights",
  "Red Wizards",
  "Zhentarim",
  "Arcane Brotherhood",
  "Aurora's Emporium",
  "Cultists of the Howling Hatred",
  "The Cult of the Black Earth",
  "The Eternal Flame",
  "Cultists of the Crushing Wave",
  "Flaming Fist",
  "Kraken Society",
  "Order of Delvers",
  "Spellguard",
  "Waterclock Guild",
];

function setStatus(message, kind = "") {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u2019\u2018`]/g, "'")
    .replace(/\s+/g, " ");
}

function canonMap() {
  const map = new Map();
  for (const name of FACTION_OPTIONS) map.set(normalizeKey(name), name);
  return map;
}

const CANON_FACTION = canonMap();

function canonizeFaction(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { ok: false, value: "" };
  const canon = CANON_FACTION.get(normalizeKey(trimmed));
  if (canon) return { ok: true, value: canon };
  return { ok: false, value: trimmed };
}

function safeInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
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

function fillFactionDatalist() {
  const list = document.getElementById("faction-options");
  if (!list) return;
  list.innerHTML = "";
  for (const name of FACTION_OPTIONS) {
    const opt = document.createElement("option");
    opt.value = name;
    list.appendChild(opt);
  }
}

function setQueryCharacterId(characterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("characterId", characterId);
  window.history.replaceState(null, "", url.toString());
}

function readQueryCharacterId() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("characterId") || "").trim();
}

function normalizeFactions(raw) {
  if (!raw) return {};

  // Common shape: {"Harpers": 1, ...}
  if (!Array.isArray(raw) && typeof raw === "object") {
    const out = {};
    for (const [name, rankRaw] of Object.entries(raw)) {
      const canon = canonizeFaction(name);
      if (!canon.ok) continue;
      const rank = safeInt(rankRaw, 0);
      if (rank > 0) out[canon.value] = rank;
    }
    return out;
  }

  // Fallback array: [{name,rank}] or [{faction,level}]
  if (Array.isArray(raw)) {
    const out = {};
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const nameRaw = entry.name || entry.faction || entry.title || "";
      const canon = canonizeFaction(nameRaw);
      if (!canon.ok) continue;
      const rank = safeInt(entry.rank ?? entry.level ?? entry.value, 0);
      if (rank > 0) out[canon.value] = rank;
    }
    return out;
  }

  return {};
}

function sortedRows(factionsMap) {
  const rows = Object.entries(factionsMap || {})
    .map(([name, rank]) => ({ name, rank: safeInt(rank, 0) }))
    .filter((row) => row.name && row.rank > 0);

  rows.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return a.name.localeCompare(b.name);
  });

  return rows;
}

let currentRecord = null;
let currentFactions = {};
let dirty = false;

function markDirty(value) {
  dirty = Boolean(value);
  const saveBtn = document.getElementById("btn-save");
  if (saveBtn) saveBtn.textContent = dirty ? "Save (Unsaved Changes)" : "Save";
}

function renderTable(factionsMap) {
  const tbody = document.getElementById("faction-rows");
  if (!tbody) return;

  tbody.innerHTML = "";
  const rows = sortedRows(factionsMap);

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "No factions set.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const info of rows) {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = info.name;
    tr.appendChild(tdName);

    const tdRank = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.value = String(info.rank);
    input.addEventListener("change", () => {
      const rank = safeInt(input.value, 0);
      if (rank <= 0) delete currentFactions[info.name];
      else currentFactions[info.name] = rank;
      markDirty(true);
      renderTable(currentFactions);
    });
    tdRank.appendChild(input);
    tr.appendChild(tdRank);

    const tdRemove = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remove";
    btn.className = "danger-btn";
    btn.addEventListener("click", () => {
      delete currentFactions[info.name];
      markDirty(true);
      renderTable(currentFactions);
    });
    tdRemove.appendChild(btn);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
  }
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
    currentFactions = normalizeFactions(currentRecord.factions);
    markDirty(false);

    const name = String(currentRecord.character_name || "Unnamed Hero");
    setStatus(`Loaded ${name}.`, "ok");

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

    const pietyLink = document.getElementById("piety-link");
    if (pietyLink) {
      pietyLink.hidden = false;
      pietyLink.href = `piety.html?characterId=${encodeURIComponent(characterId)}`;
    }

    renderTable(currentFactions);
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, "error");
  }
}

function addOrUpdateFromInputs() {
  const nameRaw = String(document.getElementById("faction-name")?.value || "").trim();
  if (!nameRaw) {
    setStatus("Enter a faction name.", "error");
    return;
  }

  const canon = canonizeFaction(nameRaw);
  if (!canon.ok) {
    setStatus(`Unknown faction "${canon.value}". Pick from the list (docs/factions.md).`, "error");
    return;
  }

  const rankRaw = document.getElementById("faction-rank")?.value ?? "";
  const rank = safeInt(String(rankRaw).trim(), 0);
  if (rank <= 0) {
    delete currentFactions[canon.value];
    setStatus(`Removed: ${canon.value}`, "ok");
  } else {
    currentFactions[canon.value] = rank;
    setStatus(`Updated: ${canon.value} (Rank ${rank})`, "ok");
  }

  const nameInput = document.getElementById("faction-name");
  if (nameInput) nameInput.value = "";
  const rankInput = document.getElementById("faction-rank");
  if (rankInput) rankInput.value = "";

  markDirty(true);
  renderTable(currentFactions);
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

  setStatus("Saving factions...", "");

  try {
    // Store as a simple map: {"Faction": rank}
    const saved = await patchCharacterById(characterId, token, { factions: currentFactions });
    currentRecord = saved;
    currentFactions = normalizeFactions(saved.factions);
    markDirty(false);
    renderTable(currentFactions);
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

  currentFactions = normalizeFactions(currentRecord.factions);
  markDirty(false);
  renderTable(currentFactions);
  setStatus("Reverted local changes.", "ok");
}

function init() {
  fillFactionDatalist();

  const queryId = readQueryCharacterId();
  const idInput = document.getElementById("character-id");
  if (idInput && queryId) idInput.value = queryId;

  document.getElementById("btn-load")?.addEventListener("click", loadCharacter);
  document.getElementById("btn-save")?.addEventListener("click", saveCharacter);
  document.getElementById("btn-revert")?.addEventListener("click", revertToLoaded);
  document.getElementById("btn-add")?.addEventListener("click", addOrUpdateFromInputs);

  // Auto-load when opened from the list with a characterId.
  if (queryId) void loadCharacter();
}

document.addEventListener("DOMContentLoaded", init);

