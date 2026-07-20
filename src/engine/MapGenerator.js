import { TERRAIN } from './Types.js';

export class MapGenerator {
  static GRID_SIZE = 8;

  /**
   * Generates or loads a map grid.
   * @param {string} mapType - 'PRESET_1', 'PRESET_2', 'PRESET_3', or 'PROCEDURAL'
   * @returns {Object} { grid: Array(8x8), player1Base: {x,y}, player2Base: {x,y} }
   */
  static createMap(mapType = 'PRESET_1') {
    let grid = Array(8).fill(null).map(() => Array(8).fill(null));

    if (mapType === 'PROCEDURAL') {
      return this.generateProceduralSymmetrical();
    }

    switch (mapType) {
      case 'PRESET_2':
        return this.loadPreset2();
      case 'PRESET_3':
        return this.loadPreset3();
      case 'PRESET_1':
      default:
        return this.loadPreset1();
    }
  }

  // Preset 1: "The Divided Valley" - River bisecting middle with bridge bottlenecks and corner bases
  static loadPreset1() {
    const layout = [
      ['B1', '.',  'F',  'M',  'M',  'Z',  '.',  '.'],
      ['.',  'Z',  '.',  'M',  '.',  'F',  '.',  'F'],
      ['F',  '.',  'S',  '.',  'W',  'W',  'Z',  'M'],
      ['M',  'M',  '.',  'Z',  '.',  'W',  'F',  'M'],
      ['M',  'F',  'W',  '.',  'Z',  '.',  'M',  'M'],
      ['M',  'Z',  'W',  'W',  '.',  'S',  '.',  'F'],
      ['F',  '.',  'F',  '.',  'M',  '.',  'Z',  '.'],
      ['.',  '.',  'Z',  'M',  'M',  'F',  '.',  'B2']
    ];
    return this.parseLayout(layout, {x:0, y:0}, {x:7, y:7});
  }

  // Preset 2: "Crossfire Swamps" - Central contested capture zones surrounded by forests & swamps
  static loadPreset2() {
    const layout = [
      ['.',  'B1', '.',  'F',  'Z',  '.',  'M',  'F'],
      ['.',  'F',  '.',  'S',  '.',  'F',  '.',  'Z'],
      ['.',  '.',  'Z',  '.',  'W',  'S',  'F',  '.'],
      ['F',  'S',  '.',  'Z',  'Z',  '.',  'S',  'M'],
      ['M',  'S',  '.',  'Z',  'Z',  '.',  'S',  'F'],
      ['.',  'F',  'S',  'W',  '.',  'Z',  '.',  '.'],
      ['Z',  '.',  'F',  '.',  'S',  '.',  'F',  '.'],
      ['F',  'M',  '.',  'Z',  'F',  '.',  'B2', '.']
    ];
    return this.parseLayout(layout, {x:1, y:0}, {x:6, y:7});
  }

  // Preset 3: "Twin Peaks Fortress" - Mountain corridors with flank avenues
  static loadPreset3() {
    const layout = [
      ['B1', '.',  'Z',  'M',  'M',  'F',  '.',  '.'],
      ['.',  'F',  '.',  'M',  'M',  '.',  'Z',  'F'],
      ['Z',  '.',  'F',  '.',  'S',  'F',  '.',  'Z'],
      ['M',  'M',  '.',  'Z',  '.',  'W',  'M',  'M'],
      ['M',  'M',  'W',  '.',  'Z',  '.',  'M',  'M'],
      ['Z',  '.',  'F',  'S',  '.',  'F',  '.',  'Z'],
      ['F',  'Z',  '.',  'M',  'M',  '.',  'F',  '.'],
      ['.',  '.',  'F',  'M',  'M',  'Z',  '.',  'B2']
    ];
    return this.parseLayout(layout, {x:0, y:0}, {x:7, y:7});
  }

  /**
   * Generates a completely procedural 8x8 map with guaranteed 180-degree rotational symmetry.
   */
  static generateProceduralSymmetrical() {
    const grid = Array(8).fill(null).map(() => Array(8).fill(null));

    // Fill with default plains
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        grid[r][c] = { ...TERRAIN.PLAINS, x: c, y: r, owner: null };
      }
    }

    // Main Bases at opposite corners
    const p1Base = { x: 0, y: 0 };
    const p2Base = { x: 7, y: 7 };
    grid[p1Base.y][p1Base.x] = { ...TERRAIN.MAIN_BASE, x: p1Base.x, y: p1Base.y, owner: 1 };
    grid[p2Base.y][p2Base.x] = { ...TERRAIN.MAIN_BASE, x: p2Base.x, y: p2Base.y, owner: 2 };

    // Set symmetrical capture zones
    const zonePositions = [
      { x: 1, y: 3 }, { x: 2, y: 1 }, { x: 3, y: 2 }
    ];

    zonePositions.forEach(pos => {
      grid[pos.y][pos.x] = { ...TERRAIN.CAPTURE_ZONE, x: pos.x, y: pos.y, owner: null };
      const symX = 7 - pos.x;
      const symY = 7 - pos.y;
      grid[symY][symX] = { ...TERRAIN.CAPTURE_ZONE, x: symX, y: symY, owner: null };
    });

    // Random feature placement with 180 degree symmetry
    const terrainChoices = [TERRAIN.FOREST, TERRAIN.FOREST, TERRAIN.SWAMP, TERRAIN.MOUNTAIN, TERRAIN.WATER];
    
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        // Skip base and capture zones
        const current = grid[y][x];
        if (current.id === 'MAIN_BASE' || current.id === 'CAPTURE_ZONE') continue;

        if (Math.random() < 0.35) {
          const type = terrainChoices[Math.floor(Math.random() * terrainChoices.length)];
          grid[y][x] = { ...type, x, y, owner: null };

          // Mirror position
          const symX = 7 - x;
          const symY = 7 - y;
          if (grid[symY][symX].id !== 'MAIN_BASE' && grid[symY][symX].id !== 'CAPTURE_ZONE') {
            grid[symY][symX] = { ...type, x: symX, y: symY, owner: null };
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
          case 'B1':
            tData = { ...TERRAIN.MAIN_BASE, owner: 1 };
            break;
          case 'B2':
            tData = { ...TERRAIN.MAIN_BASE, owner: 2 };
            break;
          case 'Z':
            tData = { ...TERRAIN.CAPTURE_ZONE, owner: null };
            break;
          case 'F':
            tData = { ...TERRAIN.FOREST, owner: null };
            break;
          case 'S':
            tData = { ...TERRAIN.SWAMP, owner: null };
            break;
          case 'M':
            tData = { ...TERRAIN.MOUNTAIN, owner: null };
            break;
          case 'W':
            tData = { ...TERRAIN.WATER, owner: null };
            break;
          case '.':
          default:
            tData = { ...TERRAIN.PLAINS, owner: null };
            break;
        }

        grid[r][c] = { ...tData, x: c, y: r };
      }
    }

    return { grid, player1Base: p1Base, player2Base: p2Base };
  }
}
