import {
    type SpreadsheetState,
    type CellData,
    type CellStyle,
    createSpreadsheet,
    getCell,
    colToLetter,
    cellKey,
} from '../models/Spreadsheet';
import { processCell, DependencyGraph } from '../formula/FormulaEngine';
import { createAutoSave, loadSpreadsheet, saveSpreadsheet, listSpreadsheets, deleteSpreadsheet } from '../storage/StorageManager';

/* ============ App State ============ */

interface AppState {
    spreadsheet: SpreadsheetState;
    depGraph: DependencyGraph;
    selectedCell: { row: number; col: number };
    selectionRange: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
    isEditing: boolean;
    autoSave: (state: SpreadsheetState) => void;
}

let app: AppState;

/* ============ DOM References ============ */

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/* ============ Initialize ============ */

export async function initApp(): Promise<void> {
    const loaded = await loadSpreadsheet('Untitled Spreadsheet');
    const spreadsheet = loaded ?? createSpreadsheet();

    app = {
        spreadsheet,
        depGraph: new DependencyGraph(),
        selectedCell: { row: 0, col: 0 },
        selectionRange: null,
        isEditing: false,
        autoSave: createAutoSave(500),
    };

    // Re-process formulas on load to rebuild dependency graph
    for (const [key, cell] of app.spreadsheet.cells) {
        if (cell.type === 'formula') {
            processCell(key, cell.raw, app.spreadsheet, app.depGraph);
        }
    }

    applyTheme(app.spreadsheet.activeTheme);
    renderGrid();
    wireToolbar();
    wireFormulaBar();
    wireKeyboard();
    selectCell(0, 0);

    // Set sheet name
    const nameInput = $<HTMLInputElement>('sheet-name');
    nameInput.value = app.spreadsheet.name;
    nameInput.addEventListener('change', () => {
        app.spreadsheet.name = nameInput.value;
        app.autoSave(app.spreadsheet);
    });

    updateStatusBar('Ready');
}

/* ============ Theme ============ */

function applyTheme(theme: string): void {
    const appEl = $<HTMLDivElement>('app');
    // Remove all theme classes
    appEl.className = '';
    appEl.classList.add(`theme-${theme}`);
    app.spreadsheet.activeTheme = theme;

    const select = $<HTMLSelectElement>('palette-select');
    select.value = theme;
}

/* ============ Grid Rendering ============ */

function renderGrid(): void {
    const container = $<HTMLDivElement>('grid-container');
    const { numCols, numRows, columnWidths, rowHeights } = app.spreadsheet;

    const table = document.createElement('table');
    table.className = 'grid-table';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Corner cell
    const corner = document.createElement('th');
    corner.className = 'grid-corner';
    headerRow.appendChild(corner);

    // Column headers
    for (let c = 0; c < numCols; c++) {
        const th = document.createElement('th');
        th.className = 'col-header';
        th.style.width = `${columnWidths[c]}px`;
        th.textContent = colToLetter(c);
        th.dataset.col = String(c);

        // Resize handle
        const handle = document.createElement('div');
        handle.className = 'col-resize-handle';
        handle.addEventListener('mousedown', (e) => startColResize(e, c));
        th.appendChild(handle);

        // Column header click to select column
        th.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).classList.contains('col-resize-handle')) {
                selectColumn(c);
            }
        });

        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Data rows
    const tbody = document.createElement('tbody');
    for (let r = 0; r < numRows; r++) {
        const tr = document.createElement('tr');
        tr.style.height = `${rowHeights[r]}px`;

        // Row header
        const rowHeader = document.createElement('td');
        rowHeader.className = 'row-header';
        rowHeader.textContent = String(r + 1);
        rowHeader.dataset.row = String(r);

        // Row resize handle
        const rowHandle = document.createElement('div');
        rowHandle.className = 'row-resize-handle';
        rowHandle.addEventListener('mousedown', (e) => startRowResize(e, r));
        rowHeader.appendChild(rowHandle);

        rowHeader.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).classList.contains('row-resize-handle')) {
                selectRow(r);
            }
        });

        tr.appendChild(rowHeader);

        // Cells
        for (let c = 0; c < numCols; c++) {
            const td = document.createElement('td');
            td.className = 'cell';
            td.dataset.row = String(r);
            td.dataset.col = String(c);

            const key = cellKey(r, c);
            const cell = app.spreadsheet.cells.get(key);
            if (cell && cell.type !== 'empty') {
                td.textContent = cell.computed || cell.raw;
                applyCellStyle(td, cell.style);
                if (cell.error) {
                    td.classList.add('has-error');
                    td.textContent = cell.error;
                }
                if (cell.type === 'formula') {
                    td.classList.add('has-formula');
                }
            }

            // Click to select
            td.addEventListener('mousedown', (e) => {
                if (e.shiftKey) {
                    extendSelection(r, c);
                } else {
                    commitEdit();
                    selectCell(r, c);
                    startDragSelect(r, c);
                }
            });

            // Double click to edit
            td.addEventListener('dblclick', () => {
                startEditing();
            });

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
}

function applyCellStyle(td: HTMLElement, style: CellStyle): void {
    if (style.fontSize && style.fontSize !== 12) {
        td.style.fontSize = `${style.fontSize}px`;
        td.style.lineHeight = `${Math.max(style.fontSize + 8, 28)}px`;
    }
    if (style.fontWeight !== 'normal') td.style.fontWeight = style.fontWeight;
    if (style.fontStyle !== 'normal') td.style.fontStyle = style.fontStyle;
    if (style.textDecoration !== 'none') td.style.textDecoration = style.textDecoration;
    if (style.textAlign !== 'left') td.style.textAlign = style.textAlign;
    if (style.color) td.style.color = style.color;
    if (style.backgroundColor) td.style.backgroundColor = style.backgroundColor;
}

/* ============ Cell Selection ============ */

function selectCell(row: number, col: number): void {
    // Clear previous selection
    document.querySelectorAll('.cell.selected, .cell.in-range').forEach(el => {
        el.classList.remove('selected', 'in-range');
    });
    document.querySelectorAll('.col-header.selected, .row-header.selected').forEach(el => {
        el.classList.remove('selected');
    });

    app.selectedCell = { row, col };
    app.selectionRange = null;

    const td = getCellElement(row, col);
    if (td) td.classList.add('selected');

    // Highlight column/row headers
    const colHeader = document.querySelector(`.col-header[data-col="${col}"]`);
    const rowHeader = document.querySelector(`.row-header[data-row="${row}"]`);
    if (colHeader) colHeader.classList.add('selected');
    if (rowHeader) rowHeader.classList.add('selected');

    // Update formula bar
    const key = cellKey(row, col);
    $<HTMLDivElement>('cell-address').textContent = key;
    const cell = app.spreadsheet.cells.get(key);
    $<HTMLInputElement>('formula-input').value = cell?.raw ?? '';

    // Update toolbar to reflect cell style
    updateToolbarFromCell(cell);
}

function extendSelection(row: number, col: number): void {
    app.selectionRange = {
        startRow: app.selectedCell.row,
        startCol: app.selectedCell.col,
        endRow: row,
        endCol: col,
    };
    highlightRange();
}

function highlightRange(): void {
    document.querySelectorAll('.cell.in-range').forEach(el => el.classList.remove('in-range'));

    if (!app.selectionRange) return;

    const { startRow, startCol, endRow, endCol } = app.selectionRange;
    const minR = Math.min(startRow, endRow);
    const maxR = Math.max(startRow, endRow);
    const minC = Math.min(startCol, endCol);
    const maxC = Math.max(startCol, endCol);

    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const td = getCellElement(r, c);
            if (td) td.classList.add('in-range');
        }
    }
}

function selectColumn(col: number): void {
    selectCell(0, col);
    app.selectionRange = {
        startRow: 0,
        startCol: col,
        endRow: app.spreadsheet.numRows - 1,
        endCol: col,
    };
    highlightRange();
}

function selectRow(row: number): void {
    selectCell(row, 0);
    app.selectionRange = {
        startRow: row,
        startCol: 0,
        endRow: row,
        endCol: app.spreadsheet.numCols - 1,
    };
    highlightRange();
}

// Drag select
function startDragSelect(startRow: number, startCol: number): void {
    const onMove = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const td = target.closest('.cell') as HTMLTableCellElement | null;
        if (td && td.dataset.row && td.dataset.col) {
            const r = parseInt(td.dataset.row);
            const c = parseInt(td.dataset.col);
            if (r !== startRow || c !== startCol) {
                app.selectionRange = {
                    startRow,
                    startCol,
                    endRow: r,
                    endCol: c,
                };
                highlightRange();
            }
        }
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        updateStatusSummary();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

/* ============ Cell Editing ============ */

function startEditing(): void {
    if (app.isEditing) return;
    app.isEditing = true;

    const { row, col } = app.selectedCell;
    const td = getCellElement(row, col);
    if (!td) return;

    td.classList.add('editing');

    const key = cellKey(row, col);
    const cell = app.spreadsheet.cells.get(key);

    const input = document.createElement('input');
    input.className = 'cell-editor';
    input.type = 'text';
    input.value = cell?.raw ?? '';
    input.spellcheck = false;

    // Inherit cell style
    if (cell) {
        if (cell.style.fontSize !== 12) input.style.fontSize = `${cell.style.fontSize}px`;
        if (cell.style.fontWeight !== 'normal') input.style.fontWeight = cell.style.fontWeight;
        if (cell.style.fontStyle !== 'normal') input.style.fontStyle = cell.style.fontStyle;
        if (cell.style.textAlign !== 'left') input.style.textAlign = cell.style.textAlign;
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
            moveSelection(1, 0); // Move down
        } else if (e.key === 'Escape') {
            cancelEdit();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            commitEdit();
            moveSelection(0, e.shiftKey ? -1 : 1);
        }
    });

    // Sync with formula bar
    input.addEventListener('input', () => {
        $<HTMLInputElement>('formula-input').value = input.value;
    });

    td.textContent = '';
    td.appendChild(input);
    input.focus();
    input.select();
}

function commitEdit(): void {
    if (!app.isEditing) return;
    app.isEditing = false;

    const { row, col } = app.selectedCell;
    const td = getCellElement(row, col);
    if (!td) return;

    const input = td.querySelector('.cell-editor') as HTMLInputElement | null;
    if (!input) return;

    const raw = input.value;
    const key = cellKey(row, col);

    // Process cell value (formula evaluation, dependency tracking)
    processCell(key, raw, app.spreadsheet, app.depGraph);

    // Update this cell display
    updateCellDisplay(row, col);

    // Sync update dependents
    updateDependentDisplays(key);

    td.classList.remove('editing');
    app.autoSave(app.spreadsheet);
}

function updateDependentDisplays(changedKey: string): void {
    const dependents = app.depGraph.getDependents(changedKey);
    for (const depKey of dependents) {
        const match = depKey.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            let c = 0;
            for (let i = 0; i < match[1].length; i++) {
                c = c * 26 + (match[1].charCodeAt(i) - 64);
            }
            c -= 1;
            const r = parseInt(match[2], 10) - 1;
            updateCellDisplay(r, c);
        }
    }
}

function cancelEdit(): void {
    if (!app.isEditing) return;
    app.isEditing = false;

    const { row, col } = app.selectedCell;
    const td = getCellElement(row, col);
    if (!td) return;

    td.classList.remove('editing');
    updateCellDisplay(row, col);
}

function updateCellDisplay(row: number, col: number): void {
    const td = getCellElement(row, col);
    if (!td) return;

    const key = cellKey(row, col);
    const cell = app.spreadsheet.cells.get(key);

    // Remove existing children
    td.textContent = '';
    td.classList.remove('has-formula', 'has-error', 'editing');
    td.style.cssText = '';

    if (cell && cell.type !== 'empty') {
        td.textContent = cell.computed || cell.raw;
        applyCellStyle(td, cell.style);
        if (cell.error) {
            td.classList.add('has-error');
            td.textContent = cell.error;
        }
        if (cell.type === 'formula') {
            td.classList.add('has-formula');
        }
    }
}

/* ============ Cell Navigation ============ */

function moveSelection(dRow: number, dCol: number): void {
    const newRow = Math.max(0, Math.min(app.spreadsheet.numRows - 1, app.selectedCell.row + dRow));
    const newCol = Math.max(0, Math.min(app.spreadsheet.numCols - 1, app.selectedCell.col + dCol));
    selectCell(newRow, newCol);

    // Scroll into view
    const td = getCellElement(newRow, newCol);
    if (td) td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ============ Column/Row Resizing ============ */

function startColResize(e: MouseEvent, col: number): void {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = app.spreadsheet.columnWidths[col];
    const handle = e.target as HTMLElement;
    handle.classList.add('active');

    const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(40, startWidth + delta);
        app.spreadsheet.columnWidths[col] = newWidth;

        // Update column header width
        const th = document.querySelector(`.col-header[data-col="${col}"]`) as HTMLElement;
        if (th) th.style.width = `${newWidth}px`;

        // Update all cells in this column
        const table = document.querySelector('.grid-table') as HTMLTableElement;
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[col + 1]) { // +1 for row header
                    (cells[col + 1] as HTMLElement).style.width = `${newWidth}px`;
                }
            });
        }
    };

    const onUp = () => {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        app.autoSave(app.spreadsheet);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function startRowResize(e: MouseEvent, row: number): void {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = app.spreadsheet.rowHeights[row];
    const handle = e.target as HTMLElement;
    handle.classList.add('active');

    const onMove = (ev: MouseEvent) => {
        const delta = ev.clientY - startY;
        const newHeight = Math.max(22, startHeight + delta);
        app.spreadsheet.rowHeights[row] = newHeight;

        // Update row height
        const table = document.querySelector('.grid-table') as HTMLTableElement;
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.rows[row]) {
                (tbody.rows[row] as HTMLElement).style.height = `${newHeight}px`;
            }
        }
    };

    const onUp = () => {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        app.autoSave(app.spreadsheet);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

/* ============ Toolbar ============ */

function wireToolbar(): void {
    // Font size
    $<HTMLSelectElement>('font-size').addEventListener('change', (e) => {
        const size = parseInt((e.target as HTMLSelectElement).value);
        applyStyleToSelection(style => { style.fontSize = size; });
    });

    // Bold
    $<HTMLButtonElement>('btn-bold').addEventListener('click', () => {
        toggleStyle('fontWeight', 'bold', 'normal');
        $<HTMLButtonElement>('btn-bold').classList.toggle('active');
    });

    // Italic
    $<HTMLButtonElement>('btn-italic').addEventListener('click', () => {
        toggleStyle('fontStyle', 'italic', 'normal');
        $<HTMLButtonElement>('btn-italic').classList.toggle('active');
    });

    // Underline
    $<HTMLButtonElement>('btn-underline').addEventListener('click', () => {
        toggleStyle('textDecoration', 'underline', 'none');
        $<HTMLButtonElement>('btn-underline').classList.toggle('active');
    });

    // Alignment
    $<HTMLButtonElement>('btn-align-left').addEventListener('click', () => {
        applyStyleToSelection(style => { style.textAlign = 'left'; });
    });
    $<HTMLButtonElement>('btn-align-center').addEventListener('click', () => {
        applyStyleToSelection(style => { style.textAlign = 'center'; });
    });
    $<HTMLButtonElement>('btn-align-right').addEventListener('click', () => {
        applyStyleToSelection(style => { style.textAlign = 'right'; });
    });

    // Text color
    $<HTMLButtonElement>('btn-text-color').addEventListener('click', () => {
        $<HTMLInputElement>('text-color-input').click();
    });
    $<HTMLInputElement>('text-color-input').addEventListener('input', (e) => {
        const color = (e.target as HTMLInputElement).value;
        $<HTMLSpanElement>('text-color-indicator').style.background = color;
        applyStyleToSelection(style => { style.color = color; });
    });

    // Background color
    $<HTMLButtonElement>('btn-bg-color').addEventListener('click', () => {
        $<HTMLInputElement>('bg-color-input').click();
    });
    $<HTMLInputElement>('bg-color-input').addEventListener('input', (e) => {
        const color = (e.target as HTMLInputElement).value;
        $<HTMLSpanElement>('bg-color-indicator').style.background = color;
        applyStyleToSelection(style => { style.backgroundColor = color; });
    });

    // Palette
    $<HTMLSelectElement>('palette-select').addEventListener('change', (e) => {
        const theme = (e.target as HTMLSelectElement).value;
        applyTheme(theme);
        app.autoSave(app.spreadsheet);
    });

    // Print
    $<HTMLButtonElement>('btn-print').addEventListener('click', () => {
        window.print();
    });

    // New spreadsheet
    $<HTMLButtonElement>('btn-new').addEventListener('click', () => {
        if (confirm('Create a new spreadsheet? Current work will be saved first.')) {
            saveSpreadsheet(app.spreadsheet).then(() => {
                app.spreadsheet = createSpreadsheet('Untitled Spreadsheet');
                app.depGraph = new DependencyGraph();
                $<HTMLInputElement>('sheet-name').value = app.spreadsheet.name;
                renderGrid();
                selectCell(0, 0);
                updateStatusBar('New spreadsheet created');
            });
        }
    });

    // Save
    $<HTMLButtonElement>('btn-save').addEventListener('click', () => {
        doSave();
    });

    // Save As
    $<HTMLButtonElement>('btn-save-as').addEventListener('click', () => {
        doSaveAs();
    });

    // Open
    $<HTMLButtonElement>('btn-open').addEventListener('click', () => {
        openFileManager();
    });

    // File manager modal close
    $<HTMLButtonElement>('file-modal-close').addEventListener('click', closeFileManager);
    $<HTMLButtonElement>('file-modal-cancel').addEventListener('click', closeFileManager);
    $<HTMLDivElement>('file-modal-overlay').addEventListener('click', (e) => {
        if (e.target === $<HTMLDivElement>('file-modal-overlay')) closeFileManager();
    });
}

/* ============ Save / Open ============ */

async function doSave(): Promise<void> {
    await saveSpreadsheet(app.spreadsheet);
    showSaveToast();
    updateStatusBar(`Saved "${app.spreadsheet.name}"`);
}

async function doSaveAs(): Promise<void> {
    const newName = prompt('Save spreadsheet as:', app.spreadsheet.name);
    if (!newName || newName.trim() === '') return;

    app.spreadsheet.name = newName.trim();
    $<HTMLInputElement>('sheet-name').value = app.spreadsheet.name;
    await saveSpreadsheet(app.spreadsheet);
    showSaveToast();
    updateStatusBar(`Saved as "${app.spreadsheet.name}"`);
}

function showSaveToast(): void {
    const toast = $<HTMLDivElement>('save-toast');
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
}

async function openFileManager(): Promise<void> {
    const overlay = $<HTMLDivElement>('file-modal-overlay');
    const fileList = $<HTMLDivElement>('file-list');
    const fileEmpty = $<HTMLDivElement>('file-empty');

    // Save current work first
    await saveSpreadsheet(app.spreadsheet);

    // List all saved spreadsheets
    const names = await listSpreadsheets();

    fileList.innerHTML = '';

    if (names.length === 0) {
        fileList.style.display = 'none';
        fileEmpty.style.display = 'block';
    } else {
        fileList.style.display = 'flex';
        fileEmpty.style.display = 'none';

        for (const name of names) {
            const item = document.createElement('div');
            item.className = 'file-item';

            const isActive = name === app.spreadsheet.name;

            item.innerHTML = `
                <div class="file-item-icon">${isActive ? '📝' : '📄'}</div>
                <div class="file-item-info">
                    <div class="file-item-name">${escapeHtml(String(name))}</div>
                    <div class="file-item-meta">${isActive ? 'Currently open' : 'Click to open'}</div>
                </div>
                <div class="file-item-actions">
                    <button class="file-item-btn delete" title="Delete">🗑️</button>
                </div>
            `;

            // Open on click
            item.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.closest('.file-item-btn')) return; // Don't open if clicking delete
                loadSpreadsheetByName(String(name));
                closeFileManager();
            });

            // Delete button
            const deleteBtn = item.querySelector('.file-item-btn.delete') as HTMLButtonElement;
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${name}"? This cannot be undone.`)) {
                    await deleteSpreadsheet(String(name));
                    // If we deleted the current file, create a new one
                    if (name === app.spreadsheet.name) {
                        app.spreadsheet = createSpreadsheet('Untitled Spreadsheet');
                        app.depGraph = new DependencyGraph();
                        $<HTMLInputElement>('sheet-name').value = app.spreadsheet.name;
                        renderGrid();
                        selectCell(0, 0);
                    }
                    // Refresh the list
                    openFileManager();
                }
            });

            fileList.appendChild(item);
        }
    }

    overlay.style.display = 'flex';
}

function closeFileManager(): void {
    $<HTMLDivElement>('file-modal-overlay').style.display = 'none';
}

async function loadSpreadsheetByName(name: string): Promise<void> {
    const loaded = await loadSpreadsheet(name);
    if (!loaded) {
        updateStatusBar(`Could not find "${name}"`);
        return;
    }

    app.spreadsheet = loaded;
    app.depGraph = new DependencyGraph();

    // Re-process formulas to rebuild dependency graph
    for (const [key, cell] of app.spreadsheet.cells) {
        if (cell.type === 'formula') {
            processCell(key, cell.raw, app.spreadsheet, app.depGraph);
        }
    }

    $<HTMLInputElement>('sheet-name').value = app.spreadsheet.name;
    applyTheme(app.spreadsheet.activeTheme);
    renderGrid();
    selectCell(0, 0);
    updateStatusBar(`Opened "${name}"`);
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateToolbarFromCell(cell: CellData | undefined): void {
    const style = cell?.style;
    $<HTMLSelectElement>('font-size').value = String(style?.fontSize ?? 12);
    $<HTMLButtonElement>('btn-bold').classList.toggle('active', style?.fontWeight === 'bold');
    $<HTMLButtonElement>('btn-italic').classList.toggle('active', style?.fontStyle === 'italic');
    $<HTMLButtonElement>('btn-underline').classList.toggle('active', style?.textDecoration === 'underline');
}

function applyStyleToSelection(modifier: (style: CellStyle) => void): void {
    const cells = getSelectedCells();
    for (const key of cells) {
        const cell = getCell(app.spreadsheet, key);
        modifier(cell.style);
        const match = key.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            let c = 0;
            for (let i = 0; i < match[1].length; i++) c = c * 26 + (match[1].charCodeAt(i) - 64);
            c -= 1;
            const r = parseInt(match[2], 10) - 1;
            updateCellDisplay(r, c);
        }
    }
    app.autoSave(app.spreadsheet);
}

function toggleStyle<K extends keyof CellStyle>(
    prop: K,
    onVal: CellStyle[K],
    offVal: CellStyle[K],
): void {
    const key = cellKey(app.selectedCell.row, app.selectedCell.col);
    const cell = getCell(app.spreadsheet, key);
    const newVal = cell.style[prop] === onVal ? offVal : onVal;
    applyStyleToSelection(style => { (style[prop] as CellStyle[K]) = newVal; });
}

function getSelectedCells(): string[] {
    if (app.selectionRange) {
        const { startRow, startCol, endRow, endCol } = app.selectionRange;
        const minR = Math.min(startRow, endRow);
        const maxR = Math.max(startRow, endRow);
        const minC = Math.min(startCol, endCol);
        const maxC = Math.max(startCol, endCol);
        const keys: string[] = [];
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                keys.push(cellKey(r, c));
            }
        }
        return keys;
    }
    return [cellKey(app.selectedCell.row, app.selectedCell.col)];
}

/* ============ Formula Bar ============ */

function wireFormulaBar(): void {
    const formulaInput = $<HTMLInputElement>('formula-input');

    formulaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const key = cellKey(app.selectedCell.row, app.selectedCell.col);
            processCell(key, formulaInput.value, app.spreadsheet, app.depGraph);
            updateCellDisplay(app.selectedCell.row, app.selectedCell.col);
            updateDependentDisplays(key);
            app.autoSave(app.spreadsheet);
            moveSelection(1, 0);
        } else if (e.key === 'Escape') {
            const key = cellKey(app.selectedCell.row, app.selectedCell.col);
            const cell = app.spreadsheet.cells.get(key);
            formulaInput.value = cell?.raw ?? '';
            formulaInput.blur();
        }
    });

    formulaInput.addEventListener('focus', () => {
        // When formula bar is focused, also check if currently editing a cell
        if (app.isEditing) {
            commitEdit();
        }
    });
}

/* ============ Keyboard ============ */

function wireKeyboard(): void {
    document.addEventListener('keydown', (e) => {
        // Don't intercept if typing in formula bar or sheet name
        const target = e.target as HTMLElement;
        if (target.id === 'formula-input' || target.id === 'sheet-name') return;

        // If editing a cell, let the cell editor handle it
        if (app.isEditing && target.classList.contains('cell-editor')) return;

        // Navigation
        if (!app.isEditing) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (e.shiftKey) extendSelection(Math.max(0, (app.selectionRange?.endRow ?? app.selectedCell.row) - 1), app.selectionRange?.endCol ?? app.selectedCell.col);
                    else moveSelection(-1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (e.shiftKey) extendSelection(Math.min(app.spreadsheet.numRows - 1, (app.selectionRange?.endRow ?? app.selectedCell.row) + 1), app.selectionRange?.endCol ?? app.selectedCell.col);
                    else moveSelection(1, 0);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (e.shiftKey) extendSelection(app.selectionRange?.endRow ?? app.selectedCell.row, Math.max(0, (app.selectionRange?.endCol ?? app.selectedCell.col) - 1));
                    else moveSelection(0, -1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (e.shiftKey) extendSelection(app.selectionRange?.endRow ?? app.selectedCell.row, Math.min(app.spreadsheet.numCols - 1, (app.selectionRange?.endCol ?? app.selectedCell.col) + 1));
                    else moveSelection(0, 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    startEditing();
                    break;
                case 'Tab':
                    e.preventDefault();
                    moveSelection(0, e.shiftKey ? -1 : 1);
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    deleteSelectedCells();
                    break;
                case 'F2':
                    e.preventDefault();
                    startEditing();
                    break;
            }

            // Ctrl shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        $<HTMLButtonElement>('btn-bold').click();
                        break;
                    case 'i':
                        e.preventDefault();
                        $<HTMLButtonElement>('btn-italic').click();
                        break;
                    case 'u':
                        e.preventDefault();
                        $<HTMLButtonElement>('btn-underline').click();
                        break;
                    case 'p':
                        e.preventDefault();
                        window.print();
                        break;
                    case 's':
                        e.preventDefault();
                        doSave();
                        break;
                }
                return;
            }

            // Start editing on any printable character
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                startEditing();
                // The character will be captured by the editor
            }
        }
    });
}

function deleteSelectedCells(): void {
    const cells = getSelectedCells();
    for (const key of cells) {
        processCell(key, '', app.spreadsheet, app.depGraph);
        const match = key.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            let c = 0;
            for (let i = 0; i < match[1].length; i++) c = c * 26 + (match[1].charCodeAt(i) - 64);
            c -= 1;
            const r = parseInt(match[2], 10) - 1;
            updateCellDisplay(r, c);
            updateDependentDisplays(key);
        }
    }
    app.autoSave(app.spreadsheet);

    // Update formula bar
    const key = cellKey(app.selectedCell.row, app.selectedCell.col);
    const cell = app.spreadsheet.cells.get(key);
    $<HTMLInputElement>('formula-input').value = cell?.raw ?? '';
}

/* ============ Status Bar ============ */

function updateStatusBar(message: string): void {
    $<HTMLSpanElement>('status-info').textContent = message;
}

function updateStatusSummary(): void {
    if (!app.selectionRange) {
        $<HTMLSpanElement>('status-summary').textContent = '';
        return;
    }

    const cells = getSelectedCells();
    const numbers: number[] = [];
    for (const key of cells) {
        const cell = app.spreadsheet.cells.get(key);
        if (cell && cell.type !== 'empty') {
            const val = parseFloat(cell.computed);
            if (!isNaN(val)) numbers.push(val);
        }
    }

    if (numbers.length > 0) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        $<HTMLSpanElement>('status-summary').textContent =
            `Sum: ${sum.toFixed(2)}  |  Avg: ${avg.toFixed(2)}  |  Count: ${numbers.length}`;
    } else {
        $<HTMLSpanElement>('status-summary').textContent = `Count: ${cells.length}`;
    }
}

/* ============ Helpers ============ */

function getCellElement(row: number, col: number): HTMLTableCellElement | null {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}
