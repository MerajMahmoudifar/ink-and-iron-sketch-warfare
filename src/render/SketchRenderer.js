import { TERRAIN, FACTIONS, STANCES } from '../engine/Types.js';

export class SketchRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');

    this.gridSize = 8;
    this.tileSize = 70; // 70px per tile -> 560px grid
    this.canvas.width = 600;
    this.canvas.height = 600;
    this.offsetX = 20;
    this.offsetY = 20;

    this.selectedUnit = null;
    this.selectedTile = null;
    this.hoveredTile = null;

    // Particles for eraser explosion effect
    this.particles = [];
  }

  render(engine) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Notebook Paper Background
    this.drawNotebookBackground();

    // 2. Draw Terrain Grid
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const tile = engine.grid[r][c];
        const screenPos = this.getScreenCoords(c, r);
        this.drawTerrainTile(tile, screenPos.x, screenPos.y);
      }
    }

    // 3. Draw Grid Lines with Hand-Drawn Pencil Jitter
    this.drawGridLines();

    // 4. Draw Waypoint Movement Arrows for Selected/All Units
    this.drawUnitWaypoints(engine);

    // 5. Draw Units
    const allUnits = engine.getAllUnits();
    allUnits.forEach(unit => {
      const screenPos = this.getScreenCoords(unit.x, unit.y);
      this.drawUnit(unit, screenPos.x, screenPos.y, engine);
    });

    // 6. Draw Combat Playback Firing Animations
    if (engine.phase === 'PLAYBACK' && engine.combatLogs.length > 0) {
      this.drawCombatPlaybackEffects(engine);
    }

    // 7. Draw Selection Highlights & Hover Cues
    if (this.selectedTile) {
      const pos = this.getScreenCoords(this.selectedTile.x, this.selectedTile.y);
      this.drawTileSelectionHighlight(pos.x, pos.y, '#2563eb');
    }

    if (this.hoveredTile) {
      const pos = this.getScreenCoords(this.hoveredTile.x, this.hoveredTile.y);
      this.drawTileHoverHighlight(pos.x, pos.y);
    }

    // 8. Update & Draw Eraser Particles
    this.updateParticles();
  }

  drawNotebookBackground() {
    this.ctx.save();
    // Soft off-white paper fill
    this.ctx.fillStyle = '#fcfbfa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle paper margin line
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(15, 0);
    this.ctx.lineTo(15, this.canvas.height);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawGridLines() {
    this.ctx.save();
    this.ctx.strokeStyle = '#cbe3f7'; // Light blue graph paper line
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 8; i++) {
      const pos = i * this.tileSize;

      // Vertical line with pencil jitter
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX + pos, this.offsetY);
      this.ctx.lineTo(this.offsetX + pos, this.offsetY + 560);
      this.ctx.stroke();

      // Horizontal line
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, this.offsetY + pos);
      this.ctx.lineTo(this.offsetX + 560, this.offsetY + pos);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawTerrainTile(tile, x, y) {
    this.ctx.save();
    const size = this.tileSize;

    switch (tile.id) {
      case 'FOREST':
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        this.ctx.fillRect(x, y, size, size);
        this.drawTreeSketch(x + size / 2, y + size / 2);
        break;
      case 'SWAMP':
        this.ctx.fillStyle = 'rgba(101, 163, 13, 0.18)';
        this.ctx.fillRect(x, y, size, size);
        this.drawReedSketch(x + size / 2, y + size / 2);
        break;
      case 'MOUNTAIN':
        this.ctx.fillStyle = 'rgba(120, 113, 108, 0.2)';
        this.ctx.fillRect(x, y, size, size);
        this.drawMountainSketch(x + size / 2, y + size / 2);
        break;
      case 'WATER':
        this.ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        this.ctx.fillRect(x, y, size, size);
        this.drawWaterWavesSketch(x + size / 2, y + size / 2);
        break;
      case 'CAPTURE_ZONE':
        this.ctx.fillStyle = tile.owner === 1 ? 'rgba(43, 76, 126, 0.18)' : (tile.owner === 2 ? 'rgba(139, 38, 27, 0.18)' : 'rgba(234, 179, 8, 0.2)');
        this.ctx.fillRect(x, y, size, size);
        this.drawFlagSketch(x + size / 2, y + size / 2, tile.owner);
        break;
      case 'MAIN_BASE':
        this.ctx.fillStyle = tile.owner === 1 ? 'rgba(43, 76, 126, 0.25)' : 'rgba(139, 38, 27, 0.25)';
        this.ctx.fillRect(x, y, size, size);
        this.drawFortressSketch(x + size / 2, y + size / 2, tile.owner);
        break;
    }
    this.ctx.restore();
  }

  // --- Hand-Drawn Sketch Helper Patterns ---
  drawTreeSketch(cx, cy) {
    this.ctx.strokeStyle = '#2d5a27';
    this.ctx.lineWidth = 1.5;
    // Tree trunk & foliage pencil doodle
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + 12);
    this.ctx.lineTo(cx, cy + 18);
    this.ctx.moveTo(cx, cy - 12);
    this.ctx.lineTo(cx - 14, cy + 10);
    this.ctx.lineTo(cx + 14, cy + 10);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  drawReedSketch(cx, cy) {
    this.ctx.strokeStyle = '#4d7c0f';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 10, cy + 12); this.ctx.quadraticCurveTo(cx - 14, cy, cx - 8, cy - 10);
    this.ctx.moveTo(cx, cy + 14); this.ctx.quadraticCurveTo(cx + 2, cy - 2, cx, cy - 14);
    this.ctx.moveTo(cx + 10, cy + 12); this.ctx.quadraticCurveTo(cx + 12, cy, cx + 8, cy - 8);
    this.ctx.stroke();
  }

  drawMountainSketch(cx, cy) {
    this.ctx.strokeStyle = '#44403c';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 18, cy + 14);
    this.ctx.lineTo(cx, cy - 14);
    this.ctx.lineTo(cx + 18, cy + 14);
    // Hatching lines for shadow
    this.ctx.moveTo(cx, cy - 14);
    this.ctx.lineTo(cx - 4, cy + 14);
    this.ctx.stroke();
  }

  drawWaterWavesSketch(cx, cy) {
    this.ctx.strokeStyle = '#0284c7';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.arc(cx - 10, cy - 5, 8, 0, Math.PI, false);
    this.ctx.arc(cx + 10, cy + 5, 8, 0, Math.PI, false);
    this.ctx.stroke();
  }

  drawFlagSketch(cx, cy, owner) {
    const color = owner === 1 ? FACTIONS.IRON_CORPS.color : (owner === 2 ? FACTIONS.VANGUARD_LEGION.color : '#ca8a04');
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(cx - 8, cy + 14);
    this.ctx.lineTo(cx - 8, cy - 14);
    this.ctx.lineTo(cx + 10, cy - 8);
    this.ctx.lineTo(cx - 8, cy - 2);
    this.ctx.stroke();
    this.ctx.fill();
  }

  drawFortressSketch(cx, cy, owner) {
    const color = owner === 1 ? FACTIONS.IRON_CORPS.color : FACTIONS.VANGUARD_LEGION.color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    this.ctx.strokeRect(cx - 18, cy - 12, 36, 26);
    // Battlements
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 18, cy - 12); this.ctx.lineTo(cx - 18, cy - 18);
    this.ctx.moveTo(cx - 6, cy - 12); this.ctx.lineTo(cx - 6, cy - 18);
    this.ctx.moveTo(cx + 6, cy - 12); this.ctx.lineTo(cx + 6, cy - 18);
    this.ctx.moveTo(cx + 18, cy - 12); this.ctx.lineTo(cx + 18, cy - 18);
    this.ctx.stroke();
  }

  drawUnit(unit, x, y, engine) {
    this.ctx.save();
    const cx = x + this.tileSize / 2;
    const cy = y + this.tileSize / 2;
    const faction = unit.owner === 1 ? engine.player1Faction : engine.player2Faction;

    // Unit Owner Ink Ring Base
    this.ctx.strokeStyle = faction.color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.ctx.fill();

    // Icon Doodle
    this.ctx.font = '22px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(unit.icon, cx, cy - 2);

    // HP Bar Pencil Drawing
    const hpBarWidth = 36;
    const hpPercent = unit.getHpPercent() / 100;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(cx - hpBarWidth / 2, cy + 18, hpBarWidth, 4);

    this.ctx.fillStyle = hpPercent > 0.5 ? '#16a34a' : (hpPercent > 0.25 ? '#eab308' : '#dc2626');
    this.ctx.fillRect(cx - hpBarWidth / 2, cy + 18, hpBarWidth * hpPercent, 4);

    // Ambush indicator icon if hidden in forest
    if (unit.isAmbusherHidden) {
      this.ctx.font = '12px sans-serif';
      this.ctx.fillText('🥷', cx + 18, cy - 16);
    }

    this.ctx.restore();
  }

  drawUnitWaypoints(engine) {
    const units = engine.getAllUnits();
    units.forEach(unit => {
      if (unit.waypoints.length > 0) {
        this.ctx.save();
        const faction = unit.owner === 1 ? engine.player1Faction : engine.player2Faction;
        this.ctx.strokeStyle = faction.color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        let currPos = this.getScreenCoords(unit.x, unit.y);
        let currCx = currPos.x + this.tileSize / 2;
        let currCy = currPos.y + this.tileSize / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(currCx, currCy);

        unit.waypoints.forEach(wp => {
          const wpPos = this.getScreenCoords(wp.x, wp.y);
          const wpCx = wpPos.x + this.tileSize / 2;
          const wpCy = wpPos.y + this.tileSize / 2;
          this.ctx.lineTo(wpCx, wpCy);
        });
        this.ctx.stroke();
        this.ctx.restore();
      }
    });
  }

  drawCombatPlaybackEffects(engine) {
    this.ctx.save();
    engine.combatLogs.forEach(log => {
      const attacker = engine.getUnitById(log.attackerId);
      const defender = engine.getUnitById(log.defenderId);

      if (attacker && defender) {
        const p1 = this.getScreenCoords(attacker.x, attacker.y);
        const p2 = this.getScreenCoords(defender.x, defender.y);
        const c1 = { x: p1.x + 35, y: p1.y + 35 };
        const c2 = { x: p2.x + 35, y: p2.y + 35 };

        // Firing Tracer Line
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Impact Bang Doodle
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillText(`-${log.damageDealt}`, c2.x, c2.y - 20);

        if (log.defenderDied) {
          this.triggerEraserExplosion(c2.x, c2.y);
        }
      }
    });
    this.ctx.restore();
  }

  triggerEraserExplosion(cx, cy) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 6 + 2,
        life: 1.0,
        color: Math.random() > 0.5 ? '#78716c' : '#a8a29e'
      });
    }
  }

  updateParticles() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.ctx.save();
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  drawTileSelectionHighlight(x, y, color) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
    this.ctx.restore();
  }

  drawTileHoverHighlight(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
    this.ctx.restore();
  }

  getScreenCoords(gridX, gridY) {
    return {
      x: this.offsetX + gridX * this.tileSize,
      y: this.offsetY + gridY * this.tileSize
    };
  }

  getGridCoords(screenX, screenY) {
    const gx = Math.floor((screenX - this.offsetX) / this.tileSize);
    const gy = Math.floor((screenY - this.offsetY) / this.tileSize);

    if (gx >= 0 && gx < 8 && gy >= 0 && gy < 8) {
      return { x: gx, y: gy };
    }
    return null;
  }
}
