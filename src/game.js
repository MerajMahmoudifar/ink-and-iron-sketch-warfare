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
  SWAMP: { id: 'SWAMP', name: 'Mud / Swamp / Pond', symbol: 'S', isVehiclePassable: false, isInfantryPassable: true, moveCostInfantry: 2.0, moveCostVehicle: 99, defenseBonus: -0.10, trait: 'MIRES_INFANTRY_1_TURN', sketchPattern: 'reeds' },
  MOUNTAIN: { id: 'MOUNTAIN', name: 'Mountain', symbol: 'M', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'peaks' },
  WATER: { id: 'WATER', name: 'Water', symbol: 'W', isVehiclePassable: false, isInfantryPassable: false, moveCostInfantry: 99, moveCostVehicle: 99, defenseBonus: 0, sketchPattern: 'waves' },
  CAPTURE_ZONE: { id: 'CAPTURE_ZONE', name: 'Supply Zone', symbol: 'Z', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.0, moveCostVehicle: 1.0, defenseBonus: 0.15, inkPerTurn: 25, sketchPattern: 'flag' },
  MAIN_BASE: { id: 'MAIN_BASE', name: 'Main Base', symbol: 'B', isVehiclePassable: true, isInfantryPassable: true, moveCostInfantry: 1.0, moveCostVehicle: 1.0, defenseBonus: 0.25, inkPerTurn: 50, sketchPattern: 'fortress' }
};

// Military Grid Coordinate Formatter: maps column index 0..7 to A..H, and row index 0..7 to 1..8
function formatCoord(x, y) {
  if (x === undefined || y === undefined || x === null || y === null) return '';
  const col = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][x] !== undefined ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][x] : String(x);
  const row = (typeof y === 'number') ? (y + 1) : y;
  return `(${col}, ${row})`;
}
if (typeof window !== 'undefined') {
  window.formatCoord = formatCoord;
}

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
    description: 'Fast, high vision range, ideal for capturing distant zones quickly. Mired for 1 turn upon entering mud, swamps, or ponds.',
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
    description: 'Balanced frontline troop. Strong against AT crews. Mired for 1 turn upon entering mud, swamps, or ponds.',
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
    description: 'Essential anti-armor crew. 2.5x penetration vs tanks. Mired for 1 turn upon entering mud, swamps, or ponds.',
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
    description: 'Fast armored vehicle. Obliterates infantry. Completely impassable to mud, swamps, ponds & deep water.',
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
    description: 'Iron Corps Exclusive. Massive armored beast with crushing firepower. Impassable to mud, swamps, ponds & water.',
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
    description: 'Vanguard Exclusive. Rapid hit-and-run raider with extreme mobility. Impassable to mud, swamps, ponds & water.',
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
    if (mapType.startsWith('BOOTCAMP_')) {
      const lessonNum = parseInt(mapType.replace('BOOTCAMP_', ''), 10) || 1;
      return this.loadBootcampMap(lessonNum);
    } else if (mapType === 'PROCEDURAL') {
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

  static loadBootcampMap(lessonId) {
    let layout, p1Base, p2Base;
    switch (lessonId) {
      case 1:
        // Lesson 1: The WEGO Clock — Straight corridor to flag
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', 'B1', '.', 'Z', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 1, y: 3 };
        p2Base = { x: 7, y: 7 };
        break;

      case 2:
        // Lesson 2: Cover & Ambush Stance — Central forest corridor
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', 'F', 'F', '.', '.', '.', '.'],
          ['.', '.', 'F', 'F', '.', '.', '.', '.'],
          ['B1', '.', 'F', 'F', '.', '.', '.', '.'],
          ['.', '.', 'F', 'F', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 0, y: 3 };
        p2Base = { x: 7, y: 7 };
        break;

      case 3:
        // Lesson 3: Supply Depots & Recruiting
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', 'B1', '.', '.', 'Z', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 1, y: 3 };
        p2Base = { x: 7, y: 7 };
        break;

      case 4:
        // Lesson 4: The Counter Triangle — 3 distinct lanes
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', 'B1', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 1, y: 1 };
        p2Base = { x: 7, y: 7 };
        break;

      case 5:
        // Lesson 5: Bog Shortcut & Chokepoint Race
        // Symmetrical battlefield: Mountain wall down col 3 (Forest pass at D4 (3,3))
        // Mud wetlands at cols 1-2 (B-C) and cols 5-6 (F-G) including rows 0-4 (F1, F2, G1, G2, etc.)
        // Southern bypass at rows 5-7
        layout = [
          ['.',  'S',  'S',  'M',  '.',  'S',  'S',  '.'],
          ['.',  'S',  'S',  'M',  '.',  'S',  'S',  '.'],
          ['.',  'S',  'S',  'M',  '.',  'S',  'S',  '.'],
          ['B1', 'S',  'S',  'F',  '.',  'S',  'S',  'B2'],
          ['.',  'S',  'S',  'M',  '.',  'S',  'S',  '.'],
          ['.',  '.',  '.',  'M',  '.',  '.',  '.',  '.'],
          ['.',  '.',  '.',  'M',  '.',  '.',  '.',  '.'],
          ['.',  '.',  '.',  'M',  '.',  '.',  '.',  '.']
        ];
        p1Base = { x: 0, y: 3 };
        p2Base = { x: 7, y: 3 };
        break;

      case 6:
        // Lesson 6: Command Abilities — Air & Firepower
        // Ridge and trees conceal enemy nest in Fog of War
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', 'B1', '.', '.', '.', '.', '.', '.'],
          ['.', '.', 'F', 'M', 'M', 'F', '.', '.'],
          ['.', '.', 'F', 'M', 'M', 'F', '.', '.'],
          ['.', '.', 'F', 'M', 'M', 'F', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 1, y: 1 };
        p2Base = { x: 7, y: 7 };
        break;

      case 7:
        // Lesson 7: Base Defense & Siege Mechanics — Liberation Protocol
        // Forward Depot Z is occupied/besieged by adjacent enemy raider
        layout = [
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', 'Z', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.']
        ];
        p1Base = { x: 0, y: 3 };
        p2Base = { x: 7, y: 7 };
        break;

      case 8:
      default:
        // Lesson 8: Grand Graduation Skirmish — Operation Diesel Storm
        // Rich 8x8 battlefield with Mud hazard, Forest cover, and 2 Depots
        layout = [
          ['B1', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', 'F', '.', '.', 'F', '.', '.'],
          ['.', '.', '.', 'Z', '.', '.', '.', '.'],
          ['.', 'F', 'S', 'S', '.', '.', 'F', '.'],
          ['.', '.', '.', 'S', 'S', 'Z', '.', '.'],
          ['.', '.', 'F', '.', '.', 'F', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', '.'],
          ['.', '.', '.', '.', '.', '.', '.', 'B2']
        ];
        p1Base = { x: 0, y: 0 };
        p2Base = { x: 7, y: 7 };
        break;
    }
    return this.parseLayout(layout, p1Base, p2Base);
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

  static isBlockedByMountain(x1, y1, x2, y2, grid) {
    if (!grid) return false;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if ((x === x1 && y === y1) || (x === x2 && y === y2)) continue;
        if (grid[y] && grid[y][x] && grid[y][x].id === 'MOUNTAIN') {
          return true;
        }
      }
    }
    return false;
  }

  static getForecast(attacker, defender, grid, factions) {
    if (!attacker || !defender || !attacker.isAlive() || !defender.isAlive()) return null;
    const attackerFaction = (factions && factions[attacker.owner]) ? factions[attacker.owner] : FACTIONS.IRON_CORPS;
    const defenderFaction = (factions && factions[defender.owner]) ? factions[defender.owner] : FACTIONS.VANGUARD_LEGION;
    const defenderTerrain = (grid && grid[defender.y] && grid[defender.y][defender.x]) ? grid[defender.y][defender.x] : { id: 'PLAINS', defenseBonus: 0 };

    let baseDamage = attacker.attack;
    let counterNote = '';

    if (attacker.typeKey === 'ANTI_TANK' && defender.category === 'VEHICLE') {
      baseDamage *= (attacker.vehicleBonus || 2.5);
      counterNote = 'AT Weapon: +150% vs Armor';
    } else if (attacker.typeKey === 'ARTILLERY' && defender.category === 'INFANTRY') {
      baseDamage *= (attacker.infantryBonus || 1.5);
      counterNote = 'HE Shells: +50% vs Infantry';
    } else if (attacker.typeKey === 'MACHINE_GUN' && defender.category === 'INFANTRY') {
      baseDamage *= 1.4;
      counterNote = 'Suppression: +40% vs Infantry';
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
    const minDmg = Math.round(Math.max(5, baseDamage * defenderDefenseMod * 0.9));
    const maxDmg = Math.round(Math.max(5, baseDamage * defenderDefenseMod * 1.1));
    const avgDmg = Math.round((minDmg + maxDmg) / 2);
    const armorMitigationPercent = Math.max(0, Math.round((1 - defenderDefenseMod) * 100));

    // Retaliation calculation (if defender has range to hit attacker)
    const dist = CombatSystem.getDistance(attacker, defender);
    const canRetaliate = dist <= defender.attackRange;
    let retMinDmg = 0;
    let retMaxDmg = 0;
    if (canRetaliate) {
      const attackerTerrain = (grid && grid[attacker.y] && grid[attacker.y][attacker.x]) ? grid[attacker.y][attacker.x] : { id: 'PLAINS', defenseBonus: 0 };
      let retBase = defender.attack;
      if (defender.typeKey === 'ANTI_TANK' && attacker.category === 'VEHICLE') retBase *= (defender.vehicleBonus || 2.5);
      if (defender.typeKey === 'ARTILLERY' && attacker.category === 'INFANTRY') retBase *= (defender.infantryBonus || 1.5);
      retBase *= defenderStanceObj.accuracy;
      const attDefenseMod = (1.0 - (attackerTerrain.defenseBonus || 0)) / attackerStanceObj.defense;
      retMinDmg = Math.round(Math.max(5, retBase * attDefenseMod * 0.9));
      retMaxDmg = Math.round(Math.max(5, retBase * attDefenseMod * 1.1));
    }

    return {
      attacker,
      defender,
      minDamage: minDmg,
      maxDamage: maxDmg,
      avgDamage: avgDmg,
      armorMitigationPercent,
      canRetaliate,
      retaliationMin: retMinDmg,
      retaliationMax: retMaxDmg,
      counterNote
    };
  }
}

// ==========================================
// 4. GAME ENGINE (WITH FOG OF WAR & ABILITIES)
// ==========================================
class GameEngine {
  constructor(config = {}) {
    this.mapType = config.mapType || 'PRESET_1';
    this.bootcampLesson = config.bootcampLesson || null;
    this.player1Faction = config.p1Faction || FACTIONS.IRON_CORPS;
    this.player2Faction = config.p2Faction || FACTIONS.VANGUARD_LEGION;
    this.isSinglePlayer = config.isSinglePlayer !== undefined ? config.isSinglePlayer : true;
    this.aiDifficulty = config.aiDifficulty || 'VETERAN';
    this.audio = config.audio || null;
    this.playbackDurationConfig = config.playbackDuration || 3;
    this.planningDurationConfig = config.planningDuration || 40;

    this.turnNumber = 1;
    this.phase = GAME_PHASES.PLANNING;
    this.planningTimeRemaining = this.bootcampLesson ? Infinity : this.planningDurationConfig;
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
    if (this.bootcampLesson) {
      if (this.bootcampLesson === 1) {
        const u = new Unit('RIFLEMAN', 1, 1, 3);
        this.players[1].units.push(u);
      } else if (this.bootcampLesson === 2) {
        const u1 = new Unit('RIFLEMAN', 1, 2, 3);
        u1.setStance(STANCES.AMBUSH.id);
        u1.isAmbusherHidden = true;
        const u2 = new Unit('SCOUT', 2, 5, 3);
        this.players[1].units.push(u1);
        this.players[2].units.push(u2);
      } else if (this.bootcampLesson === 3) {
        const u = new Unit('SCOUT', 1, 1, 3);
        this.players[1].units.push(u);
        this.players[1].ink = 25; // Enough for Rifle Squad
      } else if (this.bootcampLesson === 4) {
        const at1 = new Unit('ANTI_TANK', 1, 1, 1);
        const rf1 = new Unit('RIFLEMAN', 1, 1, 3);
        const lc1 = new Unit('LIGHT_VEHICLE', 1, 1, 5);
        this.players[1].units.push(at1, rf1, lc1);

        const ev1 = new Unit('LIGHT_VEHICLE', 2, 4, 1);
        const eat1 = new Unit('ANTI_TANK', 2, 4, 3);
        const erf1 = new Unit('RIFLEMAN', 2, 4, 5);
        this.players[2].units.push(ev1, eat1, erf1);
      } else if (this.bootcampLesson === 5) {
        // Lesson 5: Bog Shortcut & Chokepoint Race
        // Player: low-HP AT Crew at (1, 3) (HP 25: fragile, dies immediately if attacked in open!)
        const at = new Unit('ANTI_TANK', 1, 1, 3);
        at.hp = 25;
        this.players[1].units.push(at);
        this.players[1].ink = 0;

        // Enemy: Armored Car at (7, 3) (HP 150, Range 2 autocannon: punishes infantry in open terrain!)
        const ev = new Unit('LIGHT_VEHICLE', 2, 7, 3);
        ev.hp = 150;
        ev.maxHp = 150;
        ev.attackRange = 2;
        this.players[2].units.push(ev);
        this.players[2].ink = 0;
      } else if (this.bootcampLesson === 6) {
        // Lesson 6: Command Abilities (Air & Firepower)
        const rf = new Unit('RIFLEMAN', 1, 1, 3);
        this.players[1].units.push(rf);
        this.players[1].ink = 160;
        this.players[1].cp = 10; // Max CP for Flare + Artillery

        const erf = new Unit('RIFLEMAN', 2, 6, 3);
        erf.hp = 60;
        this.players[2].units.push(erf);
        this.players[2].ink = 0;
      } else if (this.bootcampLesson === 7) {
        // Lesson 7: Base Defense & Siege (Liberation Protocol)
        if (this.grid[3] && this.grid[3][3]) {
          this.grid[3][3].owner = 1;
        }
        const at = new Unit('ANTI_TANK', 1, 1, 3);
        this.players[1].units.push(at);
        this.players[1].ink = 60;

        const raider = new Unit('LIGHT_VEHICLE', 2, 4, 3);
        raider.hp = 40;
        this.players[2].units.push(raider);
        this.players[2].ink = 0;
      } else if (this.bootcampLesson === 8) {
        // Lesson 8: Grand Graduation Skirmish (Operation Diesel Storm)
        const u1 = new Unit('RIFLEMAN', 1, 1, 0);
        const u2 = new Unit('SCOUT', 1, 0, 1);
        const u3 = new Unit('RIFLEMAN', 2, 6, 7);
        const u4 = new Unit('SCOUT', 2, 7, 6);
        this.players[1].units.push(u1, u2);
        this.players[2].units.push(u3, u4);
        this.players[1].ink = 60;
        this.players[2].ink = 40;
        this.players[1].cp = 6;
        this.players[2].cp = 4;
      }
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
      CommanderAI.processTurn(this, this.aiDifficulty);
    }

    this.getAllUnits().forEach(u => {
      u.prevX = u.x; u.prevY = u.y;
      u.targetX = u.x; u.targetY = u.y;
      u.miredThisTurn = false;
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
    this.planningTimeRemaining = this.bootcampLesson ? Infinity : this.planningDurationConfig;

    this.calculateTurnIncome(1);
    this.calculateTurnIncome(2);

    // Decay active ability durations
    this.activeFlares = this.activeFlares.filter(f => { f.turnsLeft--; return f.turnsLeft > 0; });
    this.activeSmokes = this.activeSmokes.filter(s => { s.turnsLeft--; return s.turnsLeft > 0; });

    [...this.players[1].units, ...this.players[2].units].forEach(u => {
      u.hasMovedThisTurn = false;
      u.hasAttackedThisTurn = false;
      u.miredThisTurn = false;
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
      this.activeSmokes.push({ x: targetX, y: targetY, owner: playerId, turnsLeft: 2, turnPlaced: this.turnNumber });
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
      if (playerId === 1 && this.bootcampLesson === 6 && this.bootcampManager) {
        const p1Squad = this.players[1].units.find(u => u.isAlive());
        const isFriendlyTarget = (p1Squad && Math.abs(p1Squad.x - targetX) <= 1 && Math.abs(p1Squad.y - targetY) <= 1) || (targetX === this.players[1].basePos.x && targetY === this.players[1].basePos.y);
        if (isFriendlyTarget) {
          this.bootcampManager.triggerLessonEasterEgg(6, "Friendly fire isn't friendly, Cadet! Are you trying to court-martial yourself before lunchtime?!");
        }
      }
    }

    this.notifyStateChange();
    return { success: true };
  }

  hasRefundableAbilities(playerId = 1) {
    if (this.phase !== 'PLANNING') return false;
    const artCount = this.activeArtilleryStrikes.some(a => a.owner === playerId && a.targetTurn === this.turnNumber);
    const smokeCount = this.activeSmokes.some(s => s.owner === playerId && s.turnPlaced === this.turnNumber);
    return artCount || smokeCount;
  }

  cancelPlayerAbilities(playerId = 1) {
    if (this.phase !== 'PLANNING') {
      return { success: false, reason: 'Can only cancel abilities during the Planning phase.' };
    }
    const artStrikes = this.activeArtilleryStrikes.filter(a => a.owner === playerId && a.targetTurn === this.turnNumber);
    const smokes = this.activeSmokes.filter(s => s.owner === playerId && s.turnPlaced === this.turnNumber);

    const artCount = artStrikes.length;
    const smokeCount = smokes.length;

    if (artCount === 0 && smokeCount === 0) {
      return { success: false, reason: 'No pending abilities to cancel this turn.' };
    }

    const artCost = (typeof ABILITIES !== 'undefined' && ABILITIES.ARTILLERY_STRIKE) ? ABILITIES.ARTILLERY_STRIKE.cpCost : 4;
    const smokeCost = (typeof ABILITIES !== 'undefined' && ABILITIES.SMOKE_SCREEN) ? ABILITIES.SMOKE_SCREEN.cpCost : 2;
    const refundedCP = (artCount * artCost) + (smokeCount * smokeCost);

    this.activeArtilleryStrikes = this.activeArtilleryStrikes.filter(a => !(a.owner === playerId && a.targetTurn === this.turnNumber));
    this.activeSmokes = this.activeSmokes.filter(s => !(s.owner === playerId && s.turnPlaced === this.turnNumber));

    if (this.players[playerId]) {
      this.players[playerId].cp = Math.min(10, this.players[playerId].cp + refundedCP);
    }

    this.actionLogs.push({
      type: 'ABILITY',
      turn: this.turnNumber,
      playerOwner: playerId,
      playerName: this.players[playerId] ? this.players[playerId].name : `Player ${playerId}`,
      abilityName: `Abilities Cancelled (+${refundedCP} CP Refunded)`
    });

    this.notifyStateChange();
    return { success: true, refundedCP, artCount, smokeCount };
  }

  calculateVision(playerId) {
    if (this.bootcampLesson && (this.bootcampLesson <= 5 || this.bootcampLesson === 7)) {
      return Array(8).fill(null).map(() => Array(8).fill(true));
    }
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

    if (playerBase) {
      const baseTile = this.grid[playerBase.y] && this.grid[playerBase.y][playerBase.x];
      if (baseTile && baseTile.id === 'MAIN_BASE' && baseTile.owner === playerId) {
        points.push({
          x: playerBase.x,
          y: playerBase.y,
          name: 'Main Base',
          isContested: isUnderSiege(playerBase.x, playerBase.y)
        });
      }
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = this.grid[r][c];
        if (tile.id === 'CAPTURE_ZONE' && tile.owner === playerId) {
          points.push({
            x: c,
            y: r,
            name: 'Supply Zone',
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
      return { success: false, reason: `Spawn Point ${formatCoord(spawnX, spawnY)} is UNDER SIEGE! Enemy troops are blocking deployment.` };
    }

    const occupied = this.getAllUnits().some(u => u.x === spawnX && u.y === spawnY && u.isAlive());
    if (occupied) return { success: false, reason: `Deployment Tile ${formatCoord(spawnX, spawnY)} is occupied by another unit!` };

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

      // If unit is currently standing in SWAMP / Deep Mud, movement is sluggish (1 tile per turn)
      const currentTile = this.grid[unit.y][unit.x];
      if (currentTile.id === 'SWAMP') {
        speedMax = 1;
      }

      // If unit entered mud this turn, it is mired and must stay for the remainder of this turn!
      if (unit.miredThisTurn) {
        return;
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

          // Check if infantry entered Deep Mud / Swamp / Pond
          if (tile.id === 'SWAMP') {
            unit.miredThisTurn = true;
            this.actionLogs.push({
              type: 'MIRED',
              turn: this.turnNumber,
              playerOwner: unit.owner,
              playerName: this.players[unit.owner]?.name || 'Commander',
              unitName: unit.name,
              unitIcon: unit.icon,
              x: unit.x,
              y: unit.y,
              message: `${unit.name} mired in Mud / Pond at ${formatCoord(unit.x, unit.y)}! Halted for 1 turn.`
            });
            if (this.audio) this.audio.playEraserSmudge();
          }

          // Check if allied unit stepped onto enemy HQ during tutorial lessons 1-4 (Easter Egg)
          const p2BasePos = this.players[2]?.basePos;
          if (unit.owner === 1 && this.bootcampLesson && this.bootcampLesson < 8 && p2BasePos && unit.x === p2BasePos.x && unit.y === p2BasePos.y) {
            unit.waypoints = [];
            unit.x = (unit.prevX !== undefined && unit.prevX !== p2BasePos.x) ? unit.prevX : 6;
            unit.y = (unit.prevY !== undefined && unit.prevY !== p2BasePos.y) ? unit.prevY : 7;
            unit.targetX = unit.x;
            unit.targetY = unit.y;
            unit.renderX = unit.x;
            unit.renderY = unit.y;
            if (this.bootcampManager) {
              this.bootcampManager.triggerEasterEgg(unit);
            }
          }
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

        // Direct fire is blocked if a mountain is between the units
        if (dist > 1 && Combat.isBlockedByMountain(u1.x, u1.y, u2.x, u2.y, this.grid)) return;

        if (dist <= Math.max(u1.attackRange, u2.attackRange)) {
          let u1Ambushed = false;
          const u1CanAttack = dist <= u1.attackRange && !u1.hasAttackedThisTurn;
          const u2CanAttack = dist <= u2.attackRange && !u2.hasAttackedThisTurn;

          if (u1CanAttack) {
            const res = Combat.resolveEncounter(u1, u2, this.grid[u2.y][u2.x], this.players[1].faction, this.players[2].faction);
            u1.hasAttackedThisTurn = true;
            u1Ambushed = !!res.isAmbushStrike;
            if (this.audio) this.audio.playGunfire(u1.category === 'VEHICLE' || u2.category === 'VEHICLE');
            
            // ONLY LOG COMBAT IF DEFENDER TILE IS VISIBLE TO P1
            if (p1VisionNow[u2.y][u2.x]) {
              this.actionLogs.push({ ...res, turn: this.turnNumber, step: stepIndex });
            }

            // Reward CP for dealing damage
            this.players[1].cp = Math.min(10, this.players[1].cp + Math.max(1, Math.floor(res.damageDealt / 25)));
          }

          // TRUE SIMULTANEOUS COMBAT RESOLUTION:
          // In an Ambush Strike, the ambusher eliminates the target from stealth, denying retaliation if lethal.
          // In open combat, fire is strictly simultaneous: u2 fires back even if taking lethal damage!
          const u2CanRetaliate = u2.isAlive() || (!u1Ambushed && u2CanAttack);
          if (u2CanAttack && u2CanRetaliate) {
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
        if (this.bootcampLesson && this.bootcampLesson < 8 && unit.owner === 1) {
          if (this.bootcampManager) {
            this.bootcampManager.triggerEasterEgg(unit);
          }
          return;
        }
        this.winner = unit.owner;
        this.winReason = 'BASE_CAPTURE';
        this.phase = GAME_PHASES.GAME_OVER;
      }
    });

    this.checkWinConditions();
  }

  checkWinConditions() {
    if (this.winner) return;

    const p1Base = this.players[1].basePos ? this.grid[this.players[1].basePos.y]?.[this.players[1].basePos.x] : null;
    const p2Base = this.players[2].basePos ? this.grid[this.players[2].basePos.y]?.[this.players[2].basePos.x] : null;

    if (p1Base && p1Base.id === 'MAIN_BASE' && p1Base.owner === 2) {
      this.winner = 2;
      this.winReason = 'BASE_CAPTURE';
      this.phase = GAME_PHASES.GAME_OVER;
      return;
    }
    if (p2Base && p2Base.id === 'MAIN_BASE' && p2Base.owner === 1) {
      if (this.bootcampLesson && this.bootcampLesson < 8) return;
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
      if (this.bootcampLesson && this.bootcampLesson < 8) return;
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

        let tileCost = unit.category === 'VEHICLE' ? tile.moveCostVehicle : tile.moveCostInfantry;
        if (tile.id === 'SWAMP' && unit.category !== 'VEHICLE') {
          tileCost = 4.0; // High path cost reflecting 1-turn mire delay
        }
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
  static processTurn(engine, difficulty = 'VETERAN') {
    const aiPlayer = engine.players[2];
    const humanPlayer = engine.players[1];
    if (!aiPlayer) return;

    // BOOTCAMP SCRIPTED AI BEHAVIOR
    if (engine.bootcampLesson) {
      if (engine.bootcampLesson === 1 || engine.bootcampLesson === 3 || engine.bootcampLesson === 6) {
        return; // Zero AI actions
      }
      if (engine.bootcampLesson === 2) {
        // Scout advances straight into the forest ambush trap
        const scout = aiPlayer.units.find(u => u.isAlive());
        if (scout) {
          scout.setWaypoints([{ x: 4, y: 3 }, { x: 3, y: 3 }]);
        }
        return;
      }
      if (engine.bootcampLesson === 4) {
        // Hold defense stances to allow clear counter demonstration
        aiPlayer.units.forEach(unit => {
          if (unit.isAlive()) {
            unit.setStance(STANCES.DEFEND.id);
            unit.setWaypoints([]);
          }
        });
        return;
      }
      if (engine.bootcampLesson === 5) {
        // Scripted detour: vehicle cannot enter mud so it detours south around columns 5 & 6
        const ev = aiPlayer.units.find(u => u.isAlive());
        if (ev) {
          ev.setStance(STANCES.ADVANCE.id);
          if (engine.turnNumber <= 1) {
            // Turn 1: head south from (7,3) -> (7,4) -> (7,5)
            ev.setWaypoints([{ x: 7, y: 4 }, { x: 7, y: 5 }]);
          } else if (engine.turnNumber === 2) {
            // Turn 2: round southern bypass from (7,5) -> (6,5) -> (5,5)
            ev.setWaypoints([{ x: 6, y: 5 }, { x: 5, y: 5 }]);
          } else {
            // Turn 3+: charge up col 4 straight to the Forest Pass at (3,3)
            ev.setWaypoints([{ x: 4, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 3 }]);
          }
        }
        return;
      }
      if (engine.bootcampLesson === 7) {
        // Enemy raider holds siege position adjacent to depot
        const raider = aiPlayer.units.find(u => u.isAlive());
        if (raider) {
          raider.setStance(STANCES.DEFEND.id);
          raider.setWaypoints([]);
        }
        return;
      }
      // Lesson 8 falls through to dynamic AI
    }

    // 1. Dynamic Unit Recruitment
    this.buyUnitsAI(engine, difficulty);

    // 2. Ability Usage
    this.useAbilitiesAI(engine, difficulty);

    // 3. Movement & Target Evaluation
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = humanPlayer.units.filter(u => u.isAlive() && aiVision[u.y][u.x]);
    const aiUnits = aiPlayer.units.filter(u => u.isAlive());

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

      // Low HP Tactical Preservation (retreat to forest cover or base)
      if (unit.getHpPercent() < 30 && !isSittingOnBase) {
        const forestTile = this.findNearbyForest(engine, unit);
        const safeTarget = forestTile || aiPlayer.basePos;
        this.executeOrder(engine, unit, safeTarget);
        return;
      }

      // Tactical Target Engagement based on difficulty
      if (difficulty === 'RECRUIT') {
        const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
        this.executeOrder(engine, unit, target);
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

  static buyUnitsAI(engine, difficulty = 'VETERAN') {
    const ai = engine.players[2];

    // GENTLE RECRUIT PACING: Cap unit count to 3 and 50% chance to pause buying
    if (difficulty === 'RECRUIT') {
      const activeAiUnits = ai.units.filter(u => u.isAlive()).length;
      if (activeAiUnits >= 3 || Math.random() < 0.50) {
        return;
      }
    }

    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = engine.players[1].units.filter(u => u.isAlive() && aiVision[u.y][u.x]);

    let humanVehicleCount = 0;
    let humanInfantryCount = 0;
    let humanATCount = 0;

    visibleHumanUnits.forEach(u => {
      if (u.category === 'VEHICLE') humanVehicleCount++;
      else if (u.typeKey === 'ANTI_TANK') humanATCount++;
      else humanInfantryCount++;
    });

    let targetType = 'RIFLEMAN';

    if (difficulty === 'RECRUIT') {
      const types = ['RIFLEMAN', 'SCOUT'];
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

    const spawnPoints = engine.getOwnedSpawnPoints(2).filter(sp => !sp.isContested && !engine.getAllUnits().some(u => u.x === sp.x && u.y === sp.y && u.isAlive()));
    if (spawnPoints.length > 0 && ai.ink >= UNIT_TYPES[targetType].cost) {
      engine.buyUnit(2, targetType, spawnPoints[0].x, spawnPoints[0].y);
    }
  }

  static useAbilitiesAI(engine, difficulty = 'VETERAN') {
    // RECRUIT bot never casts abilities on beginner players
    if (difficulty === 'RECRUIT') return;

    const ai = engine.players[2];
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = engine.players[1].units.filter(u => u.isAlive() && aiVision[u.y][u.x]);

    // Standard Ability Execution: Artillery Strike on enemy clusters
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
      if (p1Base && !aiVision[p1Base.y][p1Base.x]) {
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

    // 1. Background Military Drafting Vellum
    this.ctx.fillStyle = '#f3ede2';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Fine Technical Subdivisions (Graph Paper Grid at 35px)
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.08)';
    this.ctx.lineWidth = 0.6;
    for (let p = 35; p < 560; p += 35) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX + p, this.offsetY);
      this.ctx.lineTo(this.offsetX + p, this.offsetY + 560);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, this.offsetY + p);
      this.ctx.lineTo(this.offsetX + 560, this.offsetY + p);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // In GAME_OVER terrain-view mode: reveal all tiles (no fog)
    const isTerrainView = engine.phase === 'GAME_OVER';
    const p1Vision = isTerrainView ? Array(8).fill(null).map(() => Array(8).fill(true)) : engine.calculateVision(1);

    // 3. Terrain Tiles
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = engine.grid[r][c];
        const pos = this.getScreenCoords(c, r);
        this.drawTerrainTile(tile, pos.x, pos.y, engine);
      }
    }

    // 4. Primary 70px Drafting Grid Lines & Precision Quadrant Crosses
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const p = i * 70;
      this.ctx.beginPath(); this.ctx.moveTo(this.offsetX + p, this.offsetY); this.ctx.lineTo(this.offsetX + p, this.offsetY + 560); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(this.offsetX, this.offsetY + p); this.ctx.lineTo(this.offsetX + 560, this.offsetY + p); this.ctx.stroke();
    }

    // Quadrant Registration Crosses (+) at tile junctions
    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    this.ctx.lineWidth = 1;
    for (let r = 0; r <= 8; r++) {
      for (let c = 0; c <= 8; c++) {
        const jx = this.offsetX + c * 70;
        const jy = this.offsetY + r * 70;
        this.ctx.beginPath();
        this.ctx.moveTo(jx - 3.5, jy); this.ctx.lineTo(jx + 3.5, jy);
        this.ctx.moveTo(jx, jy - 3.5); this.ctx.lineTo(jx, jy + 3.5);
        this.ctx.stroke();
      }
    }
    this.ctx.restore();

    // 5. Precision Tactical Military Grid Coordinates (A-H top, 1-8 left, secondary pips bottom/right)
    this.ctx.save();
    this.ctx.font = 'bold 9px "JetBrains Mono", Consolas, monospace';
    this.ctx.fillStyle = '#475569';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let c = 0; c < 8; c++) {
      const x = this.offsetX + c * 70 + 35;
      this.ctx.fillText(colLabels[c], x, 10);
      // Coordinate alignment tick into the grid track
      this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 15);
      this.ctx.lineTo(x, 19);
      this.ctx.stroke();

      // Symmetrical bottom margin registration dot
      this.ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
      this.ctx.fillRect(x - 1, 587, 2, 2);
    }
    for (let r = 0; r < 8; r++) {
      const y = this.offsetY + r * 70 + 35;
      this.ctx.fillStyle = '#475569';
      this.ctx.fillText(String(r + 1), 10, y);
      // Coordinate alignment tick into the grid track
      this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(15, y);
      this.ctx.lineTo(19, y);
      this.ctx.stroke();

      // Symmetrical right margin registration dot
      this.ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
      this.ctx.fillRect(587, y - 1, 2, 2);
    }

    // Outer Precision Drafting Border Frame (560x560)
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(this.offsetX, this.offsetY, 560, 560);
    this.ctx.restore();

    // 6. Units Multi-Turn Waypoints — Show P1's own units' plans
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

    // 7. Render Living Units (Visible to P1) with Smooth Interpolation
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

    // 8. Tactical Hover Reticle with Drafting Corner Brackets
    if (this.hoveredTile) {
      const pos = this.getScreenCoords(this.hoveredTile.x, this.hoveredTile.y);
      const hx = pos.x; const hy = pos.y;
      const bLen = 12;

      this.ctx.save();
      // Subtle interior tint
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.09)';
      this.ctx.fillRect(hx + 1, hy + 1, 68, 68);

      // Corner Drafting Brackets ⌜ ⌝ ⌞ ⌟
      this.ctx.strokeStyle = '#0284c7';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      // Top-Left ⌜
      this.ctx.moveTo(hx + 3, hy + 3 + bLen); this.ctx.lineTo(hx + 3, hy + 3); this.ctx.lineTo(hx + 3 + bLen, hy + 3);
      // Top-Right ⌝
      this.ctx.moveTo(hx + 67 - bLen, hy + 3); this.ctx.lineTo(hx + 67, hy + 3); this.ctx.lineTo(hx + 67, hy + 3 + bLen);
      // Bottom-Left ⌞
      this.ctx.moveTo(hx + 3, hy + 67 - bLen); this.ctx.lineTo(hx + 3, hy + 67); this.ctx.lineTo(hx + 3 + bLen, hy + 67);
      // Bottom-Right ⌟
      this.ctx.moveTo(hx + 67 - bLen, hy + 67); this.ctx.lineTo(hx + 67, hy + 67); this.ctx.lineTo(hx + 67, hy + 67 - bLen);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 9. Tactical Selection Highlight with Heavy Industrial Brass Brackets
    if (this.selectedTile) {
      const pos = this.getScreenCoords(this.selectedTile.x, this.selectedTile.y);
      const sx = pos.x; const sy = pos.y;
      const bLen = 14;

      this.ctx.save();
      // Subtle amber drafting wash
      this.ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
      this.ctx.fillRect(sx + 1, sy + 1, 68, 68);

      // Inner dashed boundary
      this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 3]);
      this.ctx.strokeRect(sx + 4, sy + 4, 62, 62);
      this.ctx.setLineDash([]);

      // Outer Corner Brass Brackets
      this.ctx.strokeStyle = '#d97706';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      // Top-Left
      this.ctx.moveTo(sx + 2, sy + 2 + bLen); this.ctx.lineTo(sx + 2, sy + 2); this.ctx.lineTo(sx + 2 + bLen, sy + 2);
      // Top-Right
      this.ctx.moveTo(sx + 68 - bLen, sy + 2); this.ctx.lineTo(sx + 68, sy + 2); this.ctx.lineTo(sx + 68, sy + 2 + bLen);
      // Bottom-Left
      this.ctx.moveTo(sx + 2, sy + 68 - bLen); this.ctx.lineTo(sx + 2, sy + 68); this.ctx.lineTo(sx + 2 + bLen, sy + 68);
      // Bottom-Right
      this.ctx.moveTo(sx + 68 - bLen, sy + 68); this.ctx.lineTo(sx + 68, sy + 68); this.ctx.lineTo(sx + 68, sy + 68 - bLen);
      this.ctx.stroke();

      // Center edge registration pips
      this.ctx.fillStyle = '#d97706';
      this.ctx.fillRect(sx + 34, sy + 1, 3, 2);
      this.ctx.fillRect(sx + 34, sy + 67, 3, 2);
      this.ctx.fillRect(sx + 1, sy + 34, 2, 3);
      this.ctx.fillRect(sx + 67, sy + 34, 2, 3);
      this.ctx.restore();
    }

    // 10. FOG OF WAR PENCIL HATCH OVERLAY (skip in terrain-view / GAME_OVER)
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

    // 11. Smoke Screen Overlays (Tactical volumetric cloud)
    engine.activeSmokes.forEach(smoke => {
      for (let r = smoke.y - 1; r <= smoke.y + 1; r++) {
        for (let c = smoke.x - 1; c <= smoke.x + 1; c++) {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const pos = this.getScreenCoords(c, r);
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(51, 65, 85, 0.45)';
            this.ctx.fillRect(pos.x, pos.y, 70, 70);

            // Concentric dispersion rings
            this.ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
            this.ctx.lineWidth = 1.3;
            this.ctx.beginPath();
            this.ctx.arc(pos.x + 35, pos.y + 35, 24, 0, Math.PI * 2);
            this.ctx.arc(pos.x + 35, pos.y + 35, 14, 0, Math.PI * 2);
            this.ctx.arc(pos.x + 35, pos.y + 35, 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
          }
        }
      }
    });

    // 12. Artillery Target Crosshairs (Ballistic impact reticle)
    engine.activeArtilleryStrikes.forEach(art => {
      for (let r = art.y - 1; r <= art.y + 1; r++) {
        for (let c = art.x - 1; c <= art.x + 1; c++) {
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const pos = this.getScreenCoords(c, r);
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pos.x + 3, pos.y + 3, 64, 64);

            // Hazard corner diagonals
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x + 3, pos.y + 12); this.ctx.lineTo(pos.x + 12, pos.y + 3);
            this.ctx.moveTo(pos.x + 67, pos.y + 58); this.ctx.lineTo(pos.x + 58, pos.y + 67);
            this.ctx.stroke();

            // Tactical Ballistic Reticle Circle & Crosshairs
            this.ctx.lineWidth = 1.4;
            this.ctx.beginPath();
            this.ctx.arc(pos.x + 35, pos.y + 35, 16, 0, Math.PI * 2);
            this.ctx.moveTo(pos.x + 35, pos.y + 12); this.ctx.lineTo(pos.x + 35, pos.y + 58);
            this.ctx.moveTo(pos.x + 12, pos.y + 35); this.ctx.lineTo(pos.x + 58, pos.y + 35);
            this.ctx.stroke();
            this.ctx.restore();
          }
        }
      }
    });

    this.ctx.restore();
  }

  drawPencilHatching(x, y) {
    this.ctx.save();
    // Deep navy blueprint undertone
    this.ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
    this.ctx.fillRect(x, y, 70, 70);

    // Primary 45° dense graphite hatching
    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let i = -70; i < 140; i += 7) {
      this.ctx.moveTo(x + i, y);
      this.ctx.lineTo(x + i + 70, y + 70);
    }
    this.ctx.stroke();

    // Secondary counter-hatching for terra incognita density
    this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.22)';
    this.ctx.lineWidth = 0.8;
    this.ctx.beginPath();
    for (let i = -70; i < 140; i += 14) {
      this.ctx.moveTo(x + i + 70, y);
      this.ctx.lineTo(x + i, y + 70);
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

    // 1. Draw connecting trajectory segments
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

    // 2. Draw numbered waypoint step tokens (①, ②, ③)
    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      const turnIndex = Math.floor((i - 1) / unitSpeed);
      const tokenColor = unit.owner === 2 ? '#ef4444' : (turnIndex === 0 ? '#2563eb' : (turnIndex === 1 ? '#d97706' : '#7c3aed'));

      this.ctx.setLineDash([]);
      this.ctx.fillStyle = '#0a101f';
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = tokenColor;
      this.ctx.lineWidth = 1.8;
      this.ctx.stroke();

      this.ctx.font = 'bold 8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(String(i), pt.x, pt.y);
    }

    // 3. Draw terminal directional chevron arrow
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
      case 'PLAINS': {
        // Subtle warm vellum tint
        this.ctx.fillStyle = 'rgba(217, 119, 6, 0.025)';
        this.ctx.fillRect(x, y, 70, 70);

        // Precision surveyor center crosshair
        this.ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 31, y + 35); this.ctx.lineTo(x + 39, y + 35);
        this.ctx.moveTo(x + 35, y + 31); this.ctx.lineTo(x + 35, y + 39);
        this.ctx.stroke();

        // Subtle quadrant tick dots
        this.ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
        this.ctx.fillRect(x + 8, y + 8, 1.5, 1.5);
        this.ctx.fillRect(x + 61, y + 8, 1.5, 1.5);
        this.ctx.fillRect(x + 8, y + 61, 1.5, 1.5);
        this.ctx.fillRect(x + 61, y + 61, 1.5, 1.5);
        break;
      }
      case 'FOREST': {
        // Organic coniferous forest grove wash
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        this.ctx.fillRect(x, y, 70, 70);

        // Tree grove base perimeter shadow
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 35, y + 51, 25, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Grouped 3-canopy cluster with draftsman cross-hatching
        const drawTree = (tx, ty, scale) => {
          this.ctx.strokeStyle = '#1b4332';
          this.ctx.lineWidth = 1.4;
          this.ctx.fillStyle = 'rgba(45, 90, 39, 0.2)';
          this.ctx.beginPath();
          this.ctx.moveTo(tx, ty);
          this.ctx.lineTo(tx - 11 * scale, ty + 24 * scale);
          this.ctx.lineTo(tx + 11 * scale, ty + 24 * scale);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();

          // Tree trunk
          this.ctx.strokeStyle = '#2e1005';
          this.ctx.lineWidth = 1.6;
          this.ctx.beginPath();
          this.ctx.moveTo(tx, ty + 24 * scale);
          this.ctx.lineTo(tx, ty + 28 * scale);
          this.ctx.stroke();

          // 45° internal draftsman hatching
          this.ctx.strokeStyle = 'rgba(21, 128, 61, 0.65)';
          this.ctx.lineWidth = 0.9;
          this.ctx.beginPath();
          this.ctx.moveTo(tx - 6 * scale, ty + 12 * scale);
          this.ctx.lineTo(tx + 4 * scale, ty + 22 * scale);
          this.ctx.moveTo(tx - 4 * scale, ty + 6 * scale);
          this.ctx.lineTo(tx + 7 * scale, ty + 18 * scale);
          this.ctx.stroke();
        };

        drawTree(x + 24, y + 18, 0.85);
        drawTree(x + 46, y + 20, 0.85);
        drawTree(x + 35, y + 13, 1.05); // Central tallest canopy
        break;
      }
      case 'MOUNTAIN': {
        // Slate rock wash
        this.ctx.fillStyle = 'rgba(100, 116, 139, 0.16)';
        this.ctx.fillRect(x, y, 70, 70);

        // 3 concentric topographic elevation contour rings
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1.4;

        // Outer contour ring
        this.ctx.beginPath();
        this.ctx.moveTo(x + 14, y + 54);
        this.ctx.quadraticCurveTo(x + 22, y + 26, x + 35, y + 16);
        this.ctx.quadraticCurveTo(x + 48, y + 26, x + 56, y + 54);
        this.ctx.closePath();
        this.ctx.stroke();

        // Middle contour ring
        this.ctx.beginPath();
        this.ctx.moveTo(x + 22, y + 48);
        this.ctx.quadraticCurveTo(x + 27, y + 30, x + 35, y + 24);
        this.ctx.quadraticCurveTo(x + 43, y + 30, x + 48, y + 48);
        this.ctx.stroke();

        // Inner contour summit ring
        this.ctx.beginPath();
        this.ctx.moveTo(x + 29, y + 42);
        this.ctx.quadraticCurveTo(x + 32, y + 34, x + 35, y + 31);
        this.ctx.quadraticCurveTo(x + 38, y + 34, x + 41, y + 42);
        this.ctx.stroke();

        // Southeast slope elevation hachures (topographic relief shading)
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
        this.ctx.lineWidth = 1.1;
        this.ctx.beginPath();
        for (let i = 0; i <= 14; i += 4) {
          this.ctx.moveTo(x + 38 + i, y + 32 + i * 0.8);
          this.ctx.lineTo(x + 44 + i, y + 40 + i * 0.8);
        }
        this.ctx.stroke();

        // Summit survey triangulation symbol (▲)
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 35, y + 17);
        this.ctx.lineTo(x + 31, y + 23);
        this.ctx.lineTo(x + 39, y + 23);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      }
      case 'WATER': {
        // Deep cartographic water wash
        this.ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
        this.ctx.fillRect(x, y, 70, 70);

        // Cartographic horizontal wave crests
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.lineWidth = 1.3;
        
        const drawWave = (wx, wy) => {
          this.ctx.beginPath();
          this.ctx.moveTo(wx, wy);
          this.ctx.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy);
          this.ctx.quadraticCurveTo(wx + 12, wy + 3, wx + 16, wy);
          this.ctx.stroke();
        };

        drawWave(x + 10, y + 20);
        drawWave(x + 42, y + 24);
        drawWave(x + 22, y + 38);
        drawWave(x + 48, y + 46);
        drawWave(x + 12, y + 56);

        // Shoreline stipple depth dots
        this.ctx.fillStyle = 'rgba(2, 132, 199, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x + 34, y + 12, 1, 0, Math.PI * 2);
        this.ctx.arc(x + 60, y + 14, 1, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y + 46, 1, 0, Math.PI * 2);
        this.ctx.arc(x + 38, y + 60, 1, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      }
      case 'SWAMP': {
        // Murky mire wash
        this.ctx.fillStyle = 'rgba(101, 163, 13, 0.16)';
        this.ctx.fillRect(x, y, 70, 70);

        // Wavy mire mud contours
        this.ctx.strokeStyle = '#4d7c0f';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, y + 46);
        this.ctx.bezierCurveTo(x + 22, y + 42, x + 36, y + 50, x + 62, y + 45);
        this.ctx.stroke();

        // 2 marshland reed/cattail clumps
        const drawReeds = (rx, ry) => {
          this.ctx.strokeStyle = '#365314';
          this.ctx.lineWidth = 1.3;
          this.ctx.beginPath();
          this.ctx.moveTo(rx - 4, ry + 12); this.ctx.lineTo(rx - 7, ry - 6);
          this.ctx.moveTo(rx, ry + 12); this.ctx.lineTo(rx, ry - 10);
          this.ctx.moveTo(rx + 4, ry + 12); this.ctx.lineTo(rx + 7, ry - 6);
          this.ctx.stroke();
          // Cattail heads
          this.ctx.fillStyle = '#3f2c1d';
          this.ctx.fillRect(rx - 1, ry - 10, 2.5, 6);
        };

        drawReeds(x + 22, y + 28);
        drawReeds(x + 48, y + 24);
        break;
      }
      case 'CAPTURE_ZONE': {
        const isP1 = tile.owner === 1;
        const isAI = tile.owner === 2;
        const tint = isP1 ? 'rgba(37, 99, 235, 0.18)' : (isAI ? 'rgba(220, 38, 38, 0.18)' : 'rgba(245, 158, 11, 0.15)');
        const strokeColor = isP1 ? '#3b82f6' : (isAI ? '#ef4444' : '#f59e0b');

        this.ctx.fillStyle = tint;
        this.ctx.fillRect(x, y, 70, 70);

        // Industrial depot frame with riveted corner plates
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 1.8;
        this.ctx.strokeRect(x + 4, y + 4, 62, 62);

        // Corner rivets
        this.ctx.fillStyle = strokeColor;
        [ [8,8], [62,8], [8,62], [62,62] ].forEach(([rx, ry]) => {
          this.ctx.beginPath();
          this.ctx.arc(x + rx, y + ry, 1.8, 0, Math.PI * 2);
          this.ctx.fill();
        });

        // Center Supply Canister glyph with clean industrial cross stencil
        this.ctx.strokeRect(x + 28, y + 22, 14, 20);
        this.ctx.fillRect(x + 31, y + 19, 8, 3); // cap
        this.ctx.beginPath();
        this.ctx.moveTo(x + 35, y + 26); this.ctx.lineTo(x + 35, y + 38);
        this.ctx.moveTo(x + 31, y + 32); this.ctx.lineTo(x + 39, y + 32);
        this.ctx.stroke();

        // Bottom requisition plinth
        this.ctx.fillStyle = strokeColor;
        this.ctx.fillRect(x + 24, y + 48, 22, 3);
        break;
      }
      case 'MAIN_BASE': {
        const isP1 = tile.owner === 1;
        const strokeColor = isP1 ? '#2563eb' : '#dc2626';
        this.ctx.fillStyle = isP1 ? 'rgba(37, 99, 235, 0.22)' : 'rgba(220, 38, 38, 0.22)';
        this.ctx.fillRect(x, y, 70, 70);

        // Fortified command bunker outline
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2.4;
        this.ctx.strokeRect(x + 4, y + 4, 62, 62);

        // Bunker blast embrasures & antenna
        this.ctx.beginPath();
        this.ctx.moveTo(x + 35, y + 18); this.ctx.lineTo(x + 35, y + 8); // antenna mast
        this.ctx.moveTo(x + 32, y + 11); this.ctx.lineTo(x + 38, y + 11); // crossbar
        this.ctx.stroke();

        // Heavy bunker blast door
        this.ctx.fillStyle = strokeColor;
        this.ctx.fillRect(x + 22, y + 26, 26, 16);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(x + 26, y + 30, 18, 8); // vision slit

        // Fortified command emblem (clean vector star)
        this.ctx.fillStyle = isP1 ? '#93c5fd' : '#fca5a5';
        this.ctx.beginPath();
        this.ctx.arc(x + 35, y + 51, 3.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x + 26, y + 51); this.ctx.lineTo(x + 44, y + 51);
        this.ctx.strokeStyle = isP1 ? '#93c5fd' : '#fca5a5';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        break;
      }
    }

    if ((tile.id === 'MAIN_BASE' || tile.id === 'CAPTURE_ZONE') && tile.owner) {
      const isSieged = engine.getAllUnits().some(other => {
        if (other.owner === tile.owner || !other.isAlive()) return false;
        return Math.abs(other.x - tile.x) + Math.abs(other.y - tile.y) <= 1;
      });

      if (isSieged) {
        this.ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
        this.ctx.fillRect(x, y, 70, 70);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 4]);
        this.ctx.strokeRect(x + 2, y + 2, 66, 66);
        this.ctx.setLineDash([]);
      }
    }

    this.ctx.restore();
  }

  drawUnit(unit, x, y, engine) {
    const cx = x + 35;
    const cy = y + 35;

    if (typeof UnitIcons !== 'undefined') {
      UnitIcons.drawCanvasToken(this.ctx, unit, cx, cy, engine);
      return;
    }

    this.ctx.save();
    const isP1 = unit.owner === 1;
    const mainColor = isP1 ? '#2563eb' : '#dc2626';
    const bgFill = isP1 ? '#0a101f' : '#220808';
    const symbolColor = isP1 ? '#93c5fd' : '#fca5a5';

    // Outer Tactical Unit Frame (NATO style round-rect / circle)
    this.ctx.strokeStyle = mainColor;
    this.ctx.lineWidth = 2.5;
    this.ctx.fillStyle = bgFill;

    if (unit.category === 'VEHICLE') {
      // NATO Vehicle Oval Track Frame with subtle tread flanges
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, 23, 17, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Flank tread notches
      this.ctx.strokeStyle = mainColor;
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 24, cy - 6); this.ctx.lineTo(cx - 24, cy + 6);
      this.ctx.moveTo(cx + 24, cy - 6); this.ctx.lineTo(cx + 24, cy + 6);
      this.ctx.stroke();
    } else {
      // NATO Infantry Circle Frame with steel cardinal pips
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Cardinal rivet dots
      this.ctx.fillStyle = mainColor;
      [ [0, -21], [0, 21], [-21, 0], [21, 0] ].forEach(([px, py]) => {
        this.ctx.beginPath();
        this.ctx.arc(cx + px, cy + py, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // NATO Symbol Vector Drawing inside frame
    this.ctx.strokeStyle = symbolColor;
    this.ctx.fillStyle = symbolColor;
    this.ctx.lineWidth = 2;

    const uType = unit.typeKey || unit.id || '';

    if (uType === 'RIFLEMAN') {
      // NATO Infantry Crossed Rifles ✕ with barrel muzzles
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 9, cy - 8); this.ctx.lineTo(cx + 9, cy + 8);
      this.ctx.moveTo(cx + 9, cy - 8); this.ctx.lineTo(cx - 9, cy + 8);
      this.ctx.stroke();

      // Rifle barrel muzzle caps
      this.ctx.fillStyle = symbolColor;
      this.ctx.beginPath();
      this.ctx.arc(cx - 9, cy - 8, 1.8, 0, Math.PI * 2);
      this.ctx.arc(cx + 9, cy - 8, 1.8, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (uType === 'SCOUT') {
      // NATO Scout Reconnaissance Diagonal Slash & Dual Optics
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 10, cy + 8); this.ctx.lineTo(cx + 10, cy - 8);
      this.ctx.stroke();
      // Dual optical prism circles
      this.ctx.beginPath();
      this.ctx.arc(cx - 4, cy - 3, 2.5, 0, Math.PI * 2);
      this.ctx.arc(cx + 4, cy + 3, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (uType === 'ANTI_TANK') {
      // NATO Anti-Tank Sabot Penetrator Arrowhead (⌖)
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 10, cy); this.ctx.lineTo(cx + 10, cy);
      this.ctx.moveTo(cx, cy - 10); this.ctx.lineTo(cx, cy + 10);
      this.ctx.stroke();
      // Penetrator dart core
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - 4); this.ctx.lineTo(cx + 3, cy + 3); this.ctx.lineTo(cx - 3, cy + 3);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (uType === 'LIGHT_VEHICLE') {
      // NATO Armored Scout Car: chassis + wheels + MG turret
      this.ctx.strokeRect(cx - 10, cy - 5, 20, 10);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      this.ctx.fill();
      // 4 wheel lugs
      this.ctx.fillRect(cx - 12, cy - 7, 4, 3);
      this.ctx.fillRect(cx + 8, cy - 7, 4, 3);
      this.ctx.fillRect(cx - 12, cy + 4, 4, 3);
      this.ctx.fillRect(cx + 8, cy + 4, 4, 3);
    } else if (uType === 'HEAVY_SIEGE_TANK') {
      // NATO Heavy Tank: armor hull + dual treads + howitzer barrel
      this.ctx.strokeRect(cx - 11, cy - 6, 22, 12);
      this.ctx.fillRect(cx - 4, cy - 3, 8, 6);
      this.ctx.fillRect(cx + 4, cy - 2, 9, 4); // Elongated cannon barrel
      this.ctx.fillStyle = symbolColor;
      this.ctx.fillRect(cx + 12, cy - 3, 2, 6); // Muzzle brake
    } else if (uType === 'BLITZ_RECON') {
      // NATO Recon Lightning Bolt & Chevrons
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

    // Stealth / Ambush camouflage indicator
    if (unit.stance === 'AMBUSH' && unit.isAmbusherHidden && isP1) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Tactical Stance Indicators
    if (unit.stance === 'DEFEND') {
      // Crisp Defense Shield Icon in bottom-right corner of unit
      this.ctx.save();
      this.ctx.fillStyle = '#d97706';
      this.ctx.strokeStyle = '#fef08a';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 12, cy + 6);
      this.ctx.lineTo(cx + 21, cy + 6);
      this.ctx.lineTo(cx + 21, cy + 11);
      this.ctx.quadraticCurveTo(cx + 21, cy + 18, cx + 16.5, cy + 20);
      this.ctx.quadraticCurveTo(cx + 12, cy + 18, cx + 12, cy + 11);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 6. Tactical Segmented Drafting Health Gauge (Fallback)
    const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    const barW = 36;
    const barH = 5;
    const barX = cx - (barW / 2);
    const barY = cy + 21;
    const numPips = 5;
    const filledPips = Math.ceil(hpPct * numPips);

    // Backplate
    this.ctx.fillStyle = 'rgba(9, 14, 24, 0.94)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    this.ctx.lineWidth = 1;
    this.ctx.fillRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);
    this.ctx.strokeRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

    let pipColor = '#22c55e';
    if (hpPct <= 0.25) pipColor = '#ef4444';
    else if (hpPct <= 0.5) pipColor = '#f59e0b';

    const isCritical = hpPct <= 0.25;
    const pulseGlow = isCritical ? (Math.sin(Date.now() / 200) * 0.35 + 0.65) : 1;
    const gap = 1.5;
    const pipW = (barW - ((numPips - 1) * gap)) / numPips;

    for (let i = 0; i < numPips; i++) {
      const px = barX + i * (pipW + gap);
      if (i < filledPips) {
        this.ctx.save();
        if (isCritical) {
          this.ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
          this.ctx.shadowBlur = 5 * pulseGlow;
          this.ctx.globalAlpha = 0.7 + (0.3 * pulseGlow);
        }
        this.ctx.fillStyle = pipColor;
        this.ctx.fillRect(px, barY, pipW, barH);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(px, barY, pipW, 1);
        this.ctx.restore();
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 0.8;
        this.ctx.strokeRect(px + 0.4, barY + 0.4, pipW - 0.8, barH - 0.8);
      }
    }

    // Floating Numerical Tag on Selection
    const isSelected = !!(unit.isSelected || (this.selectedTile && this.selectedTile.x === unit.x && this.selectedTile.y === unit.y));
    if (isSelected) {
      const tagText = `${Math.round(unit.hp)}/${unit.maxHp} HP`;
      this.ctx.save();
      this.ctx.font = 'bold 8.5px "Courier New", monospace';
      const textMetrics = this.ctx.measureText(tagText);
      const tagW = textMetrics.width + 10;
      const tagH = 13;
      const tagX = cx - (tagW / 2);
      const tagY = cy - 22 - 15;

      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowOffsetY = 2;
      this.ctx.fillStyle = 'rgba(8, 14, 26, 0.96)';
      this.ctx.strokeStyle = mainColor;
      this.ctx.lineWidth = 1.2;
      this.ctx.strokeRect(tagX, tagY, tagW, tagH);
      this.ctx.fillRect(tagX, tagY, tagW, tagH);

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = isCritical ? '#fca5a5' : '#f8fafc';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tagText, cx, tagY + (tagH / 2));
      this.ctx.restore();
    }

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

    document.getElementById('btn-cancel-abilities')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.app.engine) {
        const res = this.app.engine.cancelPlayerAbilities(1);
        if (res.success) {
          this.showToast('Abilities Cancelled', `Cancelled ${res.artCount + res.smokeCount} ability(s). Refunded ${res.refundedCP} CP!`);
          try { this.app.audio.playEraserSmudge(); } catch(err){}
          this.updateHUD(this.app.engine);
        } else {
          this.showToast('Cannot Cancel', res.reason || 'No abilities to cancel.');
        }
      }
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

    // Always deselect current unit/tile first, then prompt to choose target
    this.app.renderer.selectedTile = null;
    this.pendingAbilityKey = abilityKey;
    this.showToast('Select Target Tile', `${ability.name} active (${ability.cpCost} CP)! Click any grid square to target, or Right-Click / Esc to cancel.`);
    this.updateHUD(this.app.engine);
  }

  setupMenuTabs() {
    const tabs = [
      { btn: 'tab-btn-play', pane: 'tab-pane-play' },
      { btn: 'tab-btn-bootcamp', pane: 'tab-pane-bootcamp' },
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
          if (t.btn === 'tab-btn-bootcamp' || t.btn === 'tab-btn-account') {
            if (this.app && this.app.bootcampManager) this.app.bootcampManager.updateMenuUI();
          }
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

    if (engine.bootcampLesson) {
      this.phaseBadge.textContent = `Bootcamp — Lesson ${engine.bootcampLesson}`;
      this.phaseBadge.style.background = '';
      this.timerBarFill.style.width = '100%';
      if (engine.bootcampManager) {
        engine.bootcampManager.updateHUD(engine);
      }
    } else if (engine.phase === 'PLANNING') {
      this.phaseBadge.textContent = `Planning Phase — ${engine.planningTimeRemaining}s`;
      this.phaseBadge.style.background = '';
      const maxPlanningSecs = engine.planningDurationConfig || 40;
      this.timerBarFill.style.width = `${Math.min(100, Math.max(0, (engine.planningTimeRemaining / maxPlanningSecs) * 100))}%`;
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (dialog) dialog.style.display = 'none';
      if (pointer) pointer.style.display = 'none';
    } else if (engine.phase === 'PLAYBACK') {
      this.phaseBadge.textContent = `Combat Playback — ${engine.playbackTimeRemaining}s`;
      this.phaseBadge.style.background = '';
      const maxPlaybackSecs = engine.playbackDurationConfig || 3;
      this.timerBarFill.style.width = `${(engine.playbackTimeRemaining / maxPlaybackSecs) * 100}%`;
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (dialog) dialog.style.display = 'none';
      if (pointer) pointer.style.display = 'none';
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
    const actionBtnIds = ['btn-end-turn', 'btn-halt-all', 'btn-cancel-abilities', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery'];
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

    const cancelAbilitiesBtn = document.getElementById('btn-cancel-abilities');
    if (cancelAbilitiesBtn) {
      const hasRefundable = engine.phase === 'PLANNING' && engine.hasRefundableAbilities && engine.hasRefundableAbilities(1);
      cancelAbilitiesBtn.disabled = !hasRefundable || engine.phase === 'GAME_OVER';
      cancelAbilitiesBtn.style.opacity = hasRefundable ? '1' : '0.45';
      cancelAbilitiesBtn.style.pointerEvents = hasRefundable ? 'auto' : 'none';
      cancelAbilitiesBtn.title = hasRefundable
        ? 'Cancel queued artillery strikes and smoke screens deployed this turn & refund Command Points'
        : 'No pending abilities deployed this turn to cancel';
    }

    if (engine.winner && !engine.victoryShown) {
      engine.victoryShown = true;
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (pointer) {
        pointer.style.display = 'none';
        pointer.classList.remove('pointer-below');
      }
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      if (dialog) dialog.style.display = 'none';
      if (engine.bootcampLesson && engine.bootcampManager) {
        if (engine.winner === 1) {
          engine.bootcampManager.onLessonVictory(engine);
        } else {
          engine.bootcampManager.onLessonDefeat(engine);
        }
        return;
      }
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
      const roleLabel = u.category || 'COMBAT';
      const roleClass = (u.category === 'VEHICLE' || u.category === 'ARMOR') ? 'role-vehicle' : (u.category === 'INFANTRY' ? 'role-infantry' : 'role-support');
      const badgeHtml = (typeof UnitIcons !== 'undefined')
        ? UnitIcons.getBadgeHtml(key, { size: 'md', owner: 1 })
        : `<span class="unit-card-symbol">${u.symbol || '⬚'}</span>`;

      btn.id = 'store-card-' + key;
      btn.className = 'unit-card-btn';
      btn.innerHTML = `
        <div class="unit-card-header">
          ${badgeHtml}
          <div class="unit-card-titles">
            <div class="unit-card-top-row">
              <span class="unit-card-title">${u.name}</span>
              <span class="unit-card-cost">${u.cost} Ink</span>
            </div>
            <div class="unit-card-sub-row">
              <span class="unit-role-tag ${roleClass}">${roleLabel}</span>
              <span class="unit-card-meta">HP ${u.maxHp} &bull; ATK ${u.attack} &bull; MOV ${u.moveRange} &bull; RNG ${u.attackRange}</span>
            </div>
          </div>
        </div>
        <div class="unit-card-desc">${u.description}</div>`;
      
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
          } else {
            const isOwnedSpawn = availableSpawns.some(sp => sp.x === selTile.x && sp.y === selTile.y);
            if (isOwnedSpawn) {
              const occ = engine.getAllUnits().find(u => u.x === selTile.x && u.y === selTile.y && u.isAlive());
              if (occ) {
                this.showToast('Tile Occupied', `Cannot deploy at ${formatCoord(selTile.x, selTile.y)}! Depots & Bases must be completely EMPTY to spawn new units.`);
              }
            }
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

    // Explainer Callout: Teaches all players that depots must be empty
    const infoNotice = document.createElement('div');
    infoNotice.style.cssText = 'font-size:0.78rem; color:#cbd5e1; margin-bottom:10px; padding:6px 10px; background:rgba(30,41,59,0.85); border-radius:4px; border-left:3px solid #f59e0b; line-height:1.35;';
    infoNotice.innerHTML = `💡 <b>Deployment Rule:</b> Bases and captured Depots can spawn units, but <b>the tile must be completely EMPTY</b> (unoccupied).`;
    listEl.appendChild(infoNotice);

    spawnPoints.forEach((sp, idx) => {
      const btn = document.createElement('button');
      btn.className = 'spawn-picker-btn';
      btn.id = `deploy-picker-sp-${idx}`;
      const occupyingUnit = engine.getAllUnits().find(u => u.x === sp.x && u.y === sp.y && u.isAlive());

      if (sp.isContested) {
        btn.innerHTML = `
          <div style="display:flex; flex-direction:column; text-align:left;">
            <span style="font-weight:700;">${sp.name} ${formatCoord(sp.x, sp.y)}</span>
            <span style="font-size:0.72rem; color:#f87171; font-weight:600;">⚠️ UNDER SIEGE &mdash; Enemy adjacent!</span>
          </div>
          <span style="font-size:0.75rem; color:#ef4444; border:1px solid rgba(239,68,68,0.5); padding:2px 6px; border-radius:3px; background:rgba(239,68,68,0.1);">BLOCKED</span>
        `;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.addEventListener('click', () => {
          this.showToast('Under Siege', `Cannot deploy at ${formatCoord(sp.x, sp.y)} while enemy is adjacent!`);
          if (engine.bootcampLesson === 7 && engine.bootcampManager) {
            engine.bootcampManager.triggerLessonEasterEgg(7, "You can't deploy through enemy bayonets, Rookie! Clear out the hostiles first!");
          }
        });
      } else if (occupyingUnit) {
        btn.innerHTML = `
          <div style="display:flex; flex-direction:column; text-align:left;">
            <span style="font-weight:700; color:#e2e8f0;">${sp.name} ${formatCoord(sp.x, sp.y)}</span>
            <span style="font-size:0.72rem; color:#f59e0b; font-weight:600;">⚠️ OCCUPIED by ${occupyingUnit.name} &mdash; Tile must be empty!</span>
          </div>
          <span style="font-size:0.75rem; color:#ef4444; border:1px solid rgba(239,68,68,0.5); padding:2px 6px; border-radius:3px; background:rgba(239,68,68,0.1);">BLOCKED</span>
        `;
        btn.style.opacity = '0.7';
        btn.addEventListener('click', () => {
          this.showToast('Tile Occupied', `Cannot deploy at ${formatCoord(sp.x, sp.y)}! Depots and Bases must be EMPTY to spawn new units. Move occupying troops off first.`);
        });
      } else {
        btn.innerHTML = `
          <div style="display:flex; flex-direction:column; text-align:left;">
            <span style="font-weight:700; color:#ffffff;">${sp.name} ${formatCoord(sp.x, sp.y)}</span>
            <span style="font-size:0.72rem; color:#4ade80; font-weight:600;">✅ EMPTY &mdash; Ready for deployment</span>
          </div>
          <span style="font-size:0.75rem; color:#60a5fa; border:1px solid rgba(96,165,250,0.5); padding:2px 8px; border-radius:3px; background:rgba(59,130,246,0.15); font-weight:700;">DEPLOY HERE</span>
        `;
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
      this.inspectorContent.innerHTML = `
        <div class="dossier-placeholder">
          <span class="dossier-placeholder-icon">&#x2316;</span>
          <p class="dossier-placeholder-text">Click any grid sector to inspect terrain attributes or issue unit command orders.</p>
        </div>`;
      return;
    }
    const tile = engine.grid[sel.y][sel.x];
    const isTerrainView = engine.phase === 'GAME_OVER';
    const p1Vision = isTerrainView ? Array(8).fill(null).map(() => Array(8).fill(true)) : engine.calculateVision(1);
    const isTileVisible = p1Vision[sel.y][sel.x];

    // Mask enemy units on tiles shrouded by Fog of War
    const rawUnit = engine.getAllUnits().find(u => u.x === sel.x && u.y === sel.y && u.isAlive());
    const unitOnTile = (rawUnit && (rawUnit.owner === 1 || isTileVisible)) ? rawUnit : null;

    const colLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][sel.x] || String(sel.x);
    const rowNum = sel.y + 1;
    const sectorCoord = `SECTOR [${colLetter}${rowNum}]`;

    let html = '';
    if (!isTileVisible && !isTerrainView) {
      html += `
        <div class="dossier-card">
          <div class="dossier-sector-header">
            <span class="dossier-coord-stamp">${sectorCoord}</span>
            <span class="dossier-status-fog">TERRA INCOGNITA</span>
          </div>
          <div class="dossier-fog-body">
            <span class="dossier-fog-icon">&#x25A6;</span>
            <p class="dossier-fog-desc">Sector shrouded in tactical Fog of War. Deploy Recon scout or launch a Flare to survey area.</p>
          </div>
        </div>
      `;
    } else {
      const defPct = Math.round((tile.defenseBonus || 0) * 100);
      const isLOSBlocked = tile.id === 'FOREST' || tile.id === 'MOUNTAIN';

      let badgesHtml = '';
      let terrainIntelHtml = '';
      if (tile.id === 'SWAMP') {
        badgesHtml = `
          <span class="dossier-pill dossier-pill-block" title="Hazardous Defense Penalty">DEF -10%</span>
          <span class="dossier-pill dossier-pill-hazard" title="Infantry halts immediately for 1 turn upon entry">&#x1F6B6; INFANTRY: MIRED 1T (SLOW)</span>
          <span class="dossier-pill dossier-pill-block" title="Vehicles are completely impassable">&#x1F6AB; VEHICLES: IMPASSABLE</span>
          <span class="dossier-pill dossier-pill-los" title="Tactical Sightlines">VISION OPEN</span>
        `;
        terrainIntelHtml = `
          <div class="dossier-terrain-intel dossier-intel-hazard">
            <strong>⚠️ HAZARD INTEL:</strong> Heavy mud, swamp &amp; pond mire. Infantry entering this sector are mired and forced to stay for 1 turn. Subsequent mud &amp; pond traversal is slowed to 1 tile/turn. <strong>Completely impassable to vehicles.</strong>
          </div>
        `;
      } else {
        const moveCost = tile.id === 'FOREST' ? '1.5x' : ((tile.id === 'MOUNTAIN' || tile.id === 'WATER') ? 'IMPASSABLE' : '1.0x');
        badgesHtml = `
          <span class="dossier-pill dossier-pill-def" title="Ballistic Cover Defense Bonus">
            DEF ${defPct >= 0 ? '+' : ''}${defPct}%
          </span>
          <span class="dossier-pill ${moveCost === 'IMPASSABLE' ? 'dossier-pill-block' : 'dossier-pill-mov'}" title="Movement Factor">
            MOV ${moveCost}
          </span>
          <span class="dossier-pill ${isLOSBlocked ? 'dossier-pill-block' : 'dossier-pill-los'}" title="Tactical Vision & Sightline">
            ${isLOSBlocked ? 'VISION BLOCKED' : 'VISION OPEN'}
          </span>
          ${(tile.id === 'CAPTURE_ZONE' || tile.id === 'MAIN_BASE') ? `<span class="dossier-pill dossier-pill-ink">+10 INK</span>` : ''}
        `;
      }

      let spawnStatusHtml = '';
      if ((tile.id === 'CAPTURE_ZONE' || tile.id === 'MAIN_BASE') && tile.owner === 1) {
        if (unitOnTile) {
          spawnStatusHtml = `<div class="dossier-spawn-status occupied">&#x26A0;&#xFE0F; DEPLOY POINT OCCUPIED</div>`;
        } else {
          spawnStatusHtml = `<div class="dossier-spawn-status ready">&#x2713; DEPLOY POINT READY</div>`;
        }
      }

      html += `
        <div class="dossier-card">
          <div class="dossier-sector-header">
            <span class="dossier-coord-stamp">${sectorCoord}</span>
            <span class="dossier-terrain-title">${tile.name}</span>
          </div>
          <div class="dossier-badge-row">
            ${badgesHtml}
          </div>
          ${terrainIntelHtml}
          ${spawnStatusHtml}
        </div>
      `;
    }

    if (unitOnTile) {
      const isFriendly = unitOnTile.owner === 1;
      const waypointsCount = unitOnTile.waypoints.length;
      const hpPct = Math.max(0, Math.min(100, Math.round((unitOnTile.hp / unitOnTile.maxHp) * 100)));
      const roleLabel = unitOnTile.category || 'COMBAT';
      const roleClass = (unitOnTile.category === 'VEHICLE' || unitOnTile.category === 'ARMOR') ? 'role-vehicle' : (unitOnTile.category === 'INFANTRY' ? 'role-infantry' : 'role-support');

      const badgeHtml = (typeof UnitIcons !== 'undefined')
        ? UnitIcons.getBadgeHtml(unitOnTile.typeKey || unitOnTile.id, { size: 'lg', owner: unitOnTile.owner })
        : `<span class="dossier-unit-symbol">${unitOnTile.symbol}</span>`;

      html += `
        <div class="dossier-unit-card">
          <div class="dossier-unit-header">
            ${badgeHtml}
            <div class="dossier-unit-meta-col">
              <span class="dossier-allegiance-badge ${isFriendly ? 'allegiance-friendly' : 'allegiance-enemy'}">
                ${isFriendly ? '&bull; FRIENDLY SQUAD &bull; ALLIED' : '&bull; ENEMY CONTACT &bull; AXIS'}
              </span>
              <div class="dossier-unit-title-row">
                <span class="dossier-unit-name">${unitOnTile.name}</span>
                <span class="unit-role-tag ${roleClass}">${roleLabel}</span>
              </div>
            </div>
          </div>

          <div class="dossier-hp-section">
            <div class="dossier-hp-meta">
              <span class="dossier-hp-lbl">INTEGRITY</span>
              <span class="dossier-hp-val">${unitOnTile.hp} / ${unitOnTile.maxHp} HP (${hpPct}%)</span>
            </div>
            <div class="dossier-hp-track">
              <div class="dossier-hp-fill ${isFriendly ? (hpPct > 50 ? 'hp-good' : 'hp-warn') : 'hp-enemy'}" style="width: ${hpPct}%;"></div>
            </div>
          </div>

          <div class="dossier-stats-strip">
            <span>ATK <strong>${unitOnTile.attack}</strong></span>
            <span>RNG <strong>${unitOnTile.attackRange}</strong></span>
            <span>MOV <strong>${unitOnTile.moveRange}</strong></span>
            <span>VIS <strong>${unitOnTile.visionRange || 2}</strong></span>
          </div>

          ${(tile.id === 'SWAMP' && unitOnTile.category === 'INFANTRY') ? `<div class="dossier-mired-tag" style="background:rgba(217,119,6,0.25); color:#fde68a; border:1px solid #d97706; padding:3px 6px; font-size:0.7rem; font-family:var(--font-mono); border-radius:3px; margin-top:6px; font-weight:700; text-align:center;">⚠️ MIRED IN MUD / POND (SLOWED TO 1 TILE/TURN)</div>` : ''}
          ${(isFriendly && waypointsCount > 0) ? `<div class="dossier-orders-tag">ORDERS: ${waypointsCount} WAYPOINTS QUEUED</div>` : ''}
      `;

      if (unitOnTile.owner === 1 && engine.phase === 'PLANNING') {
        const canAmbush = unitOnTile.category === 'INFANTRY' && tile.id === 'FOREST';
        html += `
          <div class="dossier-stance-block">
            <label class="dossier-stance-label">TACTICAL STANCE</label>
            <div class="dossier-stance-btns">
              <button id="stance-adv" class="btn-sketch dossier-stance-btn ${unitOnTile.stance === 'ADVANCE' ? 'active' : ''}">Advance</button>
              <button id="stance-def" class="btn-sketch dossier-stance-btn ${unitOnTile.stance === 'DEFEND' ? 'active' : ''}">Defend</button>
              <button id="stance-amb" class="btn-sketch dossier-stance-btn ${unitOnTile.stance === 'AMBUSH' ? 'active' : ''}" ${!canAmbush ? 'disabled title="Ambush: Infantry in Forest only"' : ''}>Ambush</button>
            </div>
            <button id="btn-cancel-unit-plan" class="btn-sketch btn-danger dossier-cancel-btn">
              Cancel Unit Orders
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

    // Update Tactical Engagement Forecast (Zero-Hidden-Math Combat Predictor)
    const forecastCard = document.getElementById('combat-forecast-card');
    if (forecastCard) {
      let forecast = null;
      const factionsMap = { 1: engine.player1Faction, 2: engine.player2Faction };

      if (unitOnTile) {
        if (unitOnTile.owner === 2) {
          // Player is inspecting an enemy unit! Find best friendly attacker
          const friendlyUnits = engine.players[1].units.filter(u => u.isAlive());
          let bestAttacker = friendlyUnits.find(u => {
            const lastWp = u.waypoints.length > 0 ? u.waypoints[u.waypoints.length - 1] : { x: u.x, y: u.y };
            return CombatSystem.getDistance(lastWp, unitOnTile) <= u.attackRange;
          }) || friendlyUnits.find(u => CombatSystem.getDistance(u, unitOnTile) <= u.attackRange);

          if (!bestAttacker && friendlyUnits.length > 0) {
            bestAttacker = friendlyUnits.reduce((closest, cur) => {
              const dCur = CombatSystem.getDistance(cur, unitOnTile);
              const dClo = CombatSystem.getDistance(closest, unitOnTile);
              return dCur < dClo ? cur : closest;
            }, friendlyUnits[0]);
          }

          if (bestAttacker) {
            forecast = CombatSystem.getForecast(bestAttacker, unitOnTile, engine.grid, factionsMap);
          }
        } else if (unitOnTile.owner === 1) {
          // Player is inspecting friendly unit! Find visible enemy targets in range
          const enemyUnits = engine.players[2].units.filter(u => u.isAlive() && p1Vision[u.y][u.x]);
          const targetEnemy = enemyUnits.find(e => CombatSystem.getDistance(unitOnTile, e) <= unitOnTile.attackRange) ||
                              (enemyUnits.length > 0 ? enemyUnits.reduce((closest, cur) => {
                                const dCur = CombatSystem.getDistance(unitOnTile, cur);
                                const dClo = CombatSystem.getDistance(unitOnTile, closest);
                                return dCur < dClo ? cur : closest;
                              }, enemyUnits[0]) : null);

          if (targetEnemy) {
            forecast = CombatSystem.getForecast(unitOnTile, targetEnemy, engine.grid, factionsMap);
          }
        }
      }

      if (forecast) {
        forecastCard.style.display = 'flex';
        const targetNameEl = document.getElementById('forecast-target-name');
        const dmgEl = document.getElementById('forecast-damage-val');
        const armorEl = document.getElementById('forecast-armor-val');
        const retEl = document.getElementById('forecast-retaliation-val');
        const noteEl = document.getElementById('forecast-note');

        if (targetNameEl) targetNameEl.textContent = `${forecast.attacker.name} vs ${forecast.defender.name}`;
        if (dmgEl) dmgEl.textContent = `${forecast.minDamage}–${forecast.maxDamage} HP`;
        if (armorEl) armorEl.textContent = forecast.armorMitigationPercent > 0 ? `-${forecast.armorMitigationPercent}%` : 'None';
        if (retEl) {
          retEl.textContent = forecast.canRetaliate ? `${forecast.retaliationMin}–${forecast.retaliationMax} HP` : 'Safe (Out of Range)';
          retEl.style.color = forecast.canRetaliate ? '#fbbf24' : '#4ade80';
        }
        if (noteEl) {
          if (forecast.counterNote) {
            noteEl.textContent = `⚠️ ${forecast.counterNote}`;
            noteEl.style.display = 'block';
          } else {
            noteEl.style.display = 'none';
          }
        }
      } else {
        forecastCard.style.display = 'none';
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
        div.innerHTML = `<b style="color:${color};">${ownerTag} ${log.playerName}</b> recruited <b>[${log.unitIcon}] ${log.unitName}</b> at <span style="color:#4ade80; font-weight:bold;">${formatCoord(log.x, log.y)}</span>`;
      } else if (log.type === 'ABILITY') {
        const ownerTag = log.playerOwner === 1 ? 'P1' : 'AI';
        div.innerHTML = `<b>${ownerTag} ${log.playerName}</b> deployed <b>${log.abilityName}</b> at ${formatCoord(log.x, log.y)}`;
      } else if (log.type === 'ARTILLERY_IMPACT') {
        div.innerHTML = `<b>${log.playerName} Heavy Artillery</b> barrage hit target zone ${formatCoord(log.x, log.y)}`;
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
        div.innerHTML = `<b>${log.playerName} [${log.unitIcon}] ${log.unitName}</b> <span style="color:#4ade80; font-weight:bold;">CAPTURED</span> Supply Zone at ${formatCoord(log.x, log.y)}`;
      }

      this.actionLogBox.appendChild(div);
    });

    this.actionLogBox.scrollTop = this.actionLogBox.scrollHeight;
  }
}

class BootcampManager {
  constructor(app) {
    this.app = app;
    this.activeLesson = null;
    this.currentStep = 1;
    this.savedProgress = this.loadProgress();
    this.easterEggActive = false;

    window.addEventListener('resize', () => {
      if (this.activeLesson && this.app?.engine) {
        this.updateHUD(this.app.engine);
      }
    });
  }

  loadProgress() {
    try {
      const data = localStorage.getItem('ink_bootcamp_progress');
      return data ? JSON.parse(data) : {};
    } catch(e) {
      return {};
    }
  }

  saveProgress(lessonId) {
    this.savedProgress[lessonId] = true;
    try {
      localStorage.setItem('ink_bootcamp_progress', JSON.stringify(this.savedProgress));
    } catch(e){}
    this.updateMenuUI();
  }

  isLessonCompleted(lessonId) {
    return !!this.savedProgress[lessonId];
  }

  getCompletedCount() {
    return [1, 2, 3, 4, 5, 6, 7, 8].filter(id => this.isLessonCompleted(id)).length;
  }

  startLesson(lessonId) {
    this.activeLesson = lessonId;
    this.currentStep = 1;
    this.easterEggActive = false;

    const pointer = document.getElementById('bootcamp-pointer-hint');
    if (pointer) {
      pointer.style.display = 'none';
      pointer.classList.remove('pointer-below');
    }
    const dialog = document.getElementById('bootcamp-instructor-dialog');
    if (dialog) dialog.style.display = 'none';

    const completeModal = document.getElementById('modal-bootcamp-complete');
    if (completeModal) completeModal.style.display = 'none';
    const failedModal = document.getElementById('modal-bootcamp-failed');
    if (failedModal) failedModal.style.display = 'none';

    const menu = document.getElementById('main-menu-overlay');
    if (menu) menu.style.display = 'none';
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.classList.remove('game-blurred');

    this.app.launchBootcampLesson(lessonId);
  }

  updateMenuUI() {
    const count = this.getCompletedCount();
    const fill = document.getElementById('bootcamp-progress-fill');
    const label = document.getElementById('bootcamp-progress-label');
    if (fill) fill.style.width = `${(count / 8) * 100}%`;
    if (label) label.textContent = `Bootcamp Progress: ${count}/8 Lessons Completed`;

    for (let i = 1; i <= 8; i++) {
      const card = document.getElementById(`bootcamp-card-${i}`);
      if (card) {
        if (this.isLessonCompleted(i)) {
          card.classList.add('completed');
          const btn = card.querySelector('.btn-bootcamp-start');
          if (btn) btn.textContent = 'Replay Lesson';
        } else {
          card.classList.remove('completed');
          const btn = card.querySelector('.btn-bootcamp-start');
          if (btn) btn.textContent = i === 8 ? 'Start Graduation' : `Start Lesson ${i}`;
        }
      }
    }

    const certTitle = document.getElementById('bootcamp-cert-status');
    const certDetails = document.getElementById('bootcamp-cert-details');
    const certIcon = document.getElementById('bootcamp-cert-icon');
    if (certTitle && certDetails) {
      if (count >= 8) {
        certTitle.textContent = 'Tactical Certification: CERTIFIED COMMANDER';
        certTitle.classList.add('unlocked');
        certDetails.textContent = 'You have mastered all 8 tactical training doctrines!';
        if (certIcon) certIcon.textContent = '★';
      } else {
        certTitle.textContent = `Tactical Certification: ${count}/8 Completed`;
        certTitle.classList.remove('unlocked');
        certDetails.textContent = `Complete all 8 Officer Bootcamp lessons to earn Certified Commander.`;
        if (certIcon) certIcon.textContent = '';
      }
    }
  }

  triggerLessonEasterEgg(lessonId, customQuip) {
    if (this.easterEggActive) return;
    this.easterEggActive = true;

    try {
      if (this.app.audio) {
        this.app.audio.playAlarmSound();
        setTimeout(() => {
          try { this.app.audio.playPencilScratch(); } catch(e){}
        }, 250);
      }
    } catch(e) {}

    const modal = document.getElementById('modal-bootcamp-easteregg');
    const quoteEl = document.getElementById('bootcamp-easteregg-quote');
    const pointer = document.getElementById('bootcamp-pointer-hint');
    if (pointer) pointer.style.display = 'none';
    if (modal) {
      if (quoteEl) quoteEl.textContent = `"${customQuip}"`;
      modal.style.display = 'flex';
    }

    const instructorText = document.getElementById('bootcamp-instructor-text');
    if (instructorText) {
      instructorText.innerHTML = `<span style="color:#f59e0b; font-weight:700;">[UNAUTHORIZED TACTIC]</span> ${customQuip}`;
    }

    if (this.app.ui) {
      this.app.ui.showToast('🥚 General Crow Intercept', customQuip);
    }
  }

  validateCanvasClick(gridCoords, prevSelected) {
    // Allow free tactical exploration across the battlefield
    return true;
  }

  triggerEasterEgg(unit) {
    if (this.easterEggActive) return;
    this.easterEggActive = true;

    try {
      if (this.app.audio) {
        this.app.audio.playAlarmSound();
        setTimeout(() => {
          try { this.app.audio.playPencilScratch(); } catch(e){}
        }, 250);
      }
    } catch(e) {}

    const quips = [
      "Nice try, Rookie! How about sticking to the plan this time?",
      "Whoa there, Alexander the Great! Did you really think you could skip straight to the medal ceremony? Nice try, Rookie. Now back to the objective!",
      "Look at you, Captain Price infiltrating enemy headquarters before learning how to walk. Impressive initiative, completely unauthorized. Stick to the plan, Cadet!"
    ];

    // Sequential round-robin cycle: guarantees 1 -> 2 -> 3 -> 1 -> 2 -> 3...
    // Defaults to 2 so the very first trigger immediately serves Message 1 (index 0)
    let lastIdx = 2;
    try {
      const stored = localStorage.getItem('ink_bootcamp_easteregg_rr_idx');
      if (stored !== null && stored !== '') {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < quips.length) {
          lastIdx = parsed;
        }
      }
    } catch(e) {}

    const nextIdx = (lastIdx + 1) % quips.length;

    try {
      localStorage.setItem('ink_bootcamp_easteregg_rr_idx', String(nextIdx));
    } catch(e) {}

    const chosenQuip = quips[nextIdx];
    console.log(`[General Crow Easter Egg] Quip #${nextIdx + 1} of ${quips.length}: "${chosenQuip}"`);

    const modal = document.getElementById('modal-bootcamp-easteregg');
    const quoteEl = document.getElementById('bootcamp-easteregg-quote');
    const pointer = document.getElementById('bootcamp-pointer-hint');
    if (pointer) pointer.style.display = 'none';
    if (modal) {
      if (quoteEl) quoteEl.textContent = `"${chosenQuip}"`;
      modal.style.display = 'flex';
    }

    const instructorText = document.getElementById('bootcamp-instructor-text');
    if (instructorText) {
      instructorText.innerHTML = `<span style="color:#f59e0b; font-weight:700;">[UNAUTHORIZED HEROICS]</span> ${chosenQuip}`;
    }

    if (this.app.ui) {
      this.app.ui.showToast('🥚 Rogue Cadet Detected', 'General Crow caught you trying to cheese the exam!');
    }
  }

  nudgePointer() {
    const hint = document.getElementById('bootcamp-pointer-hint');
    if (hint) {
      const animName = hint.classList.contains('pointer-below') ? 'pointerPulseBelow' : 'pointerPulse';
      hint.style.animation = 'none';
      void hint.offsetWidth;
      hint.style.animation = `${animName} 0.3s 3 alternate`;
    }
  }

  updateHUD(engine) {
    if (!this.activeLesson) {
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (dialog) dialog.style.display = 'none';
      if (pointer) pointer.style.display = 'none';
      return;
    }

    const dialog = document.getElementById('bootcamp-instructor-dialog');
    if (dialog) dialog.style.display = 'flex';

    if (this.checkVictory(engine)) {
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (pointer) {
        pointer.style.display = 'none';
        pointer.classList.remove('pointer-below');
      }
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      if (dialog) dialog.style.display = 'none';
      this.onLessonVictory(engine);
      return;
    }

    if (this.checkDefeat(engine)) {
      const pointer = document.getElementById('bootcamp-pointer-hint');
      if (pointer) {
        pointer.style.display = 'none';
        pointer.classList.remove('pointer-below');
      }
      const dialog = document.getElementById('bootcamp-instructor-dialog');
      if (dialog) dialog.style.display = 'none';
      this.onLessonDefeat(engine);
      return;
    }

    this.evaluateCurrentStep(engine);
  }

  evaluateCurrentStep(engine) {
    const stepLabel = document.getElementById('bootcamp-instructor-step');
    const textEl = document.getElementById('bootcamp-instructor-text');

    if (this.activeLesson === 1) {
      const squad = engine.players[1].units.find(u => u.isAlive());
      const isSelected = squad && this.app.renderer.selectedTile && this.app.renderer.selectedTile.x === squad.x && this.app.renderer.selectedTile.y === squad.y;
      const hasWaypoints = squad && squad.waypoints && squad.waypoints.length > 0;

      if (!isSelected && !hasWaypoints) {
        this.currentStep = 1;
        if (stepLabel) stepLabel.textContent = 'Step 1 of 3';
        if (textEl) textEl.textContent = `Click your Rifle Squad at ${formatCoord(squad ? squad.x : 1, squad ? squad.y : 3)} to select it.`;
        if (squad) this.positionPointerAtTile(squad.x, squad.y, '1. Click Squad');
      } else if (!hasWaypoints) {
        this.currentStep = 2;
        if (stepLabel) stepLabel.textContent = 'Step 2 of 3';
        if (textEl) textEl.textContent = `Click adjacent tiles to draw a path to the Green Flag at ${formatCoord(3, 3)}.`;
        this.positionPointerAtTile(3, 3, '2. Plot Path to Flag');
      } else if (engine.phase === 'PLANNING') {
        this.currentStep = 3;
        if (stepLabel) stepLabel.textContent = 'Step 3 of 3';
        if (textEl) textEl.textContent = 'Orders locked! Now click "End Phase" on the top right to execute simultaneous movement.';
        this.positionPointerAtElement('btn-end-turn', '3. Click End Phase');
      } else {
        this.positionPointerAtTile(null, null);
      }
    } else if (this.activeLesson === 2) {
      const squad = engine.players[1].units.find(u => u.isAlive());
      const isSelected = this.app.renderer.selectedTile && this.app.renderer.selectedTile.x === 2 && this.app.renderer.selectedTile.y === 3;

      if (!isSelected) {
        this.currentStep = 1;
        if (stepLabel) stepLabel.textContent = 'Step 1 of 3';
        if (textEl) textEl.textContent = 'Click your Rifle Squad concealed inside the Forest corridor.';
        this.positionPointerAtTile(2, 3, '1. Select Forest Squad');
      } else if (engine.phase === 'PLANNING') {
        this.currentStep = 2;
        if (stepLabel) stepLabel.textContent = 'Step 2 of 3';
        if (textEl) textEl.textContent = 'Notice squad is in AMBUSH stance (50% cover defense). Click "End Phase" to spring the trap!';
        this.positionPointerAtElement('btn-end-turn', '2. Spring Ambush');
      } else {
        this.positionPointerAtTile(null, null);
      }
    } else if (this.activeLesson === 3) {
      const scout = engine.players[1].units.find(u => u.typeKey === 'SCOUT' && u.isAlive());
      const depotCaptured = engine.grid[3][4].owner === 1;
      const recruitedUnit = engine.players[1].units.length >= 2;

      if (!depotCaptured) {
        const hasWaypoints = scout && scout.waypoints && scout.waypoints.length > 0;
        if (!hasWaypoints) {
          this.currentStep = 1;
          if (stepLabel) stepLabel.textContent = 'Step 1 of 3 • Plot Movement';
          if (textEl) textEl.innerHTML = `Select your fast Scout and click the Gold Supply Depot at ${formatCoord(4, 3)} to draw a movement path.`;
          this.positionPointerAtTile(4, 3, '1. Move to Gold Depot');
        } else {
          this.currentStep = 2;
          if (stepLabel) stepLabel.textContent = 'Step 2 of 3 • Capture Depot';
          if (textEl) textEl.innerHTML = 'Orders locked! Click "End Phase" to advance and capture the Supply Depot.';
          this.positionPointerAtElement('btn-end-turn', '2. Capture Depot');
        }
      } else if (!recruitedUnit) {
        this.currentStep = 3;
        if (stepLabel) stepLabel.textContent = 'Step 3 of 3 • Empty Tile Rule';
        if (textEl) {
          textEl.innerHTML = `<b>Depot Secured (+10 Ink)!</b><br><span style="color:#f59e0b; font-weight:700;">TACTICAL RULE:</span> Captured Depots can spawn units, <u>BUT THE TILE MUST BE EMPTY</u>. Because your Scout is occupying the Depot at ${formatCoord(4, 3)}, deploy your Rifle Squad at your empty Base at ${formatCoord(1, 3)}.`;
        }
        this.positionPointerAtElement('store-card-RIFLEMAN', '3. Recruit at Base');
      } else {
        this.positionPointerAtTile(null, null);
      }
    } else if (this.activeLesson === 4) {
      if (stepLabel) stepLabel.textContent = 'The Counter Triangle';
      if (textEl) textEl.textContent = 'AT pierces Armor (2.5x), Rifle flanks AT, Vehicle crushes Infantry (1.5x). Plot attacks and click End Phase!';
      this.positionPointerAtElement('btn-end-turn', 'Execute Counters');
    } else if (this.activeLesson === 5) {
      // Lesson 5: Bog Shortcut & Chokepoint Race
      const at = engine.players[1].units.find(u => u.isAlive());
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      const atX = at ? at.x : -1;
      const atY = at ? at.y : -1;

      if (!at || enemies.length === 0) {
        this.positionPointerAtTile(null, null);
      } else if (atX === 1 && atY === 3) {
        // Step 1: AT Crew at start position (1,3) -> take mud shortcut to (2,3)
        this.currentStep = 1;
        if (stepLabel) stepLabel.textContent = 'Step 1 of 3 • Take Mud Shortcut';
        if (textEl) textEl.innerHTML = `Both bases are placed symmetrically, and hostiles deployed a Light Vehicle at ${formatCoord(7, 3)}. As the crow flies, it is the <b>almost same route</b> — but they have a 3-speed vehicle! However, columns F & G (including ${formatCoord(5, 0)}, ${formatCoord(5, 1)}, ${formatCoord(6, 0)}, ${formatCoord(6, 1)}) are deep mud. Vehicles <b>cannot cross mud at all</b> and must take a long southern detour. Order your AT Crew into the <b>Mud shortcut</b> at ${formatCoord(2, 3)} and click "End Phase"!`;
        if (at.waypoints && at.waypoints.length > 0) {
          this.positionPointerAtElement('btn-end-turn', '1. Click End Phase');
        } else {
          this.positionPointerAtTile(2, 3, '1. Wade into Mud');
        }
      } else if (atX === 2 && atY === 3) {
        // Step 2: AT Crew in mud at (2,3) -> seize the forest pass at (3,3)
        this.currentStep = 2;
        if (stepLabel) stepLabel.textContent = 'Step 2 of 3 • Seize the Forest Pass';
        if (textEl) textEl.innerHTML = `Mire has cleared! The enemy vehicle was forced into a massive southern detour, so <b>we arrived earlier</b>! Move your AT Crew into the <b>Forest Pass</b> at ${formatCoord(3, 3)} and click "End Phase". Notice: <u>simply arriving does NOT win the game</u> — we must eliminate the approaching vehicle!`;
        if (at.waypoints && at.waypoints.length > 0) {
          this.positionPointerAtElement('btn-end-turn', '2. Click End Phase');
        } else {
          this.positionPointerAtTile(3, 3, '2. Seize Forest Pass');
        }
      } else if (atX === 3 && atY === 3) {
        // Step 3: Camping in the Forest Pass
        this.currentStep = 3;
        if (stepLabel) stepLabel.textContent = 'Step 3 of 3 • Ambush from the Forest';
        if (textEl) textEl.innerHTML = `Hostile Armored Car is closing in! <b style="color:#ef4444;">TACTICAL LAW:</b> Your squad has only 25 HP — in the open, you die horribly! The <b>ONLY way you win is CAMPING in this Forest</b> in AMBUSH stance for the 1.5x Ambush Strike. Hold position and click "End Phase" to destroy them as they arrive!`;
        this.positionPointerAtElement('btn-end-turn', '3. Spring Ambush');
      } else {
        this.positionPointerAtTile(null, null);
      }
    } else if (this.activeLesson === 6) {
      // Lesson 6: Command Abilities (Air & Firepower)
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      const p1Vision = engine.calculateVision(1);
      const enemySpotted = enemies.some(e => p1Vision[e.y] && p1Vision[e.y][e.x]);
      const artilleryActive = engine.activeArtilleryStrikes.some(art => art.owner === 1);

      if (!enemySpotted && engine.activeFlares.length === 0) {
        this.currentStep = 1;
        if (stepLabel) stepLabel.textContent = 'Step 1 of 3 • Recon Flare';
        if (textEl) textEl.innerHTML = `Hostiles are concealed by Fog of War behind the ridge. Click <b>"Recon Flare"</b> (2 CP) in the Command panel and launch it at ${formatCoord(6, 3)}!`;
        this.positionPointerAtElement('btn-ability-flare', '1. Click Recon Flare');
      } else if (!artilleryActive && enemies.length > 0) {
        this.currentStep = 2;
        if (stepLabel) stepLabel.textContent = 'Step 2 of 3 • Artillery Strike';
        if (textEl) textEl.innerHTML = `Target revealed at ${formatCoord(6, 3)}! Click <b>"Artillery Strike"</b> (4 CP) and target the enemy squad to call in an off-map barrage!`;
        this.positionPointerAtElement('btn-ability-artillery', '2. Call Artillery Strike');
      } else {
        this.currentStep = 3;
        if (stepLabel) stepLabel.textContent = 'Step 3 of 3 • Execute Barrage';
        if (textEl) textEl.innerHTML = `Coordinates confirmed! Click <b>"End Phase"</b> to watch the artillery strike obliterate the enemy!`;
        this.positionPointerAtElement('btn-end-turn', '3. Launch Strike');
      }
    } else if (this.activeLesson === 7) {
      // Lesson 7: Base Defense & Siege (Liberation Protocol)
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      const forwardUnit = engine.players[1].units.find(u => u.isAlive() && u.x === 3 && u.y === 3);

      if (enemies.length > 0) {
        this.currentStep = 1;
        if (stepLabel) stepLabel.textContent = 'Step 1 of 2 • Break the Siege';
        if (textEl) textEl.innerHTML = `Your forward Depot at ${formatCoord(3, 3)} is <b style="color:#ef4444;">UNDER SIEGE</b> by an adjacent enemy raider at ${formatCoord(4, 3)}! Advance your AT Crew from ${formatCoord(1, 3)} to ${formatCoord(2, 3)} to get in range and eliminate the raider!`;
        const at = engine.players[1].units.find(u => u.isAlive() && u.typeKey === 'ANTI_TANK');
        if (at && at.x === 1 && at.y === 3) {
          this.positionPointerAtTile(2, 3, '1. Advance to Fire');
        } else {
          this.positionPointerAtTile(4, 3, '1. Eliminate Raider');
        }
      } else if (!forwardUnit) {
        this.currentStep = 2;
        if (stepLabel) stepLabel.textContent = 'Step 2 of 2 • Forward Deployment';
        if (textEl) textEl.innerHTML = `<b>Siege lifted!</b> The forward Supply Depot is liberated and clear. Open the Store, recruit a <b>Rifle Squad</b>, and deploy them directly onto the forward Depot at ${formatCoord(3, 3)} to complete the doctrine!`;
        this.positionPointerAtElement('store-card-RIFLEMAN', '2. Deploy at Depot');
      } else {
        this.positionPointerAtTile(null, null);
      }
    } else if (this.activeLesson === 8) {
      if (stepLabel) stepLabel.textContent = 'Grand Graduation Skirmish';
      if (textEl) textEl.textContent = 'Operation Diesel Storm: Capture forward Depots, utilize mud corridors & forest cover, call in Command Abilities, and destroy the enemy HQ at [H8] to graduate!';
      this.positionPointerAtTile(null, null);
    }
  }

  positionPointerAtTile(gx, gy, labelText = 'Click Here') {
    const hint = document.getElementById('bootcamp-pointer-hint');
    const label = document.getElementById('bootcamp-pointer-label');
    if (!hint) return;
    if (gx === null || gy === null) {
      hint.style.display = 'none';
      return;
    }
    const canvas = this.app.canvas;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const canvasPt = this.app.renderer.getScreenCoords(gx, gy);
    const screenX = canvasRect.left + (canvasPt.x + 35) * scaleX;
    const screenY = canvasRect.top + (canvasPt.y + 15) * scaleY;

    hint.classList.remove('pointer-below');
    hint.style.left = `${screenX}px`;
    hint.style.top = `${screenY}px`;
    hint.style.display = 'flex';
    if (label) label.textContent = labelText;
  }

  positionPointerAtElement(elementId, labelText = 'Click Here') {
    const hint = document.getElementById('bootcamp-pointer-hint');
    const label = document.getElementById('bootcamp-pointer-label');
    const targetEl = document.getElementById(elementId);
    if (!hint || !targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();

    let screenX = targetRect.left + targetRect.width / 2;
    // Clamp screenX so tooltip never overflows viewport horizontally
    const pad = 100;
    screenX = Math.max(pad, Math.min(window.innerWidth - pad, screenX));

    // If element is near top edge of viewport (e.g. End Phase button), point from below
    if (targetRect.top < 65) {
      hint.classList.add('pointer-below');
      hint.style.left = `${screenX}px`;
      hint.style.top = `${targetRect.bottom + 6}px`;
    } else {
      hint.classList.remove('pointer-below');
      hint.style.left = `${screenX}px`;
      hint.style.top = `${targetRect.top - 6}px`;
    }

    hint.style.display = 'flex';
    if (label) label.textContent = labelText;
  }

  checkVictory(engine) {
    if (!this.activeLesson) return false;
    if (this.activeLesson === 1) {
      const squad = engine.players[1].units.find(u => u.isAlive());
      return squad && squad.x >= 3 && squad.y === 3;
    }
    if (this.activeLesson === 2) {
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      return enemies.length === 0;
    }
    if (this.activeLesson === 3) {
      const depotCaptured = engine.grid[3][4].owner === 1;
      const recruited = engine.players[1].units.length >= 2;
      return depotCaptured && recruited;
    }
    if (this.activeLesson === 4) {
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      return enemies.length === 0;
    }
    if (this.activeLesson === 5) {
      const p1Alive = engine.players[1].units.filter(u => u.isAlive()).length;
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      return p1Alive > 0 && enemies.length === 0 && engine.turnNumber >= 3;
    }
    if (this.activeLesson === 6) {
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      return enemies.length === 0;
    }
    if (this.activeLesson === 7) {
      const enemies = engine.players[2].units.filter(u => u.isAlive());
      const forwardUnit = engine.players[1].units.find(u => u.isAlive() && u.x === 3 && u.y === 3);
      return enemies.length === 0 && !!forwardUnit;
    }
    if (this.activeLesson === 8) {
      return engine.winner === 1;
    }
    return false;
  }

  checkDefeat(engine) {
    if (!this.activeLesson) return false;
    if (engine.winner === 2) return true;
    const p1Units = engine.players[1]?.units || [];
    const p1Alive = p1Units.filter(u => u.isAlive()).length;
    if (p1Alive === 0) return true;
    return false;
  }

  onLessonVictory(engine) {
    const currentId = this.activeLesson;
    this.saveProgress(currentId);

    // Hide tactical pointer & instructor briefing card immediately on victory
    this.positionPointerAtTile(null, null);
    const hint = document.getElementById('bootcamp-pointer-hint');
    if (hint) {
      hint.style.display = 'none';
      hint.classList.remove('pointer-below');
    }
    const dialog = document.getElementById('bootcamp-instructor-dialog');
    if (dialog) dialog.style.display = 'none';

    try { this.app.audio.playVictorySound(); } catch(e){}

    const modal = document.getElementById('modal-bootcamp-complete');
    const title = document.getElementById('bootcamp-complete-title');
    const sub = document.getElementById('bootcamp-complete-subtitle');
    const badgeArea = document.getElementById('bootcamp-complete-badge-area');
    const nextBtn = document.getElementById('btn-bootcamp-next');

    if (modal) {
      modal.style.display = 'flex';
      if (currentId < 8) {
        if (title) title.textContent = `Lesson ${currentId} Complete!`;
        if (sub) sub.textContent = `Tactical objective accomplished. Ready for Lesson ${currentId + 1}?`;
        if (badgeArea) badgeArea.style.display = 'none';
        if (nextBtn) {
          nextBtn.textContent = `Next: Lesson ${currentId + 1}`;
          nextBtn.style.display = 'block';
          nextBtn.onclick = () => window.nextBootcampLesson();
        }
      } else {
        if (title) title.textContent = `BOOTCAMP GRADUATION!`;
        if (sub) sub.textContent = `Outstanding work, Commander! You have mastered all 8 doctrines.`;
        if (badgeArea) badgeArea.style.display = 'block';
        if (nextBtn) {
          nextBtn.textContent = `Deploy to Battlefield!`;
          nextBtn.onclick = () => {
            modal.style.display = 'none';
            window.switchMenuTab('tab-btn-play', 'tab-pane-play');
            const menu = document.getElementById('main-menu-overlay');
            if (menu) menu.style.display = 'flex';
          };
        }
      }
    }
  }

  onLessonDefeat(engine, customDebrief = null) {
    const currentId = this.activeLesson;
    this.positionPointerAtTile(null, null);
    const hint = document.getElementById('bootcamp-pointer-hint');
    if (hint) {
      hint.style.display = 'none';
      hint.classList.remove('pointer-below');
    }
    const dialog = document.getElementById('bootcamp-instructor-dialog');
    if (dialog) dialog.style.display = 'none';

    try { this.app.audio.playDefeatSound(); } catch(e){}

    const modal = document.getElementById('modal-bootcamp-failed');
    const title = document.getElementById('bootcamp-failed-title');
    const debrief = document.getElementById('bootcamp-failed-debrief');
    const lessonNum = document.getElementById('bootcamp-failed-lesson-num');

    const debriefs = {
      1: "Squad eliminated! Remember to plan your path carefully across clear terrain to reach the objective flag.",
      2: "Squad wiped out! Rifle Squads excel when coordinating simultaneous attacks and holding favorable firing positions.",
      3: "Out of reinforcements! Protect your capture unit and secure the Depot to muster vital troops.",
      4: "Recon asset lost! Use scouts to spot ahead in fog of war before advancing vulnerable forces.",
      5: "You were caught out in the open! Without Forest Ambush cover, your 25 HP squad has zero chance against vehicle autocannons. Take the mud shortcut, camp in the Forest Pass, and let the Ambush Strike vaporize them!",
      6: "Battery overrun! Keep spotters forward and blast enemy formations with indirect fire from behind cover.",
      7: "Forward depot compromised! Move your AT Crew in range, destroy the besieging raider to lift the siege, and deploy fresh reinforcements at the forward depot.",
      8: "HQ fallen or forces eliminated! Synthesize all combined arms doctrines to overcome enemy assault lines."
    };

    if (modal) {
      modal.style.display = 'flex';
      if (lessonNum) lessonNum.innerHTML = `LESSON ${currentId || 1} &bull; TACTICAL DEBRIEF`;
      if (title) title.textContent = `Squad Wiped Out!`;
      if (debrief) {
        debrief.textContent = customDebrief || debriefs[currentId] || "Your squad was eliminated in action. Review tactical doctrine and try again, Commander.";
      }
    }
  }
}

window.switchMenuTab = function(btnId, paneId) {
  document.querySelectorAll('.diesel-select-wrapper.open').forEach(w => {
    w.classList.remove('open');
    w.querySelector('.diesel-select-trigger')?.setAttribute('aria-expanded', 'false');
  });
  const tabs = [
    { btn: 'tab-btn-play', pane: 'tab-pane-play' },
    { btn: 'tab-btn-bootcamp', pane: 'tab-pane-bootcamp' },
    { btn: 'tab-btn-factions', pane: 'tab-pane-factions' },
    { btn: 'tab-btn-codex', pane: 'tab-pane-codex' },
    { btn: 'tab-btn-account', pane: 'tab-pane-account' },
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
  if (typeof UnitIcons !== 'undefined' && activePane) {
    UnitIcons.renderStaticBadges(activePane);
  }
  if (btnId === 'tab-btn-bootcamp' || btnId === 'tab-btn-account') {
    if (window.gApp && window.gApp.bootcampManager) window.gApp.bootcampManager.updateMenuUI();
  }
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.deployGameFromMenu = function() {
  if (window.checkUserBannedState && window.checkUserBannedState()) {
    alert("ACCOUNT SUSPENDED: Your Commander profile is banned by an Administrator. You cannot deploy or start matches.");
    return;
  }
  const menu = document.getElementById('main-menu-overlay');
  const gameContainer = document.getElementById('game-container');
  if (menu) menu.style.display = 'none';
  if (gameContainer) gameContainer.classList.remove('game-blurred');
  if (window.gApp) window.gApp.launchMatchFromMenu();
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.enterTerrainView = function() {
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
  const banner = document.getElementById('terrain-view-banner');
  if (banner) banner.style.display = 'block';
  if (window.gApp && window.gApp.engine) {
    window.gApp.engine.phase = 'GAME_OVER';
  }
  ['btn-end-turn', 'btn-halt-all', 'btn-cancel-abilities', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = true; el.style.opacity = '0.4'; }
  });
};

window.returnToMainMenu = function() {
  const banner = document.getElementById('terrain-view-banner');
  if (banner) banner.style.display = 'none';
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
  const bModal = document.getElementById('modal-bootcamp-complete');
  if (bModal) bModal.style.display = 'none';
  const fModal = document.getElementById('modal-bootcamp-failed');
  if (fModal) fModal.style.display = 'none';
  const pointer = document.getElementById('bootcamp-pointer-hint');
  if (pointer) {
    pointer.style.display = 'none';
    pointer.classList.remove('pointer-below');
  }
  const dialog = document.getElementById('bootcamp-instructor-dialog');
  if (dialog) dialog.style.display = 'none';
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.activeLesson = null;
    window.gApp.bootcampManager.positionPointerAtTile(null, null);
  }
  ['btn-end-turn', 'btn-halt-all', 'btn-cancel-abilities', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = false; el.style.opacity = ''; }
  });
  const menu = document.getElementById('main-menu-overlay');
  if (menu) menu.style.display = 'flex';
  try { if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch(); } catch(e){}
};

window.startBootcampLesson = function(lessonId) {
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.startLesson(lessonId);
  }
};

window.nextBootcampLesson = function() {
  const modal = document.getElementById('modal-bootcamp-complete');
  if (modal) modal.style.display = 'none';
  const fModal = document.getElementById('modal-bootcamp-failed');
  if (fModal) fModal.style.display = 'none';
  const pointer = document.getElementById('bootcamp-pointer-hint');
  if (pointer) {
    pointer.style.display = 'none';
    pointer.classList.remove('pointer-below');
  }
  const dialog = document.getElementById('bootcamp-instructor-dialog');
  if (dialog) dialog.style.display = 'none';
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.positionPointerAtTile(null, null);
    const nextId = (window.gApp.bootcampManager.activeLesson || 1) + 1;
    if (nextId <= 8) {
      window.gApp.bootcampManager.startLesson(nextId);
    } else {
      window.returnToBootcampMenu();
    }
  }
};

window.replayBootcampLesson = function() {
  const modal = document.getElementById('modal-bootcamp-complete');
  if (modal) modal.style.display = 'none';
  const fModal = document.getElementById('modal-bootcamp-failed');
  if (fModal) fModal.style.display = 'none';
  const pointer = document.getElementById('bootcamp-pointer-hint');
  if (pointer) {
    pointer.style.display = 'none';
    pointer.classList.remove('pointer-below');
  }
  const dialog = document.getElementById('bootcamp-instructor-dialog');
  if (dialog) dialog.style.display = 'none';
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.positionPointerAtTile(null, null);
    const currentId = window.gApp.bootcampManager.activeLesson || 1;
    window.gApp.bootcampManager.startLesson(currentId);
  }
};

window.returnToBootcampMenu = function() {
  const modal = document.getElementById('modal-bootcamp-complete');
  if (modal) modal.style.display = 'none';
  const fModal = document.getElementById('modal-bootcamp-failed');
  if (fModal) fModal.style.display = 'none';
  const pointer = document.getElementById('bootcamp-pointer-hint');
  if (pointer) {
    pointer.style.display = 'none';
    pointer.classList.remove('pointer-below');
  }
  const dialog = document.getElementById('bootcamp-instructor-dialog');
  if (dialog) dialog.style.display = 'none';
  const menu = document.getElementById('main-menu-overlay');
  if (menu) menu.style.display = 'flex';
  window.switchMenuTab('tab-btn-bootcamp', 'tab-pane-bootcamp');
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.activeLesson = null;
    window.gApp.bootcampManager.positionPointerAtTile(null, null);
    window.gApp.bootcampManager.updateMenuUI();
  }
};

window.dismissBootcampEasterEgg = function() {
  const modal = document.getElementById('modal-bootcamp-easteregg');
  if (modal) modal.style.display = 'none';
  if (window.gApp && window.gApp.bootcampManager) {
    window.gApp.bootcampManager.easterEggActive = false;
    const currentId = window.gApp.bootcampManager.activeLesson || 1;
    window.gApp.bootcampManager.startLesson(currentId);
  }
};

window.acceptBootcampInvite = function() {
  const modal = document.getElementById('modal-bootcamp-invite');
  if (modal) modal.style.display = 'none';
  try { localStorage.setItem('ink_bootcamp_invited', 'true'); } catch(e){}
  window.startBootcampLesson(1);
};

window.declineBootcampInvite = function() {
  const modal = document.getElementById('modal-bootcamp-invite');
  if (modal) modal.style.display = 'none';
  try { localStorage.setItem('ink_bootcamp_invited', 'true'); } catch(e){}
};

class App {
  constructor() {
    window.gApp = this;
    this.canvas = document.getElementById('sketch-canvas');
    this.renderer = new SketchRenderer(this.canvas);
    this.audio = new AudioEngine();
    this.engine = null;
    this.bootcampManager = new BootcampManager(this);
    this.ui = new UIManager(this);

    this.setupCanvasInteractions();
    this.startRenderLoop();
    this.launchMatchFromMenu(); // Pre-initialize match state in background

    setTimeout(() => {
      this.bootcampManager.updateMenuUI();
      if (!localStorage.getItem('ink_bootcamp_invited') && this.bootcampManager.getCompletedCount() === 0) {
        const invite = document.getElementById('modal-bootcamp-invite');
        if (invite) invite.style.display = 'flex';
      }
    }, 400);
  }

  launchBootcampLesson(lessonId) {
    try {
      if (this.engine) this.engine.pauseTimer();

      this.engine = new GameEngine({
        mapType: `BOOTCAMP_${lessonId}`,
        p1Faction: FACTIONS.IRON_CORPS,
        p2Faction: FACTIONS.VANGUARD_LEGION,
        isSinglePlayer: true,
        isTutorialMode: false,
        bootcampLesson: lessonId,
        aiDifficulty: 'RECRUIT',
        playbackDuration: 3,
        audio: this.audio
      });

      this.engine.bootcampLesson = lessonId;
      this.engine.bootcampManager = this.bootcampManager;
      this.engine.planningTimeRemaining = Infinity;

      this.engine.subscribe(() => {
        if (this.engine.isSinglePlayer && this.engine.phase === 'PLAYBACK' && this.engine.playbackTimeRemaining === this.engine.playbackDurationConfig) {
          CommanderAI.processTurn(this.engine, this.engine.aiDifficulty);
        }
        if (this.ui) this.ui.updateHUD(this.engine);
      });

      this.engine.startTurnTimer();
      this.renderer.selectedTile = null;

      // Re-enable HUD action buttons
      ['btn-end-turn', 'btn-halt-all', 'btn-cancel-abilities', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.style.opacity = ''; el.style.pointerEvents = ''; }
      });

      const terrainBanner = document.getElementById('terrain-view-banner');
      if (terrainBanner) terrainBanner.style.display = 'none';
      const victoryModal = document.getElementById('victory-modal');
      if (victoryModal) victoryModal.style.display = 'none';
      const bModal = document.getElementById('modal-bootcamp-complete');
      if (bModal) bModal.style.display = 'none';
      const fModal = document.getElementById('modal-bootcamp-failed');
      if (fModal) fModal.style.display = 'none';

      if (this.ui) this.ui.updateHUD(this.engine);
    } catch(err) {
      console.error('Error launching Bootcamp lesson:', err);
    }
  }

  launchMatchFromMenu() {
    if (window.checkUserBannedState && window.checkUserBannedState()) {
      return;
    }
    try {
      if (this.engine) this.engine.pauseTimer();

      const mapVal = document.getElementById('select-map')?.value || 'PRESET_1';
      const gameMode = document.getElementById('select-game-mode')?.value || 'SINGLE_PLAYER';
      const p1FactionKey = document.getElementById('select-p1-faction')?.value || 'IRON_CORPS';
      const aiDiff = document.getElementById('select-ai-difficulty')?.value || window.gAiDifficulty || 'VETERAN';
      const timerDuration = parseInt(document.getElementById('select-timer-duration')?.value || '40', 10);
      const playbackDuration = parseInt(document.getElementById('select-playback-duration')?.value || '3', 10);

      const p2FactionKey = p1FactionKey === 'IRON_CORPS' ? 'VANGUARD_LEGION' : 'IRON_CORPS';

      this.engine = new GameEngine({
        mapType: mapVal,
        p1Faction: FACTIONS[p1FactionKey],
        p2Faction: FACTIONS[p2FactionKey],
        isSinglePlayer: true,
        aiDifficulty: aiDiff,
        planningDuration: timerDuration,
        playbackDuration: playbackDuration,
        audio: this.audio
      });

      this.engine.bootcampLesson = null;
      this.engine.bootcampManager = null;
      this.engine.planningTimeRemaining = timerDuration;
      this.engine.subscribe(() => {
        if (this.engine.isSinglePlayer && this.engine.phase === 'PLAYBACK' && this.engine.playbackTimeRemaining === this.engine.playbackDurationConfig) {
          CommanderAI.processTurn(this.engine, this.engine.aiDifficulty);
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
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.classList.remove('game-blurred');
        gameContainer.style.pointerEvents = '';
        gameContainer.style.filter = '';
      }
      ['btn-end-turn', 'btn-halt-all', 'btn-cancel-abilities', 'btn-ability-flare', 'btn-ability-smoke', 'btn-ability-artillery', 'btn-open-menu'].forEach(id => {
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

      if (this.bootcampManager && this.bootcampManager.activeLesson) {
        if (!this.bootcampManager.validateCanvasClick(gridCoords, this.renderer.selectedTile)) {
          this.bootcampManager.nudgePointer();
          return;
        }
      }

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
          this.ui.showToast('Ability Deployed', `${ability.name} targeted at ${formatCoord(gridCoords.x, gridCoords.y)}!`);
          this.ui.pendingAbilityKey = null;
        } else {
          this.ui.showToast('Ability Error', res.reason);
        }
        this.renderer.selectedTile = gridCoords;
        this.ui.updateHUD(this.engine);
        return;
      }

      const prevSelected = this.renderer.selectedTile;

      // TOGGLE DESELECTION: Re-clicking the currently selected tile toggles selection off
      if (prevSelected && prevSelected.x === gridCoords.x && prevSelected.y === gridCoords.y) {
        this.renderer.selectedTile = null;
        try { this.audio.playEraserSmudge(); } catch(err){}
        this.ui.updateHUD(this.engine);
        return;
      }

      this.renderer.selectedTile = gridCoords;

      if (this.engine.phase === 'PLANNING' && prevSelected) {
        const unit = this.engine.getAllUnits().find(u => u.x === prevSelected.x && u.y === prevSelected.y && u.owner === 1);
        if (unit) {
          if (unit.category === 'VEHICLE' && this.engine.grid[gridCoords.y][gridCoords.x].id === 'SWAMP') {
            this.ui.showToast('Terrain Blocked', 'Mud, Swamp & Pond terrain is completely impassable to vehicles and tanks!');
            if (this.audio) this.audio.playEraserSmudge();
            if (this.engine.bootcampLesson === 5 && this.bootcampManager) {
              this.bootcampManager.triggerLessonEasterEgg(5, "Nice try, Mario Andretti! Tanks sink in the bog like lead weights. Did you skip the terrain briefing?!");
            }
          }

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

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      let handled = false;
      if (this.ui && this.ui.pendingAbilityKey) {
        const ab = (typeof ABILITIES !== 'undefined') ? ABILITIES[this.ui.pendingAbilityKey] : null;
        this.ui.pendingAbilityKey = null;
        this.ui.showToast('Ability Cancelled', `${ab ? ab.name : 'Targeting'} cancelled.`);
        handled = true;
      }
      if (this.renderer.selectedTile) {
        this.renderer.selectedTile = null;
        handled = true;
      }
      if (handled) {
        try { this.audio.playEraserSmudge(); } catch(err){}
        if (this.engine) this.ui.updateHUD(this.engine);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const coords = this.renderer.getGridCoords(e.clientX - rect.left, e.clientY - rect.top);
      this.renderer.hoveredTile = coords;
      this.updateCanvasSitrep(coords);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.renderer.hoveredTile = null;
      this.updateCanvasSitrep(null);
    });
  }

  updateCanvasSitrep(hoveredTile) {
    const el = document.getElementById('canvas-sitrep-text');
    if (!el) return;
    if (!hoveredTile || !this.engine || !this.engine.grid[hoveredTile.y] || !this.engine.grid[hoveredTile.y][hoveredTile.x]) {
      if (this.bootcampManager && this.bootcampManager.activeLesson) {
        el.innerHTML = 'TACTICAL TELEMETRY &bull; HOVER SECTOR TO INSPECT TERRAIN &amp; TROOPS';
      } else {
        el.innerHTML = 'SECTOR 8x8 &bull; MAP: THE IRON BASIN &bull; ALLIED COMMAND';
      }
      return;
    }
    const tile = this.engine.grid[hoveredTile.y][hoveredTile.x];
    const colLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][hoveredTile.x] || '';
    const rowNum = hoveredTile.y + 1;
    const defPct = Math.round((tile.defenseBonus || 0) * 100);
    const losStatus = (tile.id === 'FOREST' || tile.id === 'MOUNTAIN') ? 'LOS BLOCKED' : 'LOS OPEN';

    // Check if tile is visible to P1
    const p1Vision = this.engine.phase === 'GAME_OVER' ? Array(8).fill(null).map(() => Array(8).fill(true)) : this.engine.calculateVision(1);
    const isVisible = p1Vision[hoveredTile.y][hoveredTile.x];
    
    if (!isVisible && this.engine.phase !== 'GAME_OVER') {
      el.innerHTML = `[${colLetter}${rowNum}] &bull; <span style="color:#94a3b8;">TERRA INCOGNITA (UNSURVEYED)</span>`;
      return;
    }

    const unit = this.engine.getAllUnits().find(u => u.x === hoveredTile.x && u.y === hoveredTile.y && u.isAlive());

    if (unit) {
      const allegiance = unit.owner === 1 ? '<span style="color:#60a5fa; font-weight:700;">ALLIED' : '<span style="color:#f87171; font-weight:700;">HOSTILE';
      const hp = `${unit.hp}/${unit.maxHp} HP`;
      const stance = (unit.stance && unit.stance !== 'ADVANCE') ? ` [${unit.stance}]` : '';
      let miredNote = '';
      if (tile.id === 'SWAMP') {
        miredNote = ' &bull; <span style="color:#fbbf24; font-weight:700;">MIRED (1T)</span> &bull; <span style="color:#ef4444; font-weight:700;">NO VEHICLES</span>';
      } else if (tile.id === 'FOREST' && unit.stance === 'AMBUSH') {
        miredNote = ' &bull; <span style="color:#34d399; font-weight:700;">AMBUSH READY</span>';
      }
      el.innerHTML = `[${colLetter}${rowNum}] <strong>${tile.name}</strong> &bull; ${allegiance}: ${unit.name} (${hp})${stance}</span>${miredNote}`;
    } else {
      let terrainDetails = '';
      if (tile.id === 'SWAMP') {
        terrainDetails = `<span style="color:#f87171; font-weight:700;">DEF -10%</span> &bull; <span style="color:#fbbf24; font-weight:700;">MIRED (1T)</span> &bull; <span style="color:#ef4444; font-weight:700;">NO VEHICLES</span> &bull; ${losStatus}`;
      } else if (tile.id === 'FOREST') {
        terrainDetails = `DEF +${defPct}% &bull; MOV 1.5x &bull; ${losStatus} (AMBUSH)`;
      } else if (tile.id === 'MOUNTAIN') {
        terrainDetails = `<span style="color:#ef4444; font-weight:700;">IMPASSABLE</span> &bull; ${losStatus}`;
      } else if (tile.id === 'WATER') {
        terrainDetails = `<span style="color:#ef4444; font-weight:700;">WATER HAZARD</span> &bull; ${losStatus}`;
      } else if (tile.id === 'CAPTURE_ZONE') {
        terrainDetails = `DEF +${defPct}% &bull; +25 INK/T &bull; ${losStatus}`;
      } else if (tile.id === 'MAIN_BASE') {
        terrainDetails = `DEF +${defPct}% &bull; COMMAND HQ (+50 INK/T)`;
      } else {
        terrainDetails = `DEF +${defPct}% &bull; MOV 1.0x &bull; ${losStatus}`;
      }
      el.innerHTML = `[${colLetter}${rowNum}] <strong>${tile.name}</strong> &bull; ${terrainDetails}`;
    }
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
  const targetPane = document.getElementById(`codex-subpane-${subtabKey}`);
  if (typeof UnitIcons !== 'undefined' && targetPane) {
    UnitIcons.renderStaticBadges(targetPane);
  }
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
      planning_duration: 40,
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
          if (data.user.is_banned) {
            window.checkUserBannedState(data.user);
          }
        }
        return { success: true, user: this.user };
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.is_banned) {
          this.user.is_banned = true;
          this.saveLocalUser(this.user);
          window.checkUserBannedState(this.user);
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

window.updateGameSpeedPreset = function(preset) {
  let plan = 40;
  let play = 3;
  if (preset === 'BLITZ') {
    plan = 20;
    play = 3;
  } else if (preset === 'RELAXED') {
    plan = 60;
    play = 3;
  } else if (preset === 'STANDARD') {
    plan = 40;
    play = 3;
  } else {
    return;
  }

  const timerSelect = document.getElementById('select-timer-duration');
  if (timerSelect) timerSelect.value = plan;

  const speedSelect = document.getElementById('select-playback-duration');
  if (speedSelect) speedSelect.value = play;

  d1Service.syncSettings({
    planning_duration: plan,
    playback_speed: play
  });

  if (typeof window.syncCustomSelects === 'function') {
    window.syncCustomSelects();
  }
};

window.updatePlanningDuration = function(val) {
  const plan = Number(val);
  const speedSelect = document.getElementById('select-playback-duration');
  const play = Number(speedSelect?.value || 3);

  const presetSelect = document.getElementById('select-game-speed-preset');
  if (presetSelect) {
    if (plan === 40 && play === 3) presetSelect.value = 'STANDARD';
    else if (plan === 20 && play === 3) presetSelect.value = 'BLITZ';
    else if (plan === 60 && play === 3) presetSelect.value = 'RELAXED';
    else presetSelect.value = 'CUSTOM';
  }

  d1Service.syncSettings({ planning_duration: plan });
  if (typeof window.syncCustomSelects === 'function') {
    window.syncCustomSelects();
  }
};

window.updatePlaybackSpeed = function(val) {
  const play = Number(val);
  const timerSelect = document.getElementById('select-timer-duration');
  const plan = Number(timerSelect?.value || 40);

  const presetSelect = document.getElementById('select-game-speed-preset');
  if (presetSelect) {
    if (plan === 40 && play === 3) presetSelect.value = 'STANDARD';
    else if (plan === 20 && play === 3) presetSelect.value = 'BLITZ';
    else if (plan === 60 && play === 3) presetSelect.value = 'RELAXED';
    else presetSelect.value = 'CUSTOM';
  }

  d1Service.syncSettings({ playback_speed: play });
  if (typeof window.syncCustomSelects === 'function') {
    window.syncCustomSelects();
  }
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

window.checkUserBannedState = function(userObj) {
  const u = userObj || (window.d1Service ? window.d1Service.user : null);
  if (!u) return false;
  const isBanned = Boolean(u.is_banned);
  const modal = document.getElementById('banned-account-modal');
  const topBanner = document.getElementById('banned-persistent-banner');
  const deployBtn = document.getElementById('btn-start-game');

  if (isBanned) {
    if (topBanner) topBanner.style.display = 'flex';
    if (modal) {
      modal.style.zIndex = '100000';
      modal.style.display = 'flex';
    }
    if (deployBtn) {
      deployBtn.disabled = true;
      deployBtn.style.opacity = '0.4';
      deployBtn.style.cursor = 'not-allowed';
      deployBtn.title = "Account Suspended";
    }
    return true;
  } else {
    if (topBanner) topBanner.style.display = 'none';
    if (modal) modal.style.display = 'none';
    if (deployBtn) {
      deployBtn.disabled = false;
      deployBtn.style.opacity = '1';
      deployBtn.style.cursor = 'pointer';
      deployBtn.title = "";
    }
    return false;
  }
};

window.toggleBanAdminUser = async function(id, currentBanned) {
  try {
    const newBannedState = !currentBanned;
    await d1Service.updateUser(id, { is_banned: newBannedState });
    alert(`Account ${newBannedState ? 'SUSPENDED / BANNED' : 'UNBANNED / ALLOWED'} successfully.`);
    window.refreshAdminUserTable();
    window.fetchAdminDashboardStats();

    // If current logged in user was banned, enforce ban overlay immediately
    if (d1Service.user && (d1Service.user.id === id || (window.gAuth && window.gAuth.user && window.gAuth.user.uid === id))) {
      d1Service.user.is_banned = newBannedState;
      window.checkUserBannedState(d1Service.user);
    }
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

/**
 * Custom Dieselpunk Select System
 * Upgrades HTML <select> dropdowns with custom military themed UI,
 * preventing native browser OS dropdown popup glitches and Segoe UI flicker.
 */
function initCustomSelects() {
  const selects = document.querySelectorAll('#tab-pane-play select.btn-sketch, #tab-pane-settings select.btn-sketch');
  selects.forEach(selectEl => {
    if (selectEl.dataset.customized === 'true') {
      if (typeof selectEl._syncCustomSelect === 'function') selectEl._syncCustomSelect();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'diesel-select-wrapper';
    if (selectEl.classList.contains('setting-select')) {
      wrapper.classList.add('setting-select-wrap');
    }

    // Insert wrapper before select, then place select inside wrapper
    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);

    // Hide original select visually and from tab index, keep accessible in DOM
    selectEl.classList.add('diesel-hidden-select');
    selectEl.setAttribute('tabindex', '-1');
    selectEl.setAttribute('aria-hidden', 'true');
    selectEl.dataset.customized = 'true';

    // Trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'diesel-select-trigger btn-sketch';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'diesel-select-label';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'diesel-select-arrow';
    arrowSpan.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    trigger.appendChild(labelSpan);
    trigger.appendChild(arrowSpan);
    wrapper.appendChild(trigger);

    // Menu container
    const menu = document.createElement('div');
    menu.className = 'diesel-select-menu';
    menu.setAttribute('role', 'listbox');
    wrapper.appendChild(menu);

    function syncLabel() {
      const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      if (selectedOpt) {
        labelSpan.textContent = selectedOpt.textContent;
      }
      Array.from(menu.children).forEach(item => {
        item.classList.toggle('selected', item.dataset.value === selectEl.value);
      });
    }

    function rebuildOptions() {
      menu.innerHTML = '';
      const options = Array.from(selectEl.options);
      options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'diesel-select-item';
        item.setAttribute('role', 'option');
        item.dataset.value = opt.value;
        item.textContent = opt.textContent;

        if (opt.disabled) {
          item.classList.add('disabled');
          item.setAttribute('aria-disabled', 'true');
        } else {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (opt.disabled) return;
            selectOption(opt.value);
          });
        }

        if (opt.selected || opt.value === selectEl.value) {
          item.classList.add('selected');
        }

        menu.appendChild(item);
      });
      syncLabel();
    }

    function selectOption(val) {
      if (selectEl.value !== val) {
        selectEl.value = val;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof selectEl.onchange === 'function') {
          selectEl.onchange.call(selectEl);
        }
      }
      syncLabel();
      closeMenu();
      try {
        if (window.gApp && window.gApp.audio) window.gApp.audio.playPencilScratch();
      } catch (err) {}
    }

    function openMenu() {
      // Close other open diesel selects
      document.querySelectorAll('.diesel-select-wrapper.open').forEach(other => {
        if (other !== wrapper) {
          other.classList.remove('open');
          other.querySelector('.diesel-select-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Check vertical placement
      const rect = trigger.getBoundingClientRect();
      const estimatedHeight = Math.min(selectEl.options.length * 36 + 10, 220);
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
        wrapper.classList.add('drop-up');
      } else {
        wrapper.classList.remove('drop-up');
      }

      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu() {
      if (wrapper.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleMenu();
    });

    // Hook selectEl.value setter so programmatic changes immediately update UI
    try {
      const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      Object.defineProperty(selectEl, 'value', {
        get() {
          return originalDescriptor.get.call(this);
        },
        set(newVal) {
          originalDescriptor.set.call(this, newVal);
          syncLabel();
        },
        configurable: true
      });
    } catch (err) {
      selectEl.addEventListener('change', syncLabel);
    }

    selectEl.addEventListener('change', syncLabel);
    selectEl._syncCustomSelect = () => {
      rebuildOptions();
    };

    rebuildOptions();
  });
}

window.initCustomSelects = initCustomSelects;
window.syncCustomSelects = function() {
  document.querySelectorAll('select[data-customized="true"]').forEach(s => {
    if (typeof s._syncCustomSelect === 'function') s._syncCustomSelect();
  });
};

// Global click outside to dismiss custom selects
document.addEventListener('click', (e) => {
  if (!e.target.closest('.diesel-select-wrapper')) {
    document.querySelectorAll('.diesel-select-wrapper.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.diesel-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// Escape key to dismiss custom selects, deselect active tile/unit, or cancel pending abilities
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.diesel-select-wrapper.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.diesel-select-trigger')?.setAttribute('aria-expanded', 'false');
    });

    if (window.gApp) {
      let handled = false;
      if (window.gApp.ui && window.gApp.ui.pendingAbilityKey) {
        const ab = (typeof ABILITIES !== 'undefined') ? ABILITIES[window.gApp.ui.pendingAbilityKey] : null;
        window.gApp.ui.pendingAbilityKey = null;
        window.gApp.ui.showToast('Ability Cancelled', `${ab ? ab.name : 'Targeting'} cancelled.`);
        handled = true;
      }
      if (window.gApp.renderer && window.gApp.renderer.selectedTile) {
        window.gApp.renderer.selectedTile = null;
        handled = true;
      }
      if (handled) {
        try { window.gApp.audio.playEraserSmudge(); } catch(err){}
        if (window.gApp.ui && window.gApp.engine) {
          window.gApp.ui.updateHUD(window.gApp.engine);
        }
      }
    }
  }
});

function bootGame() {
  if (window._gameBooted) return;
  window._gameBooted = true;

  new App();

  // Initialize stylized dieselpunk select dropdowns
  initCustomSelects();

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

    const planVal = Number(user.planning_duration || 40);
    const playVal = Number(user.playback_speed || 3);

    const timerSelect = document.getElementById('select-timer-duration');
    if (timerSelect) timerSelect.value = planVal;

    const speedSelect = document.getElementById('select-playback-duration');
    if (speedSelect) speedSelect.value = playVal;

    const presetSelect = document.getElementById('select-game-speed-preset');
    if (presetSelect) {
      if (planVal === 40 && playVal === 3) presetSelect.value = 'STANDARD';
      else if (planVal === 20 && playVal === 3) presetSelect.value = 'BLITZ';
      else if (planVal === 60 && playVal === 3) presetSelect.value = 'RELAXED';
      else presetSelect.value = 'CUSTOM';
    }

    window.syncCustomSelects();

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
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}

