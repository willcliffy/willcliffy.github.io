// Requirement data, sourced from the OSRS Wiki.
export const SKILLS = ['attack','defence','strength','hitpoints','ranged','prayer','magic','cooking','woodcutting','fletching','fishing','firemaking','crafting','smithing','mining','herblore','agility','thieving','slayer','farming','runecrafting','hunter','construction','sailing'];

// Highest level each skill needs for all quests (Quest Cape).
// Source: OSRS Wiki "Quests/Requirements by skill", "All Quests" tab (checked 2026-11-10).
// Most are boostable; the wiki also lists Combat 85 and 200 quest points, which aren't on the hiscores.
export const QUEST_CAPE = {
  attack: 50, defence: 65, strength: 60, hitpoints: 50, ranged: 62, prayer: 50, magic: 75,
  cooking: 72, woodcutting: 74, fletching: 70, fishing: 62, firemaking: 75, crafting: 70,
  smithing: 72, mining: 72, herblore: 70, agility: 70, thieving: 72, slayer: 74, farming: 70,
  runecrafting: 60, hunter: 70, construction: 70, sailing: 62,
};

// Achievement Diary requirements per region and tier, from the OSRS Wiki diary pages (checked 2026-11-10).
// Skill levels include those needed for each tier's required quests. combat/total are shown when present.
export const DIARIES = {
  "Ardougne": {
    easy: {"skills":{"thieving":5},"quests":["Biohazard","Rune Mysteries"],"total":36},
    medium: {"skills":{"strength":38,"agility":39,"ranged":25,"thieving":38,"crafting":49,"firemaking":50,"magic":51,"woodcutting":36,"farming":31,"construction":10},"quests":["Enlightened Journey","The Hand in the Sand","Rune Mysteries","Tower of Life","Underground Pass"],"quest":20,"total":391},
    hard: {"skills":{"mining":52,"strength":50,"agility":56,"smithing":68,"herblore":45,"fishing":53,"ranged":60,"thieving":72,"cooking":53,"prayer":42,"crafting":50,"firemaking":50,"magic":66,"fletching":5,"woodcutting":50,"runecrafting":65,"farming":70,"construction":50,"hunter":59},"quests":["Enlightened Journey","The Hand in the Sand","Legends' Quest","Monkey Madness I","Mourning's End Part II","Rune Mysteries","Tower of Life","Watchtower"],"quest":107,"total":1029},
    elite: {"skills":{"mining":52,"strength":50,"agility":90,"smithing":91,"herblore":45,"fishing":81,"ranged":60,"thieving":82,"cooking":91,"prayer":42,"crafting":50,"firemaking":50,"magic":94,"fletching":69,"woodcutting":50,"runecrafting":65,"farming":85,"construction":50,"hunter":59},"quests":["Desert Treasure I","Enlightened Journey","The Hand in the Sand","Haunted Mine","Legends' Quest","Monkey Madness I","Mourning's End Part II","Rune Mysteries","Tower of Life","Watchtower"],"quest":107,"total":1269},
  },
  "Desert": {
    easy: {"skills":{"thieving":21,"hunter":5},"quests":[],"total":56},
    medium: {"skills":{"mining":37,"agility":30,"herblore":36,"ranged":37,"thieving":37,"prayer":43,"crafting":50,"firemaking":45,"magic":39,"woodcutting":35,"slayer":22,"construction":20,"hunter":47},"quests":["Eagles' Peak","Enakhra's Lament","The Golem","Spirits of the Elid"],"total":497},
    hard: {"skills":{"attack":50,"mining":60,"agility":70,"smithing":68,"defence":40,"herblore":36,"ranged":40,"thieving":65,"prayer":43,"crafting":61,"firemaking":60,"magic":68,"fletching":10,"woodcutting":55,"slayer":65,"construction":20,"hunter":47},"quests":["Contact!","Desert Treasure I","Dream Mentor","Eagles' Peak","Enakhra's Lament","The Feud","The Golem","Spirits of the Elid"],"combat":85,"total":873},
    elite: {"skills":{"attack":50,"mining":60,"agility":70,"smithing":68,"defence":40,"herblore":36,"ranged":40,"thieving":91,"cooking":85,"prayer":85,"crafting":61,"firemaking":60,"magic":94,"fletching":95,"woodcutting":55,"slayer":65,"construction":78,"hunter":47},"quests":["Contact!","Desert Treasure I","Dream Mentor","Eagles' Peak","Enakhra's Lament","The Feud","The Golem","Spirits of the Elid"],"combat":85,"total":1194},
  },
  "Falador": {
    easy: {"skills":{"mining":10,"agility":5,"smithing":13,"construction":16},"quests":["Doric's Quest","The Knight's Sword"],"total":72},
    medium: {"skills":{"mining":40,"strength":37,"agility":42,"smithing":13,"defence":20,"ranged":19,"thieving":40,"cooking":20,"prayer":10,"crafting":40,"firemaking":49,"magic":37,"woodcutting":30,"slayer":32,"farming":23,"construction":16},"quests":["Doric's Quest","The Knight's Sword","Recruitment Drive","Skippy and the Mogres"],"quest":12,"total":484},
    hard: {"skills":{"mining":60,"strength":37,"agility":59,"smithing":13,"defence":50,"ranged":19,"herblore":52,"fishing":53,"thieving":58,"cooking":53,"prayer":70,"crafting":40,"firemaking":49,"magic":37,"woodcutting":71,"runecrafting":56,"slayer":72,"farming":45,"construction":16},"quests":["Doric's Quest","Grim Tales","Heroes' Quest","The Knight's Sword","Skippy and the Mogres","The Slug Menace"],"quest":55,"total":971},
    elite: {"skills":{"mining":60,"strength":37,"agility":80,"smithing":13,"defence":50,"ranged":19,"herblore":81,"fishing":53,"thieving":58,"cooking":53,"prayer":70,"crafting":40,"firemaking":49,"magic":37,"woodcutting":75,"runecrafting":88,"slayer":72,"farming":91,"construction":16},"quests":["Doric's Quest","Grim Tales","Heroes' Quest","The Knight's Sword","Skippy and the Mogres","The Slug Menace"],"quest":55,"total":1080},
  },
  "Fremennik": {
    easy: {"skills":{"mining":20,"smithing":20,"thieving":5,"crafting":23,"firemaking":15,"woodcutting":15,"hunter":11},"quests":["The Fremennik Trials"],"total":134},
    medium: {"skills":{"mining":40,"agility":35,"smithing":50,"defence":30,"thieving":42,"crafting":31,"firemaking":40,"woodcutting":50,"slayer":47,"construction":37,"hunter":35},"quests":["Between a Rock...","Eagles' Peak","Horror from the Deep"],"total":458},
    hard: {"skills":{"mining":70,"agility":35,"smithing":60,"defence":40,"herblore":66,"fishing":53,"thieving":75,"cooking":53,"crafting":61,"firemaking":49,"magic":72,"woodcutting":56,"slayer":47,"construction":37,"hunter":55},"quests":["Between a Rock...","Eadgar's Ruse","Eagles' Peak","Horror from the Deep","Lunar Diplomacy","Throne of Miscellania"],"quest":55,"total":846},
    elite: {"skills":{"hitpoints":70,"mining":70,"strength":70,"agility":80,"smithing":60,"defence":40,"herblore":66,"fishing":53,"ranged":70,"thieving":75,"cooking":53,"crafting":80,"firemaking":49,"magic":72,"woodcutting":56,"runecrafting":82,"slayer":83,"construction":37,"hunter":55},"quests":["Between a Rock...","Eadgar's Ruse","Eagles' Peak","Horror from the Deep","Lunar Diplomacy","Throne of Miscellania"],"quest":55,"total":1225},
  },
  "Kandarin": {
    easy: {"skills":{"agility":20,"fishing":16,"farming":13},"quests":[],"total":78},
    medium: {"skills":{"mining":30,"strength":22,"agility":36,"smithing":30,"herblore":48,"fishing":46,"crafting":31,"ranged":40,"thieving":47,"cooking":43,"magic":45,"fletching":50,"woodcutting":36,"farming":26},"quests":["Alfred Grimhand's Barcrawl","Waterfall Quest"],"total":577},
    hard: {"skills":{"attack":20,"mining":30,"strength":50,"agility":60,"smithing":75,"defence":70,"herblore":48,"fishing":70,"ranged":40,"thieving":53,"cooking":43,"prayer":70,"crafting":31,"firemaking":65,"magic":56,"fletching":70,"woodcutting":60,"farming":26,"construction":50},"quests":["Alfred Grimhand's Barcrawl"],"quest":12,"total":1000},
    elite: {"skills":{"attack":20,"mining":60,"strength":50,"agility":60,"smithing":90,"defence":70,"herblore":86,"fishing":76,"ranged":40,"thieving":53,"cooking":80,"prayer":70,"crafting":85,"firemaking":85,"magic":87,"fletching":70,"woodcutting":60,"farming":79,"construction":50},"quests":["Alfred Grimhand's Barcrawl","Family Crest","Lunar Diplomacy"],"quest":12,"total":1284},
  },
  "Karamja": {
    easy: {"skills":{"mining":40,"agility":15},"quests":[],"total":85},
    medium: {"skills":{"mining":40,"agility":32,"herblore":3,"fishing":65,"cooking":16,"crafting":20,"woodcutting":50,"farming":27,"hunter":41},"quests":["The Grand Tree","Shilo Village"],"quest":32,"total":318},
    hard: {"skills":{"mining":52,"strength":50,"agility":53,"smithing":40,"herblore":25,"fishing":65,"ranged":42,"thieving":50,"cooking":53,"crafting":50,"magic":59,"woodcutting":50,"runecrafting":44,"slayer":50,"farming":27,"hunter":41},"quests":["The Grand Tree","Tai Bwo Wannai Trio"],"combat":100,"quest":107,"total":767},
    elite: {"skills":{"mining":52,"strength":50,"agility":53,"smithing":40,"herblore":87,"fishing":65,"ranged":42,"thieving":50,"cooking":53,"crafting":50,"magic":59,"woodcutting":50,"runecrafting":91,"slayer":50,"farming":72,"hunter":41},"quests":["The Grand Tree","Tai Bwo Wannai Trio"],"combat":100,"quest":107,"total":921},
  },
  "Kourend & Kebos": {
    easy: {"skills":{"mining":15,"herblore":12,"fishing":20,"thieving":25,"construction":25},"quests":["Druidic Ritual"],"total":124},
    medium: {"skills":{"mining":42,"strength":16,"agility":49,"herblore":12,"fishing":43,"thieving":25,"crafting":31,"firemaking":50,"woodcutting":50,"farming":45,"construction":30,"hunter":53},"quests":["The Ascent of Arceuus","The Depths of Despair","The Forsaken Tower","The Queen of Thieves","Tale of the Righteous"],"total":466},
    hard: {"skills":{"mining":65,"strength":16,"agility":49,"smithing":70,"defence":40,"herblore":31,"fishing":43,"thieving":49,"crafting":61,"firemaking":50,"magic":66,"fletching":25,"woodcutting":60,"slayer":62,"farming":74,"construction":30,"hunter":53},"quests":["The Ascent of Arceuus","The Depths of Despair","Dream Mentor","The Forsaken Tower","The Queen of Thieves","Tale of the Righteous"],"combat":85,"total":859},
    elite: {"skills":{"mining":65,"strength":16,"agility":49,"smithing":70,"defence":40,"herblore":31,"fishing":82,"thieving":49,"cooking":84,"crafting":61,"firemaking":50,"magic":90,"fletching":40,"woodcutting":90,"runecrafting":77,"slayer":95,"farming":85,"construction":30,"hunter":53},"quests":["The Ascent of Arceuus","The Depths of Despair","Dream Mentor","The Forsaken Tower","The Queen of Thieves","Tale of the Righteous"],"combat":85,"total":1170},
  },
  "Lumbridge & Draynor": {
    easy: {"skills":{"mining":15,"fishing":15,"firemaking":15,"woodcutting":15,"runecrafting":5,"slayer":7},"quests":["Cook's Assistant","Rune Mysteries"],"total":98},
    medium: {"skills":{"strength":19,"mining":15,"agility":20,"fishing":30,"ranged":50,"thieving":38,"crafting":38,"firemaking":15,"magic":31,"woodcutting":36,"runecrafting":23,"slayer":18,"hunter":42},"quests":["Animal Magnetism","Cook's Assistant","Rune Mysteries"],"combat":70,"total":394},
    hard: {"skills":{"mining":50,"strength":19,"agility":46,"smithing":40,"herblore":25,"fishing":53,"ranged":50,"thieving":53,"cooking":70,"prayer":52,"crafting":70,"firemaking":65,"magic":60,"fletching":10,"woodcutting":57,"runecrafting":59,"slayer":18,"farming":63,"hunter":42},"quests":["Animal Magnetism","Another Slice of H.A.M.","Recipe for Disaster","Rune Mysteries","Tears of Guthix"],"combat":70,"quest":175,"total":915},
    elite: {"skills":{"attack":50,"hitpoints":50,"mining":72,"strength":70,"agility":70,"smithing":88,"defence":65,"herblore":70,"fishing":62,"ranged":70,"thieving":78,"cooking":72,"prayer":52,"crafting":70,"firemaking":75,"magic":75,"fletching":70,"woodcutting":75,"runecrafting":76,"slayer":74,"farming":70,"construction":70,"hunter":70,"sailing":62},"quests":["Quests/List"],"combat":85,"total":1571},
  },
  "Morytania": {
    easy: {"skills":{"cooking":12,"crafting":15,"slayer":15,"farming":23},"quests":["Nature Spirit"],"combat":20,"total":93},
    medium: {"skills":{"mining":15,"ranged":40,"agility":42,"smithing":50,"herblore":22,"fishing":50,"cooking":40,"prayer":47,"crafting":45,"magic":7,"fletching":5,"woodcutting":45,"slayer":42,"farming":40,"hunter":29},"quests":["Cabin Fever","Dwarf Cannon","Ghosts Ahoy","Lair of Tarn Razorlor"],"combat":20,"total":536},
    hard: {"skills":{"attack":20,"mining":55,"agility":71,"smithing":50,"defence":70,"herblore":22,"fishing":50,"ranged":40,"thieving":53,"cooking":40,"prayer":70,"crafting":45,"firemaking":50,"magic":66,"fletching":10,"woodcutting":50,"slayer":58,"farming":53,"construction":50,"hunter":29},"quests":["Desert Treasure I","Dwarf Cannon","Ghosts Ahoy","In Aid of the Myreque","Lair of Tarn Razorlor"],"combat":20,"quest":12,"total":964},
    elite: {"skills":{"attack":20,"mining":60,"strength":76,"agility":71,"smithing":50,"defence":70,"herblore":22,"fishing":96,"ranged":40,"thieving":53,"cooking":40,"prayer":70,"crafting":84,"firemaking":80,"magic":83,"fletching":10,"woodcutting":55,"slayer":85,"farming":53,"construction":50,"hunter":29},"quests":["Desert Treasure I","Dwarf Cannon","Ghosts Ahoy","In Aid of the Myreque","Lair of Tarn Razorlor","Lunar Diplomacy","Shades of Mort'ton"],"combat":20,"quest":12,"total":1238},
  },
  "Varrock": {
    easy: {"skills":{"mining":15,"agility":13,"fishing":20,"thieving":5,"crafting":8,"runecrafting":9},"quests":["Rune Mysteries"],"total":96},
    medium: {"skills":{"mining":15,"agility":30,"herblore":10,"fishing":20,"thieving":25,"crafting":36,"firemaking":40,"magic":25,"runecrafting":9,"farming":30},"quests":["The Dig Site","Enlightened Journey","Garden of Tranquillity","Gertrude's Cat","Rune Mysteries","A Soul's Bane","Tree Gnome Village"],"combat":40,"quest":32,"total":262},
    hard: {"skills":{"mining":15,"agility":51,"herblore":10,"smithing":20,"fishing":20,"ranged":40,"thieving":53,"prayer":52,"crafting":36,"firemaking":60,"magic":54,"fletching":10,"woodcutting":60,"runecrafting":9,"farming":68,"construction":50,"hunter":66},"quests":["Desert Treasure I","Enlightened Journey","Garden of Tranquillity","Gertrude's Cat","Rune Mysteries","A Soul's Bane","Tree Gnome Village"],"combat":40,"quest":32,"total":689},
    elite: {"skills":{"mining":60,"agility":51,"smithing":89,"defence":40,"herblore":90,"fishing":20,"ranged":40,"thieving":53,"cooking":95,"prayer":52,"crafting":61,"firemaking":60,"magic":86,"fletching":81,"woodcutting":60,"runecrafting":78,"farming":68,"construction":50,"hunter":66},"quests":["Desert Treasure I","Dream Mentor","Enlightened Journey","Garden of Tranquillity","Gertrude's Cat","A Soul's Bane","Tree Gnome Village"],"combat":40,"quest":32,"total":1187},
  },
  "Western Provinces": {
    easy: {"skills":{"mining":15,"ranged":30,"cooking":30,"fletching":20,"hunter":9},"quests":["Big Chompy Bird Hunting","Rune Mysteries"],"combat":40,"total":131},
    medium: {"skills":{"mining":40,"agility":37,"smithing":30,"herblore":18,"fishing":46,"ranged":30,"cooking":42,"crafting":25,"firemaking":35,"magic":46,"fletching":20,"woodcutting":35,"construction":5,"hunter":31},"quests":["Big Chompy Bird Hunting","Eagles' Peak","The Eyes of Glouphrie"],"combat":70,"total":458},
    hard: {"skills":{"mining":70,"agility":56,"smithing":45,"herblore":18,"fishing":62,"ranged":70,"thieving":75,"cooking":70,"crafting":40,"firemaking":50,"magic":66,"fletching":20,"woodcutting":50,"farming":68,"construction":65,"hunter":69},"quests":["Eagles' Peak","The Eyes of Glouphrie","Recipe for Disaster/Freeing King Awowogei","Swan Song"],"combat":100,"quest":100,"total":910},
    elite: {"skills":{"attack":42,"hitpoints":42,"mining":70,"strength":42,"agility":85,"smithing":45,"defence":42,"herblore":18,"fishing":62,"ranged":70,"thieving":85,"cooking":70,"prayer":22,"crafting":40,"firemaking":50,"magic":66,"fletching":85,"woodcutting":50,"slayer":93,"farming":75,"construction":65,"hunter":69},"quests":["Eagles' Peak","The Eyes of Glouphrie","Recipe for Disaster/Freeing King Awowogei","Swan Song"],"combat":100,"quest":100,"total":1289},
  },
  "Wilderness": {
    easy: {"skills":{"mining":15,"agility":15,"magic":21},"quests":["Enter the Abyss"],"total":80},
    medium: {"skills":{"mining":55,"agility":52,"smithing":50,"magic":60,"woodcutting":61,"slayer":50},"quests":["Enter the Abyss"],"total":362},
    hard: {"skills":{"mining":55,"agility":64,"smithing":75,"fishing":53,"magic":66,"woodcutting":61,"slayer":68,"hunter":67},"quests":["Death Plateau","Enter the Abyss","Mage Arena I"],"total":533},
    elite: {"skills":{"mining":85,"agility":64,"smithing":90,"herblore":10,"fishing":85,"ranged":40,"thieving":84,"cooking":90,"firemaking":75,"magic":96,"fletching":10,"woodcutting":75,"slayer":83,"hunter":67},"quests":["Death Plateau","Desert Treasure I","Enter the Abyss","Mage Arena I"],"total":972},
  },
};

// Exact XP needed for each level (index = level), 1..99.
export const XP_TABLE = (() => {
  const t = [0, 0]; let pts = 0;
  for (let l = 1; l < 99; l++) { pts += Math.floor(l + 300 * 2 ** (l / 7)); t.push(Math.floor(pts / 4)); }
  return t;
})();
