# Bastions Spreadsheet

A Google Sheets-like spreadsheet application built with **Vite + TypeScript**. Fully local, browser-based, with IndexedDB persistence and print/PDF support.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)
![License](https://img.shields.io/badge/License-Private-lightgrey)

---

## Features

### Core Spreadsheet
- **26 × 100 cell grid** with column headers (A–Z) and row numbers (1–100)
- **Click-to-select**, double-click or type to edit cells
- **Formula bar** synced with the active cell
- **Keyboard navigation** — Arrow keys, Tab, Enter, Escape, F2
- **Multi-cell selection** — Shift+click, drag-select, column/row selection
- **Delete/Backspace** clears selected cells

### Formula Engine
Full expression parser with operator precedence and nested parentheses:

| Category | Supported |
|----------|-----------|
| **Arithmetic** | `+`, `-`, `*`, `/` |
| **Cell references** | `A1`, `B12`, `AA1` |
| **Range references** | `A1:B5`, `C1:C100` |
| **Math functions** | `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `ABS`, `ROUND` |
| **String functions** | `CONCAT`, `LEN`, `UPPER`, `LOWER` |
| **Logic** | `IF(condition, true_val, false_val)` |
| **Error handling** | `#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#CIRCULAR!` |

Examples:
```
=A1+B2*3
=SUM(A1:A50)
=IF(B1>100, "Over", "Under")
=AVERAGE(C1:C20)
=CONCAT(A1, " ", B1)
```

### Column & Row Resizing
- Drag column header borders to resize width (min 40px)
- Drag row header borders to resize height (min 22px)
- Sizes persist across sessions

### Text Formatting
- **Font size** — 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36
- **Bold** (Ctrl+B), **Italic** (Ctrl+I), **Underline** (Ctrl+U)
- **Text alignment** — left, center, right
- **Text color** and **background color** pickers

### Color Palettes / Themes
Six built-in themes that restyle the entire UI:

| Theme | Description |
|-------|-------------|
| 🌙 Midnight | Dark mode with blue accents |
| 📜 Parchment | Warm beige/sepia (D&D-inspired) |
| 🌊 Ocean | Deep blue-green tones |
| 🌲 Forest | Earthy green theme |
| 💎 Amethyst | Purple/violet accents |
| ⬛ Monochrome | Clean grayscale |

### File Management
- **Save** (Ctrl+S) — saves to browser IndexedDB with toast confirmation
- **Save As** — prompts for a name, creates a named copy
- **Open** — modal dialog listing all saved spreadsheets
- **New** — creates a fresh spreadsheet (saves current first)
- **Delete** — remove saved spreadsheets from storage
- **Auto-save** — debounced (500ms), saves after every change

### Print & PDF
- **Ctrl+P** or Print button opens the browser print dialog
- Print stylesheet hides toolbar, formula bar, and status bar
- Clean grid output suitable for PDF export

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Build tool | Vite 6 |
| Language | TypeScript (strict mode) |
| Styling | Vanilla CSS with custom properties |
| Fonts | Inter, JetBrains Mono (Google Fonts) |
| Storage | IndexedDB (localStorage fallback) |
| Deployment | Azure Static Web Apps (planned) |

---

## Project Structure

```
d:\Code\Bastions\
├── index.html                          # Entry point with toolbar, grid, modal
├── package.json                        # Dependencies & scripts
├── tsconfig.json                       # Strict TypeScript config
├── vite.config.ts                      # Vite config (relative base for SWA)
├── Resources/
│   ├── Bastions.md                     # D&D Bastions reference rules
│   └── bastion-sheet.pdf               # D&D Bastion sheet PDF
├── src/
│   ├── main.ts                         # App bootstrap
│   ├── vite-env.d.ts                   # CSS module type declarations
│   ├── models/
│   │   └── Spreadsheet.ts              # Cell data model & helpers
│   ├── formula/
│   │   └── FormulaEngine.ts            # Tokenizer → Parser → Evaluator
│   ├── grid/
│   │   └── SpreadsheetApp.ts           # Grid rendering, editing, toolbar
│   ├── storage/
│   │   └── StorageManager.ts           # IndexedDB CRUD + auto-save
│   └── styles/
│       ├── index.css                   # Master stylesheet (imports all)
│       ├── variables.css               # 6 theme palettes via CSS vars
│       ├── grid.css                    # Grid, cells, headers, selection
│       ├── toolbar.css                 # Toolbar, formula bar, buttons
│       ├── print.css                   # @media print rules
│       └── modal.css                   # File manager modal & save toast
└── dist/                               # Production build output
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm 9+

### Install & Run
```bash
cd d:\Code\Bastions
npm install
npm run dev
```
Open **http://localhost:5173/** in your browser.

### Production Build
```bash
npm run build
```
Output goes to `dist/` — ready for Azure Static Web App deployment.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow keys | Navigate cells |
| Tab / Shift+Tab | Move right / left |
| Enter | Edit cell / confirm & move down |
| Escape | Cancel edit |
| F2 | Edit current cell |
| Delete / Backspace | Clear selected cells |
| Shift+Click / Shift+Arrow | Extend selection |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |
| Ctrl+S | Save |
| Ctrl+P | Print / PDF |

---

## Roadmap

- [ ] Azure Static Web App deployment (`staticwebapp.config.json`)
- [ ] Number formatting (currency, percentage, decimal places)
- [ ] Print preview dialog with paper size/orientation options
- [ ] CSV/JSON export & import
- [ ] Undo/Redo stack
- [ ] Copy/Paste support
- [ ] Right-click context menu
