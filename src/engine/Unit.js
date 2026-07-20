import { UNIT_TYPES, STANCES } from './Types.js';

export class Unit {
  static idCounter = 1;

  constructor(typeKey, ownerId, startX, startY) {
    const template = UNIT_TYPES[typeKey];
    if (!template) throw new Error(`Invalid unit typeKey: ${typeKey}`);

    this.id = `U_${Unit.idCounter++}_P${ownerId}`;
    this.typeKey = typeKey;
    this.name = template.name;
    this.category = template.category;
    this.owner = ownerId; // 1 or 2
    this.x = startX;
    this.y = startY;
    this.hp = template.maxHp;
    this.maxHp = template.maxHp;
    this.attack = template.attack;
    this.moveRange = template.moveRange;
    this.attackRange = template.attackRange;
    this.visionRange = template.visionRange;
    this.icon = template.icon;
    this.description = template.description;
    
    // Multipliers
    this.vehicleBonus = template.vehicleBonus || 1.0;
    this.infantryBonus = template.infantryBonus || 1.0;

    // Movement & Orders during 20s planning
    this.waypoints = []; // Array of {x, y} path steps
    this.stance = STANCES.ADVANCE.id;
    this.isAmbusherHidden = false; // True when in Forest with Ambush stance
    this.animProgress = 0; // 0 to 1 for smooth 10s playback
    this.hasMovedThisTurn = false;
    this.hasAttackedThisTurn = false;
  }

  setWaypoints(pathArray) {
    this.waypoints = pathArray;
  }

  setStance(stanceId) {
    if (STANCES[stanceId]) {
      this.stance = stanceId;
    }
  }

  takeDamage(amount) {
    const rounded = Math.round(amount);
    this.hp = Math.max(0, this.hp - rounded);
    return rounded;
  }

  isAlive() {
    return this.hp > 0;
  }

  getHpPercent() {
    return Math.max(0, Math.min(100, Math.round((this.hp / this.maxHp) * 100)));
  }
}
