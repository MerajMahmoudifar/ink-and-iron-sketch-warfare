import { STANCES, UNIT_TYPES } from '../engine/Types.js';

export class CommanderAI {
  /**
   * Generates orders for Player 2 (AI) during the 20-second planning phase.
   * @param {GameEngine} engine 
   * @param {string} personality - 'TACTICUS', 'BLITZKRIEG', or 'FORTRESS'
   */
  static processTurn(engine, personality = 'TACTICUS') {
    const aiPlayer = engine.players[2];
    const humanPlayer = engine.players[1];

    if (!aiPlayer || aiPlayer.units.length === 0) return;

    // 1. Spend Ink to buy units
    this.buyUnitsAI(engine, personality);

    // 2. Issue movement waypoints and stance orders for all AI units
    aiPlayer.units.forEach(unit => {
      if (!unit.isAlive()) return;

      switch (personality) {
        case 'BLITZKRIEG':
          this.executeBlitzkriegOrder(engine, unit, humanPlayer);
          break;
        case 'FORTRESS':
          this.executeFortressOrder(engine, unit, humanPlayer);
          break;
        case 'TACTICUS':
        default:
          this.executeTacticusOrder(engine, unit, humanPlayer);
          break;
      }
    });
  }

  static buyUnitsAI(engine, personality) {
    const ai = engine.players[2];
    const base = ai.basePos;

    // Determine target unit to recruit
    let targetType = 'RIFLEMAN';

    if (personality === 'BLITZKRIEG') {
      targetType = ai.faction.id === 'VANGUARD_LEGION' ? 'BLITZ_RECON' : 'LIGHT_VEHICLE';
    } else if (personality === 'FORTRESS') {
      targetType = ai.ink >= 160 && ai.faction.id === 'IRON_CORPS' ? 'HEAVY_SIEGE_TANK' : 'ANTI_TANK';
    } else {
      // Tacticus: Balanced selection
      const count = ai.units.length;
      if (count % 3 === 0) targetType = 'SCOUT';
      else if (count % 3 === 1) targetType = 'RIFLEMAN';
      else targetType = 'LIGHT_VEHICLE';
    }

    // Try to buy at AI main base or owned capture zones
    const spawnPoints = [base];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'CAPTURE_ZONE' && engine.grid[r][c].owner === 2) {
          spawnPoints.push({ x: c, y: r });
        }
      }
    }

    for (const sp of spawnPoints) {
      if (ai.ink >= UNIT_TYPES[targetType].cost) {
        engine.buyUnit(2, targetType, sp.x, sp.y);
      }
    }
  }

  // Tacticus AI: Balanced capture & tactical engagement
  static executeTacticusOrder(engine, unit, humanPlayer) {
    // Find closest uncaptured zone or human base
    let target = this.findClosestUncapturedZone(engine, unit);
    if (!target) {
      target = humanPlayer.basePos; // Target main base if all zones captured
    }

    const path = engine.findValidPath(unit, target.x, target.y);
    if (path.length > 0) {
      engine.setUnitWaypoints(unit.id, path);
      unit.setStance(STANCES.ADVANCE.id);
    }
  }

  // Blitzkrieg AI: Direct rush towards human main base
  static executeBlitzkriegOrder(engine, unit, humanPlayer) {
    const target = humanPlayer.basePos;
    const path = engine.findValidPath(unit, target.x, target.y);
    if (path.length > 0) {
      engine.setUnitWaypoints(unit.id, path);
      unit.setStance(STANCES.ADVANCE.id);
    }
  }

  // Fortress AI: Hold capture zones and set Defend/Ambush stances
  static executeFortressOrder(engine, unit, humanPlayer) {
    const currentTile = engine.grid[unit.y][unit.x];

    // If unit is in forest, set Ambush stance
    if (currentTile.id === 'FOREST') {
      unit.setStance(STANCES.AMBUSH.id);
      return;
    }

    // If unit on capture zone, set Defend stance
    if (currentTile.id === 'CAPTURE_ZONE') {
      unit.setStance(STANCES.DEFEND.id);
      return;
    }

    // Move towards nearest AI-controlled zone to defend it
    const target = this.findClosestUncapturedZone(engine, unit) || humanPlayer.basePos;
    const path = engine.findValidPath(unit, target.x, target.y);
    if (path.length > 0) {
      engine.setUnitWaypoints(unit.id, path);
      unit.setStance(STANCES.DEFEND.id);
    }
  }

  static findClosestUncapturedZone(engine, unit) {
    let closest = null;
    let minDist = Infinity;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = engine.grid[r][c];
        if (tile.id === 'CAPTURE_ZONE' && tile.owner !== unit.owner) {
          const dist = Math.abs(unit.x - c) + Math.abs(unit.y - r);
          if (dist < minDist) {
            minDist = dist;
            closest = { x: c, y: r };
          }
        }
      }
    }

    return closest;
  }
}
