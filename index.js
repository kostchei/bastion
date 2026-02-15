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

// Keep this in sync with docs/class_features.md.
// Stored as data in JS (vs. parsing Markdown at runtime) to keep the static app simple.
const FEATURES_BY_CLASS = {
  bard: [
    {
      title: "Bardic Inspiration",
      body: [
        "You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which is a d6.",
        "Using Bardic Inspiration. As a Bonus Action, you can inspire another creature within 60 feet of yourself who can see or hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time.",
        "Once within the next hour when the creature fails a D20 Test, the creature can roll the Bardic Inspiration die and add the number rolled to the d20, potentially turning the failure into a success. A Bardic Inspiration die is expended when it's rolled.",
        "Number of Uses. You can confer a Bardic Inspiration die a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.",
      ].join("\n\n"),
    },
  ],
  monk: [
    {
      title: "Martial Arts",
      body: [
        "Your practice of martial arts gives you mastery of combat styles that use your Unarmed Strike and Monk weapons, which are the following:",
        "- Simple Melee weapons",
        "- Martial Melee weapons that have the Light property",
        "",
        "You gain the following benefits while you are unarmed or wielding only Monk weapons and you aren't wearing armor or wielding a Shield.",
        "",
        "Bonus Unarmed Strike. You can make an Unarmed Strike as a Bonus Action.",
        "",
        "Martial Arts Die. You can roll 1d6 in place of the normal damage of your Unarmed Strike or Monk weapons. This die changes as you gain Monk levels, as shown in the Martial Arts column of the Monk Features table.",
        "",
        "Dexterous Attacks. You can use your Dexterity modifier instead of your Strength modifier for the attack and damage rolls of your Unarmed Strikes and Monk weapons. In addition, when you use the Grapple or Shove option of your Unarmed Strike, you can use your Dexterity modifier instead of your Strength modifier to determine the save DC.",
      ].join("\n"),
    },
    {
      title: "Unarmored Defense",
      body: "While you aren't wearing armor or wielding a Shield, your base Armor Class equals 10 plus your Dexterity and Wisdom modifiers.",
    },
  ],
  sorcerer: [
    {
      title: "Spellcasting",
      body: [
        "Drawing from your innate magic, you can cast spells.",
        "",
        "Cantrips. You know four Sorcerer cantrips of your choice. Whenever you gain a Sorcerer level, you can replace one of your cantrips from this feature with another Sorcerer cantrip of your choice.",
        "",
        "Spell Slots. The Sorcerer Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.",
        "",
        "Prepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Sorcerer spells.",
        "",
        "Changing Your Prepared Spells. Whenever you gain a Sorcerer level, you can replace one spell on your list with another Sorcerer spell for which you have spell slots.",
        "",
        "Spellcasting Ability. Charisma is your spellcasting ability for your Sorcerer spells.",
      ].join("\n"),
    },
    {
      title: "Innate Sorcery",
      body: [
        "An event in your past left an indelible mark on you, infusing you with simmering magic. As a Bonus Action, you can unleash that magic for 1 minute, during which you gain the following benefits:",
        "- The spell save DC of your Sorcerer spells increases by 1.",
        "- You have Advantage on the attack rolls of Sorcerer spells you cast.",
        "",
        "You can use this feature twice, and you regain all expended uses of it when you finish a Long Rest.",
      ].join("\n"),
    },
  ],
  rogue: [
    {
      title: "Sneak Attack",
      body: [
        "You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack roll if you have Advantage on the roll and the attack uses a Finesse or a Ranged weapon. The extra damage's type is the same as the weapon's type.",
        "",
        "You don't need Advantage on the attack roll if at least one of your allies is within 5 feet of the target, the ally doesn't have the Incapacitated condition, and you don't have Disadvantage on the attack roll.",
      ].join("\n"),
    },
    {
      title: "Weapon Mastery",
      body: [
        "Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Daggers and Shortbows.",
        "",
        "Whenever you finish a Long Rest, you can change the kinds of weapons you chose. For example, you could switch to using the mastery properties of Scimitars and Shortswords.",
      ].join("\n"),
    },
  ],
  warlock: [
    {
      title: "Eldritch Invocations",
      body: [
        "You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice, such as Pact of the Chain.",
        "",
        "Replacing and Gaining Invocations. Whenever you gain a Warlock level, you can replace one of your invocations with another one for which you qualify. You can't replace an invocation if it's a prerequisite for another invocation that you have.",
      ].join("\n"),
    },
    {
      title: "Pact Magic",
      body: [
        "Through occult ceremony, you have formed a pact with a mysterious entity to gain magical powers. The entity is a voice in the shadows-its identity unclear-but its boon to you is concrete: the ability to cast spells.",
        "",
        "Cantrips. You know two Warlock cantrips of your choice. Whenever you gain a Warlock level, you can replace one of your cantrips from this feature with another Warlock cantrip of your choice.",
        "",
        "When you reach Warlock levels 4 and 10, you learn another Warlock cantrip of your choice, as shown in the Cantrips column of the Warlock Features table.",
        "",
        "Spell Slots. The Warlock Features table shows how many spell slots you have to cast your Warlock spells of levels 1-5. The table also shows the level of those slots, all of which are the same level. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest.",
      ].join("\n"),
    },
  ],
  barbarian: [
    {
      title: "Rage",
      body: "Use your rage to hit harder and endure damage in melee combat.",
    },
  ],
  fighter: [
    {
      title: "Second Wind",
      body: "Recover hit points once per short rest and stay in the fight longer.",
    },
  ],
  wizard: [
    {
      title: "Arcane Recovery",
      body: "Recover limited spell power after a short rest.",
    },
  ],
  cleric: [
    {
      title: "Divine Domain",
      body: "Gain domain features that shape your divine role in the party.",
    },
  ],
};

function normalizeClassFeatures(classKey) {
  const features = FEATURES_BY_CLASS[classKey];
  if (!features || !Array.isArray(features) || !features.length) return [];
  return features
    .map((f) => ({
      title: String(f?.title || "").trim(),
      body: String(f?.body || "").trim(),
    }))
    .filter((f) => f.title && f.body);
}

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
    classFeatures: normalizeClassFeatures(classKey),
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

function renderClassFeatures(className, features) {
  setText(".class-features-title", `${className} Class Features`);

  const host = document.getElementById("class-features-items") || document.querySelector(".class-features-content");
  if (!host) return;

  host.innerHTML = "";

  const normalized = Array.isArray(features) ? features : [];
  if (!normalized.length) {
    const item = document.createElement("div");
    item.className = "class-feature-item";
    const h4 = document.createElement("h4");
    h4.textContent = "Core Features";
    const body = document.createElement("div");
    body.className = "class-feature-body";
    body.textContent = "Class-specific features are tracked in TaleKeeper.";
    item.appendChild(h4);
    item.appendChild(body);
    host.appendChild(item);
    return;
  }

  for (const feature of normalized) {
    const item = document.createElement("div");
    item.className = "class-feature-item";

    const h4 = document.createElement("h4");
    h4.textContent = feature.title;
    item.appendChild(h4);

    const body = document.createElement("div");
    body.className = "class-feature-body";
    body.textContent = feature.body;
    item.appendChild(body);

    host.appendChild(item);
  }
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

  renderClassFeatures(view.className, view.classFeatures);
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
