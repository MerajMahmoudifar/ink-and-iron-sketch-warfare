import { GameEngine } from '../engine/GameEngine.js';
import { SketchRenderer } from '../render/SketchRenderer.js';
import { AudioEngine } from '../render/AudioEngine.js';
import { UIManager } from './UIManager.js';
import { CommanderAI } from '../ai/CommanderAI.js';
import { FACTIONS } from '../engine/Types.js';

export class App {
  constructor() {
    this.canvas = document.getElementById('sketch-canvas');
    this.renderer = new SketchRenderer(this.canvas);
    this.audio = new AudioEngine();

    this.engine = null;
    this.ui = new UIManager(this);

    this.setupCanvasInteractions();
    this.startRenderLoop();
  }

  launchMatchFromMenu() {
    if (this.engine) {
      this.engine.pauseTimer();
    }

    const mapVal = document.getElementById('select-map')?.value || 'PRESET_1';
    const p1FactionKey = document.getElementById('select-p1-faction')?.value || 'IRON_CORPS';
    const aiPersonality = document.getElementById('select-ai-personality')?.value || 'TACTICUS';
    const gameMode = document.getElementById('select-game-mode')?.value || 'SINGLE_PLAYER';
    const timerDuration = parseInt(document.getElementById('select-timer-duration')?.value || '20', 10);

    const p2FactionKey = p1FactionKey === 'IRON_CORPS' ? 'VANGUARD_LEGION' : 'IRON_CORPS';

    this.engine = new GameEngine({
      mapType: mapVal,
      p1Faction: FACTIONS[p1FactionKey],
      p2Faction: FACTIONS[p2FactionKey],
      isSinglePlayer: gameMode === 'SINGLE_PLAYER',
      aiPersonality: aiPersonality
    });

    this.engine.planningTimeRemaining = timerDuration;

    this.engine.subscribe(() => {
      // Trigger AI turn generation when phase switches to Playback in Single Player mode
      if (this.engine.isSinglePlayer && this.engine.phase === 'PLAYBACK' && this.engine.playbackTimeRemaining === 10) {
        CommanderAI.processTurn(this.engine, this.engine.aiPersonality);
      }
      if (this.ui) this.ui.updateHUD(this.engine);
    });

    this.engine.startTurnTimer();
    this.renderer.selectedTile = null;
    this.renderer.selectedUnit = null;
    this.ui.updateHUD(this.engine);
  }

  setupCanvasInteractions() {
    this.canvas.addEventListener('click', (e) => {
      if (!this.engine) return;

      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const gridCoords = this.renderer.getGridCoords(clickX, clickY);
      if (!gridCoords) return;

      this.audio.playPencilScratch();
      const prevSelected = this.renderer.selectedTile;
      this.renderer.selectedTile = gridCoords;

      // Handle Unit Movement Path Drawing during 20s planning phase
      if (this.engine.phase === 'PLANNING') {
        const unitOnPrevTile = prevSelected ? this.engine.getAllUnits().find(u => u.x === prevSelected.x && u.y === prevSelected.y && u.owner === 1) : null;

        if (unitOnPrevTile) {
          // Calculate valid path to newly clicked tile
          const path = this.engine.findValidPath(unitOnPrevTile, gridCoords.x, gridCoords.y);
          if (path.length > 0) {
            this.engine.setUnitWaypoints(unitOnPrevTile.id, path);
            this.ui.log(`Added waypoint path for ${unitOnPrevTile.name} to (${gridCoords.x}, ${gridCoords.y})`);
          }
        }
      }

      this.ui.updateHUD(this.engine);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      this.renderer.hoveredTile = this.renderer.getGridCoords(gx, gy);
    });
  }

  startRenderLoop() {
    const loop = () => {
      if (this.engine) {
        this.renderer.render(this.engine);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Instantiate web app on load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
