import {
    type SpreadsheetState,
    type CellData,
    type CellStyle,
    createSpreadsheet,
    defaultCellStyle,
    cellKey,
} from '../models/Spreadsheet';

/* ============ Character Sheet Builder ============ */

interface SheetCell {
    row: number;
    col: number;
    value: string;
    locked?: boolean;
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    bg?: string;
    color?: string;
    border?: 'none' | 'thin' | 'medium' | 'thick';
    className?: string;
}

/* ---- Colour palette ---- */
const C = {
    // Header bar
    hdrBg: '#1a1a2e',   // deep navy
    hdrText: '#e0d6c8',   // warm parchment white
    hdrAccent: '#c9a84c',   // gold

    // Sub-header
    subBg: '#16213e',
    subText: '#9ca3af',

    // Section headers
    secHdr: '#d4c5a0',   // darker parchment for section dividers
    secHdrTx: '#3b2f1a',   // dark brown text

    // Section background – slightly warmer than the parchment theme default
    secBg: '#ede4d0',

    // Labels
    label: '#4a3f2f',   // dark brown ink
    value: '#1e3a5f',   // dark blue ink for computed values
    editable: '#2d1810',   // dark sepia for editable values

    // Accent colours
    acRed: '#8b1a1a',   // deep red (AC / attack)
    acGreen: '#1a5c32',   // forest green (proficient saves)
    acPurple: '#4a1a6b',   // royal purple (spell DC)
    acGold: '#b8860b',   // dark goldenrod (tabs)

    // Backgrounds for special regions
    acBg: '#f5e6e6',   // very light pink (armor class box)
    inspBg: '#f5f0d0',   // soft yellow (inspiration)
};

function makeCell(opts: SheetCell): CellData {
    const style: CellStyle = {
        ...defaultCellStyle(),
        locked: opts.locked ?? true,
        fontWeight: opts.bold ? 'bold' : 'normal',
        fontStyle: opts.italic ? 'italic' : 'normal',
        textDecoration: 'none',
        textAlign: opts.align ?? 'left',
        fontSize: opts.fontSize ?? 12,
        color: opts.color ?? '',
        backgroundColor: opts.bg ?? '',
        border: opts.border ?? 'none',
        className: opts.className ?? '',
    };

    const isFormula = opts.value.startsWith('=');
    return {
        raw: opts.value,
        computed: isFormula ? '' : opts.value,
        type: isFormula ? 'formula' : (opts.value === '' ? 'empty' : 'text'),
        style,
    };
}

/* ============ Layout ============ */

const COL_WIDTHS = [
    48,   // A  – modifiers / labels
    80,   // B  – ability score names / values
    55,   // C  – (spare / small label)
    90,   // D  – saving throw / skill labels
    50,   // E  – saving throw / skill values
    45,   // F  – prof bonus column
    85,   // G  – Initiative / Equipment labels
    85,   // H  – Initiative / Equipment values
    20,   // I  – spacer
    85,   // J  – Armor Class / Concentration labels
    80,   // K  – Armor Class / Concentration values
    80,   // L  – Concentration continued
    20,   // M  – spacer
    135,  // N  – Class Features
    135,  // O  – Class Features continued
    20,   // P  – spacer
    50,   // Q  – right tab
    50,   // R
    50,   // S
    50,   // T
];

const NUM_COLS = COL_WIDTHS.length;
const NUM_ROWS = 50;

/* ============ Build ============ */

export function buildCharacterSheet(): SpreadsheetState {
    const state = createSpreadsheet('D&D Character Sheet', NUM_COLS, NUM_ROWS);
    // Adjust column widths for better print alignment
    // A: Mods, B: Scores, C: Spacer, D: SkillName, E: Bonus, F: Prof
    // G: Init/Speed Label, H: Val, I: Space, J: AC Label, K: Val, ...
    state.columnWidths = [...COL_WIDTHS];
    state.activeTheme = 'dnd'; // Use new theme

    const rowH = Array(NUM_ROWS).fill(24);
    rowH[0] = 40;  // Title row
    rowH[1] = 24;  // Subtitle
    rowH[2] = 12;  // spacer
    state.rowHeights = rowH;

    const cells: SheetCell[] = [];

    // ─── HEADER ROW ───
    cells.push({ row: 0, col: 0, value: 'LEVEL', bold: true, fontSize: 10, bg: C.hdrBg, color: C.hdrText, align: 'center', className: 'dnd-header-label' });
    cells.push({ row: 0, col: 1, value: '1', locked: false, bold: true, fontSize: 18, bg: C.hdrBg, color: C.hdrAccent, align: 'center', className: 'dnd-header-value' });
    cells.push({ row: 0, col: 2, value: 'CLASS', bold: true, fontSize: 10, bg: C.hdrBg, color: C.hdrText, align: 'right', className: 'dnd-header-label' });
    cells.push({ row: 0, col: 3, value: 'Cleric', locked: false, bold: true, fontSize: 22, bg: C.hdrBg, color: C.hdrText, align: 'left', className: 'dnd-header-value' });
    for (let c = 4; c < NUM_COLS; c++) cells.push({ row: 0, col: c, value: '', bg: C.hdrBg, className: 'dnd-header-bg' });

    // Subtitle
    for (let c = 0; c < 3; c++) cells.push({ row: 1, col: c, value: '', bg: C.subBg, className: 'dnd-subheader-bg' });
    cells.push({ row: 1, col: 3, value: 'A Miraculous Priest of Divine Power', italic: true, fontSize: 10, bg: C.subBg, color: C.subText, className: 'dnd-subheader-text' });
    for (let c = 4; c < NUM_COLS; c++) cells.push({ row: 1, col: c, value: '', bg: C.subBg, className: 'dnd-subheader-bg' });

    // ─── ABILITY SCORES SECTION HEADER ───
    cells.push({ row: 3, col: 0, value: 'Ability Modifiers', bold: true, fontSize: 11, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 3, col: 1, value: '', bg: C.secHdr, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 3, col: 2, value: '', bg: C.secHdr, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 3, col: 3, value: 'Saving Throws & Skills', bold: true, fontSize: 11, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 3, col: 4, value: '', bg: C.secHdr, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 3, col: 5, value: 'Prof', bold: true, fontSize: 9, align: 'center', bg: C.secHdr, color: C.secHdrTx, border: 'medium', className: 'dnd-section-header' });

    // Proficiency bonus formula in F5 (row 4 col 5)
    cells.push({ row: 4, col: 5, value: '=IF(B1<5,2,IF(B1<9,3,IF(B1<13,4,IF(B1<17,5,6))))', bold: true, fontSize: 18, align: 'center', bg: C.secBg, color: C.acGold, className: 'dnd-prof-bonus' });

    // ─── ABILITIES ───
    const abilities = [
        { name: 'STRENGTH', abbr: 'STR', score: 14 },
        { name: 'DEXTERITY', abbr: 'DEX', score: 8 },
        { name: 'CONSTITUTION', abbr: 'CON', score: 10 },
        { name: 'INTELLIGENCE', abbr: 'INT', score: 12 },
        { name: 'WISDOM', abbr: 'WIS', score: 16 },
        { name: 'CHARISMA', abbr: 'CHA', score: 14 },
    ];

    const skillMap: Record<string, { name: string; proficient: boolean }[]> = {
        'STR': [{ name: 'Athletics', proficient: true }],
        'DEX': [
            { name: 'Acrobatics', proficient: false },
            { name: 'Sleight of Hand', proficient: false },
            { name: 'Stealth', proficient: false },
        ],
        'CON': [],
        'INT': [
            { name: 'Arcana', proficient: false },
            { name: 'History', proficient: true },
            { name: 'Investigation', proficient: false },
            { name: 'Nature', proficient: false },
            { name: 'Religion', proficient: true },
        ],
        'WIS': [
            { name: 'Animal Handling', proficient: false },
            { name: 'Insight', proficient: true },
            { name: 'Medicine', proficient: false },
            { name: 'Perception', proficient: true },
            { name: 'Survival', proficient: false },
        ],
        'CHA': [
            { name: 'Deception', proficient: false },
            { name: 'Intimidation', proficient: false },
            { name: 'Performance', proficient: false },
            { name: 'Persuasion', proficient: false },
        ],
    };

    const saveProficiencies: Record<string, boolean> = {
        'STR': false, 'DEX': false, 'CON': false,
        'INT': false, 'WIS': true, 'CHA': true,
    };

    // Track modifier cell keys for attack roll formulas later
    const modRefs: Record<string, string> = {};

    let currentRow = 4;
    for (const ab of abilities) {
        const r = currentRow;

        // Ability name header
        cells.push({ row: r, col: 0, value: ab.name, bold: true, fontSize: 10, bg: C.secBg, color: C.label, align: 'center', className: 'dnd-ability-name' });
        cells.push({ row: r, col: 1, value: '', bg: C.secBg, className: 'dnd-ability-bg' });

        // Score (editable) — row r+1, col B
        const scoreRef = cellKey(r + 1, 1);
        cells.push({ row: r + 1, col: 1, value: String(ab.score), locked: false, bold: true, fontSize: 20, align: 'center', bg: C.secBg, color: C.editable, className: 'dnd-ability-score' });

        // Modifier formula — row r+1, col A
        const modRef = cellKey(r + 1, 0);
        modRefs[ab.abbr] = modRef;
        cells.push({ row: r + 1, col: 0, value: `=ROUND((${scoreRef}-10)/2)`, bold: true, fontSize: 24, align: 'center', bg: C.secBg, color: C.value, className: 'dnd-ability-mod' });

        // Save label — row r+2, col A
        cells.push({ row: r + 2, col: 0, value: `${ab.abbr} Save`, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-save-label' });

        // Save formula — row r+2, col B
        const profRef = 'F5';
        if (saveProficiencies[ab.abbr]) {
            cells.push({ row: r + 2, col: 1, value: `=${modRef}+${profRef}`, fontSize: 12, align: 'center', bg: C.secBg, color: C.acGreen, className: 'dnd-save-value proficient' });
        } else {
            cells.push({ row: r + 2, col: 1, value: `=${modRef}`, fontSize: 12, align: 'center', bg: C.secBg, color: C.label, className: 'dnd-save-value' });
        }

        // Skills in columns D–E
        const skills = skillMap[ab.abbr];
        let skillRow = r;
        for (const skill of skills) {
            const prefix = skill.proficient ? '●' : '○';
            const bonusFormula = skill.proficient ? `=${modRef}+${profRef}` : `=${modRef}`;
            cells.push({ row: skillRow, col: 3, value: `${prefix} ${skill.name}`, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-skill-name' });
            cells.push({ row: skillRow, col: 4, value: bonusFormula, fontSize: 10, align: 'center', bg: C.secBg, color: skill.proficient ? C.acGreen : C.label, className: 'dnd-skill-bonus' });
            skillRow++;
        }

        currentRow += Math.max(3, skills.length);
    }

    // ─── HEROIC INSPIRATION ───
    const inspRow = currentRow;
    cells.push({ row: inspRow, col: 0, value: 'HEROIC', bold: true, fontSize: 9, bg: C.secHdr, color: C.secHdrTx, align: 'center', className: 'dnd-section-label' });
    cells.push({ row: inspRow + 1, col: 0, value: 'INSPIRATION', bold: true, fontSize: 9, bg: C.secHdr, color: C.secHdrTx, align: 'center', className: 'dnd-section-label' });
    cells.push({ row: inspRow, col: 1, value: '', locked: false, fontSize: 14, align: 'center', bg: C.inspBg, className: 'dnd-inspiration-box' });

    // ─── INITIATIVE & SPEED ───
    cells.push({ row: 4, col: 6, value: 'INITIATIVE', bold: true, fontSize: 11, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-stat-header' });
    cells.push({ row: 4, col: 7, value: 'SPEED', bold: true, fontSize: 11, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-stat-header' });
    cells.push({ row: 5, col: 6, value: `=${modRefs['DEX']}`, bold: true, fontSize: 20, align: 'center', bg: C.secBg, color: C.value, border: 'thin', className: 'dnd-stat-value' });
    cells.push({ row: 5, col: 7, value: '30 Feet', locked: false, bold: true, fontSize: 14, align: 'center', bg: C.secBg, color: C.editable, border: 'thin', className: 'dnd-stat-value' });

    // ─── HIT POINT MAXIMUM ───
    cells.push({ row: 7, col: 6, value: 'HIT POINT MAXIMUM', bold: true, fontSize: 10, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-stat-header' });
    cells.push({ row: 7, col: 7, value: '', bg: C.secHdr, border: 'medium', className: 'dnd-stat-header' });
    cells.push({ row: 8, col: 6, value: '', bg: C.secBg, border: 'thin', className: 'dnd-hp-box' });
    cells.push({ row: 8, col: 7, value: '8', locked: false, bold: true, fontSize: 26, align: 'center', bg: C.secBg, color: C.acRed, border: 'thick', className: 'dnd-hp-value' });
    cells.push({ row: 9, col: 6, value: 'Place Hit Point', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 9, col: 7, value: 'Tokens here.', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 10, col: 6, value: 'Remove them as', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 10, col: 7, value: 'you take damage.', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });

    // ─── ARMOR CLASS ───
    cells.push({ row: 4, col: 9, value: 'ARMOR CLASS', bold: true, fontSize: 11, bg: C.acRed, color: '#ffffff', align: 'center', border: 'medium', className: 'dnd-ac-header' });
    cells.push({ row: 4, col: 10, value: '', bg: C.acRed, border: 'medium', className: 'dnd-ac-header' });
    cells.push({ row: 5, col: 9, value: '', bg: C.acBg, border: 'thin', className: 'dnd-ac-box' });
    cells.push({ row: 5, col: 10, value: '9', locked: false, bold: true, fontSize: 26, align: 'center', bg: C.acBg, color: C.acRed, border: 'thick', className: 'dnd-ac-value' });
    cells.push({ row: 6, col: 9, value: 'Wear Light or Medium', fontSize: 9, bg: C.acBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 6, col: 10, value: 'Armor by placing an', fontSize: 9, bg: C.acBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 7, col: 9, value: 'Equipment Card for', fontSize: 9, bg: C.acBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 7, col: 10, value: 'armor of either type.', fontSize: 9, bg: C.acBg, italic: true, color: C.label, className: 'dnd-helper-text' });

    // Starting equipment card (armor)
    cells.push({ row: 9, col: 9, value: 'STARTING CARD', bold: true, fontSize: 9, bg: C.secHdr, color: C.secHdrTx, align: 'center', className: 'dnd-section-label' });
    cells.push({ row: 9, col: 10, value: '', bg: C.secHdr, className: 'dnd-section-label' });
    cells.push({ row: 10, col: 9, value: 'Chain Shirt', locked: false, fontSize: 12, align: 'center', bg: C.secBg, color: C.editable, className: 'dnd-equipment-item' });
    cells.push({ row: 10, col: 10, value: '', bg: C.secBg, className: 'dnd-equipment-item' });

    // ─── EQUIPMENT (weapon area) ───
    cells.push({ row: 13, col: 6, value: 'You can use Simple', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 13, col: 7, value: 'Weapons by placing', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 14, col: 6, value: 'an Equipment Card for', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 14, col: 7, value: 'a Simple weapon.', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });

    cells.push({ row: 16, col: 6, value: 'STARTING CARD', bold: true, fontSize: 9, bg: C.secHdr, color: C.secHdrTx, align: 'center', className: 'dnd-section-label' });
    cells.push({ row: 16, col: 7, value: '', bg: C.secHdr, className: 'dnd-section-label' });
    cells.push({ row: 17, col: 6, value: 'Mace', locked: false, fontSize: 12, align: 'center', bg: C.secBg, color: C.editable, className: 'dnd-equipment-item' });
    cells.push({ row: 17, col: 7, value: '', bg: C.secBg, className: 'dnd-equipment-item' });

    // EQUIPMENT banner
    cells.push({ row: 19, col: 6, value: 'EQUIPMENT', bold: true, fontSize: 13, bg: C.hdrBg, color: C.hdrText, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 19, col: 7, value: '', bg: C.hdrBg, border: 'medium', className: 'dnd-section-header' });

    // ─── CONCENTRATION SPELL ───
    cells.push({ row: 12, col: 9, value: 'EQUIPMENT', bold: true, fontSize: 13, bg: C.hdrBg, color: C.hdrText, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 12, col: 10, value: '', bg: C.hdrBg, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 12, col: 11, value: '', bg: C.hdrBg, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 13, col: 9, value: 'Concentration Spell', bold: true, fontSize: 11, bg: C.secHdr, color: C.secHdrTx, align: 'center', className: 'dnd-subheader' });
    cells.push({ row: 13, col: 10, value: '', bg: C.secHdr, className: 'dnd-subheader' });
    cells.push({ row: 13, col: 11, value: '', bg: C.secHdr, className: 'dnd-subheader' });
    cells.push({ row: 14, col: 9, value: 'When you cast a spell', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 14, col: 10, value: 'that requires', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 15, col: 9, value: 'Concentration, place', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });
    cells.push({ row: 15, col: 10, value: 'that Spell Card here.', fontSize: 9, bg: C.secBg, italic: true, color: C.label, className: 'dnd-helper-text' });

    // SPELL banner
    cells.push({ row: 19, col: 9, value: 'SPELL', bold: true, fontSize: 13, bg: C.hdrBg, color: C.hdrText, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 19, col: 10, value: '', bg: C.hdrBg, border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 19, col: 11, value: '', bg: C.hdrBg, border: 'medium', className: 'dnd-section-header' });

    // ─── ATTACK ROLLS ───
    const profRef = 'F5';
    cells.push({ row: 20, col: 6, value: 'MELEE ATTACK:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-attack-label' });
    cells.push({ row: 20, col: 7, value: `=${modRefs['STR']}+${profRef}`, bold: true, fontSize: 16, align: 'center', bg: C.secBg, color: C.acRed, className: 'dnd-attack-value' });

    cells.push({ row: 21, col: 6, value: 'RANGED ATTACK:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-attack-label' });
    cells.push({ row: 21, col: 7, value: `=${modRefs['DEX']}+${profRef}`, bold: true, fontSize: 16, align: 'center', bg: C.secBg, color: C.acRed, className: 'dnd-attack-value' });

    // ─── SPELL ATTACK & SAVE DC ───
    cells.push({ row: 20, col: 9, value: 'SPELL ATTACK:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-attack-label' });
    cells.push({ row: 20, col: 10, value: `=${modRefs['WIS']}+${profRef}`, bold: true, fontSize: 16, align: 'center', bg: C.secBg, color: C.acRed, className: 'dnd-attack-value' });

    cells.push({ row: 21, col: 9, value: 'SPELL SAVE DC:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-attack-label' });
    cells.push({ row: 21, col: 10, value: `=8+${modRefs['WIS']}+${profRef}`, bold: true, fontSize: 16, align: 'center', bg: C.secBg, color: C.acPurple, className: 'dnd-save-dc-value' });

    // ─── CLASS FEATURES ───
    cells.push({ row: 4, col: 13, value: 'Cleric Class Features', bold: true, fontSize: 13, bg: C.secHdr, color: C.secHdrTx, align: 'center', border: 'medium', className: 'dnd-section-header' });
    cells.push({ row: 4, col: 14, value: '', bg: C.secHdr, border: 'medium', className: 'dnd-section-header' });

    cells.push({ row: 5, col: 13, value: 'Spellcasting', bold: true, fontSize: 11, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: 6, col: 13, value: 'Remove 1 Power Token below', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 6, col: 14, value: 'to cast a level 1 spell from', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 7, col: 13, value: 'one of your Spell Cards.', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 7, col: 14, value: 'Casting a Cantrip doesn\'t', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 8, col: 13, value: 'require a Power Token.', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });

    cells.push({ row: 10, col: 13, value: 'Playing a Cleric', bold: true, fontSize: 12, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: 11, col: 13, value: 'Choose this class if you', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 11, col: 14, value: 'want to play a holy warrior', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 12, col: 13, value: 'who invokes divine magic', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 12, col: 14, value: 'to heal, bolster, and smite.', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });

    cells.push({ row: 14, col: 13, value: 'Cleric Tips', bold: true, italic: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: 15, col: 13, value: 'In combat, defend your fellow', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 15, col: 14, value: 'party members with your', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 16, col: 13, value: 'trusty Mace and spells like', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 16, col: 14, value: 'Guiding Bolt.', italic: true, fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });

    cells.push({ row: 18, col: 13, value: 'Gaining a Level', bold: true, italic: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: 19, col: 13, value: 'When you advance to level 2,', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 19, col: 14, value: 'flip this Class Board to the', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 20, col: 13, value: 'level 2 side and retrieve the', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: 20, col: 14, value: 'additional components.', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });

    // ─── RIGHT TABS ───
    cells.push({ row: 4, col: 16, value: 'SPECIES', bold: true, fontSize: 9, bg: C.acGold, color: '#ffffff', align: 'center', className: 'dnd-tab-label' });
    cells.push({ row: 4, col: 17, value: 'CARD', bold: true, fontSize: 9, bg: C.acGold, color: '#ffffff', align: 'center', className: 'dnd-tab-label' });
    cells.push({ row: 14, col: 16, value: 'BACKGROUND', bold: true, fontSize: 8, bg: C.acGold, color: '#ffffff', align: 'center', className: 'dnd-tab-label' });
    cells.push({ row: 14, col: 17, value: 'CARD', bold: true, fontSize: 9, bg: C.acGold, color: '#ffffff', align: 'center', className: 'dnd-tab-label' });

    // ─── WHAT YOU NEED TO PLAY ───
    const needRow = Math.max(24, inspRow + 3);
    for (let c = 0; c <= 4; c++) cells.push({ row: needRow, col: c, value: c === 0 ? 'WHAT YOU NEED TO PLAY' : '', bold: true, fontSize: 10, bg: C.acRed, color: '#ffffff', border: 'medium', className: 'dnd-box-header' });
    cells.push({ row: needRow + 1, col: 0, value: 'Equipment Cards:', bold: true, fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-box-label' });
    cells.push({ row: needRow + 1, col: 1, value: 'Chain Shirt, Mace', locked: false, fontSize: 9, bg: C.secBg, color: C.editable, className: 'dnd-box-value' });
    cells.push({ row: needRow + 2, col: 0, value: 'Spell Cards:', bold: true, fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-box-label' });
    cells.push({ row: needRow + 2, col: 1, value: 'Bless, Cure Wounds, Guiding Bolt, Light, Sacred Flame', locked: false, fontSize: 9, bg: C.secBg, color: C.editable, className: 'dnd-box-value' });
    cells.push({ row: needRow + 3, col: 0, value: 'Starting Gold:', bold: true, fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-box-label' });
    cells.push({ row: needRow + 3, col: 1, value: '60 GP', locked: false, fontSize: 9, bg: C.secBg, color: C.editable, className: 'dnd-box-value' });

    // ─── REST SECTION ───
    cells.push({ row: needRow, col: 13, value: 'After a Short Rest:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: needRow + 1, col: 13, value: '• Regain 4 Hit Point Tokens', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });
    cells.push({ row: needRow + 2, col: 13, value: 'After a Long Rest:', bold: true, fontSize: 10, bg: C.secBg, color: C.label, className: 'dnd-feature-name' });
    cells.push({ row: needRow + 3, col: 13, value: '• Regain all HP & Power Tokens', fontSize: 9, bg: C.secBg, color: C.label, className: 'dnd-feature-text' });

    // ─── Apply to state ───
    for (const c of cells) {
        const key = cellKey(c.row, c.col);
        state.cells.set(key, makeCell(c));
    }

    return state;
}
