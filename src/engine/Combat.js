import { STANCES, FACTIONS } from './Types.js';

export class Combat {
  /**
   * Resolves an automatic combat encounter between an attacker unit and a defender unit.
   * @param {Unit} attacker 
   * @param {Unit} defender 
   * @param {Object} defenderTerrain - Terrain tile defender is standing on
   * @param {Object} attackerFaction - Faction object of attacker owner
   * @param {Object} defenderFaction - Faction object of defender owner
   * @returns {Object} Combat log { damageDealt, defenderDied, isAmbushStrike }
   */
  static resolveEncounter(attacker, defender, defenderTerrain, attackerFaction, defenderFaction) {
    let baseDamage = attacker.attack;

    // 1. Category Bonuses (Rock-Paper-Scissors)
    if (defender.category === 'VEHICLE' && attacker.vehicleBonus > 1.0) {
      baseDamage *= attacker.vehicleBonus;
    } else if (defender.category === 'INFANTRY' && attacker.infantryBonus > 1.0) {
      baseDamage *= attacker.infantryBonus;
    }

    // 2. Ambush Stance First Strike
    let isAmbushStrike = false;
    if (attacker.stance === STANCES.AMBUSH.id && attacker.isAmbusherHidden) {
      baseDamage *= 1.5;
      attacker.isAmbusherHidden = false; // Reveal ambusher
      isAmbushStrike = true;
    }

    // 3. Vanguard Legion Faction Ambush multiplier
    if (attackerFaction.id === FACTIONS.VANGUARD_LEGION.id && defenderTerrain.id === 'FOREST' && isAmbushStrike) {
      baseDamage *= 1.25; // Extra vanguard ambush lethal strike
    }

    // 4. Stance Modifiers
    const attackerStanceObj = STANCES[attacker.stance] || STANCES.ADVANCE;
    const defenderStanceObj = STANCES[defender.stance] || STANCES.ADVANCE;

    baseDamage *= attackerStanceObj.accuracy;

    // 5. Defender Terrain & Faction Defense Bonus
    let defenderDefenseMod = 1.0 - (defenderTerrain.defenseBonus || 0);

    // Iron Corps Faction Passive (+20% Defense on Captured Zones and Forests)
    if (defenderFaction.id === FACTIONS.IRON_CORPS.id) {
      if (defenderTerrain.id === 'CAPTURE_ZONE' || defenderTerrain.id === 'FOREST' || defenderTerrain.id === 'MAIN_BASE') {
        defenderDefenseMod *= 0.80; // 20% extra damage reduction
      }
    }

    // Defender stance defense multiplier
    defenderDefenseMod /= defenderStanceObj.defense;

    // Final damage calculation with slight random sketch variance (+/- 10%)
    const rngFactor = 0.9 + (Math.random() * 0.2);
    let finalDamage = Math.max(5, baseDamage * defenderDefenseMod * rngFactor);

    const actualDamageDealt = defender.takeDamage(finalDamage);

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      damageDealt: actualDamageDealt,
      defenderDied: !defender.isAlive(),
      isAmbushStrike
    };
  }

  /**
   * Calculates Manhattan distance between two grid points.
   */
  static getDistance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  }
}
