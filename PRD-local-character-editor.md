# PRD: PocketBase Character List + Printable Sheet Renderer

## 1. Overview
Build a local viewer flow that reads characters from the live TaleKeeper PocketBase server and renders them in the existing printable sheet layout.

Requested flow:
1. Open a local `list.html` page.
2. Fetch character records from `https://api.talekeeper.org`.
3. Select a character from the list.
4. Open `index.html` and render that character in the existing format.

## 2. Goals
- Keep the existing printable layout in `index.html`.
- Add a local character picker page (`list.html`).
- Pull live character data from PocketBase (`users_stats` collection).
- Support authenticated access for non-public records.

## 3. Non-Goals (V1)
- Editing/saving characters from this repo.
- Replacing TaleKeeper app auth flows.
- Full DnD automation for every derived number.

## 4. Data Source
- API base: `https://api.talekeeper.org`
- Collection: `users_stats`
- Primary endpoints:
  - `GET /api/collections/users_stats/records`
  - `GET /api/collections/users_stats/records/:id`
  - Optional auth endpoint for superusers:
    - `POST /api/collections/_superusers/auth-with-password`

## 5. Auth Reality and Constraints
- `users` password auth is disabled on the live server.
- Unauthenticated list access may return empty results due collection rules.
- Therefore `list.html` must support token-based access (paste JWT token) and optional superuser login.

## 6. Pages and Responsibilities

### 6.1 `list.html`
- Displays characters retrieved from `users_stats`.
- Supports:
  - Manual auth token paste and save (localStorage).
  - Optional superuser auth form (identity/password).
  - Refresh list action.
- Each row links to:
  - `index.html?characterId=<recordId>`

### 6.2 `index.html`
- Keeps current sheet visual layout.
- Loads a selected record id from URL query.
- Calls PocketBase record endpoint and maps fields into sheet elements.
- Keeps existing print mode toggle.

## 7. Mapping Rules (V1)
- Source fields:
  - `character_name`, `class_name`, `species`, `background`
  - `strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`
  - `hp`, `max_hp`, `levels`, `updated`
- Derived values:
  - Ability modifiers from ability scores.
  - Level from `levels` JSON sum (fallbacks if empty).
  - Proficiency bonus from level.
  - Saves from ability mods plus class save proficiency defaults.
  - Skills from ability modifier mapping.
  - Initiative from DEX mod.
  - Melee/Ranged attack from STR/DEX mod + proficiency.

## 8. UX Requirements
- `list.html`:
  - Clear status text for auth/list/load failures.
  - Empty-state guidance when no visible records are returned.
  - Table columns: Name, Class, Level, Species, Updated, Action.
- `index.html`:
  - Status badge for load state/errors.
  - Back link to `list.html`.
  - Non-destructive fallback if record cannot be loaded.

## 9. Storage
- Local browser storage keys:
  - `tk_pb_token`
  - `tk_pb_auth_model` (optional metadata)
- No credentials are written into repository files.

## 10. Acceptance Criteria
1. `list.html` loads and attempts a character list from `https://api.talekeeper.org`.
2. With valid auth token, list displays accessible `users_stats` records.
3. Clicking/opening a row loads `index.html?characterId=<id>`.
4. `index.html` fetches and renders the selected record.
5. Print mode still functions.
6. Errors are shown clearly for missing auth or inaccessible records.

## 11. Implementation Notes
- Keep static frontend only (no local backend required for this version).
- Use plain JS with `fetch`.
- Keep CSS changes minimal; preserve existing sheet design.

## 12. Run Notes
- Serve files locally from this repo (recommended) or open directly in browser.
- Entry point for selection:
  - `list.html`
