import { GAME_PHASES, FACTIONS, UNIT_TYPES, TERRAIN, STANCES } from './Types.js';
import { MapGenerator } from './MapGenerator.js';
import { Unit } from './Unit.js';
import { Combat } from './Combat.js';

export class GameEngine {
  constructor(config = {}) {
    this.mapType = config.mapType || 'PRESET_1';
    this.player1Faction = config.p1Faction || FACTIONS.IRON_CORPS;
    this.player2Faction = config.p2Faction || FACTIONS.VANGUARD_LEGION;
    this.isSinglePlayer = config.isSinglePlayer !== false; // default true
    this.aiPersonality = config.aiPersonality || 'TACTICUS';

    this.turnNumber = 1;
    this.phase = GAME_PHASES.PLANNING;
    this.planningTimeRemaining = 20; // 20s action phase
    this.playbackTimeRemaining = 10; // 10s playback phase
    this.timerInterval = null;

    // Board & Players Setup
    const mapData = MapGenerator.createMap(this.mapType);
    this.grid = mapData.grid; // 8x8
    this.p1Base = mapData.player1Base;
    this.p2Base = mapData.player2Base;

    this.players = {
      1: {
        id: 1,
        name: 'Player 1',
        faction: this.player1Faction,
        ink: 150, // Starting Ink currency
        basePos: this.p1Base,
        units: [],
        zonesCaptured: 1
      },
      2: {
        id: 2,
        name: this.isSinglePlayer ? `AI Commander (${this.aiPersonality})` : 'Player 2',
        faction: this.player2Faction,
        ink: 150,
        basePos: this.p2Base,
        units: [],
        zonesCaptured: 1
      }
    };

    this.winner = null;
    this.combatLogs = [];
    this.listeners = [];

    // Spawn starting Scout & Rifleman for both players at start
    this.spawnInitialUnits();
  }

  spawnInitialUnits() {
    // Player 1 Initial Units near base
    const p1U1 = new Unit('RIFLEMAN', 1, this.p1Base.x + 1, this.p1Base.y);
    const p1U2 = new Unit('SCOUT', 1, this.p1Base.x, Math.min(7, this.p1Base.y + 1));
    this.players[1].units.push(p1U1, p1U2);

    // Player 2 Initial Units near base
    const p2U1 = new Unit('RIFLEMAN', 2, this.p2Base.x - 1, this.p2Base.y);
    const p2U2 = new Unit('SCOUT', 2, this.p2Base.x, Math.max(0, this.p2Base.y - 1));
    this.players[2].units.push(p2U1, p2U2);
  }

  startTurnTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.phase === GAME_PHASES.PLANNING) {
        this.planningTimeRemaining--;
        if (this.planningTimeRemaining <= 0) {
          this.endPlanningPhase();
        }
      } else if (this.phase === GAME_PHASES.PLAYBACK) {
        this.playbackTimeRemaining--;
        if (this.playbackTimeRemaining <= 0) {
          this.endPlaybackPhase();
        }
      }
      this.notifyStateChange();
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  endPlanningPhase() {
    this.phase = GAME_PHASES.PLAYBACK;
    this.playbackTimeRemaining = 10;
    this.combatLogs = [];

    // Execute playback simulation step by step
    this.runPlaybackSimulation();
  }

  endPlaybackPhase() {
    if (this.winner) {
      this.phase = GAME_PHASES.GAME_OVER;
      this.pauseTimer();
      return;
    }

    // Advance to next turn
    this.turnNumber++;
    this.phase = GAME_PHASES.PLANNING;
    this.planningTimeRemaining = 20;

    // Collect Income for both players
    this.calculateTurnIncome(1);
    this.calculateTurnIncome(2);

    // Reset unit turn flags
    [...this.players[1].units, ...this.players[2].units].forEach(u => {
      u.hasMovedThisTurn = false;
      u.hasAttackedThisTurn = false;
      u.waypoints = [];
      // Re-enable forest ambush stealth if in forest
      const terrainTile = this.grid[u.y][u.x];
      if (terrainTile.id === 'FOREST' && u.stance === STANCES.AMBUSH.id) {
        u.isAmbusherHidden = true;
      }
    });

    this.notifyStateChange();
  }

  calculateTurnIncome(playerId) {
    let income = TERRAIN.MAIN_BASE.inkPerTurn;
    let zonesCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = this.grid[r][c];
        if (tile.id === 'CAPTURE_ZONE' && tile.owner === playerId) {
          income += TERRAIN.CAPTURE_ZONE.inkPerTurn;
          zonesCount++;
        }
      }
    }

    this.players[playerId].ink += income;
    this.players[playerId].zonesCaptured = zonesCount;
  }

  buyUnit(playerId, typeKey, spawnX, spawnY) {
    const player = this.players[playerId];
    const unitTemplate = UNIT_TYPES[typeKey];

    if (!unitTemplate) return { success: false, reason: 'Unknown unit type' };
    if (unitTemplate.factionLock && unitTemplate.factionLock !== player.faction.id) {
      return { success: false, reason: 'Unit locked to other nation' };
    }
    if (player.ink < unitTemplate.cost) {
      return { success: false, reason: 'Not enough Ink currency' };
    }

    // Verify spawn location (Main base or captured zone owned by player)
    const tile = this.grid[spawnY][spawnX];
    if (!tile || tile.owner !== playerId) {
      return { success: false, reason: 'Must spawn at base or owned Supply Zone' };
    }

    // Check if tile already occupied
    const occupied = this.getAllUnits().some(u => u.x === spawnX && u.y === spawnY);
    if (occupied) {
      return { success: false, reason: 'Tile is occupied by another unit' };
    }

    // Deduct cost and spawn
    player.ink -= unitTemplate.cost;
    const newUnit = new Unit(typeKey, playerId, spawnX, spawnY);
    player.units.push(newUnit);

    this.notifyStateChange();
    return { success: true, unit: newUnit };
  }

  setUnitWaypoints(unitId, waypoints) {
    const unit = this.getUnitById(unitId);
    if (unit) {
      unit.waypoints = waypoints;
    }
  }

  setUnitStance(unitId, stanceId) {
    const unit = this.getUnitById(unitId);
    if (unit) {
      unit.setStance(stanceId);
    }
  }

  /**
   * Executes the 10s playback simulation:
   * Moves units along waypoints step-by-step, resolves auto-combat on encounters, and checks zone captures.
   */
  runPlaybackSimulation() {
    const maxSteps = 4; // Max movement steps per playback turn

    for (let step = 0; step < maxSteps; step++) {
      // 1. Move all units 1 step along waypoints
      const allUnits = this.getAllUnits();

      allUnits.forEach(unit => {
        if (unit.waypoints.length > 0 && unit.isAlive()) {
          const nextTile = unit.waypoints.shift();
          // Verify terrain passability
          const tile = this.grid[nextTile.y][nextTile.x];
          const canPass = unit.category === 'VEHICLE' ? tile.isVehiclePassable : tile.isInfantryPassable;

          if (canPass) {
            unit.x = nextTile.x;
            unit.y = nextTile.y;
            unit.hasMovedThisTurn = true;
          }
        }
      });

      // 2. Resolve Automatic Combat Encounters
      const p1Units = this.players[1].units.filter(u => u.isAlive());
      const p2Units = this.players[2].units.filter(u => u.isAlive());

      p1Units.forEach(u1 => {
        p2Units.forEach(u2 => {
          if (!u1.isAlive() || !u2.isAlive()) return;

          const dist = Combat.getDistance({ x: u1.x, y: u1.y }, { x: u2.x, y: u2.y });

          // Combat triggers if within attack range of either unit
          if (dist <= Math.max(u1.attackRange, u2.attackRange)) {
            // U1 attacks U2
            if (dist <= u1.attackRange && !u1.hasAttackedThisTurn) {
              const defenderTile = this.grid[u2.y][u2.x];
              const result = Combat.resolveEncounter(u1, u2, defenderTile, this.players[1].faction, this.players[2].faction);
              u1.hasAttackedThisTurn = true;
              this.combatLogs.push({ ...result, turn: this.turnNumber, step });
            }

            // Counter-attack: U2 attacks U1 if still alive
            if (u2.isAlive() && dist <= u2.attackRange && !u2.hasAttackedThisTurn) {
              const defenderTile = this.grid[u1.y][u1.x];
              const result = Combat.resolveEncounter(u2, u1, defenderTile, this.players[2].faction, this.players[1].faction);
              u2.hasAttackedThisTurn = true;
              this.combatLogs.push({ ...result, turn: this.turnNumber, step });
            }
          }
        });
      });

      // Remove dead units
      this.players[1].units = this.players[1].units.filter(u => u.isAlive());
      this.players[2].units = this.players[2].units.filter(u => u.isAlive());

      // 3. Zone Capture Check
      this.getAllUnits().forEach(unit => {
        const tile = this.grid[unit.y][unit.x];
        if (tile.id === 'CAPTURE_ZONE') {
          tile.owner = unit.owner;
        } else if (tile.id === 'MAIN_BASE' && tile.owner !== unit.owner) {
          // WIN CONDITION TRIGGERED! Main base captured!
          this.winner = unit.owner;
          this.phase = GAME_PHASES.GAME_OVER;
        }
      });
    }
  }

  getUnitById(unitId) {
    return this.getAllUnits().find(u => u.id === unitId);
  }

  getAllUnits() {
    return [...this.players[1].units, ...this.players[2].units];
  }

  /**
   * Breadth-First Search pathfinder for valid grid movements.
   */
  findValidPath(unit, targetX, targetY) {
    if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) return [];

    const queue = [[{ x: unit.x, y: unit.y }]];
    const visited = new Set();
    visited.add(`${unit.x},${unit.y}`);

    let speedMax = unit.moveRange;
    // Vanguard Legion +1 movement speed on open terrain passive
    if (this.players[unit.owner].faction.id === FACTIONS.VANGUARD_LEGION.id) {
      speedMax += FACTIONS.VANGUARD_LEGION.movementSpeedBonus;
    }

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.x === targetX && current.y === targetY) {
        return path.slice(1); // Exclude starting tile
      }

      if (path.length - 1 >= speedMax) continue;

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < 8 && n.y >= 0 && n.y < 8) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            const tile = this.grid[n.y][n.x];
            const canPass = unit.category === 'VEHICLE' ? tile.isVehiclePassable : tile.isInfantryPassable;

            if (canPass) {
              visited.add(key);
              queue.push([...path, n]);
            }
          }
        }
      }
    }

    return [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyStateChange() {
    this.listeners.forEach(fn => fn(this));
  }
}
