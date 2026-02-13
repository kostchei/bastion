import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { SpreadsheetState, CellData } from '../models/Spreadsheet';

/* ============ URL Sharing ============ */

/**
 * Compact representation of a spreadsheet for URL sharing.
 * We strip defaults and use short keys to minimise compressed size.
 */
interface CompactState {
    n: string;                              // name
    c: Record<string, CompactCell>;         // cells (only non-empty)
    cw: number[];                           // columnWidths
    rh: number[];                           // rowHeights
    t: string;                              // activeTheme
    nc: number;                             // numCols
    nr: number;                             // numRows
}

interface CompactCell {
    r: string;          // raw
    v?: string;         // computed (omit if same as raw)
    t?: string;         // type (omit if 'text')
    e?: string;         // error
    s?: CompactStyle;   // style (omit if all defaults)
}

interface CompactStyle {
    fs?: number;        // fontSize (omit if 12)
    fw?: string;        // fontWeight (omit if 'normal')
    fi?: string;        // fontStyle (omit if 'normal')
    td?: string;        // textDecoration (omit if 'none')
    ta?: string;        // textAlign (omit if 'left')
    c?: string;         // color (omit if '')
    bg?: string;        // backgroundColor (omit if '')
    l?: boolean;        // locked (omit if false)
    b?: string;         // border (omit if 'none')
}

/* ---- Compress (state → URL hash) ---- */

function compactStyle(cell: CellData): CompactStyle | undefined {
    const s = cell.style;
    const cs: CompactStyle = {};
    let hasAny = false;

    if (s.fontSize !== 12) { cs.fs = s.fontSize; hasAny = true; }
    if (s.fontWeight !== 'normal') { cs.fw = s.fontWeight; hasAny = true; }
    if (s.fontStyle !== 'normal') { cs.fi = s.fontStyle; hasAny = true; }
    if (s.textDecoration !== 'none') { cs.td = s.textDecoration; hasAny = true; }
    if (s.textAlign !== 'left') { cs.ta = s.textAlign; hasAny = true; }
    if (s.color !== '') { cs.c = s.color; hasAny = true; }
    if (s.backgroundColor !== '') { cs.bg = s.backgroundColor; hasAny = true; }
    if (s.locked) { cs.l = true; hasAny = true; }
    if (s.border && s.border !== 'none') { cs.b = s.border; hasAny = true; }

    return hasAny ? cs : undefined;
}

function compactCell(cell: CellData): CompactCell | null {
    if (cell.type === 'empty' && !cell.raw) return null;
    const cc: CompactCell = { r: cell.raw };
    if (cell.computed !== cell.raw) cc.v = cell.computed;
    if (cell.type !== 'text') cc.t = cell.type;
    if (cell.error) cc.e = cell.error;
    const st = compactStyle(cell);
    if (st) cc.s = st;
    return cc;
}

export function stateToHash(state: SpreadsheetState): string {
    const compact: CompactState = {
        n: state.name,
        c: {},
        cw: state.columnWidths,
        rh: state.rowHeights,
        t: state.activeTheme,
        nc: state.numCols,
        nr: state.numRows,
    };

    for (const [key, cell] of state.cells) {
        const cc = compactCell(cell);
        if (cc) compact.c[key] = cc;
    }

    const json = JSON.stringify(compact);
    const compressed = compressToEncodedURIComponent(json);
    return `#data=${compressed}`;
}

/* ---- Decompress (URL hash → state) ---- */

import { defaultCellStyle, createSpreadsheet } from '../models/Spreadsheet';

function expandCell(cc: CompactCell): CellData {
    const style = defaultCellStyle();
    if (cc.s) {
        if (cc.s.fs !== undefined) style.fontSize = cc.s.fs;
        if (cc.s.fw) style.fontWeight = cc.s.fw as 'normal' | 'bold';
        if (cc.s.fi) style.fontStyle = cc.s.fi as 'normal' | 'italic';
        if (cc.s.td) style.textDecoration = cc.s.td as 'none' | 'underline';
        if (cc.s.ta) style.textAlign = cc.s.ta as 'left' | 'center' | 'right';
        if (cc.s.c) style.color = cc.s.c;
        if (cc.s.bg) style.backgroundColor = cc.s.bg;
        if (cc.s.l) style.locked = true;
        if (cc.s.b) style.border = cc.s.b as 'none' | 'thin' | 'medium' | 'thick';
    }

    return {
        raw: cc.r,
        computed: cc.v ?? cc.r,
        type: (cc.t ?? 'text') as CellData['type'],
        style,
        error: cc.e,
    };
}

export function hashToState(hash: string): SpreadsheetState | null {
    if (!hash.startsWith('#data=')) return null;

    try {
        const compressed = hash.slice(6); // strip '#data='
        const json = decompressFromEncodedURIComponent(compressed);
        if (!json) return null;

        const compact: CompactState = JSON.parse(json);
        const state = createSpreadsheet(compact.n, compact.nc, compact.nr);
        state.columnWidths = compact.cw;
        state.rowHeights = compact.rh;
        state.activeTheme = compact.t;

        for (const [key, cc] of Object.entries(compact.c)) {
            state.cells.set(key, expandCell(cc));
        }

        return state;
    } catch (e) {
        console.error('Failed to decompress sheet from URL:', e);
        return null;
    }
}

/**
 * Generate a full shareable URL for the current page + hash.
 */
export function getShareableURL(state: SpreadsheetState): string {
    const hash = stateToHash(state);
    const base = window.location.origin + window.location.pathname;
    return base + hash;
}
