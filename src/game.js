// Ink & Iron: Sketch Warfare - Complete Standalone Game System
// Designed to run directly via file:// in any browser or deployed to GitHub/Cloudflare Pages

// ==========================================
// 1. DATA TYPES & CONSTANTS
// ==========================================
const FACTIONS = {
  IRON_CORPS: {
    id: 'IRON_CORPS',
    name: 'Iron Corps',
    tagline: 'Heavy Armor & Defensive Fortifications',
    color: '#2b4c7e',
    secondaryColor: '#1b3254',
    specialUnitId: 'HEAVY_SIEGE_TANK',
    passiveDescription: '+20% defense bonus on Captured Zones and Forests. Unique Heavy Siege Tank unit.',
    defenseBonusMultiplier: 1.2
  },
  VANGUARD_LEGION: {
    id: 'VANGUARD_LEGION',
    name: 'Vanguard Legion',
    tagline: 'Blitz Mobility & Stealth Ambush',
    color: '#8b261b',
    secondaryColor: '#5a1710',
    specialUnitId: 'BLITZ_RECON',
    passiveDescription: '+1 movement speed on open terrain. Stealth ambush multiplier in forests. Unique Blitz Recon unit.',
    movementSpeedBonus: 1
  }
};

const TERRAIN = {
  PLAINS: { id: 'PLAINS', name: 'Plains', symbol: '.', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.0, moveCostVehicle: 1.0, defenseBonus: 0, sketchPattern: 'none' },
  FOREST: { id: 'FOREST', name: 'Forest', symbol: 'F', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.5, moveCostVehicle: 2.0, defenseBonus: 0.30, allowsAmbush: true, sketchPattern: 'trees' },
  SWAMP: { id: 'SWAMP', name: 'Swamp / Pond', symbol: 'S', isVehiclePassable: false, isInfantryPassable: true, moveCostInfantry: 2.5, moveCostVehicle: 99, defenseBonus: -0.10, sketchPattern: 'reeds' },
  MOUNTAIN: { id: 'MOUNTAIN', name: 'Mountain', symbol: 'M', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'peaks' },
  WATER: { id: 'WATER', name: 'Water', symbol: 'W', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'waves' },
  CAPTURE_ZONE: { id: 'CAPTURE_ZONE', name: 'Supply Zone', symbol: 'Z', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.0, moveCostVehicle: 1.0, defenseBonus: 0.15, inkPerTurn: 25, sketchPattern: 'flag' },
  MAIN_BASE: { id: 'MAIN_BASE', name: 'Main Base', symbol: 'B', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.0, moveCostVehicle: 1.0, defenseBonus: 0.25, inkPerTurn: 50, sketchPattern: 'fortress' }
};

const UNIT_TYPES = {
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
    icon: 'SCOUT',
    symbol: '⧟'
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
    icon: 'RIFLE',
    symbol: '✕'
  },
  ANTI_TANK: {
    id: 'ANTI_TANK',
    name: 'Anti-Tank Crew',
    category: 'INFANTRY',
    cost: 80,
    maxHp: 80,
    attack: 55,
    vehicleBonus: 2.5,
    moveRange: 1,
    attackRange: 2,
    visionRange: 2,
    description: 'Essential anti-armor crew. 2.5x penetration obliterates enemy tanks!',
    icon: 'ANTI-TANK',
    symbol: '⌖'
  },
  LIGHT_VEHICLE: {
    id: 'LIGHT_VEHICLE',
    name: 'Light Armored Car',
    category: 'VEHICLE',
    cost: 100,
    maxHp: 120,
    attack: 40,
    infantryBonus: 1.5,
    moveRange: 3,
    attackRange: 1,
    visionRange: 3,
    description: 'Fast armored vehicle. Obliterates basic infantry; blocked by swamps.',
    icon: 'ARMORED',
    symbol: '⬭'
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
    icon: 'TANK',
    symbol: '⬚'
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
    icon: 'RECON',
    symbol: '🗲'
  }
};

const STANCES = {
  ADVANCE: { id: 'ADVANCE', name: 'Advance', desc: 'Move towards target and attack any enemy in range.', accuracy: 1.0, defense: 1.0 },
  DEFEND: { id: 'DEFEND', name: 'Defend', desc: 'Hold position or move cautiously. +25% defense bonus.', accuracy: 1.1, defense: 1.25 },
  AMBUSH: { id: 'AMBUSH', name: 'Ambush Stance', desc: 'Stay hidden in forests. First attack deals 1.5x ambush damage!', accuracy: 1.3, defense: 1.1 }
};

const GAME_PHASES = {
  PLANNING: 'PLANNING',
  PLAYBACK: 'PLAYBACK',
  GAME_OVER: 'GAME_OVER'
};

// SPECIAL ABILITIES DEFINITIONS
const ABILITIES = {
  RECON_FLARE: { id: 'RECON_FLARE', name: 'Recon Flare', cpCost: 2, desc: 'Reveals a 3x3 area in the Fog of War for 1 turn.' },
  SMOKE_SCREEN: { id: 'SMOKE_SCREEN', name: 'Smoke Screen', cpCost: 3, desc: 'Neutral physical cloud. Blocks line-of-sight & direct attacks for ALL units inside a 3x3 area for 2 turns.' },
  ARTILLERY_STRIKE: { id: 'ARTILLERY_STRIKE', name: 'Artillery Strike', cpCost: 4, desc: 'Targets 3x3 area for a 35 splash damage bombardment.' }
};

// ==========================================
// 2. MAP GENERATOR
// ==========================================
class MapGenerator {
  static createMap(mapType = 'PRESET_1') {
    let result;
    if (mapType === 'PROCEDURAL') {
      result = this.generateProceduralSymmetrical();
    } else {
      switch (mapType) {
        case 'PRESET_2': result = this.loadPreset2(); break;
        case 'PRESET_3': result = this.loadPreset3(); break;
        case 'PRESET_1':
        default: result = this.loadPreset1(); break;
      }
    }
    // Always enforce full infantry connectivity after generation
    this.enforceConnectivity(result.grid, result.player1Base, result.player2Base);
    return result;
  }

  // -----------------------------------------------
  // CONNECTIVITY ENFORCER — BFS flood-fill
  // Opens corridors through impassable terrain until
  // every walkable tile is reachable from P1 base.
  // -----------------------------------------------
  static enforceConnectivity(grid, p1Base, p2Base) {
    const isPassable = (tile) => tile.isInfantryPassable;

    const bfsReachable = (startX, startY) => {
      const visited = new Set();
      const queue = [`${startX},${startY}`];
      visited.add(`${startX},${startY}`);
      while (queue.length > 0) {
        const key = queue.shift();
        const [cx, cy] = key.split(',').map(Number);
        for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
          if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
          const nKey = `${nx},${ny}`;
          if (visited.has(nKey)) continue;
          if (isPassable(grid[ny][nx])) {
            visited.add(nKey);
            queue.push(nKey);
          }
        }
      }
      return visited;
    };

    // Collect all tiles that SHOULD be reachable (not impassable by design)
    const allPassable = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isPassable(grid[r][c])) allPassable.push(`${c},${r}`);
      }
    }

    // BFS from P1 base up to 10 repair passes
    for (let pass = 0; pass < 10; pass++) {
      const reachable = bfsReachable(p1Base.x, p1Base.y);
      const unreachable = allPassable.filter(k => !reachable.has(k));
      if (unreachable.length === 0) break;

      // Find shortest corridor: for each unreachable tile find nearest blocking
      // neighbor that is impassable and convert it to plains
      let corridorOpened = false;
      for (const key of unreachable) {
        const [ux, uy] = key.split(',').map(Number);
        // Look for an impassable neighbour that IS reachable from p1 (or
        // adjacent to a reachable tile) and clear it
        for (const [nx, ny] of [[ux+1,uy],[ux-1,uy],[ux,uy+1],[ux,uy-1]]) {
          if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
          const tile = grid[ny][nx];
          if (!isPassable(tile) && tile.id !== 'MAIN_BASE') {
            // Check that this blocker is adjacent to a reachable tile
            let adjToReachable = false;
            for (const [ax, ay] of [[nx+1,ny],[nx-1,ny],[nx,ny+1],[nx,ny-1]]) {
              if (ax < 0 || ax >= 8 || ay < 0 || ay >= 8) continue;
              if (reachable.has(`${ax},${ay}`)) { adjToReachable = true; break; }
            }
            if (adjToReachable) {
              grid[ny][nx] = { ...TERRAIN.PLAINS, x: nx, y: ny, owner: null };
              corridorOpened = true;
              break;
            }
          }
        }
        if (corridorOpened) break;
      }
      if (!corridorOpened) break; // Nothing left to fix
    }
  }

  // -----------------------------------------------
  // PRESET 1: Divided Valley
  // Replaced solid M/W rows with scattered terrain
  // -----------------------------------------------
  static loadPreset1() {
    const layout = [
      ['B1', '.',  'F',  'M',  '.',  'Z',  '.',  '.'],
      ['.',  'Z',  '.',  '.',  'F',  '.',  'F',  '.'],
      ['F',  '.',  'S',  '.',  'W',  '.',  'Z',  'M'],
      ['.',  'M',  '.',  'Z',  '.',  'W',  'F',  '.'],
      ['.',  'F',  'W',  '.',  'Z',  '.',  'M',  '.'],
      ['M',  'Z',  '.',  'W',  '.',  'S',  '.',  'F'],
      ['.',  'F',  '.',  'F',  '.',  '.',  'Z',  '.'],
      ['.',  '.',  'Z',  '.',  'M',  'F',  '.',  'B2']
    ];
    return this.parseLayout(layout, {x:0, y:0}, {x:7, y:7});
  }

  // -----------------------------------------------
  // PRESET 2: Crossfire Swamps
  // -----------------------------------------------
  static loadPreset2() {
    const layout = [
      ['.',  'B1', '.',  'F',  'Z',  '.',  '.',  'F'],
      ['.',  'F',  '.',  'S',  '.',  'F',  '.',  'Z'],
      ['.',  '.',  'Z',  '.',  'W',  'S',  'F',  '.'],
      ['F',  'S',  '.',  'Z',  '.',  '.',  'S',  '.'],
      ['.',  'S',  '.',  '.',  'Z',  '.',  'S',  'F'],
      ['.',  'F',  'S',  'W',  '.',  'Z',  '.',  '.'],
      ['Z',  '.',  'F',  '.',  'S',  '.',  'F',  '.'],
      ['F',  '.',  '.',  'Z',  'F',  '.',  'B2', '.']
    ];
    return this.parseLayout(layout, {x:1, y:0}, {x:6, y:7});
  }

  // -----------------------------------------------
  // PRESET 3: Twin Peaks Fortress
  // Replaced solid M walls with broken ridges
  // -----------------------------------------------
  static loadPreset3() {
    const layout = [
      ['B1', '.',  'Z',  'M',  '.',  'F',  '.',  '.'],
      ['.',  'F',  '.',  'M',  '.',  '.',  'Z',  'F'],
      ['Z',  '.',  'F',  '.',  'S',  'F',  '.',  'Z'],
      ['M',  '.',  '.',  'Z',  '.',  'W',  '.',  'M'],
      ['M',  '.',  'W',  '.',  'Z',  '.',  '.',  'M'],
      ['Z',  '.',  'F',  'S',  '.',  'F',  '.',  'Z'],
      ['F',  'Z',  '.',  '.',  'M',  '.',  'F',  '.'],
      ['.',  '.',  'F',  '.',  'M',  'Z',  '.',  'B2']
    ];
    return this.parseLayout(layout, {x:0, y:0}, {x:7, y:7});
  }

  // -----------------------------------------------
  // PROCEDURAL: Symmetrical with connectivity guard
  // -----------------------------------------------
  static generateProceduralSymmetrical() {
    const grid = Array(8).fill(null).map(() => Array(8).fill(null));

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        grid[r][c] = { ...TERRAIN.PLAINS, x: c, y: r, owner: null };
      }
    }

    const p1Base = { x: 0, y: 0 };
    const p2Base = { x: 7, y: 7 };
    grid[p1Base.y][p1Base.x] = { ...TERRAIN.MAIN_BASE, x: p1Base.x, y: p1Base.y, owner: 1 };
    grid[p2Base.y][p2Base.x] = { ...TERRAIN.MAIN_BASE, x: p2Base.x, y: p2Base.y, owner: 2 };

    const zonePositions = [{ x: 1, y: 3 }, { x: 2, y: 1 }, { x: 3, y: 2 }];
    zonePositions.forEach(pos => {
      grid[pos.y][pos.x] = { ...TERRAIN.CAPTURE_ZONE, x: pos.x, y: pos.y, owner: null };
      grid[7 - pos.y][7 - pos.x] = { ...TERRAIN.CAPTURE_ZONE, x: 7 - pos.x, y: 7 - pos.y, owner: null };
    });

    // Lower density for hard-blockers, higher for forests/swamps
    const hardBlockers  = [TERRAIN.MOUNTAIN, TERRAIN.WATER];
    const softTerrain   = [TERRAIN.FOREST, TERRAIN.FOREST, TERRAIN.SWAMP];

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        const current = grid[y][x];
        if (current.id === 'MAIN_BASE' || current.id === 'CAPTURE_ZONE') continue;

        const roll = Math.random();
        let type = null;
        if (roll < 0.18) {
          type = hardBlockers[Math.floor(Math.random() * hardBlockers.length)];
        } else if (roll < 0.42) {
          type = softTerrain[Math.floor(Math.random() * softTerrain.length)];
        }

        if (type) {
          grid[y][x] = { ...type, x, y, owner: null };
          const mx = 7 - x, my = 7 - y;
          if (grid[my][mx].id !== 'MAIN_BASE' && grid[my][mx].id !== 'CAPTURE_ZONE') {
            grid[my][mx] = { ...type, x: mx, y: my, owner: null };
          }
        }
      }
    }

    return { grid, player1Base: p1Base, player2Base: p2Base };
  }

  static parseLayout(layout, p1Base, p2Base) {
    const grid = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const char = layout[r][c];
        let tData;
        switch (char) {
          case 'B1': tData = { ...TERRAIN.MAIN_BASE, owner: 1 }; break;
          case 'B2': tData = { ...TERRAIN.MAIN_BASE, owner: 2 }; break;
          case 'Z':  tData = { ...TERRAIN.CAPTURE_ZONE, owner: null }; break;
          case 'F':  tData = { ...TERRAIN.FOREST, owner: null }; break;
          case 'S':  tData = { ...TERRAIN.SWAMP, owner: null }; break;
          case 'M':  tData = { ...TERRAIN.MOUNTAIN, owner: null }; break;
          case 'W':  tData = { ...TERRAIN.WATER, owner: null }; break;
          default:   tData = { ...TERRAIN.PLAINS, owner: null }; break;
        }
        grid[r][c] = { ...tData, x: c, y: r };
      }
    }
    return { grid, player1Base: p1Base, player2Base: p2Base };
  }
}

// ==========================================
// 3. UNIT & COMBAT MODELS
// ==========================================
class Unit {
  static idCounter = 1;

  constructor(typeKey, ownerId, startX, startY) {
    const template = UNIT_TYPES[typeKey] || {
      name: 'Rifle Squad',
      category: 'INFANTRY',
      maxHp: 100,
      attack: 30,
      moveRange: 2,
      attackRange: 1,
      visionRange: 2,
      icon: 'RIFLE',
      symbol: '✕',
      description: 'Frontline Infantry'
    };
    this.id = `U_${Unit.idCounter++}_P${ownerId}`;
    this.typeKey = typeKey;
    this.name = template.name || 'Rifle Squad';
    this.category = template.category || 'INFANTRY';
    this.owner = ownerId;
    this.x = startX;
    this.y = startY;
    this.hp = template.maxHp || 100;
    this.maxHp = template.maxHp || 100;
    this.attack = template.attack || 30;
    this.moveRange = template.moveRange || 2;
    this.attackRange = template.attackRange || 1;
    this.visionRange = template.visionRange || 2;
    this.icon = template.icon || 'RIFLE';
    this.symbol = template.symbol || '✕';
    this.description = template.description || 'Tactical Unit';
    this.vehicleBonus = template.vehicleBonus || 1.0;
    this.infantryBonus = template.infantryBonus || 1.0;

    this.waypoints = [];
    this.stance = STANCES.ADVANCE.id;
    this.isAmbusherHidden = false;
    this.hasMovedThisTurn = false;
    this.hasAttackedThisTurn = false;

    this.renderX = startX;
    this.renderY = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.targetX = startX;
    this.targetY = startY;
  }

  setWaypoints(pathArray) { this.waypoints = pathArray; }
  setStance(stanceId) { if (STANCES[stanceId]) this.stance = stanceId; }
  takeDamage(amount) {
    const rounded = Math.round(amount);
    this.hp = Math.max(0, this.hp - rounded);
    return rounded;
  }
  isAlive() { return this.hp > 0; }
  getHpPercent() { return Math.max(0, Math.min(100, Math.round((this.hp / this.maxHp) * 100))); }
}

class Combat {
  static resolveEncounter(attacker, defender, defenderTerrain, attackerFaction, defenderFaction) {
    let baseDamage = attacker.attack;
    let counterNote = '';

    // ROCK-PAPER-SCISSORS COMBAT MATRIX
    if (defender.category === 'VEHICLE') {
      if (attacker.typeKey === 'ANTI_TANK') {
        baseDamage *= 2.5; // Heavy Anti-Tank Armor Penetration (Obliterates armor in 1-2 hits!)
        counterNote = 'Heavy Anti-Tank Penetration (2.5x Dmg)!';
      } else if (attacker.category === 'INFANTRY') {
        baseDamage *= 0.50; // Small-arms bullets bounce off vehicle armor plating!
        counterNote = 'Small-Arms Deflected by Armor (50% Dmg)!';
      }
    } else if (defender.category === 'INFANTRY') {
      if (attacker.category === 'VEHICLE') {
        baseDamage *= 1.5; // Armored vehicle machine guns & cannons crush infantry!
        counterNote = 'Armored Vehicle Anti-Infantry Crush (1.5x Dmg)!';
      } else if (attacker.typeKey === 'RIFLEMAN' && defender.typeKey === 'ANTI_TANK') {
        baseDamage *= 1.5; // Riflemen flank slow static AT crews!
        counterNote = 'Riflemen Flank AT Crew (1.5x Dmg)!';
      }
    }

    let isAmbushStrike = false;
    if (attacker.stance === STANCES.AMBUSH.id && attacker.isAmbusherHidden) {
      baseDamage *= 1.5;
      attacker.isAmbusherHidden = false;
      isAmbushStrike = true;
      counterNote += ' AMBUSH STRIKE!';
    }

    if (attackerFaction.id === FACTIONS.VANGUARD_LEGION.id && defenderTerrain.id === 'FOREST' && isAmbushStrike) {
      baseDamage *= 1.25;
    }

    const attackerStanceObj = STANCES[attacker.stance] || STANCES.ADVANCE;
    const defenderStanceObj = STANCES[defender.stance] || STANCES.ADVANCE;

    baseDamage *= attackerStanceObj.accuracy;
    let defenderDefenseMod = 1.0 - (defenderTerrain.defenseBonus || 0);

    if (defenderFaction.id === FACTIONS.IRON_CORPS.id) {
      if (['CAPTURE_ZONE', 'FOREST', 'MAIN_BASE'].includes(defenderTerrain.id)) {
        defenderDefenseMod *= 0.80;
      }
    }

    defenderDefenseMod /= defenderStanceObj.defense;
    const rngFactor = 0.9 + (Math.random() * 0.2);
    let finalDamage = Math.max(5, baseDamage * defenderDefenseMod * rngFactor);

    const actualDamageDealt = defender.takeDamage(finalDamage);
    return {
      type: 'COMBAT',
      attackerId: attacker.id,
      defenderId: defender.id,
      attackerName: `${attacker.icon} ${attacker.name}`,
      defenderName: `${defender.icon} ${defender.name}`,
      attackerOwner: attacker.owner,
      defenderOwner: defender.owner,
      damageDealt: actualDamageDealt,
      defenderDied: !defender.isAlive(),
      defenderHpRemaining: defender.hp,
      defenderMaxHp: defender.maxHp,
      counterNote: counterNote.trim(),
      isAmbushStrike
    };
  }

  static getDistance(p1, p2) {
    return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
  }
}

// ==========================================
// 4. GAME ENGINE (WITH FOG OF WAR & ABILITIES)
// ==========================================
class GameEngine {
  constructor(config = {}) {
    this.mapType = config.mapType || 'PRESET_1';
    this.isTutorialMode = !!config.isTutorialMode;
    this.player1Faction = config.p1Faction || FACTIONS.IRON_CORPS;
    this.player2Faction = config.p2Faction || FACTIONS.VANGUARD_LEGION;
    this.isSinglePlayer = config.isSinglePlayer !== undefined ? config.isSinglePlayer : true;
    this.aiDifficulty = config.aiDifficulty || 'VETERAN';
    this.aiPersonality = config.aiPersonality || 'TACTICUS';
    this.audio = config.audio || null;
    this.playbackDurationConfig = config.playbackDuration || 3;

    this.turnNumber = 1;
    this.phase = GAME_PHASES.PLANNING;
    this.planningTimeRemaining = 20;
    this.playbackTimeRemaining = this.playbackDurationConfig;
    this.currentPlaybackStep = 0;
    this.timerInterval = null;

    const mapData = MapGenerator.createMap(this.mapType);
    this.grid = mapData.grid;
    this.p1Base = mapData.player1Base;
    this.p2Base = mapData.player2Base;

    this.players = {
      1: { id: 1, name: 'Player 1', faction: this.player1Faction, ink: 150, cp: 0, basePos: this.p1Base, units: [], zonesCaptured: 1 },
      2: { id: 2, name: this.isSinglePlayer ? `AI (${this.aiDifficulty})` : 'Player 2', faction: this.player2Faction, ink: 150, cp: 0, basePos: this.p2Base, units: [], zonesCaptured: 1 }
    };

    // ACTIVE SPECIAL ABILITY EFFECTS ON GRID
    this.activeFlares = []; // { x, y, owner, turnsLeft }
    this.activeSmokes = []; // { x, y, owner, turnsLeft }
    this.activeArtilleryStrikes = []; // { x, y, owner, targetTurn }

    this.winner = null;
    this.actionLogs = [];
    this.listeners = [];

    this.spawnInitialUnits();
    this.evaluateAutoStances();
  }

  spawnInitialUnits() {
    if (this.isTutorialMode) {
      // In Tutorial Mode, P1 starts with 0 units so Step 1 (recruiting at Base) triggers first!
      const u3 = new Unit('RIFLEMAN', 2, this.p2Base.x - 1, this.p2Base.y);
      this.players[2].units.push(u3);
      return;
    }

    const u1 = new Unit('RIFLEMAN', 1, this.p1Base.x + 1, this.p1Base.y);
    const u2 = new Unit('SCOUT', 1, this.p1Base.x, Math.min(7, this.p1Base.y + 1));
    const u3 = new Unit('RIFLEMAN', 2, this.p2Base.x - 1, this.p2Base.y);
    const u4 = new Unit('SCOUT', 2, this.p2Base.x, Math.max(0, this.p2Base.y - 1));

    this.players[1].units.push(u1, u2);
    this.players[2].units.push(u3, u4);

    this.actionLogs.push({
      type: 'DEPLOY',
      turn: 1,
      playerOwner: 1,
      playerName: 'Player 1',
      unitName: u1.name,
      unitIcon: u1.icon,
      x: u1.x,
      y: u1.y
    });
    this.actionLogs.push({
      type: 'DEPLOY',
      turn: 1,
      playerOwner: 1,
      playerName: 'Player 1',
      unitName: u2.name,
      unitIcon: u2.icon,
      x: u2.x,
      y: u2.y
    });
    this.actionLogs.push({
      type: 'DEPLOY',
      turn: 1,
      playerOwner: 2,
      playerName: this.players[2].name,
      unitName: u3.name,
      unitIcon: u3.icon,
      x: u3.x,
      y: u3.y
    });
    this.actionLogs.push({
      type: 'DEPLOY',
      turn: 1,
      playerOwner: 2,
      playerName: this.players[2].name,
      unitName: u4.name,
      unitIcon: u4.icon,
      x: u4.x,
      y: u4.y
    });
  }

  startTurnTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.phase === GAME_PHASES.PLANNING) {
        this.planningTimeRemaining--;
        if (this.planningTimeRemaining <= 0) this.endPlanningPhase();
      } else if (this.phase === GAME_PHASES.PLAYBACK) {
        this.playbackTimeRemaining--;
        
        const totalDuration = this.playbackDurationConfig;
        const progressFraction = (totalDuration - this.playbackTimeRemaining) / totalDuration;
        const expectedStep = Math.min(3, Math.floor(progressFraction * 4));
        
        if (expectedStep > this.currentPlaybackStep) {
          this.currentPlaybackStep = expectedStep;
          this.executeSinglePlaybackStep(this.currentPlaybackStep);
        }

        if (this.playbackTimeRemaining <= 0) this.endPlaybackPhase();
      }
      this.notifyStateChange();
    }, 1000);
  }

  pauseTimer() { if (this.timerInterval) clearInterval(this.timerInterval); }

  endPlanningPhase() {
    this.phase = GAME_PHASES.PLAYBACK;
    this.playbackTimeRemaining = this.playbackDurationConfig;
    this.currentPlaybackStep = 0;

    if (this.isSinglePlayer) {
      CommanderAI.processTurn(this, this.aiDifficulty, this.aiPersonality);
    }

    this.getAllUnits().forEach(u => {
      u.prevX = u.x; u.prevY = u.y;
      u.targetX = u.x; u.targetY = u.y;
    });

    this.executeSinglePlaybackStep(0);
  }

  endPlaybackPhase() {
    if (this.winner) {
      this.phase = GAME_PHASES.GAME_OVER;
      this.pauseTimer();
      return;
    }
    this.turnNumber++;
    this.phase = GAME_PHASES.PLANNING;
    this.planningTimeRemaining = 20;

    this.calculateTurnIncome(1);
    this.calculateTurnIncome(2);

    // Decay active ability durations
    this.activeFlares = this.activeFlares.filter(f => { f.turnsLeft--; return f.turnsLeft > 0; });
    this.activeSmokes = this.activeSmokes.filter(s => { s.turnsLeft--; return s.turnsLeft > 0; });

    [...this.players[1].units, ...this.players[2].units].forEach(u => {
      u.hasMovedThisTurn = false;
      u.hasAttackedThisTurn = false;
      u.prevX = u.x; u.prevY = u.y;
      u.renderX = u.x; u.renderY = u.y;
      const terrainTile = this.grid[u.y][u.x];
      if (terrainTile.id === 'FOREST' && u.stance === STANCES.AMBUSH.id) u.isAmbusherHidden = true;
    });

    this.notifyStateChange();
  }

  calculateTurnIncome(playerId) {
    let income = TERRAIN.MAIN_BASE.inkPerTurn;
    let zonesCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.grid[r][c].id === 'CAPTURE_ZONE' && this.grid[r][c].owner === playerId) {
          income += TERRAIN.CAPTURE_ZONE.inkPerTurn;
          zonesCount++;
        }
      }
    }
    this.players[playerId].ink += income;
    this.players[playerId].zonesCaptured = zonesCount;

    // EARN COMMAND POWER (CP): +1 CP PER CONTROLLED ZONE PER TURN (MAX 10)
    this.players[playerId].cp = Math.min(10, this.players[playerId].cp + 1 + zonesCount);
  }

  // SPECIAL ABILITY CASTING LOGIC
  useAbility(playerId, abilityKey, targetX, targetY) {
    const player = this.players[playerId];
    const ability = ABILITIES[abilityKey];
    if (!ability) return { success: false, reason: 'Unknown ability' };
    if (player.cp < ability.cpCost) return { success: false, reason: `Not enough Command Points (Need ${ability.cpCost} CP)` };

    player.cp -= ability.cpCost;

    if (abilityKey === 'RECON_FLARE') {
      this.activeFlares.push({ x: targetX, y: targetY, owner: playerId, turnsLeft: 2 });
      this.actionLogs.push({
        type: 'ABILITY',
        turn: this.turnNumber,
        playerOwner: playerId,
        playerName: player.name,
        abilityName: 'Recon Flare',
        x: targetX,
        y: targetY
      });
    } else if (abilityKey === 'SMOKE_SCREEN') {
      this.activeSmokes.push({ x: targetX, y: targetY, owner: playerId, turnsLeft: 2 });
      this.actionLogs.push({
        type: 'ABILITY',
        turn: this.turnNumber,
        playerOwner: playerId,
        playerName: player.name,
        abilityName: 'Smoke Screen',
        x: targetX,
        y: targetY
      });
    } else if (abilityKey === 'ARTILLERY_STRIKE') {
      this.activeArtilleryStrikes.push({ x: targetX, y: targetY, owner: playerId, targetTurn: this.turnNumber });
      this.actionLogs.push({
        type: 'ABILITY',
        turn: this.turnNumber,
        playerOwner: playerId,
        playerName: player.name,
        abilityName: 'Off-Map Artillery Strike',
        x: targetX,
        y: targetY
      });
    }

    this.notifyStateChange();
    return { success: true };
  }

  // FOG OF WAR VISION MATRIX CALCULATION
  calculateVision(playerId) {
    const visible = Array(8).fill(null).map(() => Array(8).fill(false));

    // Base & captured zones grant vision
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = this.grid[r][c];
        if (tile.owner === playerId) {
          this.revealVisionRadius(visible, c, r, 2);
        }
      }
    }

    // Units grant vision based on visionRange
    const pUnits = this.players[playerId].units.filter(u => u.isAlive());
    pUnits.forEach(u => {
      this.revealVisionRadius(visible, u.x, u.y, u.visionRange);
    });

    // Active Recon Flares grant 3x3 vision
    this.activeFlares.filter(f => f.owner === playerId).forEach(f => {
      this.revealVisionRadius(visible, f.x, f.y, 2);
    });

    return visible;
  }

  revealVisionRadius(matrix, cx, cy, radius) {
    for (let r = cy - radius; r <= cy + radius; r++) {
      for (let c = cx - radius; c <= cx + radius; c++) {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          if (Math.abs(r - cy) + Math.abs(c - cx) <= radius) {
            matrix[r][c] = true;
          }
        }
      }
    }
  }

  isTileInSmoke(x, y) {
    return this.activeSmokes.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
  }

  getOwnedSpawnPoints(playerId) {
    const points = [];
    const playerBase = this.players[playerId].basePos;

    const isUnderSiege = (sx, sy) => {
      return this.getAllUnits().some(other => {
        if (other.owner === playerId || !other.isAlive()) return false;
        return Math.abs(other.x - sx) + Math.abs(other.y - sy) <= 1;
      });
    };

    points.push({
      x: playerBase.x,
      y: playerBase.y,
      name: 'Main Base',
      isContested: isUnderSiege(playerBase.x, playerBase.y)
    });

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = this.grid[r][c];
        if (tile.id === 'CAPTURE_ZONE' && tile.owner === playerId) {
          points.push({
            x: c,
            y: r,
            name: `Supply Zone (${c}, ${r})`,
            isContested: isUnderSiege(c, r)
          });
        }
      }
    }
    return points;
  }

  buyUnit(playerId, typeKey, spawnX, spawnY) {
    const player = this.players[playerId];
    const template = UNIT_TYPES[typeKey];
    if (!template) return { success: false, reason: 'Unknown unit type' };
    if (template.factionLock && template.factionLock !== player.faction.id) return { success: false, reason: 'Unit locked to other nation' };
    if (player.ink < template.cost) return { success: false, reason: `Not enough Ink (Need ${template.cost} Ink)` };

    const tile = this.grid[spawnY][spawnX];
    if (!tile || tile.owner !== playerId) return { success: false, reason: 'Must deploy at your Base or captured Supply Zone!' };
    
    const enemyNearby = this.getAllUnits().some(other => {
      if (other.owner === playerId || !other.isAlive()) return false;
      return Math.abs(other.x - spawnX) + Math.abs(other.y - spawnY) <= 1;
    });

    if (enemyNearby) {
      return { success: false, reason: `Spawn Point (${spawnX}, ${spawnY}) is UNDER SIEGE! Enemy troops are blocking deployment.` };
    }

    const occupied = this.getAllUnits().some(u => u.x === spawnX && u.y === spawnY && u.isAlive());
    if (occupied) return { success: false, reason: `Deployment Tile (${spawnX}, ${spawnY}) is occupied by another unit!` };

    player.ink -= template.cost;
    const newUnit = new Unit(typeKey, playerId, spawnX, spawnY);
    player.units.push(newUnit);

    this.actionLogs.push({
      type: 'DEPLOY',
      turn: this.turnNumber,
      playerOwner: playerId,
      playerName: player.name,
      unitName: template.name,
      unitIcon: template.icon,
      x: spawnX,
      y: spawnY
    });

    this.notifyStateChange();
    return { success: true, unit: newUnit };
  }

  setUnitWaypoints(unitId, waypoints) {
    const u = this.getUnitById(unitId);
    if (u) u.waypoints = waypoints;
  }

  setUnitStance(unitId, stanceId) {
    const u = this.getUnitById(unitId);
    if (u) {
      const tile = this.grid[u.y][u.x];
      const canAmbush = u.category === 'INFANTRY' && tile.id === 'FOREST';
      if (stanceId === STANCES.AMBUSH.id && !canAmbush) {
        return; // Ambush blocked if not infantry in a forest!
      }
      u.setStance(stanceId);
      u.isAmbusherHidden = (stanceId === STANCES.AMBUSH.id && canAmbush);
    }
  }

  evaluateAutoStances() {
    this.getAllUnits().forEach(u => {
      if (!u.isAlive()) return;
      const tile = this.grid[u.y][u.x];
      // Ambush Stance is strictly restricted to Infantry inside Forest tiles
      if (tile.id === 'FOREST' && u.category === 'INFANTRY') {
        u.stance = STANCES.AMBUSH.id;
        u.isAmbusherHidden = true;
      } else if (['CAPTURE_ZONE', 'MAIN_BASE', 'SUPPLY_ZONE'].includes(tile.id) || u.waypoints.length === 0) {
        u.stance = STANCES.DEFEND.id;
        u.isAmbusherHidden = false;
      } else {
        u.stance = STANCES.ADVANCE.id;
        u.isAmbusherHidden = false;
      }
    });
  }

  getUnitPriorityScore(unit) {
    let speed = unit.moveRange;
    if (this.players[unit.owner].faction.id === FACTIONS.VANGUARD_LEGION.id) {
      speed += FACTIONS.VANGUARD_LEGION.movementSpeedBonus;
    }

    const categoryAgility = {
      'SCOUT': 50,
      'BLITZ_RECON': 45,
      'LIGHT_VEHICLE': 30,
      'RIFLEMAN': 20,
      'ANTI_TANK': 10,
      'HEAVY_SIEGE_TANK': 5
    };

    const agility = categoryAgility[unit.typeKey] || 10;
    const hpPercent = unit.getHpPercent();

    return (speed * 10000) + (agility * 100) + hpPercent;
  }

  executeSinglePlaybackStep(stepIndex) {
    const allUnits = this.getAllUnits();

    // EXECUTE ARTILLERY STRIKES ON STEP 2 OF PLAYBACK
    if (stepIndex === 2 && this.activeArtilleryStrikes.length > 0) {
      const p1Vision = this.calculateVision(1);
      this.activeArtilleryStrikes.forEach(art => {
        if (art.targetTurn === this.turnNumber) {
          const isArtilleryVisible = p1Vision[art.y][art.x];
          if (isArtilleryVisible || art.owner === 1) {
            if (this.audio) this.audio.playExplosion(true);
            this.actionLogs.push({
              type: 'ARTILLERY_IMPACT',
              turn: this.turnNumber,
              playerName: this.players[art.owner].name,
              x: art.x,
              y: art.y
            });
          }

          allUnits.forEach(targetUnit => {
            if (targetUnit.isAlive() && Math.abs(targetUnit.x - art.x) <= 1 && Math.abs(targetUnit.y - art.y) <= 1) {
              const dmg = targetUnit.takeDamage(35);
              
              // MASK LOG IF TARGET IS HIDDEN IN FOG OF WAR
              const isTargetVisible = p1Vision[targetUnit.y][targetUnit.x] || targetUnit.owner === 1;
              if (isTargetVisible) {
                this.actionLogs.push({
                  type: 'ARTILLERY_HIT',
                  turn: this.turnNumber,
                  unitName: targetUnit.name,
                  unitIcon: targetUnit.icon,
                  ownerTag: targetUnit.owner === 1 ? 'P1' : 'AI',
                  damage: dmg,
                  died: !targetUnit.isAlive(),
                  x: targetUnit.x,
                  y: targetUnit.y
                });
              }
            }
          });
        }
      });
      // Clear fired strikes
      this.activeArtilleryStrikes = this.activeArtilleryStrikes.filter(art => art.targetTurn !== this.turnNumber);
    }

    const sortedUnits = [...allUnits].sort((a, b) => {
      const pA = this.getUnitPriorityScore(a);
      const pB = this.getUnitPriorityScore(b);
      if (pB !== pA) return pB - pA;
      return a.id.localeCompare(b.id);
    });

    sortedUnits.forEach(unit => {
      let speedMax = unit.moveRange;
      if (this.players[unit.owner].faction.id === FACTIONS.VANGUARD_LEGION.id) {
        speedMax += FACTIONS.VANGUARD_LEGION.movementSpeedBonus;
      }

      if (unit.waypoints.length > 0 && unit.isAlive() && stepIndex < speedMax) {
        const nextTile = unit.waypoints[0];
        const tile = this.grid[nextTile.y][nextTile.x];
        const canPass = unit.category === 'VEHICLE' ? tile.isVehiclePassable : tile.isInfantryPassable;

        const isEnemyOccupied = allUnits.some(other => other.id !== unit.id && other.owner !== unit.owner && other.x === nextTile.x && other.y === nextTile.y && other.isAlive());
        
        const isLastStep = (stepIndex === speedMax - 1) || (unit.waypoints.length === 1);
        const isFriendlyOccupiedAtEnd = isLastStep && allUnits.some(other => other.id !== unit.id && other.owner === unit.owner && other.x === nextTile.x && other.y === nextTile.y && other.isAlive());

        if (canPass && !isEnemyOccupied && !isFriendlyOccupiedAtEnd) {
          unit.prevX = unit.x;
          unit.prevY = unit.y;
          unit.waypoints.shift();
          unit.x = nextTile.x;
          unit.y = nextTile.y;
          unit.targetX = nextTile.x;
          unit.targetY = nextTile.y;
          unit.hasMovedThisTurn = true;
          this.evaluateAutoStances();
          if (this.audio && unit.owner === 1) this.audio.playMarching(unit.category === 'VEHICLE');
        } else {
          unit.waypoints = [];
        }
      }
    });

    const occupiedMap = new Map();
    allUnits.forEach(u => {
      if (!u.isAlive()) return;
      const key = `${u.x},${u.y}`;
      if (!occupiedMap.has(key)) {
        occupiedMap.set(key, u);
      } else {
        const freeAdj = this.findAdjacentFreeTile(u.x, u.y);
        if (freeAdj) {
          u.x = freeAdj.x;
          u.y = freeAdj.y;
          u.targetX = freeAdj.x;
          u.targetY = freeAdj.y;
        }
      }
    });

    const p1Units = this.players[1].units.filter(u => u.isAlive());
    const p2Units = this.players[2].units.filter(u => u.isAlive());

    const p1VisionNow = this.calculateVision(1);

    p1Units.forEach(u1 => {
      p2Units.forEach(u2 => {
        if (!u1.isAlive() || !u2.isAlive()) return;

        // SMOKE SCREEN DIRECT ATTACK BLOCK
        const u1InSmoke = this.isTileInSmoke(u1.x, u1.y);
        const u2InSmoke = this.isTileInSmoke(u2.x, u2.y);
        if (u1InSmoke || u2InSmoke) return; // Direct combat blocked inside smoke!

        const dist = Combat.getDistance({ x: u1.x, y: u1.y }, { x: u2.x, y: u2.y });

        if (dist <= Math.max(u1.attackRange, u2.attackRange)) {
          if (dist <= u1.attackRange && !u1.hasAttackedThisTurn) {
            const res = Combat.resolveEncounter(u1, u2, this.grid[u2.y][u2.x], this.players[1].faction, this.players[2].faction);
            u1.hasAttackedThisTurn = true;
            if (this.audio) this.audio.playGunfire(u1.category === 'VEHICLE' || u2.category === 'VEHICLE');
            
            // ONLY LOG COMBAT IF DEFENDER TILE IS VISIBLE TO P1
            if (p1VisionNow[u2.y][u2.x]) {
              this.actionLogs.push({ ...res, turn: this.turnNumber, step: stepIndex });
            }

            // Reward CP for dealing damage
            this.players[1].cp = Math.min(10, this.players[1].cp + Math.max(1, Math.floor(res.damageDealt / 25)));
          }
          if (u2.isAlive() && dist <= u2.attackRange && !u2.hasAttackedThisTurn) {
            const res = Combat.resolveEncounter(u2, u1, this.grid[u1.y][u1.x], this.players[2].faction, this.players[1].faction);
            u2.hasAttackedThisTurn = true;
            
            // ONLY LOG COMBAT IF ATTACKER TILE IS VISIBLE TO P1
            if (p1VisionNow[u2.y][u2.x] || p1VisionNow[u1.y][u1.x]) {
              this.actionLogs.push({ ...res, turn: this.turnNumber, step: stepIndex });
            }

            // Reward CP for dealing damage
            this.players[2].cp = Math.min(10, this.players[2].cp + Math.max(1, Math.floor(res.damageDealt / 25)));
          }
        }
      });
    });

    this.players[1].units = this.players[1].units.filter(u => u.isAlive());
    this.players[2].units = this.players[2].units.filter(u => u.isAlive());

    this.getAllUnits().forEach(unit => {
      const tile = this.grid[unit.y][unit.x];
      if (tile.id === 'CAPTURE_ZONE' && tile.owner !== unit.owner) {
        tile.owner = unit.owner;
        if (this.audio) this.audio.playAlarmSound();
        this.actionLogs.push({
          type: 'CAPTURE',
          turn: this.turnNumber,
          playerOwner: unit.owner,
          playerName: this.players[unit.owner].name,
          unitName: unit.name,
          unitIcon: unit.icon,
          x: unit.x,
          y: unit.y
        });
      }
      else if (tile.id === 'MAIN_BASE' && tile.owner !== unit.owner) {
        this.winner = unit.owner;
        this.winReason = 'BASE_CAPTURE';
        this.phase = GAME_PHASES.GAME_OVER;
      }
    });

    this.checkWinConditions();
  }

  checkWinConditions() {
    if (this.winner) return;

    const p1Base = this.grid[this.players[1].basePos.y][this.players[1].basePos.x];
    const p2Base = this.grid[this.players[2].basePos.y][this.players[2].basePos.x];

    if (p1Base.owner === 2) {
      this.winner = 2;
      this.winReason = 'BASE_CAPTURE';
      this.phase = GAME_PHASES.GAME_OVER;
      return;
    }
    if (p2Base.owner === 1) {
      this.winner = 1;
      this.winReason = 'BASE_CAPTURE';
      this.phase = GAME_PHASES.GAME_OVER;
      return;
    }

    const p1Alive = this.players[1].units.filter(u => u.isAlive()).length;
    const p2Alive = this.players[2].units.filter(u => u.isAlive()).length;

    if (p1Alive === 0 && this.players[1].ink < 100) {
      this.winner = 2;
      this.winReason = 'TOTAL_ELIMINATION';
      this.phase = GAME_PHASES.GAME_OVER;
    } else if (p2Alive === 0 && this.players[2].ink < 100) {
      this.winner = 1;
      this.winReason = 'TOTAL_ELIMINATION';
      this.phase = GAME_PHASES.GAME_OVER;
    }
  }

  findAdjacentFreeTile(x, y) {
    const candidates = [
      { x: x - 1, y: y }, { x: x + 1, y: y },
      { x: x, y: y - 1 }, { x: x, y: y + 1 }
    ];
    for (const c of candidates) {
      if (c.x >= 0 && c.x < 8 && c.y >= 0 && c.y < 8) {
        const isOcc = this.getAllUnits().some(u => u.x === c.x && u.y === c.y && u.isAlive());
        const tile = this.grid[c.y][c.x];
        if (!isOcc && tile.isInfantryPassable) return c;
      }
    }
    return null;
  }

  getUnitById(unitId) { return this.getAllUnits().find(u => u.id === unitId); }
  getAllUnits() { return [...this.players[1].units, ...this.players[2].units]; }

  findValidPath(unit, targetX, targetY, fromX = null, fromY = null) {
    const startX = (fromX !== null) ? fromX : unit.x;
    const startY = (fromY !== null) ? fromY : unit.y;
    if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) return [];
    if (startX === targetX && startY === targetY) return [];

    const openSet = [];
    const closedSet = new Set();
    const gScore = new Map();
    const cameFrom = new Map();

    const startKey = `${startX},${startY}`;
    gScore.set(startKey, 0);

    const heuristic = (x, y) => Math.abs(x - targetX) + Math.abs(y - targetY);
    openSet.push({ x: startX, y: startY, f: heuristic(startX, startY) });

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currKey = `${current.x},${current.y}`;

      if (current.x === targetX && current.y === targetY) {
        const path = [];
        let currNode = currKey;
        while (cameFrom.has(currNode)) {
          const parts = currNode.split(',').map(Number);
          path.unshift({ x: parts[0], y: parts[1] });
          currNode = cameFrom.get(currNode);
        }
        return path;
      }

      closedSet.add(currKey);

      const neighbors = [
        { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x < 0 || n.x >= 8 || n.y < 0 || n.y >= 8) continue;
        const nKey = `${n.x},${n.y}`;
        if (closedSet.has(nKey)) continue;

        const tile = this.grid[n.y][n.x];
        const canPass = unit.category === 'VEHICLE' ? tile.isVehiclePassable : tile.isInfantryPassable;
        if (!canPass) continue;

        // Only block passage through enemies at the EXACT current position —
        // for long-range planning, enemies may move before the unit arrives.
        // We skip this check so paths always plan through the full board.

        const tileCost = unit.category === 'VEHICLE' ? tile.moveCostVehicle : tile.moveCostInfantry;
        const tentativeG = gScore.get(currKey) + tileCost;

        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, currKey);
          gScore.set(nKey, tentativeG);
          const fScore = tentativeG + heuristic(n.x, n.y);
          // Update or insert — remove stale entry first if present
          const existingIdx = openSet.findIndex(item => item.x === n.x && item.y === n.y);
          if (existingIdx !== -1) openSet.splice(existingIdx, 1);
          openSet.push({ x: n.x, y: n.y, f: fScore });
        }
      }
    }
    return [];
  }

  subscribe(fn) { this.listeners.push(fn); }
  notifyStateChange() { this.listeners.forEach(fn => fn(this)); }
}

class CommanderAI {
  static processTurn(engine, difficulty = 'VETERAN', personality = 'TACTICUS') {
    const aiPlayer = engine.players[2];
    const humanPlayer = engine.players[1];
    if (!aiPlayer) return;

    // TUTORIAL MODE: STRICTLY PASSIVE AI (No recruitment, no abilities, holds defense position)
    if (engine.isTutorialMode) {
      aiPlayer.units.forEach(unit => {
        if (unit.isAlive()) {
          unit.setStance(STANCES.DEFEND.id);
          unit.setWaypoints([]);
        }
      });
      return;
    }

    // 1. Dynamic Counter & Doctrine Recruitment
    this.buyUnitsAI(engine, difficulty, personality);

    // 2. Honest Fog of War Ability Usage based on Doctrine
    this.useAbilitiesAI(engine, difficulty, personality);

    // 3. Dynamic Strategic Evaluation (Force Balance & Tactical State)
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = humanPlayer.units.filter(u => u.isAlive() && (difficulty === 'RECRUIT' ? true : aiVision[u.y][u.x]));
    const aiUnits = aiPlayer.units.filter(u => u.isAlive());

    // Compute Force Power Ratio
    let aiForce = aiUnits.reduce((acc, u) => acc + (u.hp * (u.attack / 30)), 0);
    let humanForce = visibleHumanUnits.reduce((acc, u) => acc + (u.hp * (u.attack / 30)), 0);
    if (humanForce === 0) humanForce = 50;

    const forceRatio = aiForce / humanForce;

    let macroStrategy = 'BALANCED';
    if (forceRatio < 0.7) {
      macroStrategy = 'DEFENSIVE_RECOVERY';
    } else if (forceRatio > 1.3 && aiUnits.length >= 2) {
      macroStrategy = 'OFFENSIVE_ASSAULT';
    }

    aiUnits.forEach(unit => {
      const currentTile = engine.grid[unit.y][unit.x];

      // Auto Stance Evaluation (Infantry in Forest only!)
      if (currentTile.id === 'FOREST' && unit.category === 'INFANTRY') {
        unit.setStance(STANCES.AMBUSH.id);
        unit.isAmbusherHidden = true;
      } else if (['CAPTURE_ZONE', 'MAIN_BASE'].includes(currentTile.id) && currentTile.owner === 2) {
        unit.setStance(STANCES.DEFEND.id);
        unit.isAmbusherHidden = false;
      } else {
        unit.setStance(STANCES.ADVANCE.id);
        unit.isAmbusherHidden = false;
      }

      const isSittingOnBase = (unit.x === aiPlayer.basePos.x && unit.y === aiPlayer.basePos.y);

      // LOW HP TACTICAL PRESERVATION (Skip preservation for Blitzkrieg aggressive raiders)
      if (unit.getHpPercent() < 30 && macroStrategy !== 'OFFENSIVE_ASSAULT' && personality !== 'BLITZKRIEG' && !isSittingOnBase) {
        const forestTile = this.findNearbyForest(engine, unit);
        const safeTarget = forestTile || aiPlayer.basePos;
        this.executeOrder(engine, unit, safeTarget);
        return;
      }

      // DOCTRINE SPECIFIC MOVEMENT BEHAVIOR
      if (personality === 'BLITZKRIEG') {
        // BLITZKRIEG DOCTRINE: Relentless mobility, direct rush on human base & supply zones
        unit.setStance(STANCES.ADVANCE.id); // Max speed
        const closestVisibleEnemy = this.findClosestVisibleEnemy(unit, visibleHumanUnits);
        if (closestVisibleEnemy && (unit.category === 'VEHICLE' || unit.typeKey === 'SCOUT')) {
          // Fast raiders flank or strike directly
          this.executeOrder(engine, unit, { x: closestVisibleEnemy.x, y: closestVisibleEnemy.y });
        } else {
          // Rush furthest supply zone or human base
          this.executeOrder(engine, unit, humanPlayer.basePos);
        }
      } else if (personality === 'FORTRESS') {
        // FORTRESS DOCTRINE: Secure supply zone chokes and hold position with DEFEND stance
        const ownedOrNeutralZone = this.findClosestZone(engine, unit) || aiPlayer.basePos;
        const distToZone = Math.max(Math.abs(unit.x - ownedOrNeutralZone.x), Math.abs(unit.y - ownedOrNeutralZone.y));

        if (distToZone === 0) {
          // Already holding choke point: lock down in DEFEND stance
          unit.setStance(STANCES.DEFEND.id);
          this.executeOrder(engine, unit, { x: unit.x, y: unit.y });
        } else {
          this.executeOrder(engine, unit, ownedOrNeutralZone);
        }
      } else {
        // TACTICUS DOCTRINE (Balanced Mastermind)
        if (difficulty === 'RECRUIT') {
          const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
          this.executeOrder(engine, unit, target);
        } else if (macroStrategy === 'OFFENSIVE_ASSAULT') {
          const targetUnit = this.findBestCombatTarget(unit, visibleHumanUnits);
          if (targetUnit) {
            this.executeOrder(engine, unit, { x: targetUnit.x, y: targetUnit.y });
          } else {
            this.executeOrder(engine, unit, humanPlayer.basePos);
          }
        } else {
          const closestVisibleEnemy = this.findClosestVisibleEnemy(unit, visibleHumanUnits);
          const distToEnemy = closestVisibleEnemy ? Math.max(Math.abs(unit.x - closestVisibleEnemy.x), Math.abs(unit.y - closestVisibleEnemy.y)) : 999;
          
          if (distToEnemy <= unit.attackRange + 1 && !isSittingOnBase) {
            this.executeOrder(engine, unit, { x: closestVisibleEnemy.x, y: closestVisibleEnemy.y });
          } else {
            const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
            this.executeOrder(engine, unit, target);
          }
        }
      }
    });
  }

  static findUnownedZoneOrEnemyBase(engine, unit, humanPlayer) {
    let closest = null; let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'CAPTURE_ZONE' && engine.grid[r][c].owner !== 2) {
          const dist = Math.max(Math.abs(unit.x - c), Math.abs(unit.y - r));
          if (dist < minDist) { minDist = dist; closest = { x: c, y: r }; }
        }
      }
    }
    return closest || humanPlayer.basePos;
  }

  static findNearbyForest(engine, unit) {
    let closest = null; let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'FOREST') {
          const dist = Math.abs(unit.x - c) + Math.abs(unit.y - r);
          if (dist < minDist) { minDist = dist; closest = { x: c, y: r }; }
        }
      }
    }
    return closest;
  }

  static findOwnedDefensePoint(engine, unit, aiPlayer) {
    let closest = null; let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].owner === 2 && ['CAPTURE_ZONE', 'MAIN_BASE'].includes(engine.grid[r][c].id)) {
          const dist = Math.abs(unit.x - c) + Math.abs(unit.y - r);
          if (dist < minDist) { minDist = dist; closest = { x: c, y: r }; }
        }
      }
    }
    return closest;
  }

  static buyUnitsAI(engine, difficulty, personality) {
    const ai = engine.players[2];
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = engine.players[1].units.filter(u => u.isAlive() && (difficulty === 'RECRUIT' ? true : aiVision[u.y][u.x]));

    let humanVehicleCount = 0;
    let humanInfantryCount = 0;
    let humanATCount = 0;

    visibleHumanUnits.forEach(u => {
      if (u.category === 'VEHICLE') humanVehicleCount++;
      else if (u.typeKey === 'ANTI_TANK') humanATCount++;
      else humanInfantryCount++;
    });

    let targetType = 'RIFLEMAN';

    if (personality === 'BLITZKRIEG') {
      // BLITZKRIEG DOCTRINE: Favor high mobility raiders
      if (humanVehicleCount >= 2 && ai.ink >= UNIT_TYPES.ANTI_TANK.cost) {
        targetType = 'ANTI_TANK';
      } else if (ai.faction.id === 'VANGUARD_LEGION' && ai.ink >= UNIT_TYPES.BLITZ_RECON.cost) {
        targetType = 'BLITZ_RECON';
      } else if (ai.ink >= UNIT_TYPES.LIGHT_VEHICLE.cost && Math.random() > 0.3) {
        targetType = 'LIGHT_VEHICLE';
      } else {
        targetType = 'SCOUT';
      }
    } else if (personality === 'FORTRESS') {
      // FORTRESS DOCTRINE: Favor heavy armored siege & defensive crews
      if (ai.faction.id === 'IRON_CORPS' && ai.ink >= UNIT_TYPES.HEAVY_SIEGE_TANK.cost) {
        targetType = 'HEAVY_SIEGE_TANK';
      } else if (humanVehicleCount > 0 && ai.ink >= UNIT_TYPES.ANTI_TANK.cost) {
        targetType = 'ANTI_TANK';
      } else if (ai.ink >= UNIT_TYPES.RIFLEMAN.cost) {
        targetType = 'RIFLEMAN';
      } else {
        targetType = 'ANTI_TANK';
      }
    } else {
      // TACTICUS DOCTRINE: Balanced Counter-Recruitment
      if (difficulty === 'RECRUIT') {
        const types = ['RIFLEMAN', 'SCOUT', 'LIGHT_VEHICLE'];
        targetType = types[Math.floor(Math.random() * types.length)];
      } else {
        if (humanVehicleCount > 0 && ai.ink >= UNIT_TYPES.ANTI_TANK.cost) {
          targetType = 'ANTI_TANK';
        } else if (humanATCount > 0 && ai.ink >= UNIT_TYPES.RIFLEMAN.cost) {
          targetType = 'RIFLEMAN';
        } else if (ai.faction.id === 'IRON_CORPS' && ai.ink >= UNIT_TYPES.HEAVY_SIEGE_TANK.cost) {
          targetType = 'HEAVY_SIEGE_TANK';
        } else if (ai.faction.id === 'VANGUARD_LEGION' && ai.ink >= UNIT_TYPES.BLITZ_RECON.cost) {
          targetType = 'BLITZ_RECON';
        } else if (humanInfantryCount > 1 && ai.ink >= UNIT_TYPES.LIGHT_VEHICLE.cost) {
          targetType = 'LIGHT_VEHICLE';
        } else {
          targetType = Math.random() > 0.5 ? 'RIFLEMAN' : 'SCOUT';
        }
      }
    }

    const spawnPoints = engine.getOwnedSpawnPoints(2).filter(sp => !sp.isContested && !engine.getAllUnits().some(u => u.x === sp.x && u.y === sp.y && u.isAlive()));
    if (spawnPoints.length > 0 && ai.ink >= UNIT_TYPES[targetType].cost) {
      engine.buyUnit(2, targetType, spawnPoints[0].x, spawnPoints[0].y);
    }
  }

  static useAbilitiesAI(engine, difficulty, personality) {
    const ai = engine.players[2];
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = engine.players[1].units.filter(u => u.isAlive() && (difficulty === 'RECRUIT' ? true : aiVision[u.y][u.x]));

    if (personality === 'FORTRESS') {
      // FORTRESS: Prioritize heavy Artillery on human clusters near chokes
      if (ai.cp >= 4 && visibleHumanUnits.length > 0) {
        let bestTarget = visibleHumanUnits[0];
        let maxHits = 0;
        visibleHumanUnits.forEach(u => {
          const hits = visibleHumanUnits.filter(other => Math.abs(other.x - u.x) <= 1 && Math.abs(other.y - u.y) <= 1).length;
          if (hits > maxHits) { maxHits = hits; bestTarget = u; }
        });
        engine.useAbility(2, 'ARTILLERY_STRIKE', bestTarget.x, bestTarget.y);
        return;
      }
    } else if (personality === 'BLITZKRIEG') {
      // BLITZKRIEG: Use Smoke Screen to blind player base defenders and bypass killzones
      if (ai.cp >= 3) {
        const p1Base = engine.p1Base;
        engine.useAbility(2, 'SMOKE_SCREEN', p1Base.x, p1Base.y);
        return;
      }
    }

    // Standard Ability Execution for Tacticus / Fallback
    if (ai.cp >= 4 && visibleHumanUnits.length > 0) {
      let bestTarget = visibleHumanUnits[0];
      let maxHits = 0;
      visibleHumanUnits.forEach(u => {
        const hits = visibleHumanUnits.filter(other => Math.abs(other.x - u.x) <= 1 && Math.abs(other.y - u.y) <= 1).length;
        if (hits > maxHits) { maxHits = hits; bestTarget = u; }
      });
      engine.useAbility(2, 'ARTILLERY_STRIKE', bestTarget.x, bestTarget.y);
    } else if (ai.cp >= 2 && difficulty !== 'RECRUIT') {
      const p1Base = engine.p1Base;
      if (!aiVision[p1Base.y][p1Base.x]) {
        engine.useAbility(2, 'RECON_FLARE', p1Base.x, p1Base.y);
      }
    }
  }

  static findBestCombatTarget(unit, visibleEnemies) {
    let best = null; let bestScore = -999;
    visibleEnemies.forEach(e => {
      let score = 100 - (Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y)) * 10;
      if (unit.category === 'VEHICLE' && e.category === 'INFANTRY') score += 30;
      if (unit.typeKey === 'ANTI_TANK' && e.category === 'VEHICLE') score += 50;
      if (unit.typeKey === 'RIFLEMAN' && e.typeKey === 'ANTI_TANK') score += 40;
      if (score > bestScore) { bestScore = score; best = e; }
    });
    return best;
  }

  static findClosestVisibleEnemy(unit, visibleEnemies) {
    let closest = null; let minDist = Infinity;
    visibleEnemies.forEach(e => {
      const d = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
      if (d < minDist) { minDist = d; closest = e; }
    });
    return closest;
  }

  static executeOrder(engine, unit, target) {
    if (!target) return;
    const path = engine.findValidPath(unit, target.x, target.y);
    if (path.length > 0) {
      engine.setUnitWaypoints(unit.id, path);
    }
  }

  static findClosestZone(engine, unit) {
    let closest = null; let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'CAPTURE_ZONE' && engine.grid[r][c].owner !== unit.owner) {
          const dist = Math.abs(unit.x - c) + Math.abs(unit.y - r);
          if (dist < minDist) { minDist = dist; closest = { x: c, y: r }; }
        }
      }
    }
    return closest;
  }
}

// ==========================================
// 5. AUDIO & CANVAS RENDERER (WITH FOG OF WAR & ABILITIES OVERLAYS)
// ==========================================
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('sketch_warfare_muted') === 'true';
    this.masterVolume = parseInt(localStorage.getItem('sketch_warfare_vol_master') || '80', 10) / 100;
    this.sfxVolume = parseInt(localStorage.getItem('sketch_warfare_vol_sfx') || '100', 10) / 100;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  getEffectiveGain(baseGain = 1.0) {
    if (this.isMuted) return 0;
    return baseGain * this.masterVolume * this.sfxVolume;
  }

  playPencilScratch() {
    try {
      const vol = this.getEffectiveGain(0.08);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const sampleRate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.07), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2200;
      filter.Q.value = 3.0;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
    } catch (e) {}
  }

  playSpawnSound() {
    try {
      const vol = this.getEffectiveGain(0.18);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playGunfire(heavy = false) {
    try {
      const vol = this.getEffectiveGain(heavy ? 0.25 : 0.15);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = heavy ? 0.25 : 0.12;

      const sampleRate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = heavy ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(heavy ? 1200 : 2500, now);
      filter.frequency.exponentialRampToValueAtTime(heavy ? 200 : 400, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playExplosion(heavy = true) {
    try {
      const vol = this.getEffectiveGain(heavy ? 0.35 : 0.22);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = heavy ? 0.6 : 0.35;

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(heavy ? 140 : 180, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + duration);
      subGain.gain.setValueAtTime(vol, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + duration);

      const sampleRate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playMarching(isVehicle = false) {
    try {
      const vol = this.getEffectiveGain(0.06);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (isVehicle) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.1);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.04), sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      }
    } catch (e) {}
  }

  playFlareSound() {
    try {
      const vol = this.getEffectiveGain(0.2);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.35);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playSmokeSound() {
    try {
      const vol = this.getEffectiveGain(0.15);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const sampleRate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.4), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playAlarmSound() {
    try {
      const vol = this.getEffectiveGain(0.22);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.12);
        osc.frequency.setValueAtTime(700, now + i * 0.12 + 0.06);
        gain.gain.setValueAtTime(vol * 0.5, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.1);
      }
    } catch (e) {}
  }

  playVictorySound() {
    try {
      const vol = this.getEffectiveGain(0.3);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = now + idx * 0.1;
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {}
  }

  playDefeatSound() {
    try {
      const vol = this.getEffectiveGain(0.3);
      if (vol <= 0) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 415.30, 392, 349.23];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const startTime = now + idx * 0.15;
        gain.gain.setValueAtTime(vol * 0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('sketch_warfare_muted', this.isMuted);
    return this.isMuted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_master', Math.round(this.masterVolume * 100));
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_sfx', Math.round(this.sfxVolume * 100));
  }
}

class SketchRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = 70;
    this.canvas.width = 600;
    this.canvas.height = 600;
    this.offsetX = 20;
    this.offsetY = 20;

    this.selectedTile = null;
    this.hoveredTile = null;
  }

  render(engine) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background paper
    this.ctx.fillStyle = '#fcfbfa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Red margin line
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath(); this.ctx.moveTo(15, 0); this.ctx.lineTo(15, 600); this.ctx.stroke();

    // In GAME_OVER terrain-view mode: reveal all tiles (no fog)
    const isTerrainView = engine.phase === 'GAME_OVER';
    const p1Vision = isTerrainView ? Array(8).fill(null).map(() => Array(8).fill(true)) : engine.calculateVision(1);

    // Terrain Tiles
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = engine.grid[r][c];
        const pos = this.getScreenCoords(c, r);
        this.drawTerrainTile(tile, pos.x, pos.y, engine);
      }
    }

    // Grid lines
    this.ctx.strokeStyle = '#cbe3f7'; this.ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const p = i * 70;
      this.ctx.beginPath(); this.ctx.moveTo(this.offsetX + p, this.offsetY); this.ctx.lineTo(this.offsetX + p, this.offsetY + 560); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(this.offsetX, this.offsetY + p); this.ctx.lineTo(this.offsetX + 560, this.offsetY + p); this.ctx.stroke();
    }

    // Units multi-turn waypoints — show P1's own units' plans
    engine.players[1].units.forEach(unit => {
      if (unit.isAlive() && unit.waypoints.length > 0) {
        const gridC = Math.max(0, Math.min(7, Math.round(unit.renderX !== undefined ? unit.renderX : unit.x)));
        const gridR = Math.max(0, Math.min(7, Math.round(unit.renderY !== undefined ? unit.renderY : unit.y)));
        if (p1Vision[gridR][gridC] || isTerrainView) {
          this.drawMultiTurnWaypoints(unit, engine);
        }
      }
    });

    // In GAME_OVER (See Map) mode: reveal all remaining enemy queued movement lines in red!
    if (isTerrainView && engine.players[2]) {
      engine.players[2].units.forEach(unit => {
        if (unit.isAlive() && unit.waypoints.length > 0) {
          this.drawMultiTurnWaypoints(unit, engine);
        }
      });
    }

    // Render Living Units (Visible to P1) with Smooth Interpolation
    const allUnits = engine.getAllUnits();
    allUnits.forEach(unit => {
      if (!unit.isAlive()) return;

      if (unit.renderX === undefined) unit.renderX = unit.x;
      if (unit.renderY === undefined) unit.renderY = unit.y;

      const dx = unit.x - unit.renderX;
      const dy = unit.y - unit.renderY;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.005) {
        unit.renderX = unit.x;
        unit.renderY = unit.y;
      } else {
        unit.renderX += dx * 0.14;
        unit.renderY += dy * 0.14;
      }

      const gridR = Math.max(0, Math.min(7, Math.round(unit.renderY)));
      const gridC = Math.max(0, Math.min(7, Math.round(unit.renderX)));
      const isVisibleToP1 = p1Vision[gridR][gridC] || unit.owner === 1;

      if (isVisibleToP1) {
        const pos = this.getScreenCoords(unit.renderX, unit.renderY);
        this.drawUnit(unit, pos.x, pos.y, engine);
      }
    });

    // Hover highlight
    if (this.hoveredTile) {
      const pos = this.getScreenCoords(this.hoveredTile.x, this.hoveredTile.y);
      this.ctx.strokeStyle = '#3b82f6'; this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pos.x + 2, pos.y + 2, 66, 66);
    }

    // Selection highlight
    if (this.selectedTile) {
      const pos = this.getScreenCoords(this.selectedTile.x, this.selectedTile.y);
      this.ctx.strokeStyle = '#d97706'; this.ctx.lineWidth = 3;
      this.ctx.strokeRect(pos.x + 1, pos.y + 1, 68, 68);
    }

    // FOG OF WAR PENCIL HATCH OVERLAY (skip in terrain-view / GAME_OVER)
    if (!isTerrainView) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (!p1Vision[r][c]) {
            const pos = this.getScreenCoords(c, r);
            this.drawPencilHatching(pos.x, pos.y);
          }
        }
      }
    }

    // Smoke Screen Overlays
    engine.activeSmokes.forEach(smoke => {
      for (let r = smoke.y - 1; r <= smoke.y + 1; r++) {
        for (let c = smoke.x - 1; c <= smoke.x + 1; c++) {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const pos = this.getScreenCoords(c, r);
            this.ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            this.ctx.fillRect(pos.x, pos.y, 70, 70);
            this.ctx.font = 'bold 10px Cinzel, serif';
            this.ctx.fillStyle = '#cbd5e1';
            this.ctx.fillText('SMOKE', pos.x + 16, pos.y + 38);
          }
        }
      }
    });

    // Artillery Target Crosshairs
    engine.activeArtilleryStrikes.forEach(art => {
      for (let r = art.y - 1; r <= art.y + 1; r++) {
        for (let c = art.x - 1; c <= art.x + 1; c++) {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const pos = this.getScreenCoords(c, r);
            this.ctx.strokeStyle = 'rgba(220, 38, 38, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pos.x + 4, pos.y + 4, 62, 62);

            this.ctx.font = 'bold 9px Cinzel, serif';
            this.ctx.fillStyle = '#f87171';
            this.ctx.fillText('TARGET', pos.x + 14, pos.y + 20);
          }
        }
      }
    });

    this.ctx.restore();
  }

  drawPencilHatching(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(x, y, 70, 70);

    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let i = -70; i < 140; i += 8) {
      this.ctx.moveTo(x + i, y);
      this.ctx.lineTo(x + i + 70, y + 70);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMultiTurnWaypoints(unit, engine) {
    this.ctx.save();
    let unitSpeed = unit.moveRange;
    if (engine.players[unit.owner].faction.id === FACTIONS.VANGUARD_LEGION.id) {
      unitSpeed += FACTIONS.VANGUARD_LEGION.movementSpeedBonus;
    }

    const currX = unit.renderX !== undefined ? unit.renderX : unit.x;
    const currY = unit.renderY !== undefined ? unit.renderY : unit.y;
    const startPos = this.getScreenCoords(currX, currY);
    const pts = [{ x: startPos.x + 35, y: startPos.y + 35 }];

    unit.waypoints.forEach(wp => {
      const pt = this.getScreenCoords(wp.x, wp.y);
      pts.push({ x: pt.x + 35, y: pt.y + 35 });
    });

    for (let i = 0; i < pts.length - 1; i++) {
      const turnIndex = Math.floor(i / unitSpeed);
      let segmentColor;
      let dashPattern;

      if (unit.owner === 2) {
        segmentColor = '#ef4444';
        dashPattern = [5, 3];
      } else if (turnIndex === 0) {
        segmentColor = unit.owner === 1 ? FACTIONS.IRON_CORPS.color : FACTIONS.VANGUARD_LEGION.color;
        dashPattern = [6, 3];
      } else if (turnIndex === 1) {
        segmentColor = '#d97706';
        dashPattern = [4, 4];
      } else {
        segmentColor = '#7c3aed';
        dashPattern = [2, 4];
      }

      this.ctx.strokeStyle = segmentColor;
      this.ctx.lineWidth = 3 - Math.min(1.5, turnIndex * 0.5);
      this.ctx.setLineDash(dashPattern);

      this.ctx.beginPath();
      this.ctx.moveTo(pts[i].x, pts[i].y);
      this.ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      this.ctx.stroke();
    }

    if (pts.length >= 2) {
      const lastPt = pts[pts.length - 1];
      const prevPt = pts[pts.length - 2];
      const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
      const arrowLen = 14;

      const lastTurnIndex = Math.floor((pts.length - 2) / unitSpeed);
      const arrowColor = unit.owner === 2 ? '#ef4444' : (lastTurnIndex === 0 ? (unit.owner === 1 ? FACTIONS.IRON_CORPS.color : FACTIONS.VANGUARD_LEGION.color) : (lastTurnIndex === 1 ? '#d97706' : '#7c3aed'));

      this.ctx.setLineDash([]);
      this.ctx.fillStyle = arrowColor;
      this.ctx.strokeStyle = arrowColor;
      this.ctx.beginPath();
      this.ctx.moveTo(lastPt.x, lastPt.y);
      this.ctx.lineTo(
        lastPt.x - arrowLen * Math.cos(angle - Math.PI / 6),
        lastPt.y - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.lineTo(
        lastPt.x - arrowLen * Math.cos(angle + Math.PI / 6),
        lastPt.y - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawTerrainTile(tile, x, y, engine) {
    this.ctx.save();
    switch (tile.id) {
      case 'FOREST':
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.12)'; this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = '#2d5a27'; this.ctx.lineWidth = 1.5;
        this.ctx.beginPath(); this.ctx.moveTo(x + 35, y + 20); this.ctx.lineTo(x + 20, y + 45); this.ctx.lineTo(x + 50, y + 45); this.ctx.closePath(); this.ctx.stroke();
        break;
      case 'SWAMP':
        this.ctx.fillStyle = 'rgba(101, 163, 13, 0.18)'; this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = '#4d7c0f'; this.ctx.lineWidth = 1.2;
        this.ctx.beginPath(); this.ctx.moveTo(x + 25, y + 45); this.ctx.lineTo(x + 28, y + 25); this.ctx.stroke();
        break;
      case 'MOUNTAIN':
        this.ctx.fillStyle = 'rgba(120, 113, 108, 0.2)'; this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = '#44403c'; this.ctx.lineWidth = 1.5;
        this.ctx.beginPath(); this.ctx.moveTo(x + 18, y + 50); this.ctx.lineTo(x + 35, y + 20); this.ctx.lineTo(x + 52, y + 50); this.ctx.stroke();
        break;
      case 'WATER':
        this.ctx.fillStyle = 'rgba(14, 165, 233, 0.25)'; this.ctx.fillRect(x, y, 70, 70);
        break;
      case 'CAPTURE_ZONE':
        this.ctx.fillStyle = tile.owner === 1 ? 'rgba(37, 99, 235, 0.18)' : (tile.owner === 2 ? 'rgba(220, 38, 38, 0.18)' : 'rgba(234, 179, 8, 0.22)');
        this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = tile.owner === 1 ? '#3b82f6' : (tile.owner === 2 ? '#ef4444' : '#f59e0b');
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, 66, 66);

        this.ctx.font = 'bold 9px Inter, sans-serif';
        this.ctx.fillStyle = tile.owner === 1 ? '#93c5fd' : (tile.owner === 2 ? '#fca5a5' : '#fef08a');
        this.ctx.textAlign = 'center';
        this.ctx.fillText('+10 INK', x + 35, y + 14);
        break;
      case 'MAIN_BASE':
        this.ctx.fillStyle = tile.owner === 1 ? 'rgba(37, 99, 235, 0.25)' : 'rgba(220, 38, 38, 0.25)';
        this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = tile.owner === 1 ? '#2563eb' : '#dc2626';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, 66, 66);

        this.ctx.font = 'bold 9px Inter, sans-serif';
        this.ctx.fillStyle = tile.owner === 1 ? '#60a5fa' : '#f87171';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tile.owner === 1 ? 'P1 HQ BASE' : 'AI HQ BASE', x + 35, y + 14);
        break;
    }

    if ((tile.id === 'MAIN_BASE' || tile.id === 'CAPTURE_ZONE') && tile.owner) {
      const isSieged = engine.getAllUnits().some(other => {
        if (other.owner === tile.owner || !other.isAlive()) return false;
        return Math.abs(other.x - tile.x) + Math.abs(other.y - tile.y) <= 1;
      });

      if (isSieged) {
        this.ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
        this.ctx.fillRect(x, y, 70, 70);
        this.ctx.font = 'bold 10px Cinzel, serif';
        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillText('SIEGE', x + 16, y + 15);
      }
    }

    this.ctx.restore();
  }

  drawUnit(unit, x, y, engine) {
    this.ctx.save();
    const cx = x + 35; const cy = y + 35;
    const isP1 = unit.owner === 1;
    const mainColor = isP1 ? '#2563eb' : '#dc2626';
    const bgFill = isP1 ? '#0f172a' : '#280d0d';
    const symbolColor = isP1 ? '#93c5fd' : '#fca5a5';

    // Outer Tactical Unit Frame (NATO style round-rect / circle)
    this.ctx.strokeStyle = mainColor;
    this.ctx.lineWidth = 3;
    this.ctx.fillStyle = bgFill;

    if (unit.category === 'VEHICLE') {
      // NATO Vehicle Oval Track Frame
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, 23, 17, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      // NATO Infantry Circle Frame
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    // NATO Symbol Vector Drawing inside frame
    this.ctx.strokeStyle = symbolColor;
    this.ctx.fillStyle = symbolColor;
    this.ctx.lineWidth = 2;

    const uType = unit.typeKey || unit.id || '';

    if (uType === 'RIFLEMAN') {
      // NATO Infantry Crossed Rifles ✕
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 9, cy - 7); this.ctx.lineTo(cx + 9, cy + 7);
      this.ctx.moveTo(cx + 9, cy - 7); this.ctx.lineTo(cx - 9, cy + 7);
      this.ctx.stroke();
    } else if (uType === 'SCOUT') {
      // NATO Scout Slash & Dots ⧟
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 9, cy + 7); this.ctx.lineTo(cx + 9, cy - 7);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(cx - 4, cy - 3, 2.5, 0, Math.PI * 2);
      this.ctx.arc(cx + 4, cy + 3, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (uType === 'ANTI_TANK') {
      // NATO Anti-Tank Arrow Reticle ⌖
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 11, cy); this.ctx.lineTo(cx + 11, cy);
      this.ctx.moveTo(cx, cy - 11); this.ctx.lineTo(cx, cy + 11);
      this.ctx.stroke();
    } else if (uType === 'LIGHT_VEHICLE') {
      // NATO Armored Car Body & Wheels
      this.ctx.strokeRect(cx - 10, cy - 6, 20, 12);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (uType === 'HEAVY_SIEGE_TANK') {
      // NATO Tank Track & Gun Barrel
      this.ctx.strokeRect(cx - 11, cy - 7, 22, 14);
      this.ctx.fillRect(cx - 4, cy - 3, 8, 6);
      this.ctx.fillRect(cx + 4, cy - 2, 8, 4); // Gun barrel
    } else if (uType === 'BLITZ_RECON') {
      // NATO Recon Lightning Bolt
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 2, cy - 9);
      this.ctx.lineTo(cx - 5, cy + 1);
      this.ctx.lineTo(cx, cy + 1);
      this.ctx.lineTo(cx - 2, cy + 9);
      this.ctx.lineTo(cx + 5, cy - 1);
      this.ctx.lineTo(cx, cy - 1);
      this.ctx.closePath();
      this.ctx.fill();
    } else {
      this.ctx.font = 'bold 12px Cinzel, serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(unit.symbol || 'U', cx, cy);
    }

    // Owner Tag Badge (P1 vs AI)
    this.ctx.fillStyle = mainColor;
    this.ctx.fillRect(x + 4, y + 4, 22, 13);
    this.ctx.font = 'bold 9px Inter, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(isP1 ? 'P1' : 'AI', x + 15, y + 10.5);

    // Stance Tactical Badge (DEF, AMB, ADV)
    let stanceBadgeSymbol = 'ADV';
    let stanceBadgeBg = 'rgba(37,99,235,0.85)';
    if (unit.stance === 'DEFEND') {
      stanceBadgeSymbol = 'DEF';
      stanceBadgeBg = 'rgba(245,158,11,0.85)';
    } else if (unit.stance === 'AMBUSH') {
      stanceBadgeSymbol = 'AMB';
      stanceBadgeBg = 'rgba(22,163,74,0.85)';
    }
    
    this.ctx.fillStyle = stanceBadgeBg;
    this.ctx.fillRect(x + 44, y + 4, 22, 13);
    this.ctx.font = 'bold 8px Inter, sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(stanceBadgeSymbol, x + 55, y + 10.5);

    // Health Bar
    const hpBarWidth = 36;
    const hpPercent = unit.getHpPercent() / 100;
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(cx - 18, cy + 20, hpBarWidth, 4);
    this.ctx.fillStyle = isP1 ? (hpPercent > 0.5 ? '#16a34a' : '#eab308') : '#dc2626';
    this.ctx.fillRect(cx - 18, cy + 20, hpBarWidth * hpPercent, 4);
    this.ctx.restore();
  }

  getScreenCoords(gridX, gridY) { return { x: this.offsetX + gridX * 70, y: this.offsetY + gridY * 70 }; }
  getGridCoords(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (rect.width || 600);
    const scaleY = this.canvas.height / (rect.height || 600);
    const realX = screenX * scaleX;
    const realY = screenY * scaleY;
    const gx = Math.floor((realX - this.offsetX) / 70);
    const gy = Math.floor((realY - this.offsetY) / 70);
    return (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) ? { x: gx, y: gy } : null;
  }
}

// ==========================================
// 6. UI MANAGER & COMMANDER LOG
// ==========================================
class UIManager {
  constructor(app) {
    this.app = app;
    this.gameContainer = document.getElementById('game-container');
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.inGameMenuModal = document.getElementById('in-game-menu-modal');
    this.deployPickerModal = document.getElementById('deploy-picker-modal');

    this.phaseBadge = document.getElementById('phase-badge');
    this.timerBarFill = document.getElementById('timer-bar-fill');
    this.turnCounter = document.getElementById('turn-counter');
    this.p1InkDisplay = document.getElementById('p1-ink');
    this.p1CpDisplay = document.getElementById('p1-cp');
    this.p2InkDisplay = document.getElementById('p2-ink');
    this.inspectorContent = document.getElementById('inspector-content');
    this.storeContainer = document.getElementById('unit-store-container');
    this.actionLogBox = document.getElementById('action-log-box');

    this.pendingAbilityKey = null;

    this.setupListeners();
    this.setupMenuTabs();
  }

  showToast(title, message) {
    const container = document.getElementById('sketch-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'sketch-toast';
    toast.style.cursor = 'pointer';
    toast.innerHTML = `
      <div style="flex:1;">
        <div class="sketch-toast-title">${title}</div>
        <div class="sketch-toast-desc">${message}</div>
      </div>
      <button class="sketch-toast-dismiss" title="Dismiss">&times;</button>
    `;

    const removeToast = () => {
      if (!toast.parentNode) return;
      toast.style.animation = 'toastFadeOut 0.2s ease-in forwards';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 180);
    };

    const dismissBtn = toast.querySelector('.sketch-toast-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeToast();
      });
    }

    toast.addEventListener('click', () => {
      removeToast();
    });

    container.appendChild(toast);
    setTimeout(() => {
      removeToast();
    }, 4500);
  }

  setupListeners() {
    document.getElementById('btn-start-game')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.mainMenuOverlay) this.mainMenuOverlay.style.display = 'none';
      if (this.gameContainer) this.gameContainer.classList.remove('game-blurred');
      this.app.launchMatchFromMenu();
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-open-menu')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openInGameMenu();
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-resume-game')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeInGameMenu();
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-exit-to-main')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeInGameMenu();
      if (this.app.engine) this.app.engine.pauseTimer();
      if (this.mainMenuOverlay) this.mainMenuOverlay.style.display = 'flex';
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-menu-open-auth')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.openAuthModal) window.openAuthModal();
    });

    document.getElementById('btn-menu-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.logoutCommander) window.logoutCommander();
    });

    document.getElementById('hud-profile-badge')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.openAuthModal) window.openAuthModal();
    });

    document.getElementById('btn-end-turn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.app.engine && this.app.engine.phase === 'PLANNING') {
        this.app.engine.endPlanningPhase();
      }
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-halt-all')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.app.engine) {
        this.app.engine.players[1].units.forEach(u => u.setWaypoints([]));
        this.showToast('Troops Halted', 'All unit movement plans canceled!');
        this.updateHUD(this.app.engine);
      }
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-cancel-deploy')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.deployPickerModal) this.deployPickerModal.style.display = 'none';
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-victory-main-menu')?.addEventListener('click', (e) => {
      e.preventDefault();
      const vicModal = document.getElementById('victory-modal');
      if (vicModal) vicModal.style.display = 'none';
      if (this.mainMenuOverlay) this.mainMenuOverlay.style.display = 'flex';
      try { this.app.audio.playPencilScratch(); } catch(err){}
    });

    document.getElementById('btn-toggle-sound')?.addEventListener('click', (e) => {
      e.preventDefault();
      const muted = this.app.audio.toggleMute();
      e.target.textContent = muted ? 'Disabled (Muted)' : 'Enabled';
      e.target.style.background = muted ? '#fecdd3' : '#bbf7d0';
    });

    // LOG FILTER CHIP LISTENERS
    this.currentLogFilter = 'ALL';
    document.getElementById('log-filter-all')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setLogFilter('ALL', e.target);
    });
    document.getElementById('log-filter-combat')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setLogFilter('COMBAT', e.target);
    });
    document.getElementById('log-filter-deploy')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.setLogFilter('DEPLOY', e.target);
    });

    // ABILITIES EVENT LISTENERS
    document.getElementById('btn-ability-flare')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleAbilityClick('RECON_FLARE');
    });
    document.getElementById('btn-ability-smoke')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleAbilityClick('SMOKE_SCREEN');
    });
    document.getElementById('btn-ability-artillery')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleAbilityClick('ARTILLERY_STRIKE');
    });
  }

  setLogFilter(filterKey, activeBtn) {
    this.currentLogFilter = filterKey;
    document.querySelectorAll('.log-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
    if (this.app && this.app.engine) this.updateActionLogs(this.app.engine);
  }

  handleAbilityClick(abilityKey) {
    if (!this.app.engine || this.app.engine.phase !== 'PLANNING') return;
    const ability = ABILITIES[abilityKey];
    if (this.app.engine.players[1].cp < ability.cpCost) {
      this.showToast('Low Command Power', `Need ${ability.cpCost} CP to launch ${ability.name}!`);
      return;
    }

    const selTile = this.app.renderer.selectedTile;
    if (selTile) {
      const res = this.app.engine.useAbility(1, abilityKey, selTile.x, selTile.y);
      if (res.success) {
        try {
          if (abilityKey === 'RECON_FLARE') this.app.audio.playFlareSound();
          else if (abilityKey === 'SMOKE_SCREEN') this.app.audio.playSmokeSound();
          else if (abilityKey === 'ARTILLERY_STRIKE') this.app.audio.playExplosion(true);
          else this.app.audio.playSpawnSound();
        } catch(err){}
        this.showToast('Ability Deployed', `${ability.name} targeted at (${selTile.x}, ${selTile.y})!`);
        this.pendingAbilityKey = null;
      } else {
        this.showToast('Ability Error', res.reason);
      }
    } else {
      this.pendingAbilityKey = abilityKey;
      this.showToast('Select Target Tile', `${ability.name} active! Click any grid square to target.`);
    }
  }

  setupMenuTabs() {
    const tabs = [
      { btn: 'tab-btn-play', pane: 'tab-pane-play' },
      { btn: 'tab-btn-factions', pane: 'tab-pane-factions' },
      { btn: 'tab-btn-codex', pane: 'tab-pane-codex' },
      { btn: 'tab-btn-account', pane: 'tab-pane-account' },
      { btn: 'tab-btn-settings', pane: 'tab-pane-settings' }
    ];
    tabs.forEach(t => {
      const btnEl = document.getElementById(t.btn);
      const paneEl = document.getElementById(t.pane);
      if (btnEl && paneEl) {
        btnEl.addEventListener('click', (e) => {
          e.preventDefault();
          tabs.forEach(o => {
            document.getElementById(o.btn)?.classList.remove('active');
            const p = document.getElementById(o.pane);
            if (p) p.style.display = 'none';
          });
          btnEl.classList.add('active');
          paneEl.style.display = 'flex';
          try { this.app.audio.playPencilScratch(); } catch(err){}
        });
      }
    });
  }

  openInGameMenu() {
    if (this.app.engine) this.app.engine.pauseTimer();
    this.gameContainer.classList.add('game-blurred');
    this.inGameMenuModal.style.display = 'flex';
  }

  closeInGameMenu() {
    this.inGameMenuModal.style.display = 'none';
    this.gameContainer.classList.remove('game-blurred');
    if (this.app.engine && this.app.engine.phase !== 'GAME_OVER') {
      this.app.engine.startTurnTimer();
    }
  }

  updateHUD(engine) {
    if (!engine) return;
    this.turnCounter.textContent = `Turn ${engine.turnNumber}`;

    if (engine.phase === 'PLANNING') {
      this.phaseBadge.textContent = `Planning Phase — ${engine.planningTimeRemaining}s`;
      this.phaseBadge.style.background = '';
      this.timerBarFill.style.width = `${(engine.planningTimeRemaining / 20) * 100}%`;
    } else if (engine.phase === 'PLAYBACK') {
      this.phaseBadge.textContent = `Combat Playback — ${engine.playbackTimeRemaining}s`;
      this.phaseBadge.style.background = '';
      const maxPlaybackSecs = engine.playbackDurationConfig || 3;
      this.timerBarFill.style.width = `${(engine.playbackTimeRemaining / maxPlaybackSecs) * 100}%`;
    } else if (engine.phase === 'GAME_OVER') {
      this.phaseBadge.textContent = `Game Over`;
      this.timerBarFill.style.width = '0%';
    }

    this.p1InkDisplay.textContent = `Ink: ${engine.players[1].ink}`;
    if (this.p1CpDisplay) this.p1CpDisplay.textContent = `CP: ${engine.players[1].cp}/10`;
    if (this.p2InkDisplay) this.p2InkDisplay.textContent = `${engine.players[2].name}: ${engine.players[2].ink}`;

    this.renderUnitStore(engine);
    this.renderInspector(engine);
    this.updateActionLogs(engine);

    // In GAME_OVER: lock all action controls. Otherwise always make sure they're unlocked.
    const actionBtnIds = ['btn-end-turn', 'btn-halt-all', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery'];
    if (engine.phase === 'GAME_OVER') {
      actionBtnIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = true; el.style.opacity = '0.3'; el.style.pointerEvents = 'none'; }
      });
    } else {
      // Always re-enable on PLANNING or PLAYBACK so a new game resets the buttons
      actionBtnIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.style.opacity = ''; el.style.pointerEvents = ''; }
      });
    }

    const tutorialBox = document.getElementById('tutorial-hint-box');
    const tutorialText = document.getElementById('tutorial-hint-text');
    if (tutorialBox && tutorialText) {
      if (engine.isTutorialMode) {
        tutorialBox.style.display = 'block';
        const p1Units = engine.players[1].units.filter(u => u.isAlive());
        const hasQueuedMoves = p1Units.some(u => u.waypoints.length > 0);

        if (p1Units.length === 0) {
          tutorialText.innerHTML = '<b>Step 1:</b> Click "Rifle Squad" in the Recruit Store below to deploy your first unit at your HQ Base (Blue Ring).';
        } else if (!hasQueuedMoves) {
          tutorialText.innerHTML = '<b>Step 2:</b> Click your troop on the map grid (Blue Ring), then click adjacent tiles to draw a movement path towards the Gold Supply Zone (+10 Ink/Turn).';
        } else if (engine.phase === 'PLANNING') {
          tutorialText.innerHTML = '<b>Step 3:</b> Great job! Now click "End Phase" on the top right to execute simultaneous movement.';
        } else {
          tutorialText.innerHTML = '<b>Step 4:</b> Perfect! Capture Gold Supply Zones (+10 Ink/turn) and destroy the Red AI HQ Base to win!';
        }
      } else {
        tutorialBox.style.display = 'none';
      }
    }

    if (engine.winner && !engine.victoryShown) {
      engine.victoryShown = true;
      if (window.gAuthManager) {
        window.gAuthManager.recordMatchResult(engine.winner === 1);
      }
      const modal = document.getElementById('victory-modal');
      const title = document.getElementById('victory-title');
      const sub = document.getElementById('victory-sub');
      if (modal && title && sub) {
        modal.style.display = 'flex';
        if (engine.winner === 1) {
          if (this.app && this.app.audio) this.app.audio.playVictorySound();
          title.textContent = `Victory`;
          title.style.color = '#4ade80';
          sub.textContent = engine.winReason === 'BASE_CAPTURE'
            ? `You captured the enemy Main Base.`
            : `You eliminated all enemy forces.`;
        } else {
          if (this.app && this.app.audio) this.app.audio.playDefeatSound();
          title.textContent = `Defeat`;
          title.style.color = '#f87171';
          sub.textContent = engine.winReason === 'BASE_CAPTURE'
            ? `The enemy captured your Main Base.`
            : `The enemy eliminated all your forces.`;
        }
      }
    }
  }

  renderUnitStore(engine) {
    if (!this.storeContainer) return;
    this.storeContainer.innerHTML = '';
    // Hide the store entirely during terrain view / game over
    if (engine.phase === 'GAME_OVER') return;
    const p1 = engine.players[1];

    Object.keys(UNIT_TYPES).filter(k => !UNIT_TYPES[k].factionLock || UNIT_TYPES[k].factionLock === p1.faction.id).forEach(key => {
      const u = UNIT_TYPES[key];
      const btn = document.createElement('button');
      btn.className = 'unit-card-btn';
      btn.innerHTML = `<div class="unit-card-info"><span class="unit-card-title">${u.symbol} ${u.name}</span><span class="unit-card-desc">${u.description}</span></div><span class="unit-card-cost">${u.cost} Ink</span>`;
      
      btn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        
        const availableSpawns = engine.getOwnedSpawnPoints(1);
        const unContestedSpawns = availableSpawns.filter(sp => !sp.isContested && !engine.getAllUnits().some(u => u.x === sp.x && u.y === sp.y && u.isAlive()));

        if (unContestedSpawns.length === 0) {
          this.showToast('Deployment Failed', 'All your Base & Supply Zone tiles are UNDER SIEGE or occupied!');
          return;
        }

        const selTile = this.app.renderer.selectedTile;
        if (selTile) {
          const isSelectedValid = unContestedSpawns.some(sp => sp.x === selTile.x && sp.y === selTile.y);
          if (isSelectedValid) {
            const res = engine.buyUnit(1, key, selTile.x, selTile.y);
            if (res.success) {
              this.app.audio.playSpawnSound();
            } else {
              this.showToast('Deployment Error', res.reason);
            }
            return;
          }
        }

        try { this.app.audio.playPencilScratch(); } catch(err){}
        this.openDeploymentPicker(engine, key, u);
      });
      this.storeContainer.appendChild(btn);
    });
  }

  openDeploymentPicker(engine, unitTypeKey, unitObj) {
    const titleEl = document.getElementById('deploy-picker-title');
    if (titleEl && unitObj) titleEl.textContent = `Deploy ${unitObj.symbol} ${unitObj.name}`;
    const spawnPoints = engine.getOwnedSpawnPoints(1);
    const listEl = document.getElementById('deploy-picker-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (spawnPoints.length === 0) {
      listEl.innerHTML = `<p style="color:#f87171; font-size:0.85rem;">No active spawn points owned!</p>`;
      if (this.deployPickerModal) this.deployPickerModal.style.display = 'flex';
      return;
    }

    spawnPoints.forEach(sp => {
      const btn = document.createElement('button');
      btn.className = 'spawn-picker-btn';
      if (sp.isContested) {
        btn.innerHTML = `<span>${sp.name} (UNDER SIEGE)</span>`;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.addEventListener('click', () => {
          this.showToast('Under Siege', `Cannot deploy at (${sp.x}, ${sp.y}) while enemy is adjacent!`);
        });
      } else {
        btn.innerHTML = `<span>${sp.name}</span> <span style="color:var(--blue-400);">(${sp.x}, ${sp.y})</span>`;
        btn.addEventListener('click', () => {
          try { this.app.audio.playPencilScratch(); } catch(err){}
          if (this.deployPickerModal) this.deployPickerModal.style.display = 'none';
          const res = engine.buyUnit(1, unitTypeKey, sp.x, sp.y);
          if (res.success) {
            try { this.app.audio.playSpawnSound(); } catch(err){}
          } else {
            this.showToast('Deployment Error', res.reason);
          }
        });
      }

      listEl.appendChild(btn);
    });

    this.deployPickerModal.style.display = 'flex';
  }

  renderInspector(engine) {
    if (!this.inspectorContent) return;
    const sel = this.app.renderer.selectedTile;
    if (!sel) {
      this.inspectorContent.innerHTML = `<p class="handwriting" style="font-size:1.05rem; color:#6b7280;">Click any grid square to inspect terrain or give unit orders.</p>`;
      return;
    }
    const tile = engine.grid[sel.y][sel.x];
    const isTerrainView = engine.phase === 'GAME_OVER';
    const p1Vision = isTerrainView ? Array(8).fill(null).map(() => Array(8).fill(true)) : engine.calculateVision(1);
    const isTileVisible = p1Vision[sel.y][sel.x];

    // Mask enemy units on tiles shrouded by Fog of War
    const rawUnit = engine.getAllUnits().find(u => u.x === sel.x && u.y === sel.y && u.isAlive());
    const unitOnTile = (rawUnit && (rawUnit.owner === 1 || isTileVisible)) ? rawUnit : null;

    let html = '';
    if (!isTileVisible && !isTerrainView) {
      html += `<div><h3 style="font-size:1.15rem; color:var(--text-secondary);">Sector (${sel.x}, ${sel.y}) &mdash; Fog of War</h3><p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Sector shrouded in Fog of War. Deploy Recon units or Flares to reveal area.</p></div>`;
    } else {
      html += `<div><h3 style="font-size:1.15rem;">Terrain: ${tile.name} (${sel.x}, ${sel.y})</h3><p style="font-size:0.85rem;">Defense: +${Math.round((tile.defenseBonus || 0) * 100)}%</p></div>`;
    }
    
    if (unitOnTile) {
      const isFriendly = unitOnTile.owner === 1;
      const waypointsCount = unitOnTile.waypoints.length;
      const allegianceBadge = isFriendly
        ? `<div style="background:rgba(37,99,235,0.15); color:var(--blue-300); border:1px solid rgba(59,130,246,0.4); padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem; display:inline-block; margin-bottom:4px; font-family:var(--font-display);">FRIENDLY TROOP (Player 1)</div>`
        : `<div style="background:rgba(220,38,38,0.15); color:var(--red-300); border:1px solid rgba(239,68,68,0.4); padding:3px 8px; border-radius:4px; font-weight:bold; font-size:0.75rem; display:inline-block; margin-bottom:4px; font-family:var(--font-display);">ENEMY TROOP (AI Commander)</div>`;

      html += `
        <div style="margin-top:6px; border-top:1px dashed var(--border-subtle); padding-top:6px;">
          ${allegianceBadge}
          <h3 style="font-size:1.05rem; font-family:var(--font-display);">${unitOnTile.symbol} ${unitOnTile.name}</h3>
          <p style="font-size:0.8rem; color:var(--text-secondary);">HP: ${unitOnTile.hp}/${unitOnTile.maxHp} | Move: ${unitOnTile.moveRange}</p>
          ${(isFriendly && waypointsCount > 0) ? `<p style="font-size:0.78rem; color:var(--blue-300); font-weight:bold;">Planned Path: ${waypointsCount} tiles queued</p>` : ''}
      `;

      if (unitOnTile.owner === 1 && engine.phase === 'PLANNING') {
        const canAmbush = unitOnTile.category === 'INFANTRY' && tile.id === 'FOREST';
        html += `
          <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size:0.75rem; font-weight:bold; font-family:var(--font-display);">Stance:</label>
            <div style="display: flex; gap: 4px;">
              <button id="stance-adv" class="btn-sketch ${unitOnTile.stance === 'ADVANCE' ? 'active' : ''}" style="font-size:0.75rem; padding:3px 6px;">Advance</button>
              <button id="stance-def" class="btn-sketch ${unitOnTile.stance === 'DEFEND' ? 'active' : ''}" style="font-size:0.75rem; padding:3px 6px;">Defend</button>
              <button id="stance-amb" class="btn-sketch ${unitOnTile.stance === 'AMBUSH' ? 'active' : ''}" style="font-size:0.75rem; padding:3px 6px; ${!canAmbush ? 'opacity:0.4; cursor:not-allowed;' : ''}" ${!canAmbush ? 'disabled title="Ambush: Infantry in Forest only"' : ''}>Ambush</button>
            </div>
            <button id="btn-cancel-unit-plan" class="btn-sketch btn-danger" style="margin-top:4px; font-size:0.75rem; padding:4px;">
              Cancel Unit Plan
            </button>
          </div>
        `;
      }
      html += `</div>`;
    }
    this.inspectorContent.innerHTML = html;

    if (unitOnTile && unitOnTile.owner === 1 && engine.phase === 'PLANNING') {
      const btnAdv = document.getElementById('stance-adv');
      const btnDef = document.getElementById('stance-def');
      const btnAmb = document.getElementById('stance-amb');
      const btnCancelUnit = document.getElementById('btn-cancel-unit-plan');

      if (btnAdv) btnAdv.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'ADVANCE'); this.updateHUD(engine); });
      if (btnDef) btnDef.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'DEFEND'); this.updateHUD(engine); });
      if (btnAmb) btnAmb.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'AMBUSH'); this.updateHUD(engine); });
      
      if (btnCancelUnit) {
        btnCancelUnit.addEventListener('click', () => {
          this.app.audio.playPencilScratch();
          engine.setUnitWaypoints(unitOnTile.id, []);
          this.updateHUD(engine);
        });
      }
    }
  }

  /**
   * CLEAN BATTLE LOG (STRICT FOG OF WAR MASKING)
   */
  updateActionLogs(engine) {
    if (!this.actionLogBox) return;
    this.actionLogBox.innerHTML = '';
    
    let currentRenderedTurn = 0;
    const p1Vision = engine.calculateVision(1);

    engine.actionLogs.forEach(log => {
      if (['HALT', 'CANCEL_UNIT', 'CUSTOM'].includes(log.type)) return;

      if (this.currentLogFilter === 'COMBAT' && !['COMBAT', 'ARTILLERY_IMPACT', 'ARTILLERY_HIT'].includes(log.type)) return;
      if (this.currentLogFilter === 'DEPLOY' && !['DEPLOY', 'ABILITY', 'CAPTURE'].includes(log.type)) return;

      // STRICT FOG OF WAR LOG FILTERING FOR PLAYER 1 VIEW:
      // Completely suppress any AI action (deployment, zone capture, ability cast, artillery hit) on tiles hidden to P1!
      if (log.playerOwner === 2 && log.x !== undefined && log.y !== undefined && !p1Vision[log.y][log.x]) return;
      if (log.type === 'CAPTURE' && log.playerOwner === 2 && log.x !== undefined && log.y !== undefined && !p1Vision[log.y][log.x]) return;
      if (log.type === 'ARTILLERY_IMPACT' && log.playerName !== 'Player 1' && log.x !== undefined && log.y !== undefined && !p1Vision[log.y][log.x]) return;
      if (log.type === 'ARTILLERY_HIT' && log.ownerTag === 'AI' && log.x !== undefined && log.y !== undefined && !p1Vision[log.y][log.x]) return;

      if (log.turn && log.turn !== currentRenderedTurn) {
        currentRenderedTurn = log.turn;
        const turnDiv = document.createElement('div');
        turnDiv.style.textAlign = 'center';
        turnDiv.style.fontWeight = 'bold';
        turnDiv.style.fontSize = '0.82rem';
        turnDiv.style.color = '#2563eb';
        turnDiv.style.margin = '8px 0 4px 0';
        turnDiv.style.borderBottom = '1px solid #93c5fd';
        turnDiv.textContent = `── TURN ${currentRenderedTurn} ──`;
        this.actionLogBox.appendChild(turnDiv);
      }

      const div = document.createElement('div');
      div.className = 'log-entry';
      div.style.padding = '4px 0';
      div.style.borderBottom = '1px dashed #e5e7eb';

      if (log.type === 'DEPLOY') {
        const ownerTag = log.playerOwner === 1 ? 'P1' : 'AI';
        const color = log.playerOwner === 1 ? '#3b82f6' : '#f87171';
        div.innerHTML = `<b style="color:${color};">${ownerTag} ${log.playerName}</b> recruited <b>[${log.unitIcon}] ${log.unitName}</b> at <span style="color:#4ade80; font-weight:bold;">(${log.x}, ${log.y})</span>`;
      } else if (log.type === 'ABILITY') {
        const ownerTag = log.playerOwner === 1 ? 'P1' : 'AI';
        div.innerHTML = `<b>${ownerTag} ${log.playerName}</b> deployed <b>${log.abilityName}</b> at (${log.x}, ${log.y})`;
      } else if (log.type === 'ARTILLERY_IMPACT') {
        div.innerHTML = `<b>${log.playerName} Heavy Artillery</b> barrage hit target zone (${log.x}, ${log.y})`;
      } else if (log.type === 'ARTILLERY_HIT') {
        div.innerHTML = `<b>${log.ownerTag} [${log.unitIcon}] ${log.unitName}</b> caught in artillery blast for <span style="color:#f87171; font-weight:bold;">${log.damage} splash damage</span> ${log.died ? '<b style="color:#f87171;">(ELIMINATED)</b>' : ''}`;
      } else if (log.type === 'COMBAT') {
        const attackerOwnerTag = log.attackerOwner === 1 ? 'P1' : 'AI';
        const defenderOwnerTag = log.defenderOwner === 1 ? 'P1' : 'AI';

        if (log.defenderDied) {
          div.innerHTML = `
            <b>${attackerOwnerTag} ${log.attackerName}</b> <span style="color:#f87171; font-weight:bold;">DESTROYED</span> <b>${defenderOwnerTag} ${log.defenderName}</b>
            ${log.counterNote ? `<br><small style="color:#f87171; font-weight:bold;">(${log.counterNote} | UNIT ELIMINATED)</small>` : '<br><small style="color:#f87171;">(UNIT ELIMINATED)</small>'}
          `;
        } else {
          div.innerHTML = `
            <b>${attackerOwnerTag} ${log.attackerName}</b> struck <b>${defenderOwnerTag} ${log.defenderName}</b> for <span style="color:#f87171; font-weight:bold;">${log.damageDealt} damage</span>
            <br><small style="color:#60a5fa;">[Target HP: ${log.defenderHpRemaining}/${log.defenderMaxHp}] ${log.counterNote ? '| ' + log.counterNote : ''}</small>
          `;
        }
      } else if (log.type === 'CAPTURE') {
        div.innerHTML = `<b>${log.playerName} [${log.unitIcon}] ${log.unitName}</b> <span style="color:#4ade80; font-weight:bold;">CAPTURED</span> Supply Zone at (${log.x}, ${log.y})`;
      }

      this.actionLogBox.appendChild(div);
    });

    this.actionLogBox.scrollTop = this.actionLogBox.scrollHeight;
  }
}

window.switchMenuTab = function(btnId, paneId) {
  const tabs = [
    { btn: 'tab-btn-play', pane: 'tab-pane-play' },
    { btn: 'tab-btn-factions', pane: 'tab-pane-factions' },
    { btn: 'tab-btn-codex', pane: 'tab-pane-codex' },
    { btn: 'tab-btn-settings', pane: 'tab-pane-settings' }
  ];
  tabs.forEach(t => {
    const b = document.getElementById(t.btn);
    const p = document.getElementById(t.pane);
    if (b) b.classList.remove('active');
    if (p) p.style.display = 'none';
  });
  const activeBtn = document.getElementById(btnId);
  const activePane = document.getElementById(paneId);
  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.style.display = 'flex';
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.deployGameFromMenu = function() {
  const menu = document.getElementById('main-menu-overlay');
  const gameContainer = document.getElementById('game-container');
  if (menu) menu.style.display = 'none';
  if (gameContainer) gameContainer.classList.remove('game-blurred');
  if (window.gApp) window.gApp.launchMatchFromMenu();
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.enterTerrainView = function() {
  // Hide victory modal
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
  // Show terrain view banner
  const banner = document.getElementById('terrain-view-banner');
  if (banner) banner.style.display = 'block';
  // Mark terrain view active on engine (renderer will skip fog)
  if (window.gApp && window.gApp.engine) {
    window.gApp.engine.phase = 'GAME_OVER'; // already is, but ensure
  }
  // Disable all game action buttons
  ['btn-end-turn', 'btn-halt-all', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = true; el.style.opacity = '0.4'; }
  });
};

window.returnToMainMenu = function() {
  // Hide terrain banner and victory modal
  const banner = document.getElementById('terrain-view-banner');
  if (banner) banner.style.display = 'none';
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
  // Re-enable buttons in case user returns mid-view
  ['btn-end-turn', 'btn-halt-all', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = false; el.style.opacity = ''; }
  });
  // Show main menu
  const menu = document.getElementById('main-menu-overlay');
  if (menu) menu.style.display = 'flex';
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

class App {
  constructor() {
    window.gApp = this;
    this.canvas = document.getElementById('sketch-canvas');
    this.renderer = new SketchRenderer(this.canvas);
    this.audio = new AudioEngine();
    this.engine = null;
    this.ui = new UIManager(this);

    this.setupCanvasInteractions();
    this.startRenderLoop();
    this.launchMatchFromMenu(); // Pre-initialize match state in background
  }

  launchMatchFromMenu() {
    try {
      if (this.engine) this.engine.pauseTimer();

      const mapVal = document.getElementById('select-map')?.value || 'PRESET_1';
      const gameMode = document.getElementById('select-game-mode')?.value || 'SINGLE_PLAYER';
      const isTutorial = gameMode === 'PRACTICE_TUTORIAL';
      const p1FactionKey = document.getElementById('select-p1-faction')?.value || 'IRON_CORPS';
      const aiDiff = isTutorial ? 'RECRUIT' : (document.getElementById('select-ai-difficulty')?.value || window.gAiDifficulty || 'VETERAN');
      const aiPersonality = document.getElementById('select-ai-personality')?.value || 'TACTICUS';
      const timerDuration = parseInt(document.getElementById('select-timer-duration')?.value || '20', 10);
      const playbackDuration = parseInt(document.getElementById('select-playback-duration')?.value || '3', 10);

      const p2FactionKey = p1FactionKey === 'IRON_CORPS' ? 'VANGUARD_LEGION' : 'IRON_CORPS';

      this.engine = new GameEngine({
        mapType: mapVal,
        p1Faction: FACTIONS[p1FactionKey],
        p2Faction: FACTIONS[p2FactionKey],
        isSinglePlayer: (gameMode === 'SINGLE_PLAYER' || isTutorial),
        isTutorialMode: isTutorial,
        aiDifficulty: aiDiff,
        aiPersonality: aiPersonality,
        playbackDuration: playbackDuration,
        audio: this.audio
      });

      this.engine.isTutorialMode = isTutorial;
      this.engine.planningTimeRemaining = timerDuration;
      this.engine.subscribe(() => {
        if (this.engine.isSinglePlayer && this.engine.phase === 'PLAYBACK' && this.engine.playbackTimeRemaining === this.engine.playbackDurationConfig) {
          CommanderAI.processTurn(this.engine, this.engine.aiDifficulty, this.engine.aiPersonality);
        }
        if (this.ui) this.ui.updateHUD(this.engine);
      });

      this.engine.startTurnTimer();
      this.renderer.selectedTile = null;

      // Reset terrain-view banner and any leftover game-over state
      const terrainBanner = document.getElementById('terrain-view-banner');
      if (terrainBanner) terrainBanner.style.display = 'none';
      const victoryModal = document.getElementById('victory-modal');
      if (victoryModal) victoryModal.style.display = 'none';
      // Remove blur/lock from the whole game container
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.classList.remove('game-blurred');
        gameContainer.style.pointerEvents = '';
        gameContainer.style.filter = '';
      }
      // Re-enable every action button that may have been locked
      ['btn-end-turn', 'btn-halt-all', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.style.opacity = ''; el.style.pointerEvents = ''; }
      });

      this.ui.updateHUD(this.engine);
    } catch (err) {
      console.error('Error starting game:', err);
    }
  }

  setupCanvasInteractions() {
    this.canvas.addEventListener('click', (e) => {
      if (!this.engine) return;
      const rect = this.canvas.getBoundingClientRect();
      const gridCoords = this.renderer.getGridCoords(e.clientX - rect.left, e.clientY - rect.top);
      if (!gridCoords) return;

      try { this.audio.playPencilScratch(); } catch(err){}

      // In GAME_OVER terrain view: only allow tile selection for unit inspection
      if (this.engine.phase === 'GAME_OVER') {
        this.renderer.selectedTile = gridCoords;
        this.ui.renderInspector(this.engine);
        return;
      }

      if (this.engine.phase === 'PLANNING' && this.ui.pendingAbilityKey) {
        const abilityKey = this.ui.pendingAbilityKey;
        const ability = ABILITIES[abilityKey];
        const res = this.engine.useAbility(1, abilityKey, gridCoords.x, gridCoords.y);
        if (res.success) {
          try {
            if (abilityKey === 'RECON_FLARE') this.audio.playFlareSound();
            else if (abilityKey === 'SMOKE_SCREEN') this.audio.playSmokeSound();
            else if (abilityKey === 'ARTILLERY_STRIKE') this.audio.playExplosion(true);
            else this.audio.playSpawnSound();
          } catch(err){}
          this.ui.showToast('Ability Deployed', `${ability.name} targeted at (${gridCoords.x}, ${gridCoords.y})!`);
          this.ui.pendingAbilityKey = null;
        } else {
          this.ui.showToast('Ability Error', res.reason);
        }
        this.renderer.selectedTile = gridCoords;
        this.ui.updateHUD(this.engine);
        return;
      }

      const prevSelected = this.renderer.selectedTile;
      this.renderer.selectedTile = gridCoords;

      if (this.engine.phase === 'PLANNING' && prevSelected) {
        const unit = this.engine.getAllUnits().find(u => u.x === prevSelected.x && u.y === prevSelected.y && u.owner === 1);
        if (unit) {
          // Pathfind FROM the unit's last queued waypoint position,
          // so long multi-click chains extend naturally.
          let fromX = unit.x, fromY = unit.y;
          if (unit.waypoints && unit.waypoints.length > 0) {
            const last = unit.waypoints[unit.waypoints.length - 1];
            fromX = last.x;
            fromY = last.y;
          }
          if (fromX !== gridCoords.x || fromY !== gridCoords.y) {
            const extension = this.engine.findValidPath(unit, gridCoords.x, gridCoords.y, fromX, fromY);
            if (extension.length > 0) {
              // Append to existing waypoints (multi-leg journey)
              const combined = [...(unit.waypoints || []), ...extension];
              this.engine.setUnitWaypoints(unit.id, combined);
            }
          }
        }
      }
      this.ui.updateHUD(this.engine);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.renderer.hoveredTile = this.renderer.getGridCoords(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  startRenderLoop() {
    const loop = () => {
      if (this.engine) this.renderer.render(this.engine);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.openAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
};

window.switchAuthTab = function(tabName) {
  const btnSignIn = document.getElementById('auth-tab-signin');
  const btnSignUp = document.getElementById('auth-tab-signup');
  const formSignIn = document.getElementById('auth-form-signin');
  const formSignUp = document.getElementById('auth-form-signup');

  if (tabName === 'signin') {
    btnSignIn?.classList.add('active');
    btnSignUp?.classList.remove('active');
    if (formSignIn) formSignIn.style.display = 'flex';
    if (formSignUp) formSignUp.style.display = 'none';
  } else {
    btnSignUp?.classList.add('active');
    btnSignIn?.classList.remove('active');
    if (formSignUp) formSignUp.style.display = 'flex';
    if (formSignIn) formSignIn.style.display = 'none';
  }
};

window.handleSignInSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById('auth-signin-email')?.value;
  const pass = document.getElementById('auth-signin-pass')?.value;
  if (!email || !pass) return;

  if (window.gAuthManager) {
    const res = await window.gAuthManager.login(email, pass);
    if (res.success) {
      window.closeAuthModal();
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Auth Success', 'Signed in as Commander!');
    } else {
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Auth Error', res.error);
    }
  }
};

window.handleForgotPassword = async function() {
  const emailInput = document.getElementById('auth-signin-email');
  const email = emailInput?.value?.trim();
  
  if (!email) {
    if (window.gApp && window.gApp.ui) {
      window.gApp.ui.showToast('Email Required', 'Please type your registered email address in the Email field first.');
    }
    emailInput?.focus();
    return;
  }

  if (window.gAuthManager) {
    const res = await window.gAuthManager.resetPassword(email);
    if (res.success) {
      if (window.gApp && window.gApp.ui) {
        window.gApp.ui.showToast('Reset Link Sent', res.message);
      }
    } else {
      if (window.gApp && window.gApp.ui) {
        window.gApp.ui.showToast('Reset Error', res.error);
      }
    }
  }
};

window.handleSignUpSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('auth-signup-name')?.value;
  const email = document.getElementById('auth-signup-email')?.value;
  const pass = document.getElementById('auth-signup-pass')?.value;
  if (!email || !pass) return;

  if (window.gAuthManager) {
    const res = await window.gAuthManager.register(email, pass, name);
    if (res.success) {
      window.closeAuthModal();
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Account Created', 'Commander enlisted successfully!');
    } else {
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Registration Error', res.error);
    }
  }
};

window.gAiDifficulty = localStorage.getItem('sketch_warfare_ai_difficulty') || 'VETERAN';

window.setAiDifficulty = function(diff) {
  window.gAiDifficulty = diff;
  localStorage.setItem('sketch_warfare_ai_difficulty', diff);
  const selectPlay = document.getElementById('select-ai-difficulty');
  const selectSetting = document.getElementById('setting-ai-difficulty');
  if (selectPlay) selectPlay.value = diff;
  if (selectSetting) selectSetting.value = diff;
};

window.handleGoogleSignIn = async function() {
  if (window.gAuthManager) {
    const res = await window.gAuthManager.loginWithGoogle();
    if (res.success) {
      window.closeAuthModal();
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Google Auth Success', 'Signed in with Google!');
    } else {
      if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Google Auth Error', res.error);
    }
  }
};

window.logoutCommander = async function() {
  if (window.gAuthManager) {
    await window.gAuthManager.logout();
    if (window.gApp && window.gApp.ui) window.gApp.ui.showToast('Signed Out', 'Returned to Guest Mode.');
  }
};

// Global Auth UI Synchronizer
if (window.gAuthManager) {
  window.gAuthManager.subscribe((authData) => {
    const p = authData.profile || {};
    const nameStr = p.displayName || 'Commander Guest';
    const isGuest = authData.isGuest;

    // Header HUD Name
    const hudName = document.getElementById('hud-user-name');
    if (hudName) hudName.textContent = isGuest ? 'Guest' : nameStr;

    // Menu Account Card - basic stats
    const menuName = document.getElementById('menu-account-name');
    const menuRank = document.getElementById('menu-account-rank');
    const menuAvatar = document.getElementById('menu-account-avatar');
    const statMatches = document.getElementById('menu-stat-matches');
    const statWins = document.getElementById('menu-stat-wins');
    const statLosses = document.getElementById('menu-stat-losses');
    const statWinrate = document.getElementById('menu-stat-winrate');
    const btnOpenAuth = document.getElementById('btn-menu-open-auth');
    const btnLogout = document.getElementById('btn-menu-logout');

    if (menuName) menuName.textContent = nameStr;
    if (menuRank) menuRank.textContent = `Rank: ${p.rank || 'Recruit'}`;
    if (menuAvatar) menuAvatar.textContent = (nameStr[0] || 'C').toUpperCase();
    if (statMatches) statMatches.textContent = p.totalMatches || 0;
    if (statWins) statWins.textContent = p.wins || 0;
    if (statLosses) statLosses.textContent = p.losses || 0;
    if (statWinrate) statWinrate.textContent = p.winRate || '0%';

    if (btnOpenAuth) btnOpenAuth.style.display = isGuest ? 'inline-flex' : 'none';
    if (btnLogout) btnLogout.style.display = isGuest ? 'none' : 'inline-flex';

    // Rank Progress Bar
    const rp = p.rankProgress;
    const progressSection = document.getElementById('rank-progress-section');
    const progressLabel = document.getElementById('rank-progress-label');
    const progressPct = document.getElementById('rank-progress-pct');
    const progressBar = document.getElementById('rank-progress-bar');
    const reqGames = document.getElementById('rank-req-games');
    const reqWr = document.getElementById('rank-req-wr');

    if (progressSection) {
      if (!rp || isGuest) {
        progressSection.style.display = 'none';
      } else if (rp.atMax) {
        progressSection.style.display = 'block';
        if (progressLabel) progressLabel.textContent = 'Maximum Rank Achieved';
        if (progressPct) progressPct.textContent = '100%';
        if (progressBar) progressBar.style.width = '100%';
        if (reqGames) reqGames.textContent = 'You have reached General';
        if (reqWr) reqWr.textContent = '';
      } else {
        progressSection.style.display = 'block';
        if (progressLabel) progressLabel.textContent = `Progress to ${rp.nextRank}`;
        if (progressPct) progressPct.textContent = `${rp.overallProgress}%`;
        if (progressBar) progressBar.style.width = `${rp.overallProgress}%`;
        if (reqGames) reqGames.textContent = rp.gamesNeeded > 0
          ? `${rp.gamesNeeded} more game${rp.gamesNeeded !== 1 ? 's' : ''} needed`
          : 'Games: Ready';
        if (reqWr) reqWr.textContent = rp.winsNeeded > 0
          ? `${rp.winsNeeded} more win${rp.winsNeeded !== 1 ? 's' : ''} needed`
          : 'Wins: Ready';
      }
    }
  });
}

window.toggleAudioMute = function() {
  if (window.gApp && window.gApp.audio) {
    const isMuted = window.gApp.audio.toggleMute();
    const hudBtn = document.getElementById('btn-hud-audio');
    const settingsBtn = document.getElementById('btn-toggle-sound');
    if (hudBtn) hudBtn.textContent = isMuted ? 'Muted' : 'SFX';
    if (settingsBtn) settingsBtn.textContent = isMuted ? 'SFX Muted' : 'SFX Enabled';
  }
};

window.updateMasterVolume = function(val) {
  if (window.gApp && window.gApp.audio) {
    window.gApp.audio.setMasterVolume(val / 100);
  }
};

window.updateSFXVolume = function(val) {
  if (window.gApp && window.gApp.audio) {
    window.gApp.audio.setSFXVolume(val / 100);
  }
};

window.openCheatSheetModal = function() {
  const modal = document.getElementById('cheatsheet-modal');
  if (modal) modal.style.display = 'flex';
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.closeCheatSheetModal = function() {
  const modal = document.getElementById('cheatsheet-modal');
  if (modal) modal.style.display = 'none';
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.toggleMapLegend = function() {
  const content = document.getElementById('map-legend-content');
  const arrow = document.getElementById('legend-toggle-arrow');
  if (!content) return;
  const isHidden = content.classList.contains('legend-hidden');
  if (isHidden) {
    content.classList.remove('legend-hidden');
    content.classList.add('legend-expanded');
    if (arrow) arrow.textContent = '▾';
  } else {
    content.classList.remove('legend-expanded');
    content.classList.add('legend-hidden');
    if (arrow) arrow.textContent = '▸';
  }
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.switchCodexSubtab = function(subtabKey, btnEl) {
  const subpanes = ['quickstart', 'rules', 'matrix'];
  subpanes.forEach(key => {
    const pane = document.getElementById(`codex-subpane-${key}`);
    if (pane) pane.style.display = key === subtabKey ? 'block' : 'none';
  });
  const btns = document.querySelectorAll('.codex-subtab-bar .subtab-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

// ==========================================
// CLOUDFLARE D1 & ADMIN PORTAL INTEGRATION
// ==========================================
const d1Service = {
  storageKey: 'sketch_user_profile_v1',
  adminTokenKey: 'sketch_admin_token_v1',
  user: null,

  loadOrCreateLocalUser() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.user = JSON.parse(saved);
        return this.user;
      }
    } catch(e){}

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      username: 'Commander ' + Math.floor(100 + Math.random() * 900),
      email: '',
      master_volume: 80,
      sfx_volume: 100,
      audio_muted: false,
      planning_duration: 20,
      playback_speed: 3,
      wins: 0,
      losses: 0,
      is_banned: false
    };

    this.saveLocalUser(newUser);
    return newUser;
  },

  saveLocalUser(userObj) {
    this.user = { ...this.user, ...userObj };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.user));
    } catch(e){}
  },

  async syncSettings(updates = {}) {
    if (!this.user) this.loadOrCreateLocalUser();
    this.saveLocalUser(updates);

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.user)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser({
            ...data.user,
            audio_muted: Boolean(data.user.audio_muted),
            is_banned: Boolean(data.user.is_banned)
          });
        }
        return { success: true, user: this.user };
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.is_banned) {
          this.user.is_banned = true;
          this.saveLocalUser(this.user);
          return { success: false, is_banned: true };
        }
      }
    } catch(err) {
      console.log("Offline mode or sync error:", err.message);
    }
    return { success: true, offline: true, user: this.user };
  },

  async loginAdmin(passcode) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid passcode');
    }

    sessionStorage.setItem(this.adminTokenKey, passcode);
    return await res.json();
  },

  getAdminAuthHeader() {
    const passcode = sessionStorage.getItem(this.adminTokenKey) || "meraj7782";
    return {
      'Authorization': `Bearer ${passcode}`,
      'Content-Type': 'application/json'
    };
  },

  async fetchAllUsers() {
    const res = await fetch('/api/admin/users', {
      headers: this.getAdminAuthHeader()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }

    const data = await res.json();
    return data.users || [];
  },

  async updateUser(id, updates) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeader(),
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }

    return await res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeader()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }

    return await res.json();
  }
};

window.d1Service = d1Service;
window.gAllAdminUsers = [];

window.updateUsername = function(val) {
  d1Service.syncSettings({ username: val });
};

window.updatePlanningDuration = function(val) {
  d1Service.syncSettings({ planning_duration: Number(val) });
};

window.updatePlaybackSpeed = function(val) {
  d1Service.syncSettings({ playback_speed: Number(val) });
};

window.openAdminAuthModal = function() {
  const modal = document.getElementById('admin-auth-modal');
  if (modal) {
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    const input = document.getElementById('input-admin-passcode');
    if (input) {
      input.value = '';
      input.focus();
    }
    const err = document.getElementById('admin-auth-error');
    if (err) err.style.display = 'none';
  }
};

window.closeAdminAuthModal = function() {
  const modal = document.getElementById('admin-auth-modal');
  if (modal) modal.style.display = 'none';
};

window.submitAdminAuth = async function() {
  const passcode = document.getElementById('input-admin-passcode').value.trim();
  const errDiv = document.getElementById('admin-auth-error');
  try {
    await d1Service.loginAdmin(passcode);
    window.closeAdminAuthModal();
    window.openAdminPanel();
  } catch (err) {
    if (errDiv) {
      errDiv.textContent = err.message || "Invalid Admin Passcode";
      errDiv.style.display = 'block';
    }
  }
};

window.openAdminPanel = function() {
  const overlay = document.getElementById('admin-panel-overlay');
  if (overlay) {
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    window.refreshAdminUserTable();
    window.fetchAdminDashboardStats();
  }
};

window.closeAdminPanel = function() {
  const overlay = document.getElementById('admin-panel-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.fetchAdminDashboardStats = async function() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: d1Service.getAdminAuthHeader()
    });
    if (res.ok) {
      const stats = await res.json();
      const elTotal = document.getElementById('admin-stat-total-users');
      const el24h = document.getElementById('admin-stat-active-24h');
      const elOnline = document.getElementById('admin-stat-online-now');
      const elMatches = document.getElementById('admin-stat-total-matches');

      if (elTotal) elTotal.textContent = stats.total_users || 0;
      if (el24h) el24h.textContent = stats.active_24h || 0;
      if (elOnline) elOnline.textContent = stats.online_now || 0;
      if (elMatches) elMatches.textContent = stats.total_matches || 0;
    }
  } catch(e){}
};

window.broadcastAdminAnnouncement = async function() {
  const input = document.getElementById('input-broadcast-message');
  const msg = input ? input.value.trim() : '';
  if (!msg) { alert("Please type an announcement message."); return; }

  try {
    const res = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: d1Service.getAdminAuthHeader(),
      body: JSON.stringify({ message: msg, active: true })
    });
    if (res.ok) {
      alert("System Announcement Banner Broadcasted!");
      if (input) input.value = '';
      window.fetchPublicAnnouncement();
    } else {
      const err = await res.json();
      alert("Broadcast Error: " + (err.error || 'Failed to broadcast'));
    }
  } catch(e) {
    alert("Broadcast Error: " + e.message);
  }
};

window.clearAdminAnnouncement = async function() {
  try {
    const res = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: d1Service.getAdminAuthHeader(),
      body: JSON.stringify({ message: '', active: false })
    });
    if (res.ok) {
      alert("System Announcement Banner Cleared!");
      window.fetchPublicAnnouncement();
    }
  } catch(e){}
};

window.fetchPublicAnnouncement = async function() {
  try {
    const res = await fetch('/api/announcement');
    if (res.ok) {
      const data = await res.json();
      const banner = document.getElementById('system-announcement-banner');
      const text = document.getElementById('announcement-banner-text');
      if (data.announcement && data.announcement.message) {
        if (text) text.textContent = data.announcement.message;
        if (banner) banner.style.display = 'flex';
      } else {
        if (banner) banner.style.display = 'none';
      }
    }
  } catch(e){}
};

window.refreshAdminUserTable = async function() {
  const tbody = document.getElementById('admin-user-table-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Fetching users from Cloudflare D1...</td></tr>';
  try {
    window.gAllAdminUsers = await d1Service.fetchAllUsers();
    window.renderAdminUserTable(window.gAllAdminUsers);
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 20px;">Error: ${err.message}</td></tr>`;
  }
};

window.filterAdminUserTable = function(query) {
  const q = query.toLowerCase();
  const filtered = (window.gAllAdminUsers || []).filter(u => 
    (u.username && u.username.toLowerCase().includes(q)) || 
    (u.email && u.email.toLowerCase().includes(q)) || 
    (u.id && u.id.toLowerCase().includes(q))
  );
  window.renderAdminUserTable(filtered);
};

window.formatTimeAgo = function(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return dateStr;
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch(e) {
    return dateStr;
  }
};

window.renderAdminUserTable = function(users) {
  const tbody = document.getElementById('admin-user-table-body');
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No user records found in Cloudflare D1.</td></tr>';
    return;
  }

  let html = '';
  users.forEach(u => {
    const isBanned = Boolean(u.is_banned);
    const statusBadge = isBanned 
      ? `<span class="admin-badge-status banned">Banned</span>`
      : `<span class="admin-badge-status active">Active</span>`;
    const lastOnlineStr = window.formatTimeAgo(u.last_online || u.updated_at);

    html += `
      <tr>
        <td>
          <b>${u.username || 'Commander'}</b>
          ${u.email ? `<br><small style="color:var(--text-muted); font-size:0.75rem;">${u.email}</small>` : ''}
        </td>
        <td><code style="font-size:0.75rem;">${u.id}</code></td>
        <td>${u.master_volume}% / ${u.sfx_volume}%</td>
        <td>${u.planning_duration}s / ${u.playback_speed}s</td>
        <td><span style="color:#34d399; font-weight:600;">${u.wins}W</span> - <span style="color:#f87171; font-weight:600;">${u.losses}L</span></td>
        <td><span style="font-size:0.8rem; color:var(--text-secondary);">${lastOnlineStr}</span></td>
        <td>${statusBadge}</td>
        <td>
          <div class="admin-action-btns">
            <button class="btn-sketch btn-xs" onclick="window.openAdminEditModal('${u.id}')">Edit</button>
            <button class="btn-sketch btn-xs" onclick="window.toggleBanAdminUser('${u.id}', ${isBanned})">${isBanned ? 'Unban' : 'Ban'}</button>
            <button class="btn-sketch btn-xs" style="color:#f87171; border-color:#f87171;" onclick="window.deleteAdminUser('${u.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};

window.openAdminEditModal = function(id) {
  const user = (window.gAllAdminUsers || []).find(u => u.id === id);
  if (!user) return;

  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-user-username').value = user.username || '';
  const emailInput = document.getElementById('edit-user-email');
  if (emailInput) emailInput.value = user.email || '';
  document.getElementById('edit-user-master-vol').value = user.master_volume;
  document.getElementById('edit-user-sfx-vol').value = user.sfx_volume;
  document.getElementById('edit-user-planning').value = user.planning_duration;
  document.getElementById('edit-user-speed').value = user.playback_speed;
  document.getElementById('edit-user-wins').value = user.wins;
  document.getElementById('edit-user-losses').value = user.losses;
  document.getElementById('edit-user-banned').value = String(Boolean(user.is_banned));

  const modal = document.getElementById('admin-edit-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeAdminEditModal = function() {
  const modal = document.getElementById('admin-edit-modal');
  if (modal) modal.style.display = 'none';
};

window.saveAdminUserEdit = async function() {
  const id = document.getElementById('edit-user-id').value;
  const emailInput = document.getElementById('edit-user-email');
  const updates = {
    username: document.getElementById('edit-user-username').value.trim(),
    email: emailInput ? emailInput.value.trim() : '',
    master_volume: Number(document.getElementById('edit-user-master-vol').value),
    sfx_volume: Number(document.getElementById('edit-user-sfx-vol').value),
    planning_duration: Number(document.getElementById('edit-user-planning').value),
    playback_speed: Number(document.getElementById('edit-user-speed').value),
    wins: Number(document.getElementById('edit-user-wins').value),
    losses: Number(document.getElementById('edit-user-losses').value),
    is_banned: document.getElementById('edit-user-banned').value === 'true'
  };

  try {
    await d1Service.updateUser(id, updates);
    window.closeAdminEditModal();
    window.refreshAdminUserTable();
  } catch (err) {
    alert("Failed to update user: " + err.message);
  }
};

window.toggleBanAdminUser = async function(id, currentBanned) {
  try {
    await d1Service.updateUser(id, { is_banned: !currentBanned });
    window.refreshAdminUserTable();
  } catch (err) {
    alert("Failed to toggle suspension: " + err.message);
  }
};

window.deleteAdminUser = async function(id) {
  if (!confirm(`Are you sure you want to permanently delete user record ${id}?`)) return;
  try {
    await d1Service.deleteUser(id);
    window.refreshAdminUserTable();
  } catch (err) {
    alert("Failed to delete user: " + err.message);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  new App();

  window.fetchPublicAnnouncement();

  // 1. Initial Settings & Profile Sync
  const authProf = (window.gAuth && window.gAuth.profile) ? window.gAuth.profile : null;
  const initialUpdates = {};
  if (authProf) {
    if (window.gAuth.user && window.gAuth.user.uid) initialUpdates.id = window.gAuth.user.uid;
    if (authProf.displayName) initialUpdates.username = authProf.displayName;
    if (authProf.email) initialUpdates.email = authProf.email;
    if (typeof authProf.wins === 'number') initialUpdates.wins = authProf.wins;
    if (typeof authProf.losses === 'number') initialUpdates.losses = authProf.losses;
  }

  d1Service.syncSettings(initialUpdates).then(res => {
    const user = d1Service.user;
    const usernameInput = document.getElementById('input-username');
    if (usernameInput) usernameInput.value = user.username || '';

    const masterSlider = document.getElementById('slider-master-vol');
    if (masterSlider) masterSlider.value = user.master_volume;
    if (window.gApp && window.gApp.audio) window.gApp.audio.setMasterVolume(user.master_volume / 100);

    const sfxSlider = document.getElementById('slider-sfx-vol');
    if (sfxSlider) sfxSlider.value = user.sfx_volume;
    if (window.gApp && window.gApp.audio) window.gApp.audio.setSFXVolume(user.sfx_volume / 100);

    const timerSelect = document.getElementById('select-timer-duration');
    if (timerSelect) timerSelect.value = user.planning_duration;

    const speedSelect = document.getElementById('select-playback-duration');
    if (speedSelect) speedSelect.value = user.playback_speed;

    const badge = document.getElementById('d1-sync-badge');
    if (badge) {
      if (res && res.offline) {
        badge.innerHTML = "Local Mode";
        badge.classList.add("offline");
      } else {
        badge.innerHTML = "Synced to D1";
        badge.classList.remove("offline");
      }
    }
  });

  // Universal Robust Admin Hotkey Listener (Capturing Mode)
  const triggerAdmin = (e) => {
    const isKeyA = e.code === 'KeyA' || e.key === 'A' || e.key === 'a' || e.keyCode === 65;
    if (isKeyA && (e.altKey || e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openAdminAuthModal === 'function') {
        window.openAdminAuthModal();
      } else {
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
          modal.style.zIndex = '99999';
          modal.style.display = 'flex';
          const input = document.getElementById('input-admin-passcode');
          if (input) { input.value = ''; input.focus(); }
        }
      }
    }
  };

  window.addEventListener('keydown', triggerAdmin, true);
  document.addEventListener('keydown', triggerAdmin, true);
});

