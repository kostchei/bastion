import {
    SpreadsheetState,
    createSpreadsheet,
    createEmptyCell,
    defaultCellStyle,
    cellKey
} from '../models/Spreadsheet';

const NUM_COLS = 12;
const NUM_ROWS = 60;
// Layout: [AbilMod, Prof, SkillName, Spacer, Init/Spd, HP, HitDice, Atk, Spacer, AC, Feat, Tabs]
const COL_WIDTHS = [70, 30, 140, 20, 70, 70, 70, 70, 20, 90, 150, 40];

export function buildCharacterSheet(): SpreadsheetState {
    const state = createSpreadsheet('D&D Character Sheet', NUM_COLS, NUM_ROWS);
    state.columnWidths = [...COL_WIDTHS];
    // Adjust row heights
    state.rowHeights[1] = 45;
    state.rowHeights[2] = 45;
    state.activeTheme = 'dnd';

    // Helper to set cell
    const setCell = (r: number, c: number, value: string, style: Partial<import('../models/Spreadsheet').CellStyle> = {}, type: 'text' | 'formula' | 'number' = 'text') => {
        const key = cellKey(r, c);
        const cell = createEmptyCell();
        cell.raw = value;
        // Auto-detect number
        if (type === 'text' && !isNaN(Number(value)) && value !== '') {
            cell.type = 'number';
        } else {
            cell.type = type;
        }

        cell.style = { ...defaultCellStyle(), ...style };
        state.cells.set(key, cell);
        return cell;
    };

    // Helper for creating merged regions
    const mergeCells = (r: number, c: number, rs: number, cs: number, value: string, style: Partial<import('../models/Spreadsheet').CellStyle> = {}, type: 'text' | 'formula' | 'number' = 'text') => {
        const cell = setCell(r, c, value, style, type);
        cell.style.rowSpan = rs;
        cell.style.colSpan = cs;
        return cell;
    };

    // --- Header Section ---
    // Level
    setCell(0, 0, 'LEVEL 1', {
        fontSize: 14, fontWeight: 'bold', color: 'var(--dnd-text-muted)', textAlign: 'left'
    });

    // Class Title (CLERIC)
    mergeCells(1, 0, 2, 8, 'CLERIC', {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: 'var(--dnd-header-bg)',
        fontStyle: 'italic',
        className: 'dnd-header-huge',
        textAlign: 'left',
        verticalAlign: 'middle'
    });

    // Subtitle / XP
    setCell(1, 9, 'XP: 0', { textAlign: 'right', color: 'var(--dnd-text-muted)' });
    setCell(2, 9, 'NEXT: 300', { textAlign: 'right', color: 'var(--dnd-text-muted)' });

    // --- Left Column: Abilities ---
    const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const abilityNames = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];
    let currentRow = 4;

    abilities.forEach((_abil, idx) => {
        const baseRow = currentRow;

        // Ability Label
        setCell(baseRow, 0, abilityNames[idx], {
            fontSize: 10, fontWeight: 'bold', color: 'var(--dnd-text-muted)', textAlign: 'center',
            colSpan: 3
        }).style.colSpan = 3;

        // Modifier Circle (Merged 2x2 roughly)
        // We use a specific formula to calc mod from score
        // Score is stored in the cell below the modifier visually, or we use a helper cell

        // Visual: Big Circle with Modifier
        mergeCells(baseRow + 1, 0, 2, 1, `=FLOOR((C${baseRow + 4}-10)/2)`, {
            className: 'dnd-ability-mod',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            border: 'none',
        }, 'formula');

        // Score (Small, below/inside grid)
        // We place the raw score in a cell that creates the 'bubble' bottom? 
        // Or just place it in row+3
        setCell(baseRow + 3, 0, '10', {
            fontSize: 14, fontWeight: 'bold', textAlign: 'center',
            border: 'none', backgroundColor: 'var(--dnd-cream)',
            className: 'dnd-ability-score'
        }, 'number'); // Default score 10

        // Saving Throw
        setCell(baseRow + 1, 1, '○', { textAlign: 'center', fontSize: 10 });
        setCell(baseRow + 1, 2, 'Saving Throw', { fontSize: 11 });

        // Skills (Placeholder list for each ability)
        // In a real app we'd map specific skills. For now, generic.
        setCell(baseRow + 2, 1, '●', { textAlign: 'center', fontSize: 10 });
        setCell(baseRow + 2, 2, 'Skill Check', { fontSize: 11 });

        currentRow += 5; // Spacing
    });

    // --- Center Column: Stats ---
    // Initiative / Speed
    mergeCells(4, 4, 1, 2, 'INITIATIVE', {
        backgroundColor: 'var(--dnd-header-bg)', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 10
    });
    mergeCells(5, 4, 1, 2, '+0', {
        fontSize: 20, textAlign: 'center', fontWeight: 'bold', border: 'medium', borderColor: 'var(--dnd-header-bg)'
    });

    mergeCells(4, 6, 1, 2, 'SPEED', {
        backgroundColor: 'var(--dnd-header-bg)', color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 10
    });
    mergeCells(5, 6, 1, 2, '30 ft.', {
        fontSize: 20, textAlign: 'center', fontWeight: 'bold', border: 'medium', borderColor: 'var(--dnd-header-bg)'
    });

    // HP
    const hpRow = 7;
    mergeCells(hpRow, 4, 1, 4, 'HIT POINT MAXIMUM', {
        backgroundColor: 'var(--dnd-text-muted)', color: 'white', textAlign: 'center', fontSize: 10
    });
    mergeCells(hpRow + 1, 4, 2, 4, '12 / 12', {
        fontSize: 24, textAlign: 'center', fontWeight: 'bold', border: 'thick', borderColor: 'var(--dnd-text-muted)'
    });

    // Hit Dice
    setCell(hpRow, 8, 'HIT DICE', { fontSize: 9, textAlign: 'center' });
    setCell(hpRow + 1, 8, '1d8', { fontSize: 14, textAlign: 'center', border: 'thin' });

    // Weapons / Attacks
    const atkRow = 12;
    mergeCells(atkRow, 4, 1, 5, 'ATTACKS & SPELLCASTING', {
        className: 'dnd-green-banner', color: 'white', fontWeight: 'bold', textAlign: 'center'
    });

    // Attack Rows
    for (let i = 0; i < 3; i++) {
        const r = atkRow + 1 + i;
        setCell(r, 4, 'Mace', { border: 'thin', backgroundColor: '#f0f0f0' });
        setCell(r, 5, '+4', { border: 'thin', textAlign: 'center' });
        setCell(r, 6, '1d6+2', { border: 'thin', textAlign: 'center' });
        setCell(r, 7, 'Bldg', { border: 'thin', fontSize: 10, colSpan: 2 }).style.colSpan = 2;
    }

    // Equipment
    const eqRow = 20;
    mergeCells(eqRow, 4, 1, 5, 'EQUIPMENT', {
        className: 'dnd-green-banner', color: 'white', fontWeight: 'bold', textAlign: 'center'
    });

    mergeCells(eqRow + 1, 4, 10, 5, '• Chain Mail\n• Shield\n• Holy Symbol\n• Backpack\n• Bedroll\n• Mess Kit', {
        fontSize: 11, textAlign: 'left', verticalAlign: 'top', border: 'thin'
    });

    // --- Right Column: AC & Features ---
    // Armor Class - Shield Icon
    // We visually represent this with a red badge styling in CSS on the cell
    mergeCells(4, 9, 3, 2, '18', {
        className: 'dnd-ac-badge', // Defined in dnd.css
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        verticalAlign: 'middle'
    });
    setCell(7, 9, 'ARMOR CLASS', { fontSize: 9, textAlign: 'center', fontWeight: 'bold', colSpan: 2 }).style.colSpan = 2;

    // Features
    const featRow = 9;
    mergeCells(featRow, 9, 1, 2, 'FEATURES & TRAITS', {
        backgroundColor: 'var(--dnd-header-bg)', color: 'white', textAlign: 'center', fontSize: 10
    });

    mergeCells(featRow + 1, 9, 20, 2,
        '• Spellcasting\n• Divine Domain (Life)\n• Disciple of Life\n• Bonus Proficiency (Heavy Armor)', {
        fontSize: 11, textAlign: 'left', verticalAlign: 'top', border: 'medium', borderColor: 'var(--dnd-header-bg)'
    });

    // --- Far Right: Tabs ---
    // Vertical Text using CSS transform
    mergeCells(4, 11, 4, 1, 'SPECIES', {
        className: 'dnd-vertical-tab',
        backgroundColor: 'var(--dnd-header-bg)',
        color: 'white',
        textAlign: 'center',
        verticalAlign: 'middle'
    });
    mergeCells(8, 11, 4, 1, 'BACKGROUND', {
        className: 'dnd-vertical-tab',
        backgroundColor: 'var(--dnd-text-muted)',
        color: 'white',
        textAlign: 'center',
        verticalAlign: 'middle'
    });
    mergeCells(12, 11, 4, 1, 'CLASS', {
        className: 'dnd-vertical-tab',
        backgroundColor: 'var(--dnd-text-muted)',
        color: 'white',
        textAlign: 'center',
        verticalAlign: 'middle'
    });

    return state;
}
