import { UNIT_TYPES, STANCES, FACTIONS } from '../engine/Types.js';
import { d1Service } from '../engine/D1Service.js';

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

    this.allAdminUsers = [];

    this.setupListeners();
    this.setupMenuTabs();
    this.initD1Settings();
    this.setupAdminShortcut();
    this.bindGlobalWindowHandlers();
  }

  async initD1Settings() {
    const res = await d1Service.syncSettings();
    const user = d1Service.user;

    const usernameInput = document.getElementById('input-username');
    if (usernameInput) usernameInput.value = user.username || '';

    const masterSlider = document.getElementById('slider-master-vol');
    if (masterSlider) masterSlider.value = user.master_volume;
    if (this.app && this.app.audio) this.app.audio.setMasterVolume(user.master_volume / 100);

    const sfxSlider = document.getElementById('slider-sfx-vol');
    if (sfxSlider) sfxSlider.value = user.sfx_volume;
    if (this.app && this.app.audio) this.app.audio.setSFXVolume(user.sfx_volume / 100);

    const timerSelect = document.getElementById('select-timer-duration');
    if (timerSelect) timerSelect.value = user.planning_duration;

    const speedSelect = document.getElementById('select-playback-duration');
    if (speedSelect) speedSelect.value = user.playback_speed;

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
  }

  setupAdminShortcut() {
    // 1. Hotkey Trigger: Alt + Shift + A (or Option + Shift + A)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        this.openAdminAuthModal();
      }
    });

    // 2. Secret Logo Badge 3-Click Trigger
    let logoClickCount = 0;
    let logoClickTimer = null;
    const logoBadge = document.getElementById('menu-logo-badge');
    if (logoBadge) {
      logoBadge.addEventListener('click', () => {
        logoClickCount++;
        if (logoClickTimer) clearTimeout(logoClickTimer);

        if (logoClickCount >= 3) {
          logoClickCount = 0;
          this.openAdminAuthModal();
        } else {
          logoClickTimer = setTimeout(() => {
            logoClickCount = 0;
          }, 1000);
        }
      });
    }
  }

  openAdminAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('input-admin-passcode');
      if (input) {
        input.value = '';
        input.focus();
      }
      const err = document.getElementById('admin-auth-error');
      if (err) err.style.display = 'none';
    }
  }

  bindGlobalWindowHandlers() {
    window.updateUsername = (val) => {
      d1Service.syncSettings({ username: val });
    };

    window.updateMasterVolume = (val) => {
      if (this.app && this.app.audio) this.app.audio.setMasterVolume(val / 100);
      d1Service.syncSettings({ master_volume: Number(val) });
    };

    window.updateSFXVolume = (val) => {
      if (this.app && this.app.audio) this.app.audio.setSFXVolume(val / 100);
      d1Service.syncSettings({ sfx_volume: Number(val) });
    };

    window.toggleAudioMute = () => {
      if (this.app && this.app.audio) {
        const muted = this.app.audio.toggleMute();
        const btn = document.getElementById('btn-toggle-sound');
        if (btn) btn.textContent = muted ? 'Disabled (Muted)' : 'SFX Enabled';
        d1Service.syncSettings({ audio_muted: muted });
      }
    };

    window.updatePlanningDuration = (val) => {
      d1Service.syncSettings({ planning_duration: Number(val) });
    };

    window.updatePlaybackSpeed = (val) => {
      d1Service.syncSettings({ playback_speed: Number(val) });
    };

    window.closeAdminAuthModal = () => {
      const modal = document.getElementById('admin-auth-modal');
      if (modal) modal.style.display = 'none';
    };

    window.submitAdminAuth = async () => {
      const passcode = document.getElementById('input-admin-passcode').value.trim();
      const errDiv = document.getElementById('admin-auth-error');
      try {
        await d1Service.loginAdmin(passcode);
        window.closeAdminAuthModal();
        this.openAdminPanel();
      } catch (err) {
        if (errDiv) {
          errDiv.textContent = err.message || "Invalid Admin Passcode";
          errDiv.style.display = 'block';
        }
      }
    };

    window.closeAdminPanel = () => {
      const overlay = document.getElementById('admin-panel-overlay');
      if (overlay) overlay.style.display = 'none';
    };

    window.refreshAdminUserTable = async () => {
      const tbody = document.getElementById('admin-user-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Fetching users from Cloudflare D1...</td></tr>';
      try {
        this.allAdminUsers = await d1Service.fetchAllUsers();
        this.renderAdminUserTable(this.allAdminUsers);
      } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 20px;">Error: ${err.message}</td></tr>`;
      }
    };

    window.filterAdminUserTable = (query) => {
      const q = query.toLowerCase();
      const filtered = this.allAdminUsers.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) || 
        (u.id && u.id.toLowerCase().includes(q))
      );
      this.renderAdminUserTable(filtered);
    };

    window.openAdminEditModal = (id) => {
      const user = this.allAdminUsers.find(u => u.id === id);
      if (!user) return;

      document.getElementById('edit-user-id').value = user.id;
      document.getElementById('edit-user-username').value = user.username || '';
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

    window.closeAdminEditModal = () => {
      const modal = document.getElementById('admin-edit-modal');
      if (modal) modal.style.display = 'none';
    };

    window.saveAdminUserEdit = async () => {
      const id = document.getElementById('edit-user-id').value;
      const updates = {
        username: document.getElementById('edit-user-username').value.trim(),
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

    window.toggleBanAdminUser = async (id, currentBanned) => {
      try {
        await d1Service.updateUser(id, { is_banned: !currentBanned });
        window.refreshAdminUserTable();
      } catch (err) {
        alert("Failed to toggle suspension: " + err.message);
      }
    };

    window.deleteAdminUser = async (id) => {
      if (!confirm(`Are you sure you want to permanently delete user record ${id}?`)) return;
      try {
        await d1Service.deleteUser(id);
        window.refreshAdminUserTable();
      } catch (err) {
        alert("Failed to delete user: " + err.message);
      }
    };
  }

  async openAdminPanel() {
    const overlay = document.getElementById('admin-panel-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      window.refreshAdminUserTable();
    }
  }

  renderAdminUserTable(users) {
    const tbody = document.getElementById('admin-user-table-body');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No user records found in Cloudflare D1.</td></tr>';
      return;
    }

    let html = '';
    users.forEach(u => {
      const isBanned = Boolean(u.is_banned);
      const statusBadge = isBanned 
        ? `<span class="admin-badge-status banned">Banned</span>`
        : `<span class="admin-badge-status active">Active</span>`;

      html += `
        <tr>
          <td><b>${u.username || 'Commander'}</b></td>
          <td><code style="font-size:0.75rem;">${u.id}</code></td>
          <td>${u.master_volume}% / ${u.sfx_volume}%</td>
          <td>${u.planning_duration}s / ${u.playback_speed}s</td>
          <td><span style="color:#34d399; font-weight:600;">${u.wins}W</span> - <span style="color:#f87171; font-weight:600;">${u.losses}L</span></td>
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
  }

  setupMenuTabs() {
    window.switchMenuTab = (btnId, paneId) => {
      this.app.audio.playPencilScratch();
      document.querySelectorAll('.menu-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

      const activeBtn = document.getElementById(btnId);
      const activePane = document.getElementById(paneId);

      if (activeBtn) activeBtn.classList.add('active');
      if (activePane) activePane.style.display = 'block';
    };
  }

  openInGameMenu() {
    if (this.app.engine) {
      this.app.engine.pauseTimer();
    }
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

    this.p1InkDisplay.textContent = `P1 Ink: ✒️ ${engine.players[1].ink}`;
    this.p2InkDisplay.textContent = `${engine.players[2].name}: ✒️ ${engine.players[2].ink}`;

    this.renderUnitStore(engine);
    this.renderInspector(engine);
    this.updateActionLogs(engine);

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

  updateTimerBar(ratio) {
    if (this.timerBarFill) {
      this.timerBarFill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
    }
  }

  renderInspector(engine) {
    if (!this.inspectorContent) return;

    const selectedTile = engine.selectedTile;
    if (!selectedTile) {
      this.inspectorContent.innerHTML = '<p class="text-muted">Select any grid hex to view terrain dynamics or unit directives.</p>';
      return;
    }

    const { r, c } = selectedTile;
    const tile = engine.grid[r][c];
    const unitOnTile = engine.getUnitAt ? engine.getUnitAt(r, c) : null;

    let html = `
      <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; margin-bottom: 8px;">
        <h4 style="color:var(--text-primary); font-size:1rem;">HEX TILE (${r}, ${c})</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">Terrain: <b>${tile ? tile.name : 'Clear'}</b></p>
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

    if (engine.combatLogs) {
      engine.combatLogs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `⚔️ <b>${log.attackerId}</b> struck <b>${log.defenderId}</b> for <span style="color:#dc2626; font-weight:bold;">${log.damageDealt} HP</span>${log.isAmbushStrike ? ' (AMBUSH STRIKE!)' : ''}`;
        this.actionLogBox.appendChild(div);
      });
    }
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
      if (winnerId === 1) {
        d1Service.syncSettings({ wins: (d1Service.user.wins || 0) + 1 });
      } else {
        d1Service.syncSettings({ losses: (d1Service.user.losses || 0) + 1 });
      }
    }
  }
}
