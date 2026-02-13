/* ============ Cell Data Types ============ */

export interface CellStyle {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textDecoration: 'none' | 'underline';
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor: string;
    locked: boolean;
    border: 'none' | 'thin' | 'medium' | 'thick';
    className?: string;
}

export interface CellData {
    raw: string;
    computed: string;
    type: 'text' | 'number' | 'formula' | 'empty';
    style: CellStyle;
    error?: string;
    options?: string[]; // Dropdown options
}

export function defaultCellStyle(): CellStyle {
    return {
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '',
        backgroundColor: '',
        locked: false,
        border: 'none',
        className: '',
    };
}

export function createEmptyCell(): CellData {
    return {
        raw: '',
        computed: '',
        type: 'empty',
        style: defaultCellStyle(),
    };
}

/* ============ Spreadsheet State ============ */

export interface SpreadsheetState {
    name: string;
    cells: Map<string, CellData>;
    columnWidths: number[];
    rowHeights: number[];
    activeTheme: string;
    numCols: number;
    numRows: number;
    isProtected: boolean;
}

export function createSpreadsheet(
    name = 'Untitled Spreadsheet',
    numCols = 26,
    numRows = 100,
): SpreadsheetState {
    const columnWidths = Array(numCols).fill(100);
    const rowHeights = Array(numRows).fill(28);

    return {
        name,
        cells: new Map(),
        columnWidths,
        rowHeights,
        activeTheme: 'midnight',
        numCols,
        numRows,
        isProtected: true, // Default to protected
    };
}

/* ============ Cell Address Helpers ============ */

/** Convert column index (0-based) to letter(s): 0→A, 25→Z, 26→AA */
export function colToLetter(col: number): string {
    let result = '';
    let c = col;
    while (c >= 0) {
        result = String.fromCharCode((c % 26) + 65) + result;
        c = Math.floor(c / 26) - 1;
    }
    return result;
}

/** Convert letter(s) to column index: A→0, Z→25, AA→26 */
export function letterToCol(letters: string): number {
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
    }
    return col - 1;
}

/** Get cell key from row/col: (0,0) → "A1" */
export function cellKey(row: number, col: number): string {
    return `${colToLetter(col)}${row + 1}`;
}

/** Parse cell key to row/col: "A1" → { row: 0, col: 0 } */
export function parseKey(key: string): { row: number; col: number } | null {
    const match = key.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    return {
        row: parseInt(match[2], 10) - 1,
        col: letterToCol(match[1]),
    };
}

/** Get or create cell data */
export function getCell(state: SpreadsheetState, key: string): CellData {
    let cell = state.cells.get(key);
    if (!cell) {
        cell = createEmptyCell();
        state.cells.set(key, cell);
    }
    return cell;
}
