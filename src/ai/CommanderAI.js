import { STANCES, UNIT_TYPES } from '../engine/Types.js';

export class CommanderAI {
  /**
   * Generates orders for Player 2 (AI) during the planning phase.
   * @param {GameEngine} engine 
   * @param {string} difficulty 'RECRUIT' | 'VETERAN' | 'GENERAL'
   */
  static processTurn(engine, difficulty = 'RECRUIT') {
    const aiPlayer = engine.players[2];
    const humanPlayer = engine.players[1];
    if (!aiPlayer) return;

    // BOOTCAMP SCRIPTED AI BEHAVIOR
    if (engine.bootcampLesson) {
      if (engine.bootcampLesson === 1 || engine.bootcampLesson === 3 || engine.bootcampLesson === 6) {
        return;
      }
      if (engine.bootcampLesson === 2) {
        const scout = aiPlayer.units.find(u => u.isAlive());
        if (scout) {
          scout.setWaypoints([{ x: 4, y: 3 }, { x: 3, y: 3 }]);
        }
        return;
      }
      if (engine.bootcampLesson === 4) {
        aiPlayer.units.forEach(unit => {
          if (unit.isAlive()) {
            unit.setStance(STANCES.DEFEND.id);
            unit.setWaypoints([]);
          }
        });
        return;
      }
      if (engine.bootcampLesson === 5) {
        const ev = aiPlayer.units.find(u => u.isAlive());
        if (ev) {
          ev.setStance(STANCES.ADVANCE.id);
          if (engine.turnNumber <= 1) {
            ev.setWaypoints([{ x: 7, y: 4 }, { x: 7, y: 5 }]);
          } else if (engine.turnNumber === 2) {
            ev.setWaypoints([{ x: 6, y: 5 }, { x: 5, y: 5 }]);
          } else {
            ev.setWaypoints([{ x: 4, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 3 }]);
          }
        }
        return;
      }
      if (engine.bootcampLesson === 7) {
        const raider = aiPlayer.units.find(u => u.isAlive());
        if (raider) {
          raider.setStance(STANCES.DEFEND.id);
          raider.setWaypoints([]);
        }
        return;
      }
    }

    // 1. Dynamic Unit Recruitment
    this.buyUnitsAI(engine, difficulty);

    // 2. Ability Usage
    this.useAbilitiesAI(engine, difficulty);

    // 3. Movement, Stance & Target Evaluation
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = humanPlayer.units.filter(u => u.isAlive() && aiVision[u.y][u.x]);
    const aiUnits = aiPlayer.units.filter(u => u.isAlive());

    aiUnits.forEach(unit => {
      const currentTile = engine.grid[unit.y][unit.x];
      const isSittingOnBase = (unit.x === aiPlayer.basePos.x && unit.y === aiPlayer.basePos.y);

      // --- STANCE EVALUATION ---
      if (difficulty === 'RECRUIT') {
        if (['CAPTURE_ZONE', 'MAIN_BASE'].includes(currentTile.id) && currentTile.owner === 2) {
          unit.setStance(STANCES.DEFEND.id);
        } else {
          unit.setStance(STANCES.ADVANCE.id);
        }
        unit.isAmbusherHidden = false;
      } else {
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
      }

      // --- LOW HP TACTICAL RETREAT ---
      if (difficulty === 'RECRUIT') {
        // Recruit never flees when wounded
      } else if (difficulty === 'VETERAN') {
        if (unit.getHpPercent() < 25 && !isSittingOnBase) {
          const forestTile = this.findNearbyForest(engine, unit);
          const safeTarget = forestTile || this.findOwnedDefensePoint(engine, unit, aiPlayer) || aiPlayer.basePos;
          this.executeOrder(engine, unit, safeTarget);
          return;
        }
      } else {
        if (unit.getHpPercent() < 35 && !isSittingOnBase) {
          const safeTarget = this.findOwnedDefensePoint(engine, unit, aiPlayer) || this.findNearbyForest(engine, unit) || aiPlayer.basePos;
          this.executeOrder(engine, unit, safeTarget);
          return;
        }
      }

      // --- ORDERS & MOVEMENT ---
      if (difficulty === 'RECRUIT') {
        if (Math.random() < 0.35) {
          unit.setWaypoints([]);
          return;
        }

        const adjacentEnemy = visibleHumanUnits.find(u => Math.max(Math.abs(unit.x - u.x), Math.abs(unit.y - u.y)) <= 1);
        if (adjacentEnemy) {
          this.executeOrder(engine, unit, { x: adjacentEnemy.x, y: adjacentEnemy.y });
        } else {
          const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
          this.executeOrder(engine, unit, target);
        }
      } else if (difficulty === 'VETERAN') {
        const closestVisibleEnemy = this.findClosestVisibleEnemy(unit, visibleHumanUnits);
        const distToEnemy = closestVisibleEnemy ? Math.max(Math.abs(unit.x - closestVisibleEnemy.x), Math.abs(unit.y - closestVisibleEnemy.y)) : 999;

        if (distToEnemy <= unit.attackRange + 1 && !isSittingOnBase) {
          this.executeOrder(engine, unit, { x: closestVisibleEnemy.x, y: closestVisibleEnemy.y });
        } else {
          const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
          this.executeOrder(engine, unit, target);
        }
      } else {
        const priorityTarget = this.findGeneralCombatTarget(unit, visibleHumanUnits);
        if (priorityTarget) {
          const distToEnemy = Math.max(Math.abs(unit.x - priorityTarget.x), Math.abs(unit.y - priorityTarget.y));
          if (distToEnemy <= unit.attackRange + unit.moveRange && !isSittingOnBase) {
            this.executeOrder(engine, unit, { x: priorityTarget.x, y: priorityTarget.y });
            return;
          }
        }

        const target = this.findUnownedZoneOrEnemyBase(engine, unit, humanPlayer);
        this.executeOrder(engine, unit, target);
      }
    });
  }

  static findUnownedZoneOrEnemyBase(engine, unit, humanPlayer) {
    let closest = null;
    let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'CAPTURE_ZONE' && engine.grid[r][c].owner !== 2) {
          const dist = Math.max(Math.abs(unit.x - c), Math.abs(unit.y - r));
          if (dist < minDist) {
            minDist = dist;
            closest = { x: c, y: r };
          }
        }
      }
    }
    return closest || humanPlayer.basePos;
  }

  static findNearbyForest(engine, unit) {
    let closest = null;
    let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'FOREST') {
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

  static findOwnedDefensePoint(engine, unit, aiPlayer) {
    let closest = null;
    let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].owner === 2 && ['CAPTURE_ZONE', 'MAIN_BASE'].includes(engine.grid[r][c].id)) {
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

  static buyUnitsAI(engine, difficulty = 'RECRUIT') {
    const ai = engine.players[2];

    // --- RECRUIT: Gentle Pacing & Unit Cap ---
    if (difficulty === 'RECRUIT') {
      const activeAiUnits = ai.units.filter(u => u.isAlive()).length;
      if (activeAiUnits >= 3 || Math.random() < 0.45) {
        return;
      }

      const targetType = Math.random() < 0.6 ? 'RIFLEMAN' : 'SCOUT';
      const basePos = ai.basePos;
      const isBaseOccupied = engine.getAllUnits().some(u => u.x === basePos.x && u.y === basePos.y && u.isAlive());

      if (!isBaseOccupied && ai.ink >= UNIT_TYPES[targetType].cost) {
        engine.buyUnit(2, targetType, basePos.x, basePos.y);
      }
      return;
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

    // --- GENERAL: Proactive Counter-Building & Faction War Machines ---
    if (difficulty === 'GENERAL') {
      if (ai.faction.id === 'IRON_CORPS' && ai.ink >= UNIT_TYPES.HEAVY_SIEGE_TANK.cost) {
        targetType = 'HEAVY_SIEGE_TANK';
      } else if (ai.faction.id === 'VANGUARD_LEGION' && ai.ink >= UNIT_TYPES.BLITZ_RECON.cost && Math.random() < 0.7) {
        targetType = 'BLITZ_RECON';
      } else if (humanVehicleCount > 0 && ai.ink >= UNIT_TYPES.ANTI_TANK.cost) {
        targetType = 'ANTI_TANK';
      } else if (humanATCount > 0 && ai.ink >= UNIT_TYPES.RIFLEMAN.cost) {
        targetType = 'RIFLEMAN';
      } else if (humanInfantryCount >= 1 && ai.ink >= UNIT_TYPES.LIGHT_VEHICLE.cost) {
        targetType = 'LIGHT_VEHICLE';
      } else if (ai.ink >= UNIT_TYPES.RIFLEMAN.cost) {
        targetType = 'RIFLEMAN';
      } else {
        targetType = 'SCOUT';
      }
    } else {
      // --- VETERAN: Standard Reactive Counters ---
      if (humanVehicleCount > 0 && ai.ink >= UNIT_TYPES.ANTI_TANK.cost) {
        targetType = 'ANTI_TANK';
      } else if (humanATCount > 0 && ai.ink >= UNIT_TYPES.RIFLEMAN.cost) {
        targetType = 'RIFLEMAN';
      } else if (ai.faction.id === 'IRON_CORPS' && ai.ink >= UNIT_TYPES.HEAVY_SIEGE_TANK.cost && Math.random() < 0.5) {
        targetType = 'HEAVY_SIEGE_TANK';
      } else if (ai.faction.id === 'VANGUARD_LEGION' && ai.ink >= UNIT_TYPES.BLITZ_RECON.cost && Math.random() < 0.5) {
        targetType = 'BLITZ_RECON';
      } else if (humanInfantryCount > 1 && ai.ink >= UNIT_TYPES.LIGHT_VEHICLE.cost) {
        targetType = 'LIGHT_VEHICLE';
      } else {
        targetType = Math.random() > 0.5 ? 'RIFLEMAN' : 'SCOUT';
      }
    }

    let spawnPoints = engine.getOwnedSpawnPoints(2).filter(sp => !sp.isContested && !engine.getAllUnits().some(u => u.x === sp.x && u.y === sp.y && u.isAlive()));
    if (spawnPoints.length > 0 && ai.ink >= UNIT_TYPES[targetType].cost) {
      if (difficulty === 'GENERAL' && spawnPoints.length > 1) {
        const p1Base = engine.players[1].basePos;
        spawnPoints.sort((a, b) => {
          const distA = Math.abs(a.x - p1Base.x) + Math.abs(a.y - p1Base.y);
          const distB = Math.abs(b.x - p1Base.x) + Math.abs(b.y - p1Base.y);
          return distA - distB;
        });
      }
      engine.buyUnit(2, targetType, spawnPoints[0].x, spawnPoints[0].y);
    }
  }

  static useAbilitiesAI(engine, difficulty = 'RECRUIT') {
    if (difficulty === 'RECRUIT') return;

    const ai = engine.players[2];
    const aiVision = engine.calculateVision(2);
    const visibleHumanUnits = engine.players[1].units.filter(u => u.isAlive() && aiVision[u.y][u.x]);
    const aiUnits = ai.units.filter(u => u.isAlive());

    // --- GENERAL: Full Tactical Ability Deck (Smoke, Artillery, Flares) ---
    if (difficulty === 'GENERAL') {
      if (ai.cp >= 3) {
        const vulnerableUnit = aiUnits.find(u => {
          if (u.getHpPercent() < 45) {
            return visibleHumanUnits.some(e => Math.abs(e.x - u.x) <= 2 && Math.abs(e.y - u.y) <= 2);
          }
          if (u.category === 'VEHICLE') {
            return visibleHumanUnits.some(e => e.typeKey === 'ANTI_TANK' && Math.abs(e.x - u.x) <= 2 && Math.abs(e.y - u.y) <= 2);
          }
          return false;
        });

        if (vulnerableUnit && !engine.activeSmokes.some(s => s.x === vulnerableUnit.x && s.y === vulnerableUnit.y)) {
          engine.useAbility(2, 'SMOKE_SCREEN', vulnerableUnit.x, vulnerableUnit.y);
          return;
        }
      }

      if (ai.cp >= 4 && visibleHumanUnits.length > 0) {
        let bestTarget = null;
        let maxScore = 0;

        visibleHumanUnits.forEach(u => {
          let score = 0;
          visibleHumanUnits.forEach(other => {
            if (Math.abs(other.x - u.x) <= 1 && Math.abs(other.y - u.y) <= 1) {
              score += other.category === 'VEHICLE' ? 25 : 15;
              if (other.getHpPercent() <= 40) score += 15;
            }
          });
          if (score > maxScore) {
            maxScore = score;
            bestTarget = u;
          }
        });

        if (bestTarget && maxScore >= 25) {
          engine.useAbility(2, 'ARTILLERY_STRIKE', bestTarget.x, bestTarget.y);
          return;
        }
      }

      if (ai.cp >= 2) {
        const p1Base = engine.players[1].basePos;
        if (p1Base && !aiVision[p1Base.y][p1Base.x]) {
          engine.useAbility(2, 'RECON_FLARE', p1Base.x, p1Base.y);
        }
      }
      return;
    }

    // --- VETERAN: Conservative Tactical Usage ---
    if (ai.cp >= 4 && visibleHumanUnits.length > 0) {
      let bestTarget = null;
      let maxHits = 0;
      visibleHumanUnits.forEach(u => {
        const hits = visibleHumanUnits.filter(other => Math.abs(other.x - u.x) <= 1 && Math.abs(other.y - u.y) <= 1).length;
        if (hits > maxHits) {
          maxHits = hits;
          bestTarget = u;
        }
      });
      if (bestTarget && maxHits >= 2) {
        engine.useAbility(2, 'ARTILLERY_STRIKE', bestTarget.x, bestTarget.y);
      }
    } else if (ai.cp >= 4) {
      const p1Base = engine.players[1].basePos;
      if (p1Base && !aiVision[p1Base.y][p1Base.x]) {
        engine.useAbility(2, 'RECON_FLARE', p1Base.x, p1Base.y);
      }
    }
  }

  static findGeneralCombatTarget(unit, visibleEnemies) {
    let best = null;
    let bestScore = -999;

    visibleEnemies.forEach(e => {
      const dist = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
      let score = 100 - (dist * 12);

      if (e.getHpPercent() <= 35) score += 50;
      else if (e.getHpPercent() <= 60) score += 25;

      if (unit.typeKey === 'ANTI_TANK' && e.category === 'VEHICLE') score += 55;
      if (unit.typeKey === 'RIFLEMAN' && e.typeKey === 'ANTI_TANK') score += 40;
      if (unit.category === 'VEHICLE' && e.category === 'INFANTRY') score += 35;

      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    });

    return best;
  }

  static findClosestVisibleEnemy(unit, visibleEnemies) {
    let closest = null;
    let minDist = Infinity;
    visibleEnemies.forEach(e => {
      const d = Math.abs(unit.x - e.x) + Math.abs(unit.y - e.y);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
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
    let closest = null;
    let minDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (engine.grid[r][c].id === 'CAPTURE_ZONE' && engine.grid[r][c].owner !== unit.owner) {
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
