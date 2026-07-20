import { UNIT_TYPES, STANCES, FACTIONS } from '../engine/Types.js';

export class UIManager {
  constructor(app) {
    this.app = app;

    // HUD DOM Elements
    this.gameContainer = document.getElementById('game-container');
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.inGameMenuModal = document.getElementById('in-game-menu-modal');

    this.phaseBadge = document.getElementById('phase-badge');
    this.timerBarFill = document.getElementById('timer-bar-fill');
    this.turnCounter = document.getElementById('turn-counter');
    this.p1InkDisplay = document.getElementById('p1-ink');
    this.p2InkDisplay = document.getElementById('p2-ink');

    this.inspectorContent = document.getElementById('inspector-content');
    this.storeContainer = document.getElementById('unit-store-container');
    this.actionLogBox = document.getElementById('action-log-box');

    this.setupListeners();
    this.setupMenuTabs();
  }

  setupListeners() {
    // 1. Deploy / Start Match from Main Menu
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        this.mainMenuOverlay.style.display = 'none';
        this.gameContainer.classList.remove('game-blurred');
        this.app.launchMatchFromMenu();
      });
    }

    // 2. Open In-Game Blur Menu Button
    const openMenuBtn = document.getElementById('btn-open-menu');
    if (openMenuBtn) {
      openMenuBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        this.openInGameMenu();
      });
    }

    // 3. Resume Match from In-Game Menu
    const resumeBtn = document.getElementById('btn-resume-game');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        this.closeInGameMenu();
      });
    }

    // 4. Exit to Main Menu
    const exitBtn = document.getElementById('btn-exit-to-main');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        this.closeInGameMenu();
        if (this.app.engine) this.app.engine.pauseTimer();
        this.mainMenuOverlay.style.display = 'flex';
      });
    }

    // 5. In-Game Pause Restart Match
    const restartPauseBtn = document.getElementById('btn-pause-restart');
    if (restartPauseBtn) {
      restartPauseBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        this.closeInGameMenu();
        this.app.launchMatchFromMenu();
      });
    }

    // 6. End Planning Phase Button
    const endTurnBtn = document.getElementById('btn-end-turn');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        if (this.app.engine && this.app.engine.phase === 'PLANNING') {
          this.app.engine.endPlanningPhase();
        }
      });
    }

    // 7. Victory Modal Return to Main Menu
    const victoryMainBtn = document.getElementById('btn-victory-main-menu');
    if (victoryMainBtn) {
      victoryMainBtn.addEventListener('click', () => {
        document.getElementById('victory-modal').style.display = 'none';
        this.mainMenuOverlay.style.display = 'flex';
      });
    }

    // 8. Sound Toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const muted = this.app.audio.toggleMute();
        soundBtn.textContent = muted ? 'Disabled (Muted)' : 'Enabled';
        soundBtn.style.background = muted ? '#fecdd3' : '#bbf7d0';
      });
    }
  }

  setupMenuTabs() {
    const tabs = [
      { btn: 'tab-btn-play', pane: 'tab-pane-play' },
      { btn: 'tab-btn-codex', pane: 'tab-pane-codex' },
      { btn: 'tab-btn-armory', pane: 'tab-pane-armory' },
      { btn: 'tab-btn-settings', pane: 'tab-pane-settings' }
    ];

    tabs.forEach(t => {
      const btnEl = document.getElementById(t.btn);
      const paneEl = document.getElementById(t.pane);
      if (btnEl && paneEl) {
        btnEl.addEventListener('click', () => {
          this.app.audio.playPencilScratch();
          tabs.forEach(other => {
            document.getElementById(other.btn)?.classList.remove('active');
            const otherPane = document.getElementById(other.pane);
            if (otherPane) otherPane.style.display = 'none';
          });
          btnEl.classList.add('active');
          paneEl.style.display = 'flex';
        });
      }
    });
  }

  openInGameMenu() {
    if (this.app.engine) {
      this.app.engine.pauseTimer(); // Pause game timer while menu is active
    }
    this.gameContainer.classList.add('game-blurred');
    this.inGameMenuModal.style.display = 'flex';
  }

  closeInGameMenu() {
    this.inGameMenuModal.style.display = 'none';
    this.gameContainer.classList.remove('game-blurred');
    if (this.app.engine && this.app.engine.phase !== 'GAME_OVER') {
      this.app.engine.startTurnTimer(); // Resume game timer
    }
  }

  updateHUD(engine) {
    if (!engine) return;

    // 1. Turn & Phase Badge
    this.turnCounter.textContent = `Turn ${engine.turnNumber}`;

    if (engine.phase === 'PLANNING') {
      this.phaseBadge.textContent = `📝 Planning Phase (${engine.planningTimeRemaining}s)`;
      this.phaseBadge.style.background = '#fef3c7';
      const pct = (engine.planningTimeRemaining / 20) * 100;
      this.timerBarFill.style.width = `${pct}%`;
    } else if (engine.phase === 'PLAYBACK') {
      this.phaseBadge.textContent = `⚔️ Playback Phase (${engine.playbackTimeRemaining}s)`;
      this.phaseBadge.style.background = '#fed7aa';
      const pct = (engine.playbackTimeRemaining / 10) * 100;
      this.timerBarFill.style.width = `${pct}%`;
    } else {
      this.phaseBadge.textContent = `🏆 Match Finished`;
      this.timerBarFill.style.width = '0%';
    }

    // 2. Ink Currency
    this.p1InkDisplay.textContent = `P1 Ink: ✒️ ${engine.players[1].ink}`;
    this.p2InkDisplay.textContent = `${engine.players[2].name}: ✒️ ${engine.players[2].ink}`;

    // 3. Render Unit Store
    this.renderUnitStore(engine);

    // 4. Render Inspector
    this.renderInspector(engine);

    // 5. Update Action Logs
    this.updateActionLogs(engine);

    // 6. Victory Screen
    if (engine.winner) {
      this.showVictoryModal(engine.winner, engine);
    }
  }

  renderUnitStore(engine) {
    if (!this.storeContainer) return;
    this.storeContainer.innerHTML = '';

    const p1 = engine.players[1];
    const availableTypes = Object.keys(UNIT_TYPES).filter(key => {
      const type = UNIT_TYPES[key];
      return !type.factionLock || type.factionLock === p1.faction.id;
    });

    availableTypes.forEach(key => {
      const uType = UNIT_TYPES[key];
      const btn = document.createElement('button');
      btn.className = 'unit-card-btn';
      btn.innerHTML = `
        <div class="unit-card-info">
          <span class="unit-card-title">${uType.icon} ${uType.name}</span>
          <span class="unit-card-desc">${uType.description}</span>
        </div>
        <span class="unit-card-cost">✒️ ${uType.cost}</span>
      `;

      btn.addEventListener('click', () => {
        this.app.audio.playPencilScratch();
        const sel = this.app.renderer.selectedTile;
        const targetX = sel ? sel.x : engine.p1Base.x;
        const targetY = sel ? sel.y : engine.p1Base.y;

        const res = engine.buyUnit(1, key, targetX, targetY);
        if (res.success) {
          this.app.audio.playSpawnSound();
          this.log(`Recruited ${uType.name} at (${targetX}, ${targetY})`);
        } else {
          alert(`Cannot recruit: ${res.reason}`);
        }
      });

      this.storeContainer.appendChild(btn);
    });
  }

  renderInspector(engine) {
    if (!this.inspectorContent) return;

    const selTile = this.app.renderer.selectedTile;
    if (!selTile) {
      this.inspectorContent.innerHTML = `<p class="handwriting" style="font-size:1.1rem; color:#6b7280;">Click any grid square to inspect terrain or give unit orders.</p>`;
      return;
    }

    const tile = engine.grid[selTile.y][selTile.x];
    const unitOnTile = engine.getAllUnits().find(u => u.x === selTile.x && u.y === selTile.y);

    let html = `
      <div style="border-bottom: 1px dashed #9ca3af; padding-bottom: 8px;">
        <h3 style="font-size:1.3rem;">Terrain: ${tile.name} (${tile.x}, ${tile.y})</h3>
        <p style="font-size:0.85rem; color:#4b5563;">Defense Bonus: +${Math.round((tile.defenseBonus || 0) * 100)}%</p>
      </div>
    `;

    if (unitOnTile) {
      const ownerName = engine.players[unitOnTile.owner].name;
      html += `
        <div style="margin-top: 8px;">
          <h3 style="font-size:1.3rem;">${unitOnTile.icon} ${unitOnTile.name} (${ownerName})</h3>
          <p style="font-size:0.9rem;">HP: ${unitOnTile.hp} / ${unitOnTile.maxHp}</p>
          <p style="font-size:0.9rem;">Move Range: ${unitOnTile.moveRange} | Attack: ${unitOnTile.attack}</p>
      `;

      if (unitOnTile.owner === 1 && engine.phase === 'PLANNING') {
        html += `
          <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size:0.85rem; font-weight:bold;">Combat Stance:</label>
            <div style="display: flex; gap: 6px;">
              <button id="stance-adv" class="btn-sketch ${unitOnTile.stance === 'ADVANCE' ? 'active' : ''}">Advance</button>
              <button id="stance-def" class="btn-sketch ${unitOnTile.stance === 'DEFEND' ? 'active' : ''}">Defend</button>
              <button id="stance-amb" class="btn-sketch ${unitOnTile.stance === 'AMBUSH' ? 'active' : ''}">Ambush</button>
            </div>
            <button id="btn-clear-path" class="btn-sketch" style="margin-top:4px;">❌ Clear Path Waypoints</button>
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
      const btnClear = document.getElementById('btn-clear-path');

      if (btnAdv) btnAdv.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'ADVANCE'); this.updateHUD(engine); });
      if (btnDef) btnDef.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'DEFEND'); this.updateHUD(engine); });
      if (btnAmb) btnAmb.addEventListener('click', () => { engine.setUnitStance(unitOnTile.id, 'AMBUSH'); this.updateHUD(engine); });
      if (btnClear) btnClear.addEventListener('click', () => { engine.setUnitWaypoints(unitOnTile.id, []); this.updateHUD(engine); });
    }
  }

  updateActionLogs(engine) {
    if (!this.actionLogBox) return;
    this.actionLogBox.innerHTML = '';

    engine.combatLogs.forEach(log => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `⚔️ <b>${log.attackerId}</b> struck <b>${log.defenderId}</b> for <span style="color:#dc2626; font-weight:bold;">${log.damageDealt} HP</span>${log.isAmbushStrike ? ' (AMBUSH STRIKE!)' : ''}`;
      this.actionLogBox.appendChild(div);
    });
  }

  log(msg) {
    if (!this.actionLogBox) return;
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `📜 ${msg}`;
    this.actionLogBox.prepend(div);
  }

  showVictoryModal(winnerId, engine) {
    const overlay = document.getElementById('victory-modal');
    if (overlay) {
      overlay.style.display = 'flex';
      const winnerName = engine.players[winnerId].name;
      document.getElementById('victory-title').textContent = `🎉 ${winnerName} Victorious!`;
      document.getElementById('victory-sub').textContent = `The enemy Main Base has been captured in Turn ${engine.turnNumber}!`;
    }
  }
}
