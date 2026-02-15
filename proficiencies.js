const API_BASE = "https://api.talekeeper.org";
const TOKEN_STORAGE_KEY = "tk_pb_token";

const PROF_LEVELS = ["none", "half", "full", "expertise"];

const PROF_OPTIONS = {
  skills: [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival",
  ],
  tools: [
    "Alchemist's Supplies",
    "Brewer's Supplies",
    "Calligrapher's Supplies",
    "Carpenter's Tools",
    "Cartographer's Tools",
    "Cobbler's Tools",
    "Cook's Utensils",
    "Glassblower's Tools",
    "Jeweler's Tools",
    "Leatherworker's Tools",
    "Mason's Tools",
    "Painter's Supplies",
    "Potter's Tools",
    "Smith's Tools",
    "Tinker's Tools",
    "Weaver's Tools",
    "Woodcarver's Tools",
    "Navigator's Tools",
    "Thieves' Tools",
  ],
  kits: ["Disguise Kit", "Forgery Kit", "Healer's Kit", "Herbalism Kit", "Poisoner's Kit"],
  gaming_sets: ["Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set"],
  instruments: ["Bagpipes", "Drum", "Dulcimer", "Flute", "Horn", "Lute", "Lyre", "Pan Flute", "Shawm", "Viol"],
};

const TYPE_LABELS = {
  skills: "Skill",
  tools: "Tool",
  kits: "Kit",
  instruments: "Musical Instrument",
  gaming_sets: "Gaming Set",
};

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

function canonMaps() {
  const maps = {};
  for (const [type, items] of Object.entries(PROF_OPTIONS)) {
    const m = new Map();
    for (const item of items) m.set(normalizeKey(item), item);
    if (type === "skills") {
      m.set(normalizeKey("Slight of Hand"), "Sleight of Hand");
    }
    maps[type] = m;
  }
  return maps;
}

const CANON_BY_TYPE = canonMaps();

function canonizeName(type, rawName) {
  const key = normalizeKey(rawName);
  if (!key) return "";
  const canon = CANON_BY_TYPE[type]?.get(key);
  return canon || rawName.trim();
}

function normalizeLevel(level) {
  const text = String(level || "").trim().toLowerCase();
  if (PROF_LEVELS.includes(text)) return text;
  if (text === "proficient") return "full";
  return "none";
}

function emptyProficiencies() {
  return { skills: {}, tools: {}, kits: {}, instruments: {}, gaming_sets: {} };
}

function normalizeProficiencies(raw) {
  if (!raw) return emptyProficiencies();

  const out = emptyProficiencies();

  if (Array.isArray(raw)) {
    // [{type:'skills', name:'Acrobatics', level:'full'}] or [{category:'Skill', ...}]
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const typeRaw = entry.type || entry.category || entry.kind || "";
      const nameRaw = entry.name || entry.title || entry.skill || entry.tool || "";
      const levelRaw = entry.level ?? entry.proficiency ?? entry.value ?? "";
      const type = String(typeRaw || "").trim().toLowerCase();
      const name = String(nameRaw || "").trim();
      if (!name) continue;

      let bucket = "";
      if (type.includes("skill")) bucket = "skills";
      else if (type.includes("instrument")) bucket = "instruments";
      else if (type.includes("gaming")) bucket = "gaming_sets";
      else if (type.includes("kit")) bucket = "kits";
      else if (type.includes("tool")) bucket = "tools";
      else bucket = "skills";

      out[bucket][canonizeName(bucket, name)] = normalizeLevel(levelRaw);
    }
    return out;
  }

  if (typeof raw === "object") {
    // Preferred shape:
    // { skills: {Acrobatics:'full'}, tools:{...}, ... }
    const hasBuckets =
      raw.skills || raw.tools || raw.kits || raw.instruments || raw.gaming_sets || raw.gamingSets;

    if (hasBuckets) {
      const bucketKeys = {
        skills: "skills",
        tools: "tools",
        kits: "kits",
        instruments: "instruments",
        gaming_sets: "gaming_sets",
        gamingSets: "gaming_sets",
      };

      for (const [rawKey, bucket] of Object.entries(bucketKeys)) {
        const bucketValue = raw[rawKey];
        if (!bucketValue || typeof bucketValue !== "object" || Array.isArray(bucketValue)) continue;
        for (const [name, level] of Object.entries(bucketValue)) {
          if (!String(name || "").trim()) continue;
          out[bucket][canonizeName(bucket, name)] = normalizeLevel(level);
        }
      }

      return out;
    }

    // Legacy: flat object map -> treat as skills.
    for (const [name, level] of Object.entries(raw)) {
      if (!String(name || "").trim()) continue;
      out.skills[canonizeName("skills", name)] = normalizeLevel(level);
    }
  }

  return out;
}

function sortedRows(proficiencies) {
  const rows = [];
  for (const [type, label] of Object.entries(TYPE_LABELS)) {
    const bucket = proficiencies[type] && typeof proficiencies[type] === "object" ? proficiencies[type] : {};
    const names = Object.keys(bucket).sort((a, b) => a.localeCompare(b));
    for (const name of names) rows.push({ type, label, name, level: bucket[name] });
  }
  return rows;
}

function fillDatalist(type) {
  const list = document.getElementById("proficiency-options");
  if (!list) return;

  list.innerHTML = "";
  const options = PROF_OPTIONS[type] || [];
  for (const name of options) {
    const opt = document.createElement("option");
    opt.value = name;
    list.appendChild(opt);
  }
}

function renderTable(proficiencies, onChange) {
  const tbody = document.getElementById("prof-rows");
  if (!tbody) return;

  tbody.innerHTML = "";
  const rows = sortedRows(proficiencies);

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "No proficiencies set.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  for (const rowInfo of rows) {
    const tr = document.createElement("tr");

    const tdType = document.createElement("td");
    tdType.textContent = rowInfo.label;
    tr.appendChild(tdType);

    const tdName = document.createElement("td");
    tdName.textContent = rowInfo.name;
    tr.appendChild(tdName);

    const tdLevel = document.createElement("td");
    const select = document.createElement("select");
    for (const lvl of PROF_LEVELS) {
      const opt = document.createElement("option");
      opt.value = lvl;
      opt.textContent = lvl.charAt(0).toUpperCase() + lvl.slice(1);
      if (lvl === rowInfo.level) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () =>
      onChange({ op: "setLevel", type: rowInfo.type, name: rowInfo.name, level: select.value })
    );
    tdLevel.appendChild(select);
    tr.appendChild(tdLevel);

    const tdRemove = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remove";
    btn.className = "danger-btn";
    btn.addEventListener("click", () => onChange({ op: "remove", type: rowInfo.type, name: rowInfo.name }));
    tdRemove.appendChild(btn);
    tr.appendChild(tdRemove);

    tbody.appendChild(tr);
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

let currentRecord = null;
let currentProfs = emptyProficiencies();
let dirty = false;

function handleTableChange(change) {
  applyChange(change);
  renderTable(currentProfs, handleTableChange);
}

function markDirty(value) {
  dirty = Boolean(value);
  const saveBtn = document.getElementById("btn-save");
  if (saveBtn) saveBtn.textContent = dirty ? "Save (Unsaved Changes)" : "Save";
}

function ensureBucket(type) {
  if (!currentProfs[type] || typeof currentProfs[type] !== "object") currentProfs[type] = {};
}

function applyChange(change) {
  const type = change.type;
  ensureBucket(type);

  if (change.op === "remove") {
    delete currentProfs[type][change.name];
    markDirty(true);
    return;
  }

  if (change.op === "setLevel") {
    currentProfs[type][change.name] = normalizeLevel(change.level);
    markDirty(true);
    return;
  }
}

function pruneEmptyBuckets(profs) {
  const out = emptyProficiencies();
  for (const key of Object.keys(out)) {
    const bucket = profs[key];
    if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) continue;
    for (const [name, level] of Object.entries(bucket)) {
      const n = String(name || "").trim();
      if (!n) continue;
      out[key][n] = normalizeLevel(level);
    }
  }
  return out;
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
    currentProfs = normalizeProficiencies(currentRecord.proficiencies);
    markDirty(false);

    const name = String(currentRecord.character_name || "Unnamed Hero");
    setStatus(`Loaded ${name}.`, "ok");

    const sheetLink = document.getElementById("sheet-link");
    if (sheetLink) {
      sheetLink.hidden = false;
      sheetLink.href = `index.html?characterId=${encodeURIComponent(characterId)}`;
    }

    renderTable(currentProfs, handleTableChange);
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, "error");
  }
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

  setStatus("Saving proficiencies...", "");

  try {
    const pruned = pruneEmptyBuckets(currentProfs);
    const saved = await patchCharacterById(characterId, token, { proficiencies: pruned });
    currentRecord = saved;
    currentProfs = normalizeProficiencies(saved.proficiencies);
    markDirty(false);
    renderTable(currentProfs, handleTableChange);
    setStatus("Saved.", "ok");
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, "error");
  }
}

function addOrUpdateFromInputs() {
  const type = document.getElementById("prof-type")?.value || "skills";
  const nameInput = document.getElementById("prof-name");
  const level = document.getElementById("prof-level")?.value || "full";

  const rawName = String(nameInput?.value || "").trim();
  if (!rawName) {
    setStatus("Enter a proficiency name.", "error");
    return;
  }

  ensureBucket(type);
  const name = canonizeName(type, rawName);
  currentProfs[type][name] = normalizeLevel(level);
  markDirty(true);

  if (nameInput) nameInput.value = "";
  setStatus(`Updated: ${TYPE_LABELS[type] || type} - ${name}`, "ok");
  renderTable(currentProfs, handleTableChange);
}

function revertToLoaded() {
  if (!currentRecord) {
    setStatus("Nothing loaded yet.", "error");
    return;
  }

  currentProfs = normalizeProficiencies(currentRecord.proficiencies);
  markDirty(false);
  renderTable(currentProfs, handleTableChange);
  setStatus("Reverted local changes.", "ok");
}

function init() {
  const queryId = readQueryCharacterId();
  const idInput = document.getElementById("character-id");
  if (idInput && queryId) idInput.value = queryId;

  const typeSelect = document.getElementById("prof-type");
  if (typeSelect) {
    fillDatalist(typeSelect.value);
    typeSelect.addEventListener("change", () => fillDatalist(typeSelect.value));
  }

  document.getElementById("btn-load")?.addEventListener("click", loadCharacter);
  document.getElementById("btn-save")?.addEventListener("click", saveCharacter);
  document.getElementById("btn-revert")?.addEventListener("click", revertToLoaded);
  document.getElementById("btn-add")?.addEventListener("click", addOrUpdateFromInputs);

  // Auto-load when opened from the list with a characterId.
  if (queryId) void loadCharacter();
}

document.addEventListener("DOMContentLoaded", init);
