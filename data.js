// Requirement data. Entered from memory: verify against the OSRS Wiki.
export const SKILLS = ['attack','defence','strength','hitpoints','ranged','prayer','magic','cooking','woodcutting','fletching','fishing','firemaking','crafting','smithing','mining','herblore','agility','thieving','slayer','farming','runecrafting','hunter','construction','sailing'];

// Highest level each skill needs for all quests (Quest Cape).
export const QUEST_CAPE = {
  attack: 50, defence: 65, strength: 50, hitpoints: 50, ranged: 60, prayer: 50, magic: 75,
  cooking: 70, woodcutting: 71, fletching: 60, fishing: 62, firemaking: 66, crafting: 70,
  smithing: 70, mining: 72, herblore: 70, agility: 70, thieving: 60, slayer: 69, farming: 70,
  runecrafting: 55, hunter: 70, construction: 70,
};

// Elite-tier skill requirements per Achievement Diary region.
export const DIARIES = {
  'Ardougne': { agility: 90, cooking: 91, crafting: 10, farming: 85, fishing: 81, fletching: 69, magic: 94, smithing: 91, thieving: 82 },
  'Desert': { agility: 70, construction: 78, cooking: 85, fletching: 95, magic: 94, prayer: 85, thieving: 91 },
  'Falador': { agility: 80, farming: 91, herblore: 81, runecrafting: 88, woodcutting: 75 },
  'Fremennik': { agility: 80, crafting: 80, hitpoints: 70, ranged: 70, runecrafting: 82, slayer: 83, strength: 70, thieving: 75 },
  'Kandarin': { agility: 60, cooking: 80, crafting: 85, farming: 79, firemaking: 85, fishing: 76, herblore: 86, magic: 87, smithing: 90 },
  'Karamja': { farming: 72, herblore: 87, runecrafting: 91 },
  'Kourend & Kebos': { cooking: 84, farming: 85, magic: 90, runecrafting: 77, slayer: 95, woodcutting: 90 },
  'Lumbridge & Draynor': { agility: 70, crafting: 70, magic: 75, ranged: 70, runecrafting: 76, smithing: 88, strength: 70, thieving: 78, woodcutting: 75 },
  'Morytania': { agility: 71, crafting: 84, defence: 70, firemaking: 80, fishing: 96, magic: 83, slayer: 85 },
  'Varrock': { cooking: 95, fletching: 81, herblore: 90, magic: 86, runecrafting: 78, smithing: 89 },
  'Western Provinces': { agility: 85, farming: 75, fletching: 85, hunter: 69, magic: 93, ranged: 70, slayer: 93, thieving: 85 },
  'Wilderness': { agility: 60, cooking: 90, firemaking: 75, fishing: 85, magic: 96, mining: 85, slayer: 83, smithing: 90, thieving: 84, woodcutting: 75 },
};

// Exact XP needed for each level (index = level), 1..99.
export const XP_TABLE = (() => {
  const t = [0, 0]; let pts = 0;
  for (let l = 1; l < 99; l++) { pts += Math.floor(l + 300 * 2 ** (l / 7)); t.push(Math.floor(pts / 4)); }
  return t;
})();
