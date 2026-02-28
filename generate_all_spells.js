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
        type: "spell", title: "CHILL TOUCH", subtitle: "Necromancy Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S",
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
        type: "spell", title: "DRUIDCRAFT", subtitle: "Transmutation Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>Whispering to the spirits of nature, you create one of the following effects within range:<br>- Create a tiny, harmless sensory effect that predicts what the weather will be at your location for the next 24 hours.<br>- Make a flower blossom, a seed pod open, or a leaf bud bloom.<br>- Create an instantaneous, harmless sensory effect, such as falling leaves, wind, or the sound of a small animal.<br>- Light or snuff out a candle, a torch, or a small campfire.</p>",
        back_title: "DRUIDCRAFT", back_subtitle: "Details",
        back_body: "<p>This is a minor magical trick that cannot cause damage or affect an unwilling creature.</p>"
    },
    {
        type: "spell", title: "ELDRITCH BLAST", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S",
        front_body: "<p>A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 Force damage.</p>",
        back_title: "ELDRITCH BLAST", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The spell creates more than one beam when you reach higher levels: two beams at level 5, three beams at level 11, and four beams at level 17. You can direct the beams at the same target or at different ones. Make a separate attack roll for each beam.</p>"
    },
    {
        type: "spell", title: "ELEMENTALISM", subtitle: "Transmutation Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You exert control over the elements, creating one of the following effects:<br>- Create a breeze that flutters clothing.<br>- Light or snuff a candle or torch.<br>- Clean up to 1 cubic foot of dirt.<br>- Chill or warm 1 pound of nonmagical material for 1 hour.<br>- Create a shower of sparks or a puff of wind.</p>",
        back_title: "ELEMENTALISM", back_subtitle: "Details",
        back_body: "<p>This is a minor magical trick that cannot cause damage or affect an unwilling creature.</p>"
    },
    {
        type: "spell", title: "GUIDANCE", subtitle: "Divination Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You touch one willing creature. Once before the spell ends (Concentration, up to 1 minute), the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends.</p>",
        back_title: "GUIDANCE", back_subtitle: "Details",
        back_body: "<p>There is no additional scaling for this spell at higher levels.</p>"
    },
    {
        type: "spell", title: "LIGHT", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "Touch", vsm: "V, M",
        front_body: "<p>You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The spell ends if you cast it again or dismiss it as an action.</p>",
        back_title: "LIGHT", back_subtitle: "Components & Details",
        back_body: "<p><strong>Materials:</strong> A firefly or phosphorescent moss.</p><p>If you target an object held or worn by a hostile creature, that creature must succeed on a Dexterity saving throw to avoid the spell.</p>"
    },
    {
        type: "spell", title: "POISON SPRAY", subtitle: "Necromancy Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You project a puff of noxious gas from your palm. Make a ranged spell attack against a creature within range. On a hit, the target takes 1d12 Poison damage.</p>",
        back_title: "POISON SPRAY", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d12 when you reach levels 5 (2d12), 11 (3d12), and 17 (4d12).</p>"
    },
    {
        type: "spell", title: "PRESTIDIGITATION", subtitle: "Transmutation Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You create one of the following magical effects within range:<br>- Create a harmless sensory effect.<br>- Light or snuff out a candle, a torch, or a small campfire.<br>- Clean or soil an object no larger than 1 cubic foot.<br>- Chill, warm, or flavor up to 1 cubic foot of nonliving material for 1 hour.<br>- Make a color, a small mark, or a symbol appear on an object or a surface for 1 hour.<br>- Create a nonmagical trinket or an illusory image that can fit in your hand and that lasts until the end of your next turn.</p>",
        back_title: "PRESTIDIGITATION", back_subtitle: "Details",
        back_body: "<p>If you cast this spell multiple times, you can have up to three of its non-instantaneous effects active at a time, and you can dismiss such an effect as an action.</p>"
    },
    {
        type: "spell", title: "PRODUCE FLAME", subtitle: "Conjuration Cantrip", casting_time: "1 Bonus Action", range: "Self", vsm: "V, S",
        front_body: "<p>A flickering flame appears in your hand. The flame remains there for the duration and harms neither you nor your equipment. The flame sheds bright light in a 20-foot radius and dim light for an additional 20 feet. The spell ends if you dismiss it as a bonus action or if you cast it again.</p>",
        back_title: "PRODUCE FLAME", back_subtitle: "Attack & Scaling",
        back_body: "<p>You can also attack with the flame, although doing so ends the spell. When you cast this spell, or as an action on a later turn, you can hurl the flame at a creature within 60 feet. Make a ranged spell attack. On a hit, the target takes 1d8 Fire damage.</p><p><strong>At Higher Levels:</strong> The damage increases by 1d8 at levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "RAY OF FROST", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V, S",
        front_body: "<p>A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 Cold damage, and its Speed is reduced by 10 feet until the start of your next turn.</p>",
        back_title: "RAY OF FROST", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "RESISTANCE", subtitle: "Abjuration Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S, M",
        front_body: "<p>You touch one willing creature. Once before the spell ends (Concentration, up to 1 minute), the target can roll a d4 and add the number rolled to one saving throw of its choice. It can roll the die before or after making the saving throw. The spell then ends.</p>",
        back_title: "RESISTANCE", back_subtitle: "Components & Details",
        back_body: "<p><strong>Materials:</strong> A miniature cloak.</p><p>There is no additional scaling for this spell at higher levels.</p>"
    },
    {
        type: "spell", title: "SHILLELAGH", subtitle: "Transmutation Cantrip", casting_time: "1 Bonus Action", range: "Touch", vsm: "V, S, M",
        front_body: "<p>The wood of a club or quarterstaff you are holding is imbued with nature's power. For the duration (1 minute), you can use your spellcasting ability instead of Strength for the attack and damage rolls of melee attacks using that weapon, and the weapon's damage die becomes a d8. It also deals Force damage instead of its normal type.</p>",
        back_title: "SHILLELAGH", back_subtitle: "Components & Details",
        back_body: "<p><strong>Materials:</strong> Mistletoe, a shamrock leaf, and a club or quarterstaff.</p><p>The spell ends if you cast it again or if you let go of the weapon.</p><p><strong>At Higher Levels:</strong> The damage die becomes a d10 at level 5, a d12 at level 11, and 2d6 at level 17.</p>"
    },
    {
        type: "spell", title: "SHOCKING GRASP", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "Touch", vsm: "V, S",
        front_body: "<p>Lightning springs from your hand to deliver a shock to a creature. Make a melee spell attack against the target. You have Advantage on the attack roll if the target is wearing armor made of metal. On a hit, the target takes 1d8 Lightning damage, and it can't take reactions until the start of its next turn.</p>",
        back_title: "SHOCKING GRASP", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "SORCEROUS BURST", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "120 Feet", vsm: "V, S",
        front_body: "<p>You cast a burst of sorcerous energy at one creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d8 damage. Choose Acid, Cold, Fire, Lightning, Poison, or Thunder for the damage type.</p>",
        back_title: "SORCEROUS BURST", back_subtitle: "Exploding Dice",
        back_body: "<p>If you roll an 8 on a d8 for this spell's damage, you can roll another d8 and add it to the damage. You can do this continuously if you keep rolling an 8.</p><p><strong>At Higher Levels:</strong> Damage increases by 1d8 at levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "SPARE THE DYING", subtitle: "Necromancy Cantrip", casting_time: "1 Action", range: "15 Feet", vsm: "V, S",
        front_body: "<p>You bestow a sliver of life energy to close the wounds of a dying creature. Choose a living creature within range that has 0 Hit Points. The creature becomes Stable.</p>",
        back_title: "SPARE THE DYING", back_subtitle: "Details & Scaling",
        back_body: "<p>This spell has no effect on Constructs or Undead.</p><p><strong>At Higher Levels:</strong> The spell's range increases to 30 ft at level 5, 60 ft at level 11, and 120 ft at level 17.</p>"
    },
    {
        type: "spell", title: "STARRY WISP", subtitle: "Evocation Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V, S",
        front_body: "<p>You launch a wisp of starlight at a creature or object within range. Make a ranged spell attack. On a hit, the target takes 1d8 Radiant damage, and until the end of your next turn, it emits dim light in a 10-foot radius and can't benefit from the Invisible condition.</p>",
        back_title: "STARRY WISP", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> Damage increases by 1d8 at levels 5 (2d8), 11 (3d8), and 17 (4d8).</p>"
    },
    {
        type: "spell", title: "THORN WHIP", subtitle: "Transmutation Cantrip", casting_time: "1 Action", range: "30 Feet", vsm: "V, S, M",
        front_body: "<p>You create a long, vine-like whip covered in thorns that lashes out at your command toward a creature in range. Make a melee spell attack against the target. On a hit, the creature takes 1d6 Piercing damage, and if the creature is Large or smaller, you pull the creature up to 10 feet closer to you.</p>",
        back_title: "THORN WHIP", back_subtitle: "Components & Scaling",
        back_body: "<p><strong>Materials:</strong> The stem of a plant with thorns.</p><p><strong>At Higher Levels:</strong> The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).</p>"
    },
    {
        type: "spell", title: "TOLL THE DEAD", subtitle: "Necromancy Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V, S",
        front_body: "<p>You point at one creature you can see within range, and the sound of a dolorous bell fills the air around it for a moment. The target must succeed on a Wisdom saving throw or take 1d8 Necrotic damage. If the target is missing any of its Hit Points, it instead takes 1d12 Necrotic damage.</p>",
        back_title: "TOLL THE DEAD", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by one die when you reach levels 5 (2d8/2d12), 11 (3d8/3d12), and 17 (4d8/4d12).</p>"
    },
    {
        type: "spell", title: "VICIOUS MOCKERY", subtitle: "Enchantment Cantrip", casting_time: "1 Action", range: "60 Feet", vsm: "V",
        front_body: "<p>You unleash a string of insults laced with subtle enchantments at a creature you can see within range. If the target can hear you (though it need not understand you), it must succeed on a Wisdom saving throw or take 1d6 Psychic damage and have Disadvantage on the next attack roll it makes before the end of its next turn.</p>",
        back_title: "VICIOUS MOCKERY", back_subtitle: "Damage & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).</p>"
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
        type: "spell", title: "BURNING HANDS", subtitle: "1st-Level Evocation", casting_time: "1 Action", range: "Self (15-ft Cone)", vsm: "V, S",
        front_body: "<p>As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 Fire damage on a failed save, or half as much damage on a successful one.</p>",
        back_title: "BURNING HANDS", back_subtitle: "Ignition & Higher Levels",
        back_body: "<p>The fire ignites any flammable objects in the area that aren't being worn or carried.</p><p><strong>At Higher Levels:</strong> The damage increases by 1d6 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "CHARM PERSON", subtitle: "1st-Level Enchantment", casting_time: "1 Action", range: "30 Feet", vsm: "V, S",
        front_body: "<p>You attempt to charm a Humanoid you can see within range. It must make a Wisdom saving throw, and does so with Advantage if you or your companions are fighting it. If it fails the saving throw, it is Charmed by you until the spell ends (1 hour) or until you or your companions do anything harmful to it.</p>",
        back_title: "CHARM PERSON", back_subtitle: "Details & Higher Levels",
        back_body: "<p>The charmed creature regards you as a friendly acquaintance. When the spell ends, the creature knows it was charmed by you.</p><p><strong>At Higher Levels:</strong> You can target one additional creature for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "COLOR SPRAY", subtitle: "1st-Level Illusion", casting_time: "1 Action", range: "Self (15-ft Cone)", vsm: "V, S, M",
        front_body: "<p>A dazzling array of flashing, colored light springs from your hand. Roll 6d10; the total is how many Hit Points of creatures this spell can effect. Creatures in a 15-foot cone originating from you are affected in ascending order of their current Hit Points (ignoring unconscious creatures and creatures that can't see).</p>",
        back_title: "COLOR SPRAY", back_subtitle: "Components & Higher Levels",
        back_body: "<p><strong>Materials:</strong> A pinch of powder or sand that is colored red, yellow, and blue.</p><p>Starting with the creature that has the lowest current HP, each creature affected by this spell is Blinded until the end of your next turn. Subtract each creature's HP from the total before moving on.</p><p><strong>At Higher Levels:</strong> Roll an additional 2d10 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "DETECT MAGIC", subtitle: "1st-Level Divination (Ritual)", casting_time: "1 Action", range: "Self (30-ft sphere)", vsm: "V, S",
        front_body: "<p>For the duration (Concentration, up to 10 minutes), you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any.</p>",
        back_title: "DETECT MAGIC", back_subtitle: "Details & Blockers",
        back_body: "<p>The spell can penetrate most barriers, but it is blocked by 1 foot of stone, 1 inch of common metal, a thin sheet of lead, or 3 feet of wood or dirt.</p><p>As a Ritual spell, it can be cast without expending a spell slot if your class allows you to cast rituals.</p>"
    },
    {
        type: "spell", title: "DISSONANT WHISPERS", subtitle: "1st-Level Enchantment", casting_time: "1 Action", range: "60 Feet", vsm: "V",
        front_body: "<p>You whisper a discordant melody that only one creature of your choice within range can hear. The target must make a Wisdom saving throw. On a failed save, it takes 3d6 Psychic damage and must immediately use its Reaction, if available, to move as far as its Speed allows away from you. On a successful save, the target takes half as much damage and doesn't have to move away.</p>",
        back_title: "DISSONANT WHISPERS", back_subtitle: "Deafness & Higher Levels",
        back_body: "<p>A Deafened creature automatically succeeds on the save.</p><p><strong>At Higher Levels:</strong> The damage increases by 1d6 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "FAERIE FIRE", subtitle: "1st-Level Evocation", casting_time: "1 Action", range: "60 Feet", vsm: "V",
        front_body: "<p>Each object in a 20-foot cube within range is outlined in blue, green, or violet light. Any creature in the area must succeed on a Dexterity saving throw or also be outlined in light. For the duration (Concentration, up to 1 minute), outlined objects and creatures shed dim light in a 10-foot radius.</p>",
        back_title: "FAERIE FIRE", back_subtitle: "Advantage & Invisibility",
        back_body: "<p>Any attack roll against an affected creature or object has Advantage if the attacker can see it, and the affected creature or object can't benefit from being Invisible.</p><p>There is no additional scaling for this spell at higher levels.</p>"
    },
    {
        type: "spell", title: "HEALING WORD", subtitle: "1st-Level Evocation", casting_time: "1 Bonus Action", range: "60 Feet", vsm: "V",
        front_body: "<p>A creature of your choice that you can see within range regains Hit Points equal to 2d4 + your spellcasting ability modifier. This spell has no effect on Constructs or Undead.</p>",
        back_title: "HEALING WORD", back_subtitle: "Healing & Scaling",
        back_body: "<p><strong>At Higher Levels:</strong> The healing increases by 2d4 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "HEX", subtitle: "1st-Level Enchantment", casting_time: "1 Bonus Action", range: "90 Feet", vsm: "V, S, M",
        front_body: "<p>You place a curse on a creature that you can see. Until the spell ends (Concentration, up to 1 hour), you deal an extra 1d6 Necrotic damage to the target whenever you hit it with an attack. Also, choose one ability when you cast the spell. The target has Disadvantage on ability checks made with the chosen ability.</p>",
        back_title: "HEX", back_subtitle: "Components & Higher Levels",
        back_body: "<p><strong>Materials:</strong> The petrified eye of a newt.</p><p>If the target drops to 0 Hit Points before this spell ends, you can use a Bonus Action on a subsequent turn of yours to curse a new creature.</p><p><strong>At Higher Levels:</strong> The duration becomes 8 hours at 3rd level, and 24 hours at 5th level.</p>"
    },
    {
        type: "spell", title: "THUNDERWAVE", subtitle: "1st-Level Evocation", casting_time: "1 Action", range: "Self (15-ft Cube)", vsm: "V, S",
        front_body: "<p>A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw. On a failed save, a creature takes 2d8 Thunder damage and is pushed 10 feet away from you. On a successful save, the creature takes half as much damage and isn't pushed.</p>",
        back_title: "THUNDERWAVE", back_subtitle: "Effects & Higher Levels",
        back_body: "<p>In addition, unsecured objects that are completely within the area of effect are automatically pushed 10 feet away from you by the spell's effect, and the spell emits a thunderous boom audible out to 300 feet.</p><p><strong>At Higher Levels:</strong> The damage increases by 1d8 for each slot level above 1st.</p>"
    },
    {
        type: "spell", title: "WITCH BOLT", subtitle: "1st-Level Evocation", casting_time: "1 Action", range: "30 Feet", vsm: "V, S, M",
        front_body: "<p>A beam of crackling, blue energy lances out toward a creature within range. Make a ranged spell attack against that creature. On a hit, the target takes 2d12 Lightning damage.</p>",
        back_title: "WITCH BOLT", back_subtitle: "Components & Concentration",
        back_body: "<p><strong>Materials:</strong> A twig from a tree that has been struck by lightning.</p><p>On each of your turns for the duration (Concentration, up to 1 minute), you can use your action to deal 1d12 Lightning damage to the target automatically. The spell ends if the target is ever outside the spell's range or if it has total cover from you.</p><p><strong>At Higher Levels:</strong> Initial damage increases by 1d12 for each slot level above 1st.</p>"
    }
];

fs.writeFileSync('cantrips_full.json', JSON.stringify(cantrips, null, 2));
fs.writeFileSync('spells_level_1_full.json', JSON.stringify(level1Spells, null, 2));

console.log("Written full JSON files. Generating full card sets...");

try {
    execSync('node generate_cards.js cantrips_full.json', { stdio: 'inherit' });
    execSync('node generate_cards.js spells_level_1_full.json', { stdio: 'inherit' });
    console.log("Completed Full Sets!");
} catch (e) {
    console.error("Failed to execute card generator:", e.message);
}
