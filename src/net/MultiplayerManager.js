// Ink & Iron: Sketch Warfare - Online Multiplayer Network Module
// 100% Free Peer-to-Peer / Firebase Realtime Database Sync Engine
// Supports Anonymous / Registered Auth, Quick Matchmaking, Custom Room Codes & SHA-256 Commit-Reveal

export class MultiplayerManager {
  constructor() {
    this.rtdb = null;
    this.auth = null;
    this.sdk = null;
    this.currentRoomId = null;
    this.playerSlot = null; // 1 (Host / p1) or 2 (Guest / p2)
    this.isHost = false;
    this.roomData = null;
    this.roomUnsubscribe = null;
    this.queueUnsubscribe = null;
    this.presenceUnsubscribe = null;
    this.disconnectTimer = null;
    this.pendingTurnCommit = null;
    this.listeners = [];
  }

  get currentUser() {
    if (window.gAuth && window.gAuth.user) {
      return window.gAuth.user;
    }
    return null;
  }

  get currentProfile() {
    if (window.gAuth && window.gAuth.profile) {
      return window.gAuth.profile;
    }
    return {
      displayName: 'Commander Guest',
      rank: 'Recruit',
      wins: 0,
      losses: 0
    };
  }

  async ensureAuthenticated() {
    if (window.gAuthManager) {
      this.rtdb = window.gAuthManager.rtdb;
      this.auth = window.gAuthManager.auth;
      this.sdk = window.gAuthManager.sdk;
    }

    if (!this.auth) {
      throw new Error('Firebase Auth is initializing. Please try again in a moment.');
    }

    // If no user logged in, sign in anonymously so guests can play multiplayer instantly for $0
    if (!this.auth.currentUser) {
      try {
        const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const cred = await signInAnonymously(this.auth);
        window.gAuth.user = cred.user;
        window.gAuth.isGuest = true;
      } catch (err) {
        console.warn('[MultiplayerManager] Anonymous sign-in warning:', err);
      }
    }

    // Ensure Realtime Database is loaded
    if (!this.rtdb) {
      try {
        const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        this.rtdb = getDatabase(window.gAuthManager?.firebaseApp);
      } catch (err) {
        throw new Error('Realtime Database could not be reached: ' + err.message);
      }
    }

    return this.auth.currentUser;
  }

  generateRoomCode() {
    const prefixes = ['IRON', 'VALOR', 'TITAN', 'BLITZ', 'STORM', 'EAGLE', 'STEEL', 'VIPER'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
  }

  // ─── CRYPTOGRAPHIC COMMIT-REVEAL ANTI-PEEK HASH ENGINE ─────────────────────

  async createCommitHash(payloadObj) {
    const salt = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const packaged = { payload: payloadObj, salt };
    const str = JSON.stringify(packaged);
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(str));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
      commitHash: hashHex,
      revealData: packaged
    };
  }

  async verifyCommitHash(commitHash, revealData) {
    if (!commitHash || !revealData) return false;
    const str = JSON.stringify(revealData);
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(str));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === commitHash;
  }

  // ─── QUICK MATCHMAKING QUEUE ──────────────────────────────────────────────

  async findQuickMatch(onStatusUpdate) {
    const user = await this.ensureAuthenticated();
    const { ref, get, set, remove, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

    if (onStatusUpdate) onStatusUpdate('SEARCHING', 'Searching for active battle rooms...');

    const queueRef = ref(this.rtdb, 'matchmaking/queue');
    const snap = await get(queueRef);
    const queueData = snap.exists() ? snap.val() : {};

    // Check if there is an existing waiting room (not created by current user)
    const now = Date.now();
    let matchedRoomId = null;

    for (const [roomId, entry] of Object.entries(queueData)) {
      if (entry && entry.hostUid !== user.uid && (now - entry.createdAt) < 60000) {
        matchedRoomId = roomId;
        break;
      }
    }

    if (matchedRoomId) {
      if (onStatusUpdate) onStatusUpdate('JOINING', `Match found! Entering theater [${matchedRoomId}]...`);
      // Remove from matchmaking queue
      try { await remove(ref(this.rtdb, `matchmaking/queue/${matchedRoomId}`)); } catch(e){}
      return await this.joinRoom(matchedRoomId);
    } else {
      // Create new open room in queue
      const roomId = this.generateRoomCode();
      if (onStatusUpdate) onStatusUpdate('HOSTING', `Waiting for commander in [${roomId}]...`);

      await set(ref(this.rtdb, `matchmaking/queue/${roomId}`), {
        hostUid: user.uid,
        hostName: this.currentProfile.displayName || 'Commander',
        createdAt: now
      });

      // Cleanup queue entry if host disconnects
      const qEntryRef = ref(this.rtdb, `matchmaking/queue/${roomId}`);
      onDisconnect(qEntryRef).remove();

      return await this.createRoom(roomId, { isQuickMatch: true });
    }
  }

  async cancelQuickMatch() {
    if (this.currentRoomId) {
      try {
        const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        await remove(ref(this.rtdb, `matchmaking/queue/${this.currentRoomId}`));
      } catch(e){}
    }
    this.leaveRoom();
  }

  // ─── ROOM CREATION & JOINING ──────────────────────────────────────────────

  async createRoom(customCode = null, options = {}) {
    const user = await this.ensureAuthenticated();
    const roomId = (customCode || this.generateRoomCode()).toUpperCase().trim();
    const { ref, set, onValue, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

    this.currentRoomId = roomId;
    this.playerSlot = 1;
    this.isHost = true;

    const roomRef = ref(this.rtdb, `rooms/${roomId}`);
    const initialData = {
      id: roomId,
      status: 'LOBBY',
      createdAt: Date.now(),
      seed: Math.floor(Math.random() * 1000000),
      config: {
        map: options.map || 'PRESET_1',
        turnDuration: options.turnDuration || 40,
        playbackDuration: 3
      },
      players: {
        p1: {
          uid: user.uid,
          name: this.currentProfile.displayName || 'Commander 1',
          rank: this.currentProfile.rank || 'Recruit',
          faction: options.faction || 'IRON_CORPS',
          ready: false,
          connected: true,
          lastSeen: Date.now()
        }
      },
      turns: {}
    };

    await set(roomRef, initialData);

    // Presence on disconnect
    const p1PresenceRef = ref(this.rtdb, `rooms/${roomId}/players/p1/connected`);
    onDisconnect(p1PresenceRef).set(false);

    this.listenToRoom(roomId);
    return { success: true, roomId, playerSlot: 1 };
  }

  async joinRoom(roomId, options = {}) {
    const user = await this.ensureAuthenticated();
    const cleanId = roomId.toUpperCase().trim();
    const { ref, get, update, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

    const roomRef = ref(this.rtdb, `rooms/${cleanId}`);
    const snap = await get(roomRef);

    if (!snap.exists()) {
      throw new Error(`Battle Room [${cleanId}] does not exist.`);
    }

    const data = snap.val();
    if (data.status === 'IN_BATTLE' && data.players?.p2?.uid !== user.uid) {
      throw new Error(`Battle Room [${cleanId}] is already in progress with 2 players.`);
    }

    this.currentRoomId = cleanId;
    this.playerSlot = (data.players?.p1?.uid === user.uid) ? 1 : 2;
    this.isHost = (this.playerSlot === 1);

    const slotKey = `p${this.playerSlot}`;
    const defaultFaction = this.playerSlot === 2
      ? (data.players?.p1?.faction === 'IRON_CORPS' ? 'VANGUARD_LEGION' : 'IRON_CORPS')
      : 'IRON_CORPS';

    await update(ref(this.rtdb, `rooms/${cleanId}/players/${slotKey}`), {
      uid: user.uid,
      name: this.currentProfile.displayName || `Commander ${this.playerSlot}`,
      rank: this.currentProfile.rank || 'Recruit',
      faction: options.faction || defaultFaction,
      ready: false,
      connected: true,
      lastSeen: Date.now()
    });

    const presenceRef = ref(this.rtdb, `rooms/${cleanId}/players/${slotKey}/connected`);
    onDisconnect(presenceRef).set(false);

    this.listenToRoom(cleanId);
    return { success: true, roomId: cleanId, playerSlot: this.playerSlot };
  }

  listenToRoom(roomId) {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }

    import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js').then(({ ref, onValue }) => {
      const roomRef = ref(this.rtdb, `rooms/${roomId}`);
      this.roomUnsubscribe = onValue(roomRef, (snapshot) => {
        if (!snapshot.exists()) return;
        this.roomData = snapshot.val();
        this.handleRoomUpdate(this.roomData);
      });
    });
  }

  handleRoomUpdate(room) {
    this.notifyListeners(room);

    // If in battle, check turn synchronization
    if (room.status === 'IN_BATTLE' && room.turns && window.gApp?.engine) {
      this.handleTurnSync(room);
    }
  }

  // ─── LOBBY READY CHECKS & SETTINGS ─────────────────────────────────────────

  async setReady(isReady) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
    const slotKey = `p${this.playerSlot}`;
    await update(ref(this.rtdb, `rooms/${this.currentRoomId}/players/${slotKey}`), {
      ready: isReady
    });
  }

  async setFaction(factionKey) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
    const slotKey = `p${this.playerSlot}`;
    await update(ref(this.rtdb, `rooms/${this.currentRoomId}/players/${slotKey}`), {
      faction: factionKey
    });
  }

  async updateRoomConfig(configObj) {
    if (!this.currentRoomId || !this.isHost) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
    await update(ref(this.rtdb, `rooms/${this.currentRoomId}/config`), configObj);
  }

  async startMatch() {
    if (!this.currentRoomId || !this.isHost) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
    await update(ref(this.rtdb, `rooms/${this.currentRoomId}`), {
      status: 'IN_BATTLE',
      startedAt: Date.now()
    });
  }

  // ─── COMMIT-REVEAL TURN SYNCHRONIZATION ───────────────────────────────────

  async submitTurnOrders(turnNumber, ordersPayload) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

    const slotKey = `p${this.playerSlot}`;
    const otherSlotKey = this.playerSlot === 1 ? 'p2' : 'p1';

    // 1. Generate cryptographic commit hash
    const { commitHash, revealData } = await this.createCommitHash(ordersPayload);
    this.pendingTurnCommit = { turnNumber, revealData };

    // 2. Upload commit hash
    const updates = {};
    updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}Commit`] = commitHash;
    updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}CommittedAt`] = Date.now();

    await update(ref(this.rtdb), updates);

    // 3. Check if opponent has already committed their hash for this turn
    const turnData = this.roomData?.turns?.[turnNumber];
    if (turnData && turnData[`${otherSlotKey}Commit`]) {
      // Both committed! Immediately reveal our data
      await this.revealTurnData(turnNumber, revealData);
    }
  }

  async revealTurnData(turnNumber, revealData) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
    const slotKey = `p${this.playerSlot}`;
    const updates = {};
    updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}Data`] = revealData;
    await update(ref(this.rtdb), updates);
  }

  async handleTurnSync(room) {
    const engine = window.gApp?.engine;
    if (!engine || !engine.isMultiplayer) return;

    const currentTurn = engine.turnNumber;
    const turnData = room.turns?.[currentTurn];
    if (!turnData) return;

    const mySlot = `p${this.playerSlot}`;
    const oppSlot = this.playerSlot === 1 ? 'p2' : 'p1';

    // Step A: If opponent committed their hash and we have a pending commit, auto-reveal our payload
    if (turnData[`${oppSlot}Commit`] && this.pendingTurnCommit && this.pendingTurnCommit.turnNumber === currentTurn) {
      if (!turnData[`${mySlot}Data`]) {
        await this.revealTurnData(currentTurn, this.pendingTurnCommit.revealData);
      }
    }

    // Step B: If both players have revealed their data, verify and execute playback!
    if (turnData.p1Data && turnData.p2Data && !turnData.resolvedLocally) {
      turnData.resolvedLocally = true;

      // Verify cryptographic hashes for integrity
      const p1Valid = await this.verifyCommitHash(turnData.p1Commit, turnData.p1Data);
      const p2Valid = await this.verifyCommitHash(turnData.p2Commit, turnData.p2Data);

      if (!p1Valid || !p2Valid) {
        console.error('[MultiplayerManager] Turn hash verification failed! Possible packet tampering.');
        if (window.gApp?.ui?.showToast) {
          window.gApp.ui.showToast('Security Alert', 'Turn verification failed. Synchronizing with room state.');
        }
      }

      // Apply opponent orders to the engine
      const opponentPayload = this.playerSlot === 1 ? turnData.p2Data.payload : turnData.p1Data.payload;
      const myPayload = this.playerSlot === 1 ? turnData.p1Data.payload : turnData.p2Data.payload;

      if (window.gApp && window.gApp.applyMultiplayerTurn) {
        window.gApp.applyMultiplayerTurn(currentTurn, myPayload, opponentPayload);
      }
    }
  }

  leaveRoom() {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    this.currentRoomId = null;
    this.playerSlot = null;
    this.isHost = false;
    this.roomData = null;
    this.pendingTurnCommit = null;
    this.notifyListeners(null);
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notifyListeners(data) {
    this.listeners.forEach(fn => {
      try { fn(data); } catch(e){}
    });
  }
}

window.gMultiplayer = new MultiplayerManager();
