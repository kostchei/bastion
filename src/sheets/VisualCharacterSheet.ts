import { SpreadsheetState, cellKey } from '../models/Spreadsheet';
import '../styles/visual-sheet.css';

export class VisualCharacterSheet {
    private container: HTMLElement;
    private _state: SpreadsheetState;

    constructor(state: SpreadsheetState) {
        this._state = state;
        this.container = document.createElement('div');
        this.container.id = 'visual-sheet-overlay';
        this.container.classList.add('print-mode'); // Force print mode style for generic monochrome overlay
    }

    render(newState?: SpreadsheetState): HTMLElement {
        if (newState) this._state = newState;

        const getVal = (r: number, c: number): string => {
            const key = cellKey(r, c);
            const cell = this._state.cells.get(key);
            return cell ? (cell.computed || cell.raw || '') : '';
        };

        // Data Mapping
        const level = getVal(0, 0); // "LEVEL 1"
        const className = getVal(1, 0); // "CLERIC" etc.

        const hp = getVal(8, 4); // "12 / 12"
        // Parse HP max from string if needed, or just display
        // The starter sheet expects just a number, let's try to extract it
        const hpMatches = hp.match(/(\d+)/);
        const hpMax = hpMatches ? hpMatches[1] : hp;

        const init = getVal(5, 4); // "+0"
        const speed = getVal(5, 6); // "30 ft."

        // Abilities (Rows: 4, 9, 14, 19, 24, 29)
        // Scores are at Row + 3 => Indices (7, 12, 17, 22, 27, 32)
        const strScore = parseInt(getVal(7, 0)) || 10;
        const dexScore = parseInt(getVal(12, 0)) || 10;
        const conScore = parseInt(getVal(17, 0)) || 10;
        const intScore = parseInt(getVal(22, 0)) || 10;
        const wisScore = parseInt(getVal(27, 0)) || 10;
        const chaScore = parseInt(getVal(32, 0)) || 10;

        const getMod = (score: number) => Math.floor((score - 10) / 2);
        const fmtMod = (mod: number) => (mod >= 0 ? '+' + mod : str(mod));
        const str = (n: any) => String(n);

        const strMod = getMod(strScore);
        const dexMod = getMod(dexScore);
        const conMod = getMod(conScore);
        const intMod = getMod(intScore);
        const wisMod = getMod(wisScore);
        const chaMod = getMod(chaScore);

        // Features Text
        const classFeatures = getVal(10, 9);

        // Attack Footer
        // Rows 13, 14, 15 (indices)
        const attackRows = [13, 14, 15].map(r => {
            const name = getVal(r, 4);
            const bonus = getVal(r, 5);
            const dmg = getVal(r, 6);
            if (!name) return null;
            return `${name}: ${bonus} (${dmg})`;
        }).filter(Boolean);

        const attacks = attackRows.length > 0 ? attackRows.join(' | ') : "Melee Attack Rolls: ⚔ +0";


        this.container.innerHTML = `
            <div class="sheet-card">

                <!-- ========== HEADER ========== -->
                <div class="sheet-header">
                    <div class="level-badge">${level}</div>
                    <div class="class-name">${className}</div>
                </div>

                <!-- ========== MAIN BODY (4-column grid) ========== -->
                <div class="sheet-body">

                    <!-- ===== COLUMN 1: Abilities Sidebar ===== -->
                    <div class="abilities-panel">
                        <div class="abilities-title">Ability Modifiers<br>Saving Throws &amp; Skills</div>

                        <!-- STR + DEX side by side -->
                        <div class="ability-group">
                            <div class="ability-col">
                                <div class="ability-label">Strength</div>
                                <div class="ability-mod">${fmtMod(strMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(strMod)}</span> STR Save</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(strMod)}</span> Athletics</div>
                            </div>
                            <div class="ability-col">
                                <div class="ability-label">Dexterity</div>
                                <div class="ability-mod">${fmtMod(dexMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(dexMod)}</span> DEX Save</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(dexMod)}</span> Acrobatics</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(dexMod)}</span> Slight of Hand</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(dexMod)}</span> Stealth</div>
                            </div>
                        </div>

                        <!-- CON + INT -->
                        <div class="ability-group">
                            <div class="ability-col">
                                <div class="ability-label">Constitution</div>
                                <div class="ability-mod">${fmtMod(conMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(conMod)}</span> CON Save</div>
                            </div>
                            <div class="ability-col">
                                <div class="ability-label">Intelligence</div>
                                <div class="ability-mod">${fmtMod(intMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(intMod)}</span> INT Save</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(intMod)}</span> Arcana</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(intMod)}</span> History</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(intMod)}</span> Investigation</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(intMod)}</span> Nature</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(intMod)}</span> Religion</div>
                            </div>
                        </div>

                        <!-- WIS + CHA -->
                        <div class="ability-group">
                            <div class="ability-col">
                                <div class="ability-label">Wisdom</div>
                                <div class="ability-mod">${fmtMod(wisMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(wisMod)}</span> WIS Save</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(wisMod)}</span> Animal Handling</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(wisMod)}</span> Insight</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(wisMod)}</span> Medicine</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(wisMod)}</span> Perception</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(wisMod)}</span> Survival</div>
                            </div>
                            <div class="ability-col">
                                <div class="ability-label">Charisma</div>
                                <div class="ability-mod">${fmtMod(chaMod)}</div>
                                <div class="skill-line save-line"><span class="mod-val">${fmtMod(chaMod)}</span> CHA Save</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(chaMod)}</span> Deception</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(chaMod)}</span> Intimidation</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(chaMod)}</span> Performance</div>
                                <div class="skill-line"><span class="mod-val">${fmtMod(chaMod)}</span> Persuasion</div>
                            </div>
                        </div>

                        <!-- Heroic Inspiration -->
                        <div class="heroic-inspiration">
                            <div class="heroic-label">Heroic<br>Inspiration</div>
                            <div class="inspiration-circle"></div>
                        </div>
                    </div>

                    <!-- ===== COLUMNS 2+3: Center Area (combat, equip, footer) ===== -->
                    <div class="center-area">
                        <div class="center-columns">
                            <!-- Left center column -->
                            <div class="center-col-left">
                                <!-- Initiative + Speed -->
                                <div class="init-speed-row">
                                    <div class="stat-block">
                                        <div class="label-bar">Initiative</div>
                                        <div class="stat-value">${init}</div>
                                    </div>
                                    <div class="stat-block">
                                        <div class="label-bar">Speed</div>
                                        <div class="stat-value">${speed}</div>
                                    </div>
                                </div>

                                <!-- Hit Point Maximum -->
                                <div class="hp-block">
                                    <div class="label-bar">Hit Point Maximum</div>
                                    <div class="hp-area">
                                        <div class="hp-value">${hpMax}</div>
                                        <div class="hp-text">
                                            Place Hit Point Tokens here.
                                            Remove them as you take damage.
                                        </div>
                                        <div class="hp-text" style="margin-top: 0.3rem;">
                                            If you are reduced to 0 Hit Points,
                                            see the "Dropping to 0 Hit Points"
                                            section on page 16 of the Play Guide.
                                        </div>
                                    </div>
                                </div>

                                <!-- Equipment card slot -->
                                <div class="card-slot"></div>

                                <!-- Green label -->
                                <div class="green-label">Equipment</div>
                            </div>

                            <!-- Right center column -->
                            <div class="center-col-right">
                                <!-- Top equipment slot (shorter) -->
                                <div class="card-slot"></div>

                                <!-- Equipment label -->
                                <div class="green-label">Equipment</div>

                                <!-- Bottom slot -->
                                <div class="card-slot"></div>

                                <!-- Bottom label -->
                                <div class="green-label">Equipment</div>
                            </div>
                        </div>

                        <!-- Attack Rolls Footer (spans both center columns) -->
                        <div class="attack-footer">
                           <div class="attack-line">${attacks}</div>
                        </div>
                    </div>

                    <!-- ===== COLUMN 4: Features & Side Tabs ===== -->
                    <div class="features-panel">

                        <!-- Class Features box -->
                        <div class="class-features-box">
                            <div class="class-features-title">${className} Class Features</div>
                            <div class="class-features-content">
                                ${classFeatures.split('\\n').map(line => `<p>${line}</p>`).join('')}
                            </div>
                        </div>

                        <!-- Species Card tab zone -->
                        <div class="side-tab-zone">
                            <div class="side-tab-inner">
                                <!-- Species token circles -->
                                <div class="token-circles">
                                    <div class="token-circle"></div>
                                    <div class="token-circle"></div>
                                </div>
                            </div>
                            <div class="side-tab species">Species Card</div>
                        </div>

                        <!-- Gaining a Level -->
                        <div class="gaining-level"><em>Gaining a Level.</em></div>

                        <!-- Background Card tab zone -->
                        <div class="side-tab-zone background-zone">
                            <div class="side-tab-inner">
                                <!-- Background content area -->
                            </div>
                            <div class="side-tab background">Background Card</div>
                        </div>

                        <!-- Rest Info -->
                        <div class="rest-info">
                            <p>After a <strong>Short Rest:</strong></p>
                            <ul>
                                <li>Regain 8 Hit Point Tokens.</li>
                                <li>Restore 1 expended Power Token on Rage.</li>
                            </ul>
                            <p>After a <strong>Long Rest:</strong></p>
                            <ul>
                                <li>Regain all Hit Point Tokens and all expended Power Tokens.</li>
                            </ul>
                        </div>
                    </div>

                </div><!-- /sheet-body -->
            <!-- /sheet-card -->
                <button id="visual-sheet-close" title="Close Overlay">×</button>
        `;

        // Wire up close events
        const closeBtn = this.container.querySelector('#visual-sheet-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.container.style.display = 'none';
            });
        }

        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.container.style.display = 'none';
            }
        });

        return this.container;
    }
}
