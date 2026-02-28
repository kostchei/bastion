const fs = require('fs');
const { execSync } = require('child_process');

const cantrips = [
    {
        type: "spell", title: "ACID SPLASH", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V, S",
        front_body: "<p>You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 Acid damage.</p>",
        back_title: "ACID SPLASH", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).</p>"
    },
    {
        type: "spell", title: "CHILL TOUCH", subtitle: "Necromancy Cantrip", casting_time: "1 Action", range: "Touch", vsm: "V, S",
        front_body: "<p>You channel necrotic energy to disrupt the life force of one creature you touch. Make a melee spell attack against the creature. On a hit, the target takes 1d10 Necrotic damage, and it can't regain Hit Points until the start of your next turn. If you hit an Undead target, it also has Disadvantage on attack rolls against you until the end of your next turn.</p>",
        back_title: "CHILL TOUCH", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d10 when you reach levels 5 (2d10), 11 (3d10), and 17 (4d10).</p>"
    },
    {
        type: "spell", title: "DANCING LIGHTS", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S, M",
        front_body: "<p>You create up to four torch-sized lights within range, making them appear as torches, lanterns, or glowing orbs that hover in the air for the duration (Concentration, up to 1 minute). You can also combine the four lights into one glowing vaguely humanoid form.</p>",
        back_title: "DANCING LIGHTS", back_subtitle: "Components & Details",
        back_body: "<p><strong>Materials:</strong> A bit of phosphorus or wychwood, or a glowworm.</p><p>As a Bonus Action, you can move the lights up to 60 feet. A light must be within 20 feet of another light created by this spell, and a light winks out if it exceeds the spell's range.</p>"
    },
    {
        type: "spell", title: "ELDRITCH BLAST", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S",
        front_body: "<p>A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Force damage.</p>",
        back_title: "ELDRITCH BLAST", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The spell creates more than one beam when you reach higher levels: two beams at level 5, three beams at level 11, and four beams at level 17. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.</p>"
    },
    {
        type: "spell", title: "SORCEROUS BURST", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S",
        front_body: "<p>You cast a burst of sorcerous energy at one creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d8 damage. Choose Acid, Cold, Fire, Lightning, Poison, or Thunder for the damage type.</p>",
        back_title: "SORCEROUS BURST", back_subtitle: "Exploding Dice",
        back_body: "<p>If you roll an 8 on a d8 for this spell's damage, you can roll another d8 and add it to the damage. You can do this continuously if you keep rolling an 8.</p><p><strong>At Higher Levels:</strong> Damage increases by 1d8 at levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "STARRY WISP", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V, S",
        front_body: "<p>You launch a wisp of starlight at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d8 Radiant damage, and until the end of your next turn, it emits dim light in a 10-foot radius and can't benefit from the Invisible condition.</p>",
        back_title: "STARRY WISP", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> Damage increases by 1d8 at levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "ELEMENTALISM", subtitle: "Transmutation Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You exert control over the elements, creating one of the following effects:<br>- Create a breeze that flutters clothing.<br>- Light or snuff a candle or torch.<br>- Clean up to 1 cubic foot of dirt.<br>- Chill or warm 1 pound of nonmagical material for 1 hour.<br>- Create a shower of sparks or a puff of wind.</p>",
        back_title: "ELEMENTALISM", back_subtitle: "Details",
        back_body: "<p>This is a minor magical trick that cannot cause damage or affect an unwilling creature.</p>"
    }
];

const level1Spells = [
    {
        type: "spell", title: "ANIMAL FRIENDSHIP", subtitle: "1st-Level Enchantment", casting_time: "1 Action", range: "30 Feet", vsm: "V, S, M",
        front_body: "<p>This spell lets you convince a Beast that you mean it no harm. Choose a Beast that you can see within range. It must see and hear you. If the Beast's Intelligence is 4 or higher, the spell fails. Otherwise, the Beast must succeed on a Wisdom saving throw or be Charmed by you for the spell's duration (24 hours).</p>",
        back_title: "ANIMAL FRIENDSHIP", back_subtitle: "Components & Higher Levels",
        back_body: "<p><strong>Materials:</strong> A morsel of food.</p><p><strong>At Higher Levels:</strong> You can target one additional Beast for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "HEALING WORD", subtitle: "1st-Level Evocation", casting_time: "1 Bonus Action", range: "60 Feet", vsm: "V",
        front_body: "<p>A creature of your choice that you can see within range regains Hit Points equal to 2d4 + your spellcasting ability modifier. This spell has no effect on Constructs or Undead.</p>",
        back_title: "HEALING WORD", back_subtitle: "Healing & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The healing increases by 2d4 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "WITCH BOLT", subtitle: "1st-Level Evocation", casting_time: "1 Action", range: "30 Feet", vsm: "V, S, M",
        front_body: "<p>A beam of crackling, blue energy lances out toward a creature within range, forming a sustained arc of lightning between you and the target. Make a ranged spell attack against that creature. On a hit, the target takes 2d12 Lightning damage.</p>",
        back_title: "WITCH BOLT", back_subtitle: "Components & Concentration",
        back_body: "<p><strong>Materials:</strong> A twig from a tree that has been struck by lightning.</p><p>On each of your turns for the duration (Concentration, up to 1 minute), you can use your action to deal 1d12 Lightning damage to the target automatically. The spell ends if the target is ever outside the spell's range or if it has total cover from you.</p><p><strong>At Higher Levels:</strong> Initial damage increases by 1d12 for each slot level above 1st.</p>"
    }
];

const backgrounds = [
    {
        type: "background", title: "MOONWELL PILGRIM", subtitle: "Background", skills: "Nature, Performance", tools: "Painter's Supplies", traits: "Magic Initiate (Druid)",
        front_body: "<p>Like many who hail from the Moonshae Isles, you grew up revering the blessed land, its unique gods, and the mysterious shrines called the moonwells. As a moonwell pilgrim, you undertook a quest to visit and commune with every moonwell on (or off) the map. Along your idyllic journeys, you collected a repertoire of Moonshavian folk songs, painted landscapes of enchanting vistas, and even learned how to wield a bit of primal magic.</p>",
        back_title: "MOONWELL PILGRIM", back_subtitle: "Ability Scores & Equipment",
        back_body: "<p><strong>Ability Scores:</strong> Constitution, Wisdom, Charisma</p><p><strong>Equipment:</strong> Choose A or B: (A) Quarterstaff, Painter's Supplies, Bedroll, Bell, Pouch, Robe, String, Traveler’s Clothes, Waterskin, 38 GP; or (B) 50 GP</p>"
    },
    {
        type: "background", title: "NOBLE", subtitle: "Background", skills: "History, Persuasion", tools: "Gaming Set", traits: "Skilled Feat",
        front_body: "<p>You were raised in a family that has wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence. You have received the finest education and have the manners to mingle among the high society comfortably.</p>",
        back_title: "NOBLE", back_subtitle: "Ability Scores & Equipment",
        back_body: "<p><strong>Ability Scores:</strong> Strength, Intelligence, Charisma</p><p><strong>Equipment:</strong> Fine clothes, a signet ring, a scroll of pedigree, a purse containing 25 GP.</p>"
    }
];

const species = [
    {
        type: "species", title: "DRAGONBORN", subtitle: "Species", traits: "30 ft Speed, Size Medium",
        front_body: "<p><strong>Draconic Ancestry:</strong> Choose a type of dragon. Your breath weapon and damage resistance are determined by the dragon type.<br><strong>Breath Weapon:</strong> When you take the Attack action, you can replace one of your attacks with an exhalation of magical energy in a 15-foot cone or a 30-foot line. Each creature in that area must make a Dexterity saving throw (DC 8 + CON + PB). On a failed save, the creature takes 1d10 damage of the type associated with your ancestry. On a successful save, it takes half as much. You can use this a number of times equal to your PB per Long Rest.</p>",
        back_title: "DRAGONBORN", back_subtitle: "Resistance & Darkvision",
        back_body: "<p><strong>Damage Resistance:</strong> You have resistance to the damage type associated with your draconic ancestry.</p><p><strong>Darkvision:</strong> You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.</p><p>At level 5, you gain the Winged ability to manifest temporary wings (fly speed) for 10 minutes, once per Long Rest.</p>"
    },
    {
        type: "species", title: "TIEFLING", subtitle: "Species", traits: "30 ft Speed, Size Medium",
        front_body: "<p><strong>Fiendish Legacy:</strong> You have a legacy from the Lower Planes. Choose Abyssal, Chthonic, or Infernal. This choice determines your innate spellcasting and resistance.<br>At level 1, you know a specific cantrip. At level 3, you learn a 1st-level spell and can cast it once per Long Rest. At level 5, you learn a 2nd-level spell.</p>",
        back_title: "TIEFLING", back_subtitle: "Resistance & Darkvision",
        back_body: "<p><strong>Darkvision:</strong> You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.</p><p><strong>Damage Resistance:</strong> You have resistance to cold (Abyssal), necrotic (Chthonic), or fire (Infernal) damage based on your legacy choice.</p>"
    }
];

const feats = [
    {
        type: "feat", title: "ZHENTARIM RUFFIAN", subtitle: "Origin Feat", traits: "", skills: "", tools: "",
        front_body: "<p>You gain the following benefits:</p><p><strong>Exploit Opening:</strong> When you roll damage for an Opportunity Attack, you can roll the damage dice twice and use either roll against the target.</p><p><strong>Family First:</strong> If you have Heroic Inspiration when you roll Initiative, you can expend it to give yourself and your allies Advantage on that Initiative roll.</p>",
        back_title: "ZHENTARIM RUFFIAN", back_subtitle: "Feat Details",
        back_body: "<p>You have been trained in the cutthroat tactics of the Black Network. Loyalty to your comrades and seizing every advantage are the core tenets of your survival.</p>"
    }
];

fs.writeFileSync('cantrips.json', JSON.stringify(cantrips, null, 2));
fs.writeFileSync('spells_level_1.json', JSON.stringify(level1Spells, null, 2));
fs.writeFileSync('backgrounds.json', JSON.stringify(backgrounds, null, 2));
fs.writeFileSync('species.json', JSON.stringify(species, null, 2));
fs.writeFileSync('origin_feats.json', JSON.stringify(feats, null, 2));

console.log("Written JSON files. Now generating cards...");

try {
    execSync('node generate_cards.js cantrips.json', { stdio: 'inherit' });
    execSync('node generate_cards.js spells_level_1.json', { stdio: 'inherit' });
    execSync('node generate_cards.js backgrounds.json', { stdio: 'inherit' });
    execSync('node generate_cards.js species.json', { stdio: 'inherit' });
    execSync('node generate_cards.js origin_feats.json', { stdio: 'inherit' });
} catch (e) {
    console.error("Failed to execute card generator:", e.message);
}
