const fs = require('fs');
const path = require('path');

// Config
const OUTPUT_DIR = path.join(__dirname, 'cards_output');
const CARDS_PER_PAGE = 3; // Maximum folded cards that fit on an A4 page (A4 width 210mm, card width 63.5mm => 3 fits perfectly)

// HTML Boilerplate
const getHtmlStart = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="../cards.css">
    <style>
        .page { page-break-after: always; display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 2mm; width: 210mm; padding: 5mm; background: white; margin-bottom: 2rem;}
        @media print {
            body { background-color: white; padding: 0; margin: 0;}
            .print-controls { display: none; }
            .page { box-shadow: none; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="print-controls">
        <button onclick="window.print()">Print Cards (A4)</button>
        <p>Ensure printer settings are set to scale: 100% or "Actual Size".<br>
        Cut along the dashed lines, fold along the dotted center line, and glue the halves together.</p>
    </div>
`;

const getHtmlEnd = () => `
</body>
</html>`;

function renderWeaponCard(item) {
    return `
        <div class="card">
            <div class="card-face back">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.back_title || item.title}</h1>
                        <div class="card-subtitle">${item.back_subtitle || 'Damage'}</div>
                    </div>
                    <div class="card-body damage-body">
                        <div class="damage-roll">${item.damage_roll || ''}</div>
                        <div class="damage-type">${item.damage_type || ''}</div>
                    </div>
                    <div class="card-footer"></div>
                </div>
            </div>
            <div class="card-face front">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.title}</h1>
                        <div class="card-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="card-banner">
                        <strong>Weapon Properties:</strong> ${item.range_or_props || ''}
                    </div>
                    <div class="card-body">
                        ${item.front_body || ''}
                    </div>
                    <div class="fine-print">Unofficial content permitted under WOTC fan policy</div>
                    <div class="card-footer"></div>
                </div>
            </div>
        </div>
    `;
}

function renderSpellCard(item) {
    return `
        <div class="card">
            <div class="card-face back">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.back_title || item.title}</h1>
                        <div class="card-subtitle">${item.back_subtitle || 'Components & Higher Levels'}</div>
                    </div>
                    <div class="card-banner spell-banner">
                        <strong>Details</strong>
                    </div>
                    <div class="card-body">
                        ${item.back_body || ''}
                    </div>
                    <div class="card-footer spell-footer"></div>
                </div>
            </div>
            <div class="card-face front">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.title}</h1>
                        <div class="card-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="card-banner spell-banner">
                        <strong>Casting Time:</strong> ${item.casting_time || ''}<br>
                        <strong>Range:</strong> ${item.range || ''}<br>
                        <strong>Components:</strong> ${item.vsm || ''}
                    </div>
                    <div class="card-body">
                        ${item.front_body || ''}
                    </div>
                    <div class="fine-print">Unofficial content permitted under WOTC fan policy</div>
                    <div class="card-footer spell-footer"></div>
                </div>
            </div>
        </div>
    `;
}

function renderGenericCard(item) {
    const bannerColor = item.type === 'background' ? 'style="background-color: #e1bee7;"' : 'style="background-color: #b2dfdb;"';
    const footerColor = item.type === 'background' ? 'style="background-color: #8e24aa;"' : 'style="background-color: #00796b;"';

    return `
        <div class="card">
            <div class="card-face back">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.back_title || item.title}</h1>
                        <div class="card-subtitle">${item.back_subtitle || 'Details'}</div>
                    </div>
                    <div class="card-body">
                        ${item.back_body || ''}
                    </div>
                    <div class="card-footer" ${footerColor}></div>
                </div>
            </div>
            <div class="card-face front">
                <div class="card-inner">
                    <div class="card-header">
                        <h1 class="card-title">${item.title}</h1>
                        <div class="card-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="card-banner" ${bannerColor}>
                        <strong>Type:</strong> ${item.type.toUpperCase()}<br>
                        ${item.skills ? `<strong>Skills:</strong> ${item.skills}<br>` : ''}
                        ${item.tools ? `<strong>Tools:</strong> ${item.tools}` : ''}
                        ${item.traits ? `<strong>Traits:</strong> ${item.traits}` : ''}
                    </div>
                    <div class="card-body">
                        ${item.front_body || ''}
                    </div>
                    <div class="fine-print">Unofficial content permitted under WOTC fan policy</div>
                    <div class="card-footer" ${footerColor}></div>
                </div>
            </div>
        </div>
    `;
}

function renderCard(item) {
    if (item.type === 'weapon') return renderWeaponCard(item);
    if (item.type === 'spell') return renderSpellCard(item);
    return renderGenericCard(item);
}


function generateHtmlForItems(filename, items) {
    let htmlContent = getHtmlStart(filename);

    // Group into pages of up to 3 cards
    for (let i = 0; i < items.length; i += CARDS_PER_PAGE) {
        const pageItems = items.slice(i, i + CARDS_PER_PAGE);
        htmlContent += `\n    <div class="page">\n`;

        pageItems.forEach(item => {
            htmlContent += renderCard(item);
        });

        htmlContent += `\n    </div>\n`;
    }

    htmlContent += getHtmlEnd();

    // Ensure directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const filepath = path.join(OUTPUT_DIR, filename + '.html');
    fs.writeFileSync(filepath, htmlContent, 'utf-8');
    console.log(`Successfully created: ${filepath}`);
}

// ---------------------------------------------------------
// Example Execution block
// In reality, you'd load from a JSON file using:
// const data = JSON.parse(fs.readFileSync('spells.json'));
// ---------------------------------------------------------

const exampleSpells = [
    {
        type: "spell",
        title: "FIREBALL",
        subtitle: "3rd-Level Evocation",
        casting_time: "1 Action",
        range: "150 Feet",
        vsm: "V, S, M",
        front_body: "<p>A bright streak flashes from your pointing finger to a point you choose...</p>",
        back_title: "FIREBALL",
        back_subtitle: "Components & Higher Levels",
        back_body: "<p><strong>Materials:</strong> A tiny ball of bat guano and sulfur.</p><p><strong>At Higher Levels:</strong> When you cast this spell using a spell slot of 4th level or higher...</p>"
    }
];

// If run directly, run an example to test the generation
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        // Assume user passed a json file
        const dataPath = path.resolve(args[0]);
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            // Take the filename without extension to use as grouping name
            const basename = path.basename(dataPath, '.json');
            generateHtmlForItems(`cards_${basename}`, data);
        } else {
            console.error(`File not found: ${dataPath}`);
        }
    } else {
        console.log("No JSON file provided. Generating example: cards_spells_example.html");
        generateHtmlForItems("cards_spells_example", exampleSpells);
    }
}
