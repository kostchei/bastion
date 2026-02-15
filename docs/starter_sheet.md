# Starter Sheet (Local Viewer)

Static HTML/JS pages for browsing TaleKeeper characters and rendering a printable "starter sheet".

## What's Here

- `list.html` + `list.js`: Character list UI (loads from `https://api.talekeeper.org/api/collections/users_stats/records`).
- `index.html` + `index.js`: Printable sheet renderer (loads `?characterId=<id>`).
- `styles.css`: Sheet styling.

## Recent Updates (Sidebar / Right Column)

The right-hand "features" column in `index.html` now shows:

- **Feats** (from `feats`)
- **God** + **Piety** (from `piety_deity`, `piety_score`)
- **Highest-ranked Allegiance** (derived from `factions`; hidden if none have rank > 0)
- **XP** (from `xp`)

Also removed the "Gaining a Level" placeholder from that section.

## How To Use

1. Open `list.html`.
2. Paste a PocketBase auth token (if needed) and refresh the list.
3. Click **Open Sheet**.

## Note On Repo Location

`d:\\Code\\Bastions` is already a git repo with a configured GitHub remote and appears to be the canonical home for this work.
If you want a single source of truth, migrate ongoing edits there and treat this folder as a staging copy.

