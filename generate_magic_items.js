const fs = require('fs');
const { execSync } = require('child_process');

const items = [
    // Group 1
    {
        type: "item", title: "HEADBAND OF INTELLECT", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>Your Intelligence score is 19 while you wear this headband. It has no effect on you if your Intelligence is already 19 or higher without it.</p>",
        back_title: "HEADBAND OF INTELLECT", back_subtitle: "Details",
        back_body: "<p>This intricate headband is woven with gleaming wires.</p>"
    },
    {
        type: "item", title: "ROD OF THE PACT KEEPER +1", subtitle: "Rod (Requires Attunement by Warlock)",
        front_body: "<p>While holding this rod, you gain a +1 bonus to spell attack rolls and to the saving throw DCs of your warlock spells.</p>",
        back_title: "ROD OF THE PACT KEEPER +1", back_subtitle: "Regain Spell Slot",
        back_body: "<p>As an action, you can regain 1 warlock spell slot. You can't use this property again until you finish a long rest.</p>"
    },
    {
        type: "item", title: "ROD OF THE PACT KEEPER +2", subtitle: "Rod (Requires Attunement by Warlock)",
        front_body: "<p>While holding this rod, you gain a +2 bonus to spell attack rolls and to the saving throw DCs of your warlock spells.</p>",
        back_title: "ROD OF THE PACT KEEPER +2", back_subtitle: "Regain Spell Slot",
        back_body: "<p>As an action, you can regain 1 warlock spell slot. You can't use this property again until you finish a long rest.</p>"
    },
    {
        type: "item", title: "ROD OF THE PACT KEEPER +3", subtitle: "Rod (Requires Attunement by Warlock)",
        front_body: "<p>While holding this rod, you gain a +3 bonus to spell attack rolls and to the saving throw DCs of your warlock spells.</p>",
        back_title: "ROD OF THE PACT KEEPER +3", back_subtitle: "Regain Spell Slot",
        back_body: "<p>As an action, you can regain 1 warlock spell slot. You can't use this property again until you finish a long rest.</p>"
    },
    {
        type: "item", title: "BRACERS OF THE ILLUSIONIST", subtitle: "Wondrous Item",
        front_body: "<p>While wearing these bracers, whenever you cast an illusion spell that has a duration of 1 minute or longer, you can double its duration, to a maximum of 24 hours.</p>",
        back_title: "BRACERS", back_subtitle: "Illusionist",
        back_body: "<p>Silver bracers polished to a mirror finish, often refracting light strangely.</p>"
    },
    {
        type: "item", title: "SMALL ELVEN CHAINMAIL", subtitle: "Armor (Chain Shirt)",
        front_body: "<p>You gain a +1 bonus to AC while wearing this armor (Base AC 16). You gain no benefit from your Dexterity modifier. You are considered proficient with this armor even if you lack proficiency with that armor type.</p>",
        back_title: "ELVEN CHAINMAIL", back_subtitle: "Details",
        back_body: "<p>Made of interlocking rings of silver metal, tailored for a small-sized creature. It is incredibly light and supple.</p>"
    },
    {
        type: "item", title: "BELL BRANCH", subtitle: "Wondrous Item (Requires Attunement by a Spellcaster)",
        front_body: "<p>This silver implement is shaped like a tree branch and strung with small golden bells. It contains 3 charges, and regains 1d3 expended charges at dawn. You can expend 1 charge as an action to ring the bells, sounding an alarm that wards against certain creatures.</p>",
        back_title: "BELL BRANCH", back_subtitle: "Warding",
        back_body: "<p>When rung, Aberrations, Celestials, Elementals, Fey, Fiends, or Undead within 60 ft must make a DC 15 Charisma save or be turned for 1 minute or until it takes damage.</p>"
    },
    {
        type: "item", title: "CAULDRON OF REBIRTH", subtitle: "Wondrous Item (Requires Attunement by a Druid/Warlock)",
        front_body: "<p>This tiny iron pot can be enlarged as an action to a large cauldron. You can use it as a spellcasting focus. It aids in crafting potions of healing, or raising the dead.</p>",
        back_title: "CAULDRON OF REBIRTH", back_subtitle: "Details",
        back_body: "<p>If you place a corpse in the filled cauldron with 200 gp of salt, it is targeted by a Raise Dead spell. Once used for this, it can't be used again for 7 days.</p>"
    },
    {
        type: "item", title: "DARKSHARD AMULET", subtitle: "Wondrous Item (Requires Attunement by Warlock)",
        front_body: "<p>This amulet is fashioned from a single shard of resonant extraplanar material. You can use it as a spellcasting focus for your warlock spells.</p>",
        back_title: "DARKSHARD AMULET", back_subtitle: "Abilities",
        back_body: "<p>Once per long rest, you can use an action to try to cast a cantrip that you don't know. Make a DC 10 Intelligence (Arcana) check. On a success, you cast the cantrip. On a failure, the action is wasted.</p>"
    },
    {
        type: "item", title: "HORN OF ALARM", subtitle: "Wondrous Item",
        front_body: "<p>You can use an action to blow this horn, which can be heard up to 600 feet away. Additionally, once per day you can blow the horn to replicate the Alarm spell.</p>",
        back_title: "HORN OF ALARM", back_subtitle: "Details",
        back_body: "<p>Often favored by patrols and sentries who need to rouse a camp immediately.</p>"
    },
    {
        type: "weapon", title: "GOLD MOONTOUCHED SICKLE", subtitle: "Weapon (Simple Melee)", range_or_props: "Light", damage_roll: "1d4", damage_type: "Slashing",
        front_body: "<p>In darkness, the unsheathed blade of this sickle sheds moonlight, creating bright light in a 15-foot radius and dim light for an additional 15 feet.</p>",
        back_title: "MOONTOUCHED SICKLE", back_subtitle: "Damage"
    },

    // Group 2
    {
        type: "item", title: "OUTER ESSENCE SHARD (GOOD)", subtitle: "Wondrous Item (Requires Attunement by Sorcerer)",
        front_body: "<p>This glowing crystalline shard contains the essence of the Upper Planes. While holding the shard, you can use it as a spellcasting focus.</p>",
        back_title: "OUTER ESSENCE SHARD", back_subtitle: "Metamagic Effect",
        back_body: "<p>When you use a Metamagic option on a spell, you can grant temporary hit points equal to 3d6 to one creature of your choice that you can see.</p>"
    },
    {
        type: "item", title: "BLOODWELL VIAL +1", subtitle: "Wondrous Item (Requires Attunement by Sorcerer)",
        front_body: "<p>Provides a +1 bonus to your spell attack rolls and saving throw DCs. Also, when you roll a Hit Die to regain HP, you can regain 5 Sorcery Points (once per long rest).</p>",
        back_title: "BLOODWELL VIAL +1", back_subtitle: "Details",
        back_body: "<p>Requires attunement by a sorcerer. Contains a mixture of blood and magic.</p>"
    },
    {
        type: "item", title: "BLOODWELL VIAL +2", subtitle: "Wondrous Item (Requires Attunement by Sorcerer)",
        front_body: "<p>Provides a +2 bonus to your spell attack rolls and saving throw DCs. Also, when you roll a Hit Die to regain HP, you can regain 5 Sorcery Points (once per long rest).</p>",
        back_title: "BLOODWELL VIAL +2", back_subtitle: "Details",
        back_body: "<p>Requires attunement by a sorcerer. Contains a mixture of blood and magic.</p>"
    },
    {
        type: "item", title: "BLOODWELL VIAL +3", subtitle: "Wondrous Item (Requires Attunement by Sorcerer)",
        front_body: "<p>Provides a +3 bonus to your spell attack rolls and saving throw DCs. Also, when you roll a Hit Die to regain HP, you can regain 5 Sorcery Points (once per long rest).</p>",
        back_title: "BLOODWELL VIAL +3", back_subtitle: "Details",
        back_body: "<p>Requires attunement by a sorcerer. Contains a mixture of blood and magic.</p>"
    },
    {
        type: "item", title: "STAFF OF THE MAGI", subtitle: "Staff, Legendary (Requires Attunement by Sor/War/Wiz)",
        front_body: "<p>This staff can be wielded as a magic quarterstaff that grants a +2 bonus to attack/damage rolls. Gives +2 to spell attack rolls. Holds 50 charges. Can cast numerous spells like Fireball (7 charges), Conjure Elemental (7 charges), Dispel Magic (3 charges), Passwall (5 charges) etc.</p>",
        back_title: "STAFF OF THE MAGI", back_subtitle: "Retributive Strike",
        back_body: "<p>You can use an action to break the staff, causing an explosion. You have a chance to plane shift, otherwise take massive force damage based on charges.</p>"
    },
    {
        type: "item", title: "CLOCKWORK AMULET", subtitle: "Wondrous Item",
        front_body: "<p>When you make an attack roll while wearing the amulet, you can forgo rolling the d20 to get a 10 on the die. Once used, this property can't be used again until the next dawn.</p>",
        back_title: "CLOCKWORK AMULET", back_subtitle: "Mechanus Tech",
        back_body: "<p>Filled with tiny clicking gears, ensuring mathematical average performance exactly when you need it.</p>"
    },
    {
        type: "item", title: "RIVAL COIN", subtitle: "Wondrous Item",
        front_body: "<p>A magical coin that seems to warm up when a hostile creature of CR 1 or higher is within 60 feet. Flipping it always results in it landing on the edge if danger is near.</p>",
        back_title: "RIVAL COIN", back_subtitle: "Details",
        back_body: "<p>An old adventurer's trick coin.</p>"
    },
    {
        type: "weapon", title: "SILVERED STAFF", subtitle: "Weapon (Simple Melee)", range_or_props: "Versatile (1d8)", damage_roll: "1d6", damage_type: "Bludgeoning",
        front_body: "<p>A finely crafted quarterstaff plated in shining silver. It is considered a magic weapon. When you score a Critical Hit with it against a Shapeshifter, you roll one additional die of the weapon’s damage.</p>",
        back_title: "SILVERED STAFF", back_subtitle: "Damage"
    },

    // Group 3
    {
        type: "item", title: "INSTRUMENT OF THE BARDS", subtitle: "Wondrous Item (Requires Attunement by Bard)",
        front_body: "<p>You can use an action to play the instrument and cast spells such as Fly, Invisibility, Leviate, and Protection from Evil and Good (spells depend on the specific instrument model). Opponents have disadvantage on saves against your charm spells.</p>",
        back_title: "INSTRUMENT", back_subtitle: "Details",
        back_body: "<p>A legendary magical instrument that channels the raw power of song.</p>"
    },
    {
        type: "item", title: "RHYTHM-MAKER'S DRUM +1", subtitle: "Wondrous Item (Requires Attunement by Bard)",
        front_body: "<p>Provides a +1 bonus to spell attack rolls and saving throw DCs. As an action, you can regain 1 use of your Bardic Inspiration. Once used, you cannot do this again until a long rest.</p>",
        back_title: "RHYTHM DRUM", back_subtitle: "Details",
        back_body: "<p>Keeps the beat for your allies.</p>"
    },
    {
        type: "item", title: "JESTER'S MASK", subtitle: "Wondrous Item",
        front_body: "<p>While wearing this mask, you can cast Tasha's Hideous Laughter once per long rest without using a spell slot. Additionally, you gain a +1 bonus to Performance checks.</p>",
        back_title: "JESTER'S MASK", back_subtitle: "Details",
        back_body: "<p>A vibrant, slightly unsettling ceramic mask.</p>"
    },
    {
        type: "item", title: "SMALL +3 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +3 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 3). Fashioned for a small-sized creature.</p>",
        back_title: "STUDDED LEATHER +3", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "SMALL +2 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +2 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 2). Fashioned for a small-sized creature.</p>",
        back_title: "STUDDED LEATHER +2", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "SMALL +1 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +1 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 1). Fashioned for a small-sized creature.</p>",
        back_title: "STUDDED LEATHER +1", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "BAG OF TRICKS (GREY)", subtitle: "Wondrous Item",
        front_body: "<p>This tiny bag contains 3 fuzzy objects. You can pull one out and throw it up to 20 feet. It instantly becomes a creature (roll 1d8 to determine: Weasel, Giant Rat, Badger, Boar, Panther, Giant Badger, Dire Wolf, Giant Elk). Recharges at dawn.</p>",
        back_title: "BAG OF TRICKS (GREY)", back_subtitle: "Details",
        back_body: "<p>The creature obeys your commands and acts on your turn. It lasts until dawn or until reduced to 0 HP.</p>"
    },
    {
        type: "item", title: "BAG OF TRICKS (BROWN)", subtitle: "Wondrous Item",
        front_body: "<p>This tiny bag contains 3 fuzzy objects. You can pull one out and throw it up to 20 feet. It instantly becomes a creature (roll 1d8 to determine: Giant Rat, Owl, Mastiff, Goat, Giant Goat, Giant Boar, Lion, Brown Bear). Recharges at dawn.</p>",
        back_title: "BAG OF TRICKS (BROWN)", back_subtitle: "Details",
        back_body: "<p>The creature obeys your commands and acts on your turn. It lasts until dawn or until reduced to 0 HP.</p>"
    },
    {
        type: "item", title: "INSTRUMENT OF ILLUSIONS", subtitle: "Wondrous Item",
        front_body: "<p>While you use an action to play this instrument, you can create harmless visual illusions within a 15-foot radius of yourself. The illusions last as long as you perform and move with you.</p>",
        back_title: "INSTRUMENT OF ILLUSIONS", back_subtitle: "Details",
        back_body: "<p>Perfect for storytelling and adding visual flair to your performances.</p>"
    },
    {
        type: "weapon", title: "SYLVAN TALON SPEAR", subtitle: "Weapon (Martial Melee)", range_or_props: "Thrown (20/60), Versatile (1d8)", damage_roll: "1d6", damage_type: "Piercing",
        front_body: "<p>This spear is wrapped in living vines. When you hit with a ranged attack using this weapon, you can command it to instantly fly back to your hand.</p>",
        back_title: "SYLVAN TALON SPEAR", back_subtitle: "Damage"
    },

    // Group 4
    {
        type: "item", title: "RING OF PROTECTION", subtitle: "Ring (Requires Attunement)",
        front_body: "<p>You gain a +1 bonus to AC and saving throws while wearing this ring.</p>",
        back_title: "RING OF PROTECTION", back_subtitle: "Details",
        back_body: "<p>A simple band of silver that hums slightly with abjuration magic.</p>"
    },
    {
        type: "item", title: "BRACERS OF DEFENSE", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While wearing these bracers, you gain a +2 bonus to AC if you are wearing no armor and using no shield.</p>",
        back_title: "BRACERS OF DEFENSE", back_subtitle: "Details",
        back_body: "<p>Often worn by monks and spellcasters for added protection.</p>"
    },
    {
        type: "item", title: "WRAPS OF UNARMED POWER +3", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While you're wearing these hand wraps, your unarmed strikes are considered magical, and you gain a +3 bonus to the attack and damage rolls of your unarmed strikes.</p>",
        back_title: "WRAPS OF POWER +3", back_subtitle: "Details",
        back_body: "<p>Durable cloth strips inscribed with runes.</p>"
    },
    {
        type: "item", title: "WRAPS OF UNARMED POWER +2", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While you're wearing these hand wraps, your unarmed strikes are considered magical, and you gain a +2 bonus to the attack and damage rolls of your unarmed strikes.</p>",
        back_title: "WRAPS OF POWER +2", back_subtitle: "Details",
        back_body: "<p>Durable cloth strips inscribed with runes.</p>"
    },
    {
        type: "item", title: "WRAPS OF UNARMED POWER +1", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While you're wearing these hand wraps, your unarmed strikes are considered magical, and you gain a +1 bonus to the attack and damage rolls of your unarmed strikes.</p>",
        back_title: "WRAPS OF POWER +1", back_subtitle: "Details",
        back_body: "<p>Durable cloth strips inscribed with runes.</p>"
    },
    {
        type: "item", title: "PERIAPT OF WOUND CLOSURE", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While you wear this pendant, you stabilize whenever you are dying at the start of your turn. In addition, whenever you roll a Hit Die to regain hit points, double the number of hit points it restores.</p>",
        back_title: "PERIAPT", back_subtitle: "Details",
        back_body: "<p>A teardrop-shaped red stone that pulses like a heartbeat.</p>"
    },
    {
        type: "item", title: "MASK OF CHANGED APPEARANCE", subtitle: "Wondrous Item",
        front_body: "<p>While wearing this mask, you can use an action to cast the Disguise Self spell from it at will. The spell ends if the mask is removed.</p>",
        back_title: "MASK OF APPEARANCE", back_subtitle: "Details",
        back_body: "<p>A blank, white mask that conforms to the wearer's new envisioned face.</p>"
    },
    {
        type: "item", title: "MYSTERY KEY", subtitle: "Wondrous Item",
        front_body: "<p>A rusted key that has a 5% chance of unlocking any non-magical lock into which it's inserted. Once it successfully unlocks something, it disappears.</p>",
        back_title: "MYSTERY KEY", back_subtitle: "Details",
        back_body: "<p>A small gamble for a rogue in a pinch.</p>"
    },

    // Group 5
    {
        type: "item", title: "MEDIUM +3 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +3 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 3). Fashioned for a medium-sized creature.</p>",
        back_title: "STUDDED LEATHER +3", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "MEDIUM +2 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +2 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 2). Fashioned for a medium-sized creature.</p>",
        back_title: "STUDDED LEATHER +2", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "MEDIUM +1 STUDDED LEATHER", subtitle: "Armor (Light)",
        front_body: "<p>You have a +1 bonus to AC while wearing this armor (Base AC 12 + Dex Modifier + 1). Fashioned for a medium-sized creature.</p>",
        back_title: "STUDDED LEATHER +1", back_subtitle: "Details",
        back_body: "<p>Tough leather, reinforced with closely-set rivets or spikes.</p>"
    },
    {
        type: "item", title: "GLOVES OF THIEVERY", subtitle: "Wondrous Item",
        front_body: "<p>These gloves are invisible while worn. While wearing them, you gain a +5 bonus to Sleight of Hand checks and Dexterity checks made to pick locks.</p>",
        back_title: "GLOVES OF THIEVERY", back_subtitle: "Details",
        back_body: "<p>Very thin leather gloves that vanish seamlessly against the skin.</p>"
    },
    {
        type: "item", title: "BOOTS OF ELVENKIND", subtitle: "Wondrous Item",
        front_body: "<p>While you wear these boots, your steps make no sound, regardless of the surface you are moving across. You also have advantage on Dexterity (Stealth) checks that rely on moving silently.</p>",
        back_title: "BOOTS OF ELVENKIND", back_subtitle: "Details",
        back_body: "<p>Softly padded, moss-green boots.</p>"
    },
    {
        type: "item", title: "CLOAK OF PROTECTION", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>You gain a +1 bonus to AC and saving throws while you wear this cloak.</p>",
        back_title: "CLOAK OF PROTECTION", back_subtitle: "Details",
        back_body: "<p>A simple grey cloak draped with protective wards.</p>"
    },
    {
        type: "item", title: "BELT OF GIANT STRENGTH", subtitle: "Wondrous Item (Requires Attunement)",
        front_body: "<p>While wearing this belt, your Strength score changes depending on the giant type (Hill: 21, Frost/Stone: 23, Fire: 25, Cloud: 27, Storm: 29). Has no effect if your STR is already equal or higher.</p>",
        back_title: "BELT OF GIANT STRENGTH", back_subtitle: "Details",
        back_body: "<p>A massive, heavily studded leather belt that infuses the wearer with immense physical might.</p>"
    },
    {
        type: "weapon", title: "VICIOUS DAGGER", subtitle: "Weapon (Simple Melee)", range_or_props: "Finesse, Light, Thrown (20/60)", damage_roll: "1d4", damage_type: "Piercing",
        front_body: "<p>When you roll a 20 on your attack roll with this magic weapon, the target takes an extra 7 piercing damage.</p>",
        back_title: "VICIOUS DAGGER", back_subtitle: "Damage"
    },
    {
        type: "weapon", title: "WEAPON OF WARNING (SHORTSWORD)", subtitle: "Weapon (Martial Melee) (Requires Attunement)", range_or_props: "Finesse, Light", damage_roll: "1d6", damage_type: "Piercing",
        front_body: "<p>This magic weapon warns you of danger. While the weapon is on your person, you have advantage on initiative rolls. In addition, you and companions within 30 feet of you can't be surprised. It magically awakens you and your companions if sleeping naturally. </p>",
        back_title: "WEAPON OF WARNING", back_subtitle: "Damage"
    },
    {
        type: "item", title: "HEWARD'S HANDY SPICE POUCH", subtitle: "Wondrous Item",
        front_body: "<p>This pouch appears empty and has 10 charges. You can use an action, expend 1 charge, name any nonmagical food seasoning, and reach into the pouch to pull out a pinch of it. Regains 1d6+4 charges at dawn.</p>",
        back_title: "SPICE POUCH", back_subtitle: "Details",
        back_body: "<p>A favorite companion for traveling cooks.</p>"
    },
    {
        type: "weapon", title: "SILVERED DAGGER", subtitle: "Weapon (Simple Melee)", range_or_props: "Finesse, Light, Thrown (20/60)", damage_roll: "1d4", damage_type: "Piercing",
        front_body: "<p>A finely crafted dagger plated in shining silver. It is considered a magic weapon. When you score a Critical Hit with it against a Shapeshifter, you roll one additional die of the weapon’s damage.</p>",
        back_title: "SILVERED DAGGER", back_subtitle: "Damage"
    }
];

fs.writeFileSync('magic_items.json', JSON.stringify(items, null, 2));
console.log("Written magic_items.json. Generating cards...");
try {
    execSync('node generate_cards.js magic_items.json', { stdio: 'inherit' });
} catch (e) {
    console.error("Failed to execute card generator:", e.message);
}
