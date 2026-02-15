# Bastions Static Character Viewer

This repo now contains a lightweight static frontend for viewing TaleKeeper characters:

- `list.html` lists characters from `https://api.talekeeper.org`.
- `index.html` renders a selected character in printable sheet format.
- `proficiencies.html` edits `users_stats.proficiencies` for a character (requires auth token).

`index.html` sidebar extras:
- XP
- Feats
- God + Piety score
- Highest-ranked Allegiance (derived from `factions`, if any rank > 0)

## Files Kept

- `list.html`
- `list.js`
- `index.html`
- `index.js`
- `proficiencies.html`
- `proficiencies.js`
- `styles.css`
- `PRD-local-character-editor.md`
- `staticwebapp.config.json`

## How It Works

1. Open `list.html`.
2. Provide a PocketBase auth token (if records are not publicly listable).
3. Click **Open Sheet** for a character.
4. `index.html` loads `?characterId=<id>` and renders the sheet.

## Password Login + Reset (Optional)

If you enable `users` password auth in PocketBase, `list.html` can log in with email/password.

If a user fails to authenticate, `list.html` can request a password reset email via PocketBase:
- `POST /api/collections/users/request-password-reset`

This repo also includes `reset-password.html`, which can complete the reset if you configure your
PocketBase password reset email template to link to it, e.g.:
- `https://<your-static-app>/reset-password.html?token={TOKEN}`

## Local Run

Any static server works. Example with Python:

```bash
cd d:\Code\Bastions
python -m http.server 8080
```

Then open `http://localhost:8080/list.html`.

## Azure Static Web Apps

The workflow at `.github/workflows/azure-static-web-apps-polite-smoke-0bc4bc310.yml` is configured for direct static upload (no build step).

`staticwebapp.config.json` rewrites `/` to `list.html`.
