export const FACTIONS = {
  IRON_CORPS: {
    id: 'IRON_CORPS',
    name: 'Iron Corps',
    tagline: 'Heavy Armor & Defensive Fortifications',
    color: '#2b4c7e', // Slate Navy Blue
    secondaryColor: '#1b3254',
    specialUnitId: 'HEAVY_SIEGE_TANK',
    passiveDescription: '+20% defense bonus on Captured Zones and Forests. Unique Heavy Siege Tank unit.',
    defenseBonusMultiplier: 1.2
  },
  VANGUARD_LEGION: {
    id: 'VANGUARD_LEGION',
    name: 'Vanguard Legion',
    tagline: 'Blitz Mobility & Stealth Ambush',
    color: '#8b261b', // Crimson Red
    secondaryColor: '#5a1710',
    specialUnitId: 'BLITZ_RECON',
    passiveDescription: '+1 movement speed on open terrain. Stealth ambush multiplier in forests. Unique Blitz Recon unit.',
    movementSpeedBonus: 1
  }
};

export const TERRAIN = {
  PLAINS: { id: 'PLAINS', name: 'Plains', symbol: '.', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1, moveCostVehicle: 1, defenseBonus: 0, sketchPattern: 'none' },
  FOREST: { id: 'FOREST', name: 'Forest', symbol: 'F', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1, moveCostVehicle: 1.5, defenseBonus: 0.30, allowsAmbush: true, sketchPattern: 'trees' },
  SWAMP: { id: 'SWAMP', name: 'Swamp / Pond', symbol: 'S', isVehiclePassable: false, isInfantryPassable: true, moveCostInfantry: 2, moveCostVehicle: 99, defenseBonus: -0.10, sketchPattern: 'reeds' },
  MOUNTAIN: { id: 'MOUNTAIN', name: 'Mountain', symbol: 'M', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'peaks' },
  WATER: { id: 'WATER', name: 'Water', symbol: 'W', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'waves' },
  CAPTURE_ZONE: { id: 'CAPTURE_ZONE', name: 'Supply Zone', symbol: 'Z', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1, moveCostVehicle: 1, defenseBonus: 0.15, inkPerTurn: 25, sketchPattern: 'flag' },
  MAIN_BASE: { id: 'MAIN_BASE', name: 'Main Base', symbol: 'B', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1, moveCostVehicle: 1, defenseBonus: 0.25, inkPerTurn: 50, sketchPattern: 'fortress' }
};

export const UNIT_TYPES = {
  SCOUT: {
    id: 'SCOUT',
    name: 'Scout Infantry',
    category: 'INFANTRY',
    cost: 40,
    maxHp: 60,
    attack: 18,
    moveRange: 3,
    attackRange: 1,
    visionRange: 4,
    description: 'Fast, high vision range, ideal for capturing distant zones quickly.',
    icon: '🕵️'
  },
  RIFLEMAN: {
    id: 'RIFLEMAN',
    name: 'Rifle Squad',
    category: 'INFANTRY',
    cost: 60,
    maxHp: 100,
    attack: 30,
    moveRange: 2,
    attackRange: 1,
    visionRange: 2,
    description: 'Balanced frontline troop. Strong against Anti-Tank crews.',
    icon: '🪖'
  },
  ANTI_TANK: {
    id: 'ANTI_TANK',
    name: 'Anti-Tank Crew',
    category: 'INFANTRY',
    cost: 80,
    maxHp: 80,
    attack: 55,
    vehicleBonus: 2.2, // Huge bonus against vehicles
    moveRange: 1,
    attackRange: 2,
    visionRange: 2,
    description: 'Slow heavy artillery crew. Devastating against enemy armor.',
    icon: '🎯'
  },
  LIGHT_VEHICLE: {
    id: 'LIGHT_VEHICLE',
    name: 'Light Armored Car',
    category: 'VEHICLE',
    cost: 100,
    maxHp: 120,
    attack: 40,
    infantryBonus: 1.5, // Strong against infantry
    moveRange: 3,
    attackRange: 1,
    visionRange: 3,
    description: 'Fast armored vehicle. Obliterates basic infantry; blocked by swamps.',
    icon: '🏎️'
  },
  HEAVY_SIEGE_TANK: {
    id: 'HEAVY_SIEGE_TANK',
    name: 'Heavy Siege Tank',
    category: 'VEHICLE',
    cost: 160,
    maxHp: 220,
    attack: 65,
    moveRange: 1,
    attackRange: 2,
    visionRange: 2,
    factionLock: 'IRON_CORPS',
    description: 'Iron Corps Exclusive. Massive armored beast with crushing firepower.',
    icon: '🚜'
  },
  BLITZ_RECON: {
    id: 'BLITZ_RECON',
    name: 'Blitz Recon Vehicle',
    category: 'VEHICLE',
    cost: 90,
    maxHp: 110,
    attack: 38,
    moveRange: 4,
    attackRange: 1,
    visionRange: 4,
    factionLock: 'VANGUARD_LEGION',
    description: 'Vanguard Legion Exclusive. Rapid hit-and-run raider with extreme mobility.',
    icon: '⚡'
  }
};

export const STANCES = {
  ADVANCE: { id: 'ADVANCE', name: 'Advance', desc: 'Move towards target and attack any enemy in range.', accuracy: 1.0, defense: 1.0 },
  DEFEND: { id: 'DEFEND', name: 'Defend', desc: 'Hold position or move cautiously. +25% defense bonus.', accuracy: 1.1, defense: 1.25 },
  AMBUSH: { id: 'AMBUSH', name: 'Ambush Stance', desc: 'Stay hidden in forests. First attack deals 1.5x ambush damage!', accuracy: 1.3, defense: 1.1 }
};

export const GAME_PHASES = {
  PLANNING: 'PLANNING', // 20-second player turn
  PLAYBACK: 'PLAYBACK', // 10-second simultaneous playback phase
  GAME_OVER: 'GAME_OVER'
};
