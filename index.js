const API_BASE = "https://api.talekeeper.org";
const TOKEN_STORAGE_KEY = "tk_pb_token";
const MODEL_STORAGE_KEY = "tk_pb_auth_model";
let statusHideTimer = null;

const SAVE_PROFICIENCY_BY_CLASS = {
  artificer: ["con", "int"],
  barbarian: ["str", "con"],
  bard: ["dex", "cha"],
  cleric: ["wis", "cha"],
  druid: ["int", "wis"],
  fighter: ["str", "con"],
  monk: ["str", "dex"],
  paladin: ["wis", "cha"],
  ranger: ["str", "dex"],
  rogue: ["dex", "int"],
  sorcerer: ["con", "cha"],
  warlock: ["wis", "cha"],
  wizard: ["int", "wis"],
};

const ABILITY_ORDER = ["str", "dex", "con", "int", "wis", "cha"];

const SKILL_TO_ABILITY = {
  "athletics": "str",
  "acrobatics": "dex",
  "slight of hand": "dex",
  "sleight of hand": "dex",
  "stealth": "dex",
  "arcana": "int",
  "history": "int",
  "investigation": "int",
  "nature": "int",
  "religion": "int",
  "animal handling": "wis",
  "insight": "wis",
  "medicine": "wis",
  "perception": "wis",
  "survival": "wis",
  "deception": "cha",
  "intimidation": "cha",
  "performance": "cha",
  "persuasion": "cha",
};

const FEATURE_BY_CLASS = {
  barbarian: {
    title: "Rage",
    description: "Use your rage to hit harder and endure damage in melee combat.",
  },
  fighter: {
    title: "Second Wind",
    description: "Recover hit points once per short rest and stay in the fight longer.",
  },
  rogue: {
    title: "Sneak Attack",
    description: "Deal extra damage once per turn when you strike with advantage or teamwork.",
  },
  wizard: {
    title: "Arcane Recovery",
    description: "Recover limited spell power after a short rest.",
  },
  warlock: {
    title: "Pact Magic",
    description: "Cast powerful spells with short-rest spell slot recovery.",
  },
  cleric: {
    title: "Divine Domain",
    description: "Gain domain features that shape your divine role in the party.",
  },
};

function setStatus(message, state = "loading") {
  const statusEl = document.getElementById("sheet-status");
  if (!statusEl) return;
  if (statusHideTimer) {
    clearTimeout(statusHideTimer);
    statusHideTimer = null;
  }
  statusEl.classList.remove("is-hidden");
  statusEl.textContent = message;
  statusEl.dataset.state = state;

  if (state === "ok") {
    statusHideTimer = window.setTimeout(() => {
      statusEl.classList.add("is-hidden");
      statusHideTimer = null;
    }, 2400);
  }
}

function safeInt(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function normalizeStringList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeStringList(parsed);
      } catch {
        return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  if (typeof value === "object") {
    // e.g. {"feat name": true} or [{"name":"..."}]
    if (Array.isArray(value)) return normalizeStringList(value);
    return Object.keys(value)
      .map((k) => String(k || "").trim())
      .filter(Boolean);
  }

  return [];
}

function parseJsonMaybe(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u2019\u2018`]/g, "'")
    .replace(/\s+/g, " ");
}

function normalizeProficiencyLevel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "none" || text === "half" || text === "full" || text === "expertise") return text;
  if (text === "proficient") return "full";
  return "";
}

function proficiencyBonusForLevel(levelTag, proficiencyBonus) {
  const level = normalizeProficiencyLevel(levelTag) || "none";
  if (level === "half") return Math.floor(proficiencyBonus / 2);
  if (level === "full") return proficiencyBonus;
  if (level === "expertise") return proficiencyBonus * 2;
  return 0;
}

function extractSkillProficienciesMap(proficienciesValue) {
  const parsed = parseJsonMaybe(proficienciesValue);
  const out = new Map();
  if (!parsed) return out;

  const SLIGHT_KEY = normalizeKey("slight of hand");
  const SLEIGHT_KEY = normalizeKey("sleight of hand");

  const upsert = (name, level) => {
    const key = normalizeKey(name);
    const normalizedLevel = normalizeProficiencyLevel(level) || "none";
    if (!key) return;
    out.set(key, normalizedLevel);
  };

  // Preferred shape: { skills: { "Acrobatics": "full", ... }, ... }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (parsed.skills && typeof parsed.skills === "object" && !Array.isArray(parsed.skills)) {
      for (const [name, level] of Object.entries(parsed.skills)) upsert(name, level);
      // Common typo compatibility.
      if (out.has(SLIGHT_KEY) && !out.has(SLEIGHT_KEY)) out.set(SLEIGHT_KEY, out.get(SLIGHT_KEY));
      if (out.has(SLEIGHT_KEY) && !out.has(SLIGHT_KEY)) out.set(SLIGHT_KEY, out.get(SLEIGHT_KEY));
      return out;
    }

    // Legacy: flat object map -> treat as skills.
    for (const [name, level] of Object.entries(parsed)) upsert(name, level);
    if (out.has(SLIGHT_KEY) && !out.has(SLEIGHT_KEY)) out.set(SLEIGHT_KEY, out.get(SLIGHT_KEY));
    if (out.has(SLEIGHT_KEY) && !out.has(SLIGHT_KEY)) out.set(SLIGHT_KEY, out.get(SLEIGHT_KEY));
    return out;
  }

  // Array shape: [{type:'skills', name:'Acrobatics', level:'full'}]
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const kind = normalizeKey(entry.type || entry.category || entry.kind || "");
      if (kind && !kind.includes("skill")) continue;
      const name = entry.name || entry.title || entry.skill || "";
      const level = entry.level ?? entry.proficiency ?? entry.value;
      upsert(name, level);
    }
    if (out.has(SLIGHT_KEY) && !out.has(SLEIGHT_KEY)) out.set(SLEIGHT_KEY, out.get(SLIGHT_KEY));
    if (out.has(SLEIGHT_KEY) && !out.has(SLIGHT_KEY)) out.set(SLIGHT_KEY, out.get(SLEIGHT_KEY));
  }

  return out;
}

function pickHighestRankedFaction(factionsValue) {
  const factions = parseJsonMaybe(factionsValue);
  if (!factions) return null;

  // Common shape: {"Faction Name": 0|1|2|...}
  if (!Array.isArray(factions) && typeof factions === "object") {
    let best = null;
    for (const [name, rankRaw] of Object.entries(factions)) {
      const rank = safeInt(rankRaw, 0);
      const label = String(name || "").trim();
      if (!label) continue;
      if (!best || rank > best.rank) best = { name: label, rank };
    }
    return best && best.rank > 0 ? best : null;
  }

  // Fallback: array of objects like [{name,rank}] or [{faction,level}]
  if (Array.isArray(factions)) {
    let best = null;
    for (const entry of factions) {
      if (!entry || typeof entry !== "object") continue;
      const name = String(entry.name || entry.faction || entry.title || "").trim();
      const rank = safeInt(entry.rank ?? entry.level ?? entry.value, 0);
      if (!name) continue;
      if (!best || rank > best.rank) best = { name, rank };
    }
    return best && best.rank > 0 ? best : null;
  }

  return null;
}

function formatMod(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function calcAbilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function calcLevel(levels, className = "", fallback = 1) {
  if (typeof levels === "number" && Number.isFinite(levels)) {
    return Math.max(1, Math.round(levels));
  }

  if (Array.isArray(levels)) {
    const total = levels.reduce((sum, level) => sum + safeInt(level, 0), 0);
    if (total > 0) return total;
  }

  if (levels && typeof levels === "object") {
    const total = Object.values(levels).reduce((sum, level) => sum + safeInt(level, 0), 0);
    if (total > 0) return total;
  }

  const levelMatch = String(className).match(/\b(\d+)\b/);
  if (levelMatch) {
    return Math.max(1, safeInt(levelMatch[1], fallback));
  }

  return fallback;
}

function calcProficiency(level) {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

function normalizeClassKey(className) {
  const text = String(className || "").toLowerCase();
  for (const key of Object.keys(SAVE_PROFICIENCY_BY_CLASS)) {
    if (text.includes(key)) return key;
  }
  return "";
}

function readAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (queryToken) return queryToken.trim();

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) return stored;

    const pbAuthRaw = localStorage.getItem("pocketbase_auth");
    if (!pbAuthRaw) return "";

    const parsed = JSON.parse(pbAuthRaw);
    return typeof parsed?.token === "string" ? parsed.token : "";
  } catch {
    return "";
  }
}

async function fetchCharacterById(characterId, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${API_BASE}/api/collections/users_stats/records/${encodeURIComponent(characterId)}`,
    { headers }
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

function buildViewModel(record) {
  const className = String(record.class_name || "Commoner").trim() || "Commoner";
  const level = calcLevel(record.levels, className, 1);
  const proficiency = calcProficiency(level);
  const skillProficiencies = extractSkillProficienciesMap(record.proficiencies);

  const abilities = {
    str: safeInt(record.strength, 10),
    dex: safeInt(record.dexterity, 10),
    con: safeInt(record.constitution, 10),
    int: safeInt(record.intelligence, 10),
    wis: safeInt(record.wisdom, 10),
    cha: safeInt(record.charisma, 10),
  };

  const mods = {
    str: calcAbilityMod(abilities.str),
    dex: calcAbilityMod(abilities.dex),
    con: calcAbilityMod(abilities.con),
    int: calcAbilityMod(abilities.int),
    wis: calcAbilityMod(abilities.wis),
    cha: calcAbilityMod(abilities.cha),
  };

  const classKey = normalizeClassKey(className);
  const proficientSaves = new Set(SAVE_PROFICIENCY_BY_CLASS[classKey] || []);

  const saves = {};
  for (const ability of ABILITY_ORDER) {
    const value = mods[ability] + (proficientSaves.has(ability) ? proficiency : 0);
    saves[ability] = formatMod(value);
  }

  const skills = {};
  for (const [skillName, ability] of Object.entries(SKILL_TO_ABILITY)) {
    const profLevel = skillProficiencies.get(normalizeKey(skillName)) || "none";
    const bonus = proficiencyBonusForLevel(profLevel, proficiency);
    skills[skillName] = formatMod(mods[ability] + bonus);
  }

  const hpMaxDefault = Math.max(1, 10 + mods.con);
  const hpMax = safeInt(record.max_hp, hpMaxDefault);

  const meleeAttack = formatMod(mods.str + proficiency);
  const rangedAttack = formatMod(mods.dex + proficiency);
  const initiative = formatMod(mods.dex);

  const feature = FEATURE_BY_CLASS[classKey] || {
    title: "Core Features",
    description: "Class-specific features are tracked in TaleKeeper.",
  };

  return {
    characterName: String(record.character_name || "Unnamed Hero"),
    className,
    level,
    species: String(record.species || "Unknown Species"),
    background: String(record.background || "Unknown Background"),
    xp: safeInt(record.xp, 0),
    feats: normalizeStringList(record.feats),
    god: String(record.piety_deity || "").trim(),
    piety: safeInt(record.piety_score, 0),
    highestAllegiance: pickHighestRankedFaction(record.factions),
    abilities,
    mods,
    saves,
    skills,
    hpMax,
    initiative,
    meleeAttack,
    rangedAttack,
    speed: "30 Feet",
    featureTitle: feature.title,
    featureDescription: feature.description,
    updated: String(record.updated || ""),
    id: String(record.id || ""),
  };
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderTextOrDash(selector, value) {
  const text = String(value || "").trim();
  setText(selector, text || "-");
}

function renderSimpleList(listSelector, items, emptyLabel = "None") {
  const list = document.querySelector(listSelector);
  if (!list) return;

  list.innerHTML = "";

  const normalized = Array.isArray(items)
    ? items.map((s) => String(s || "").trim()).filter(Boolean)
    : [];

  if (!normalized.length) {
    const li = document.createElement("li");
    li.className = "meta-empty";
    li.textContent = emptyLabel;
    list.appendChild(li);
    return;
  }

  for (const item of normalized) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
}

function renderAbilityMods(mods) {
  const nodes = document.querySelectorAll(".ability-mod");
  const values = [mods.str, mods.dex, mods.con, mods.int, mods.wis, mods.cha];
  nodes.forEach((node, index) => {
    node.textContent = formatMod(values[index] || 0);
  });
}

function parseSkillLabel(lineElement) {
  const text = lineElement.textContent.replace(/\s+/g, " ").trim();
  return text.replace(/^[-+]\d+\s*/, "").trim().toLowerCase();
}

function renderSavesAndSkills(saves, skills) {
  const lines = document.querySelectorAll(".skill-line");
  lines.forEach((line) => {
    const modNode = line.querySelector(".mod-val");
    if (!modNode) return;

    const label = parseSkillLabel(line);
    if (label.endsWith("save")) {
      const code = label.slice(0, 3).toLowerCase();
      if (saves[code]) modNode.textContent = saves[code];
      return;
    }

    const skillValue = skills[label];
    if (skillValue) modNode.textContent = skillValue;
  });
}

function renderSheet(view) {
  setText(".level-badge", `Level ${view.level}`);
  setText(".class-name", view.className);
  renderTextOrDash("#character-name", view.characterName);

  renderAbilityMods(view.mods);
  renderSavesAndSkills(view.saves, view.skills);

  const statValues = document.querySelectorAll(".init-speed-row .stat-value");
  if (statValues[0]) statValues[0].textContent = view.initiative;
  if (statValues[1]) statValues[1].textContent = view.speed;

  setText(".hp-value", String(view.hpMax));

  renderTextOrDash("#meta-god", view.god);
  setText("#meta-piety", String(view.piety));
  setText("#meta-xp", String(view.xp));
  renderSimpleList("#meta-feats", view.feats, "None");

  const allegianceRow = document.getElementById("meta-allegiance-row");
  if (allegianceRow) {
    if (view.highestAllegiance?.name) {
      allegianceRow.hidden = false;
      const rankSuffix = Number.isFinite(view.highestAllegiance.rank)
        ? ` (Rank ${view.highestAllegiance.rank})`
        : "";
      setText("#meta-allegiance", `${view.highestAllegiance.name}${rankSuffix}`);
    } else {
      allegianceRow.hidden = true;
    }
  }

  const attacks = document.querySelectorAll(".attack-line");
  if (attacks[0]) attacks[0].textContent = `Melee Attack Rolls: ${view.meleeAttack}`;
  if (attacks[1]) attacks[1].textContent = `Ranged Attack Rolls: ${view.rangedAttack}`;

  setText(".class-features-title", `${view.className} Class Features`);
  setText(".class-features-content h4", view.featureTitle);
  setText(".class-features-content p", view.featureDescription);
  setText(".side-tab.species", view.species);
  setText(".side-tab.background", view.background);
}

async function initSheetLoader() {
  const params = new URLSearchParams(window.location.search);
  const characterId = params.get("characterId");

  if (!characterId) {
    setStatus("No character selected. Open list.html first.", "error");
    return;
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

  const factionsLink = document.getElementById("factions-link");
  if (factionsLink) {
    factionsLink.hidden = false;
    factionsLink.href = `factions.html?characterId=${encodeURIComponent(characterId)}`;
  }

  setStatus(`Loading character ${characterId}...`, "loading");

  const token = readAuthToken();
  if (token) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage write failures
    }
  }

  try {
    const record = await fetchCharacterById(characterId, token);
    const viewModel = buildViewModel(record);
    renderSheet(viewModel);

    let authModel = null;
    try {
      authModel = localStorage.getItem(MODEL_STORAGE_KEY);
    } catch {
      authModel = null;
    }
    if (authModel) {
      try {
        const parsed = JSON.parse(authModel);
        if (parsed?.global_role) {
          setStatus(`Loaded ${viewModel.characterName} (${parsed.global_role})`, "ok");
          return;
        }
      } catch {
        // ignore parse failures
      }
    }

    setStatus(`Loaded ${viewModel.characterName}`, "ok");
  } catch (error) {
    setStatus(`Load failed: ${error.message}`, "error");
  }
}

document.addEventListener("DOMContentLoaded", initSheetLoader);
