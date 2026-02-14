import type { SpreadsheetState } from '../models/Spreadsheet';

const DB_NAME = 'BastionsSpreadsheet';
const DB_VERSION = 1;
const STORE_NAME = 'spreadsheets';

interface SerializedState {
    name: string;
    cells: Record<string, import('../models/Spreadsheet').CellData>;
    columnWidths: number[];
    rowHeights: number[];
    activeTheme: string;
    numCols: number;
    numRows: number;
    isProtected?: boolean;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'name' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveSpreadsheet(state: SpreadsheetState): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Serialize Map to plain object
        const serialized: SerializedState = {
            name: state.name,
            cells: Object.fromEntries(state.cells),
            columnWidths: state.columnWidths,
            rowHeights: state.rowHeights,
            activeTheme: state.activeTheme,
            numCols: state.numCols,
            numRows: state.numRows,
            isProtected: state.isProtected,
        };

        store.put(serialized);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
        });
    } catch (e) {
        console.warn('Failed to save to IndexedDB:', e);
        // Fallback: save to localStorage
        try {
            const serialized = {
                name: state.name,
                cells: Object.fromEntries(state.cells),
                columnWidths: state.columnWidths,
                rowHeights: state.rowHeights,
                activeTheme: state.activeTheme,
                numCols: state.numCols,
                numRows: state.numRows,
                isProtected: state.isProtected,
            };
            localStorage.setItem(`spreadsheet_${state.name}`, JSON.stringify(serialized));
        } catch (lsErr) {
            console.error('Failed to save to localStorage:', lsErr);
        }
    }
}

export async function loadSpreadsheet(name: string): Promise<SpreadsheetState | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(name);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close();
                const data = request.result as SerializedState | undefined;
                if (!data) {
                    resolve(null);
                    return;
                }
                // Deserialize plain object to Map
                const cells = new Map(Object.entries(data.cells));
                // Migration: ensure locked and border fields exist on all cell styles
                for (const cell of cells.values()) {
                    if (cell.style && cell.style.locked === undefined) {
                        cell.style.locked = false;
                    }
                    if (cell.style && (cell.style as any).border === undefined) {
                        (cell.style as any).border = 'none';
                    }
                }
                resolve({
                    name: data.name,
                    cells,
                    columnWidths: data.columnWidths,
                    rowHeights: data.rowHeights,
                    activeTheme: data.activeTheme,
                    numCols: data.numCols,
                    numRows: data.numRows,
                    isProtected: data.isProtected ?? true,
                });
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch (e) {
        console.warn('Failed to load from IndexedDB:', e);
        // Fallback: try localStorage
        try {
            const stored = localStorage.getItem(`spreadsheet_${name}`);
            if (!stored) return null;
            const data = JSON.parse(stored) as SerializedState;
            return {
                name: data.name,
                cells: new Map(Object.entries(data.cells)),
                columnWidths: data.columnWidths,
                rowHeights: data.rowHeights,
                activeTheme: data.activeTheme,
                numCols: data.numCols,
                numRows: data.numRows,
                isProtected: data.isProtected ?? true,
            };
        } catch {
            return null;
        }
    }
}

export async function listSpreadsheets(): Promise<string[]> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close();
                resolve(request.result as string[]);
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch {
        return [];
    }
}

export async function deleteSpreadsheet(name: string): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(name);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
        });
    } catch (e) {
        console.warn('Failed to delete from IndexedDB:', e);
    }
}

/** Debounced save helper */
export function createAutoSave(delay = 500): (state: SpreadsheetState) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (state: SpreadsheetState) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            saveSpreadsheet(state);
        }, delay);
    };
}
