# Prompt Rules for Generating D&D Card Content

Use the following strict rules when generating lists of game items (Weapons, Spells, Species, Backgrounds, etc.) into a structured JSON format. This JSON will be fed into our generator script to turn them into double-sided printable cards.

## 1. General Rules
- Output exactly valid JSON. The JSON should be an array of objects.
- Each object must have a `type` field to indicate its category (`"weapon"`, `"spell"`, `"species"`, `"background"`).
- All string values must be plain text or contain basic HTML tags (`<strong>`, `<em>`, `<br>`) if formatting is needed. Do not use Markdown inside the JSON string values.

## 2. Specific Type Rules

### a) Type: "spell"
Fields required:
- `title`: Spell name in uppercase (e.g., "FIREBALL").
- `subtitle`: Level and school (e.g., "3rd-Level Evocation").
- `casting_time`: Action cost (e.g., "1 Action").
- `range`: Range in feet (e.g., "150 Feet").
- `vsm`: Verbal, Somatic, Material letters (e.g., "V, S, M").
- `front_body`: The main spell description. Keep it concise enough to fit on a card.
- `back_title`: Same as `title`.
- `back_subtitle`: Typically "Spell Components" or "At Higher Levels".
- `back_body`: **MANDATORY**: List the detailed material components (e.g., "A tiny ball of bat guano and sulfur"). Also include the "At Higher Levels" casting trait if applicable.

### b) Type: "weapon"
Fields required:
- `title`: Weapon name in uppercase (e.g., "GREATAXE").
- `subtitle`: Weapon category (e.g., "Weapon (Martial Melee)").
- `range_or_props`: Properties like "Heavy, Two-Handed" or "Range 20/60".
- `front_body`: Explanatory text, plus the **Mastery Property** (e.g., "<h3>Mastery Property: Cleave</h3> <p>...</p>").
- `damage_roll`: The dice (e.g., "1d12").
- `damage_type`: The type (e.g., "Slashing").
- `back_title`: Same as `title`.
- `back_subtitle`: "Damage".

### c) Type: "species"
Fields required:
- `title`: Species name in uppercase (e.g., "DRAGONBORN").
- `subtitle`: Subtitle, e.g., "Species Traits".
- `traits`: A short summary of movement speed, size, and main traits.
- `front_body`: Detailed feature descriptions (e.g., Breath Weapon).
- `back_title`: Same as `title`.
- `back_subtitle`: Lore or secondary abilities.
- `back_body`: Any lore, ancestry details, or secondary active abilities.

### d) Type: "background"
Fields required:
- `title`: Background name in uppercase (e.g., "CRIMINAL").
- `subtitle`: "Background".
- `skills`: Skill proficiencies gained.
- `tools`: Tool proficiencies gained.
- `front_body`: Description of the background feature (e.g., "Criminal Contact") and starting equipment.
- `back_title`: Same as `title`.
- `back_subtitle`: "Personality & Flaws".
- `back_body`: Recommended distinct personality traits, bonds, ideals, and flaws.

## Output Example
```json
[
  {
    "type": "spell",
    "title": "FIREBALL",
    "subtitle": "3rd-Level Evocation",
    "casting_time": "1 Action",
    "range": "150 Feet",
    "vsm": "V, S, M",
    "front_body": "<p>A bright streak flashes from your pointing finger to a point you choose...</p>",
    "back_title": "FIREBALL",
    "back_subtitle": "Components & Higher Levels",
    "back_body": "<p><strong>Materials:</strong> A tiny ball of bat guano and sulfur.</p><p><strong>At Higher Levels:</strong> When you cast this spell using a spell slot of 4th level or higher...</p>"
  }
]
```
