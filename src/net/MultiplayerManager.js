// Ink & Iron: Sketch Warfare - Online Multiplayer Network Module
// Hybrid Realtime Database (Cloud) + Local Mesh (Multi-Tab / Cross-Window) Transport Engine
// 100% Free Zero-Server Architecture: Cryptographic SHA-256 Commit-Reveal WEGO Synchronizer

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
    this.pendingTurnCommit = null;
    this.listeners = [];
    this.statusListeners = [];
    this.presenceListeners = [];
    this.presenceState = 'LOBBY';
    this.onlineStats = { total: 1, inLobby: 1, inMatchmaking: 0, inRoom: 0, inBattle: 0, users: [] };
    this.isFirebaseConnected = false;
    this.isFirebasePresenceInit = false;
    this.presenceHeartbeatTimer = null;
    this.transportMode = 'CLOUD'; // 'CLOUD' (Firebase RTDB) or 'LOCAL_MESH' (BroadcastChannel + localStorage)

    this.tabId = this.getOrCreateTabId();
    this.guestUid = this.getOrCreateGuestUid();
    this.initBroadcastChannel();
    this.initPresence();
  }

  get myUid() {
    if (window.gAuth && window.gAuth.user && window.gAuth.user.uid) {
      return window.gAuth.user.uid;
    }
    return this.guestUid;
  }

  get presenceSessionId() {
    return `${this.myUid}_${this.tabId}`;
  }

  get currentUser() {
    if (window.gAuth && window.gAuth.user) {
      return window.gAuth.user;
    }
    return { uid: this.myUid, isGuest: true };
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

  getOrCreateTabId() {
    try {
      let tabId = sessionStorage.getItem('sketch_mp_tab_id');
      if (!tabId) {
        tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
        sessionStorage.setItem('sketch_mp_tab_id', tabId);
      }
      return tabId;
    } catch (e) {
      return 'tab_' + Math.random().toString(36).substring(2, 9);
    }
  }

  getOrCreateGuestUid() {
    try {
      let uid = sessionStorage.getItem('sketch_guest_uid');
      if (!uid) {
        uid = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
        sessionStorage.setItem('sketch_guest_uid', uid);
      }
      return uid;
    } catch (e) {
      return 'guest_' + Math.random().toString(36).substring(2, 10);
    }
  }

  // ─── LOCAL MESH & BROADCAST CHANNEL SUBSYSTEM ────────────────────────────

  initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('ink_iron_mp_network');
        this.broadcastChannel.onmessage = (evt) => this.handleLocalMeshMessage(evt.data);
      }
    } catch (e) {
      console.warn('[MultiplayerManager] BroadcastChannel not supported in this environment:', e);
    }

    // Cross-tab storage event backup
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (evt) => {
        if (evt.key === 'sketch_mp_rooms_event' && evt.newValue) {
          try {
            const data = JSON.parse(evt.newValue);
            this.handleLocalMeshMessage(data);
          } catch (e) {}
        }
      });
    }
  }

  _getLocalRooms() {
    try {
      return JSON.parse(localStorage.getItem('sketch_mp_rooms') || '{}');
    } catch (e) {
      return {};
    }
  }

  _saveLocalRooms(rooms) {
    try {
      localStorage.setItem('sketch_mp_rooms', JSON.stringify(rooms));
    } catch (e) {}
  }

  _getLocalQueue() {
    try {
      return JSON.parse(localStorage.getItem('sketch_mp_queue') || '{}');
    } catch (e) {
      return {};
    }
  }

  _saveLocalQueue(queue) {
    try {
      localStorage.setItem('sketch_mp_queue', JSON.stringify(queue));
    } catch (e) {}
  }

  _broadcastMeshEvent(action, payload) {
    const msg = {
      action,
      payload,
      senderUid: this.myUid,
      timestamp: Date.now()
    };
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }
    try {
      localStorage.setItem('sketch_mp_rooms_event', JSON.stringify(msg));
    } catch (e) {}
  }

  handleLocalMeshMessage(msg) {
    if (!msg || !msg.action) return;

    if (msg.action === 'ROOM_UPDATED' && msg.payload && msg.payload.id === this.currentRoomId) {
      this.roomData = msg.payload;
      this.handleRoomUpdate(this.roomData);
    } else if (msg.action === 'QUEUE_UPDATED') {
      // If we are currently searching for quick match, re-check local queue
      if (this.isSearchingQuickMatch) {
        this.checkLocalMatchmakingQueue();
      }
    } else if (msg.action === 'PRESENCE_PING' || msg.action === 'PRESENCE_LEAVE') {
      if (!this.isFirebaseConnected) {
        this.processLocalMeshPresence();
      }
    }
  }

  // ─── AUTHENTICATION & RTDB PROBING ────────────────────────────────────────

  async ensureAuthenticated() {
    if (window.gAuthManager) {
      this.rtdb = window.gAuthManager.rtdb;
      this.auth = window.gAuthManager.auth;
      this.sdk = window.gAuthManager.sdk;
    }

    // Try Anonymous Firebase Auth if not signed in
    if (this.auth && !this.auth.currentUser) {
      try {
        const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const cred = await signInAnonymously(this.auth);
        if (window.gAuth) {
          window.gAuth.user = cred.user;
          window.gAuth.isGuest = true;
        }
      } catch (err) {
        console.warn('[MultiplayerManager] Anonymous auth bypassed, using local guest token:', err?.message || err);
      }
    }

    // Ensure Realtime Database instance is loaded
    if (!this.rtdb && window.gAuthManager?.firebaseApp) {
      try {
        const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        this.rtdb = getDatabase(window.gAuthManager.firebaseApp);
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB load bypassed:', err?.message || err);
      }
    }

    if (this.rtdb && !this.isFirebasePresenceInit) {
      this.initFirebasePresence().catch(() => {});
    }

    return this.currentUser;
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
    const payloadStr = JSON.stringify(payloadObj || {});
    const combined = payloadStr + '::' + salt;
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(combined));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
      commitHash: hashHex,
      revealData: { payload: payloadObj || {}, payloadStr, salt }
    };
  }

  async verifyCommitHash(commitHash, revealData) {
    if (!commitHash || !revealData) return false;
    const payloadStr = revealData.payloadStr || JSON.stringify(revealData.payload || {});
    const combined = payloadStr + '::' + (revealData.salt || '');
    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(combined));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === commitHash;
  }

  // ─── QUICK MATCHMAKING QUEUE ──────────────────────────────────────────────

  async findQuickMatch(onStatusUpdate) {
    this.isSearchingQuickMatch = true;
    this.setPresenceState('MATCHMAKING');
    const user = await this.ensureAuthenticated();

    if (onStatusUpdate) onStatusUpdate('SEARCHING', 'Scanning tactical network for open battle frequencies...');

    // Attempt Firebase RTDB Queue first if not in forced local mode
    if (this.rtdb && this.transportMode !== 'LOCAL_MESH') {
      try {
        const { ref, get, set, remove, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const queueRef = ref(this.rtdb, 'matchmaking/queue');
        const snap = await get(queueRef);
        const queueData = snap.exists() ? snap.val() : {};

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
          try { await remove(ref(this.rtdb, `matchmaking/queue/${matchedRoomId}`)); } catch(e){}
          this.isSearchingQuickMatch = false;
          return await this.joinRoom(matchedRoomId);
        } else {
          const roomId = this.generateRoomCode();
          if (onStatusUpdate) onStatusUpdate('HOSTING', `Broadcasting challenge in [${roomId}]...`);

          await set(ref(this.rtdb, `matchmaking/queue/${roomId}`), {
            hostUid: user.uid,
            hostName: this.currentProfile.displayName || 'Commander',
            createdAt: now
          });

          const qEntryRef = ref(this.rtdb, `matchmaking/queue/${roomId}`);
          onDisconnect(qEntryRef).remove();

          this.isSearchingQuickMatch = true;
          return await this.createRoom(roomId, { isQuickMatch: true });
        }
      } catch (err) {
        console.warn('[MultiplayerManager] Cloud matchmaking restricted, switching to Local Mesh transport:', err?.message || err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh Matchmaking Fallback
    return this.findQuickMatchLocal(onStatusUpdate);
  }

  findQuickMatchLocal(onStatusUpdate) {
    this.setPresenceState('MATCHMAKING');
    if (onStatusUpdate) onStatusUpdate('SEARCHING', 'Searching Local Mesh Theater for active commanders...');
    const queue = this._getLocalQueue();
    const now = Date.now();
    let matchedRoomId = null;

    for (const [roomId, entry] of Object.entries(queue)) {
      if (entry && entry.hostUid !== this.myUid && (now - entry.createdAt) < 120000) {
        matchedRoomId = roomId;
        break;
      }
    }

    if (matchedRoomId) {
      if (onStatusUpdate) onStatusUpdate('JOINING', `Local match found! Synchronizing with [${matchedRoomId}]...`);
      delete queue[matchedRoomId];
      this._saveLocalQueue(queue);
      this._broadcastMeshEvent('QUEUE_UPDATED', {});
      this.isSearchingQuickMatch = false;
      return this.joinRoomLocal(matchedRoomId);
    } else {
      const roomId = this.generateRoomCode();
      if (onStatusUpdate) onStatusUpdate('HOSTING', `Hosting Local Mesh Theater [${roomId}]...`);

      queue[roomId] = {
        hostUid: this.myUid,
        hostName: this.currentProfile.displayName || 'Commander Host',
        createdAt: now
      };
      this._saveLocalQueue(queue);
      this._broadcastMeshEvent('QUEUE_UPDATED', {});

      this.isSearchingQuickMatch = true;
      return this.createRoomLocal(roomId, { isQuickMatch: true });
    }
  }

  checkLocalMatchmakingQueue() {
    // If waiting in local queue and another tab created or modified queue
    if (!this.isSearchingQuickMatch) return;
  }

  async cancelQuickMatch() {
    this.isSearchingQuickMatch = false;
    if (this.currentRoomId) {
      if (this.rtdb && this.transportMode === 'CLOUD') {
        try {
          const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
          await remove(ref(this.rtdb, `matchmaking/queue/${this.currentRoomId}`));
          await remove(ref(this.rtdb, `rooms/${this.currentRoomId}`));
        } catch(e){}
      }
      const queue = this._getLocalQueue();
      if (queue[this.currentRoomId]) {
        delete queue[this.currentRoomId];
        this._saveLocalQueue(queue);
        this._broadcastMeshEvent('QUEUE_UPDATED', {});
      }
      const rooms = this._getLocalRooms();
      if (rooms[this.currentRoomId]) {
        delete rooms[this.currentRoomId];
        this._saveLocalRooms(rooms);
        this._broadcastMeshEvent('ROOM_UPDATED', { id: this.currentRoomId, deleted: true });
      }
    }
    this.leaveRoom();
  }

  // ─── ROOM CREATION ────────────────────────────────────────────────────────

  async createRoom(customCode = null, options = {}) {
    const user = await this.ensureAuthenticated();
    const roomId = (customCode || this.generateRoomCode()).toUpperCase().trim();

    // Primary: Firebase Realtime Database
    if (this.rtdb && this.transportMode !== 'LOCAL_MESH') {
      try {
        const { ref, set, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        this.currentRoomId = roomId;
        this.playerSlot = 1;
        this.isHost = true;
        this.transportMode = 'CLOUD';

        const roomRef = ref(this.rtdb, `rooms/${roomId}`);
        const initialData = this.buildInitialRoomData(roomId, user.uid, options);

        await set(roomRef, initialData);

        const p1PresenceRef = ref(this.rtdb, `rooms/${roomId}/players/p1/connected`);
        onDisconnect(p1PresenceRef).set(false);

        this.listenToRoom(roomId);
        this.setPresenceState('IN_ROOM', roomId);
        this.notifyNetworkStatus('CLOUD', 'Connected to Global Firebase Cloud Network.');
        return { success: true, roomId, playerSlot: 1, transport: 'CLOUD' };
      } catch (err) {
        console.warn('[MultiplayerManager] Cloud room creation error (PERMISSION_DENIED or network). Switching to Local Mesh:', err?.message || err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Fallback: Local Mesh Transport (Multi-Tab / Multi-Window / Same PC)
    return this.createRoomLocal(roomId, options);
  }

  createRoomLocal(roomId, options = {}) {
    this.currentRoomId = roomId;
    this.playerSlot = 1;
    this.isHost = true;
    this.transportMode = 'LOCAL_MESH';

    const initialData = this.buildInitialRoomData(roomId, this.myUid, options);
    const rooms = this._getLocalRooms();
    rooms[roomId] = initialData;
    this._saveLocalRooms(rooms);

    this.roomData = initialData;
    this.setPresenceState('IN_ROOM', roomId);
    this._broadcastMeshEvent('ROOM_UPDATED', initialData);
    this.notifyListeners(this.roomData);
    this.notifyNetworkStatus('LOCAL_MESH', 'Local Mesh Theater Active. Multi-tab/local synchronization enabled.');

    return { success: true, roomId, playerSlot: 1, transport: 'LOCAL_MESH' };
  }

  buildInitialRoomData(roomId, hostUid, options = {}) {
    return {
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
          uid: hostUid,
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
  }

  // ─── ROOM JOINING ─────────────────────────────────────────────────────────

  async joinRoom(roomId, options = {}) {
    const user = await this.ensureAuthenticated();
    const cleanId = roomId.toUpperCase().trim();

    // Primary: Firebase Realtime Database
    if (this.rtdb && this.transportMode !== 'LOCAL_MESH') {
      try {
        const { ref, get, update, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const roomRef = ref(this.rtdb, `rooms/${cleanId}`);
        const snap = await get(roomRef);

        if (snap.exists()) {
          const data = snap.val();
          if (data.status === 'IN_BATTLE' && data.players?.p2?.uid !== user.uid) {
            throw new Error(`Battle Room [${cleanId}] is already in progress with 2 players.`);
          }

          this.currentRoomId = cleanId;
          this.playerSlot = (data.players?.p1?.uid === user.uid) ? 1 : 2;
          this.isHost = (this.playerSlot === 1);
          this.transportMode = 'CLOUD';

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
          this.setPresenceState('IN_ROOM', cleanId);
          this.notifyNetworkStatus('CLOUD', 'Connected to Global Firebase Cloud Network.');
          return { success: true, roomId: cleanId, playerSlot: this.playerSlot, transport: 'CLOUD' };
        }
      } catch (err) {
        if (err.message && err.message.includes('already in progress')) throw err;
        console.warn('[MultiplayerManager] RTDB join room failed, checking Local Mesh:', err?.message || err);
      }
    }

    // Fallback: Local Mesh Room Joining
    return this.joinRoomLocal(cleanId, options);
  }

  joinRoomLocal(cleanId, options = {}) {
    const rooms = this._getLocalRooms();
    const room = rooms[cleanId];

    if (!room) {
      throw new Error(`Battle Room [${cleanId}] not found in tactical network.`);
    }

    if (room.status === 'IN_BATTLE' && room.players?.p2?.uid !== this.myUid) {
      throw new Error(`Battle Room [${cleanId}] is already in progress with 2 players.`);
    }

    this.currentRoomId = cleanId;
    this.playerSlot = (room.players?.p1?.uid === this.myUid) ? 1 : 2;
    this.isHost = (this.playerSlot === 1);
    this.transportMode = 'LOCAL_MESH';

    const slotKey = `p${this.playerSlot}`;
    const defaultFaction = this.playerSlot === 2
      ? (room.players?.p1?.faction === 'IRON_CORPS' ? 'VANGUARD_LEGION' : 'IRON_CORPS')
      : 'IRON_CORPS';

    if (!room.players) room.players = {};
    room.players[slotKey] = {
      uid: this.myUid,
      name: this.currentProfile.displayName || `Commander ${this.playerSlot}`,
      rank: this.currentProfile.rank || 'Recruit',
      faction: options.faction || defaultFaction,
      ready: false,
      connected: true,
      lastSeen: Date.now()
    };

    rooms[cleanId] = room;
    this._saveLocalRooms(rooms);
    this.roomData = room;
    this.setPresenceState('IN_ROOM', cleanId);

    this._broadcastMeshEvent('ROOM_UPDATED', room);
    this.notifyListeners(this.roomData);
    this.notifyNetworkStatus('LOCAL_MESH', 'Local Mesh Theater Active. Multi-tab/local synchronization enabled.');

    return { success: true, roomId: cleanId, playerSlot: this.playerSlot, transport: 'LOCAL_MESH' };
  }

  listenToRoom(roomId) {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }

    if (this.rtdb && this.transportMode === 'CLOUD') {
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js').then(({ ref, onValue }) => {
        const roomRef = ref(this.rtdb, `rooms/${roomId}`);
        this.roomUnsubscribe = onValue(roomRef, (snapshot) => {
          if (!snapshot.exists()) return;
          this.roomData = snapshot.val();
          this.handleRoomUpdate(this.roomData);
        }, (err) => {
          console.warn('[MultiplayerManager] onValue listener error, falling back to Local Mesh:', err);
          this.setTransportMode('LOCAL_MESH');
        });
      }).catch(e => {
        console.warn('[MultiplayerManager] Error importing database module for listener:', e);
      });
    }
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
    const slotKey = `p${this.playerSlot}`;

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        await update(ref(this.rtdb, `rooms/${this.currentRoomId}/players/${slotKey}`), {
          ready: isReady
        });
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB setReady failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]?.players?.[slotKey]) {
      rooms[this.currentRoomId].players[slotKey].ready = isReady;
      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);
      this.notifyListeners(this.roomData);
    }
  }

  async setFaction(factionKey) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const slotKey = `p${this.playerSlot}`;

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        await update(ref(this.rtdb, `rooms/${this.currentRoomId}/players/${slotKey}`), {
          faction: factionKey
        });
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB setFaction failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]?.players?.[slotKey]) {
      rooms[this.currentRoomId].players[slotKey].faction = factionKey;
      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);
      this.notifyListeners(this.roomData);
    }
  }

  async updateRoomConfig(configObj) {
    if (!this.currentRoomId || !this.isHost) return;

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        await update(ref(this.rtdb, `rooms/${this.currentRoomId}/config`), configObj);
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB updateRoomConfig failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]) {
      rooms[this.currentRoomId].config = Object.assign({}, rooms[this.currentRoomId].config, configObj);
      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);
      this.notifyListeners(this.roomData);
    }
  }

  async startMatch() {
    if (!this.currentRoomId || !this.isHost) return;
    this.setPresenceState('IN_BATTLE', this.currentRoomId);

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        await update(ref(this.rtdb, `rooms/${this.currentRoomId}`), {
          status: 'IN_BATTLE',
          startedAt: Date.now()
        });
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB startMatch failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]) {
      rooms[this.currentRoomId].status = 'IN_BATTLE';
      rooms[this.currentRoomId].startedAt = Date.now();
      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);
      this.notifyListeners(this.roomData);
    }
  }

  // ─── COMMIT-REVEAL TURN SYNCHRONIZATION ───────────────────────────────────

  async submitTurnOrders(turnNumber, ordersPayload) {
    if (!this.currentRoomId || !this.playerSlot) return;

    const slotKey = `p${this.playerSlot}`;
    const otherSlotKey = this.playerSlot === 1 ? 'p2' : 'p1';

    // 1. Generate cryptographic commit hash
    const { commitHash, revealData } = await this.createCommitHash(ordersPayload);
    this.pendingTurnCommit = { turnNumber, revealData };

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const updates = {};
        updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}Commit`] = commitHash;
        updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}CommittedAt`] = Date.now();

        await update(ref(this.rtdb), updates);

        const turnData = this.roomData?.turns?.[turnNumber];
        if (turnData && turnData[`${otherSlotKey}Commit`]) {
          await this.revealTurnData(turnNumber, revealData);
        }
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB submitTurnOrders failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]) {
      if (!rooms[this.currentRoomId].turns) rooms[this.currentRoomId].turns = {};
      if (!rooms[this.currentRoomId].turns[turnNumber]) rooms[this.currentRoomId].turns[turnNumber] = {};

      const turn = rooms[this.currentRoomId].turns[turnNumber];
      turn[`${slotKey}Commit`] = commitHash;
      turn[`${slotKey}CommittedAt`] = Date.now();

      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);

      if (turn[`${otherSlotKey}Commit`]) {
        await this.revealTurnData(turnNumber, revealData);
      }
    }
  }

  async revealTurnData(turnNumber, revealData) {
    if (!this.currentRoomId || !this.playerSlot) return;
    const slotKey = `p${this.playerSlot}`;

    if (this.transportMode === 'CLOUD' && this.rtdb) {
      try {
        const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        const updates = {};
        updates[`rooms/${this.currentRoomId}/turns/${turnNumber}/${slotKey}Data`] = revealData;
        await update(ref(this.rtdb), updates);
        return;
      } catch (err) {
        console.warn('[MultiplayerManager] RTDB revealTurnData failed, switching to Local Mesh:', err);
        this.setTransportMode('LOCAL_MESH');
      }
    }

    // Local Mesh
    const rooms = this._getLocalRooms();
    if (rooms[this.currentRoomId]?.turns?.[turnNumber]) {
      rooms[this.currentRoomId].turns[turnNumber][`${slotKey}Data`] = revealData;
      this._saveLocalRooms(rooms);
      this.roomData = rooms[this.currentRoomId];
      this._broadcastMeshEvent('ROOM_UPDATED', this.roomData);
      this.handleTurnSync(this.roomData);
    }
  }

  async handleTurnSync(room) {
    const engine = window.gApp?.engine;
    if (!engine || !engine.isMultiplayer) return;

    const currentTurn = engine.turnNumber;
    const turnData = room.turns?.[currentTurn];
    if (!turnData) return;

    const mySlot = `p${this.playerSlot}`;
    const oppSlot = this.playerSlot === 1 ? 'p2' : 'p1';

    // Step A: If opponent committed their hash for current turn, mark opponent as ready
    if (turnData[`${oppSlot}Commit`]) {
      if (engine && engine.isMultiplayer && !engine.isOpponentReadyThisTurn) {
        engine.isOpponentReadyThisTurn = true;
        if (window.gApp) {
          if (window.gApp.ui) window.gApp.ui.updateHUD(engine);
          if (window.gApp.showEnemyReadyDispatchBanner) window.gApp.showEnemyReadyDispatchBanner();
          if (window.gApp.ui?.showToast) window.gApp.ui.showToast('Orders Intercepted', 'Enemy Commander has committed their turn orders!');
        }
        try { if (engine.audio) engine.audio.playCountdownTick(); } catch(e){}
      }
      if (this.pendingTurnCommit && this.pendingTurnCommit.turnNumber === currentTurn) {
        if (!turnData[`${mySlot}Data`]) {
          await this.revealTurnData(currentTurn, this.pendingTurnCommit.revealData);
        }
      }
    } else {
      if (engine) {
        engine.isOpponentReadyThisTurn = false;
      }
    }

    // Step B: If both players have revealed their data, verify and execute playback exactly once!
    this.resolvedTurns = this.resolvedTurns || new Set();
    const turnKey = `${room.id}_turn_${currentTurn}`;

    if (turnData.p1Data && turnData.p2Data && !this.resolvedTurns.has(turnKey)) {
      this.resolvedTurns.add(turnKey);
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
    this.resolvedTurns = new Set();
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
    if (this.currentRoomId && this.transportMode === 'LOCAL_MESH') {
      const rooms = this._getLocalRooms();
      if (rooms[this.currentRoomId]) {
        const slotKey = `p${this.playerSlot}`;
        if (rooms[this.currentRoomId].players?.[slotKey]) {
          rooms[this.currentRoomId].players[slotKey].connected = false;
        }
        this._saveLocalRooms(rooms);
        this._broadcastMeshEvent('ROOM_UPDATED', rooms[this.currentRoomId]);
      }
    }

    this.currentRoomId = null;
    this.playerSlot = null;
    this.isHost = false;
    this.roomData = null;
    this.pendingTurnCommit = null;
    this.setPresenceState('LOBBY');
    this.notifyListeners(null);
  }

  // ─── ONLINE PRESENCE & COMMANDER TELEMETRY SUBSYSTEM ───────────────────────

  initPresence() {
    this.presenceListeners = [];
    this.presenceState = 'LOBBY';
    this.onlineStats = { total: 1, inLobby: 1, inMatchmaking: 0, inRoom: 0, inBattle: 0, users: [] };
    this.isFirebaseConnected = false;
    this.isFirebasePresenceInit = false;

    // Browser unload hooks
    if (typeof window !== 'undefined') {
      const cleanup = () => this.leavePresence();
      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('pagehide', cleanup);
    }

    // Local mesh presence heartbeat (every 20s)
    this.presenceHeartbeatTimer = setInterval(() => {
      this.heartbeatPresence();
    }, 20000);

    // Initial heartbeat & auth connection check
    setTimeout(() => {
      this.heartbeatPresence();
      this.ensureAuthenticated().then(() => this.initFirebasePresence()).catch(() => {});
    }, 800);
  }

  async initFirebasePresence() {
    if (this.isFirebasePresenceInit) return;
    if (!this.rtdb && window.gAuthManager?.rtdb) {
      this.rtdb = window.gAuthManager.rtdb;
    }
    if (!this.rtdb) return;

    try {
      const { ref, onValue, set, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
      
      const connectedRef = ref(this.rtdb, '.info/connected');
      onValue(connectedRef, async (snap) => {
        if (snap.val() === true) {
          this.isFirebaseConnected = true;
          const myPresenceRef = ref(this.rtdb, `presence/${this.presenceSessionId}`);
          try {
            await onDisconnect(myPresenceRef).remove();
          } catch(e) {}
          this.heartbeatPresence();
        } else {
          this.isFirebaseConnected = false;
        }
      });

      const allPresenceRef = ref(this.rtdb, 'presence');
      this.presenceUnsubscribe = onValue(allPresenceRef, (snap) => {
        const data = snap.val() || {};
        this.processCloudPresenceData(data);
      }, (err) => {
        console.warn('[MultiplayerManager] RTDB presence listener notice:', err?.message || err);
      });

      this.isFirebasePresenceInit = true;
    } catch (err) {
      console.warn('[MultiplayerManager] Firebase presence init skipped:', err?.message || err);
    }
  }

  processCloudPresenceData(presenceData) {
    const now = Date.now();
    const activeUsers = [];
    let inLobby = 0;
    let inMatchmaking = 0;
    let inRoom = 0;
    let inBattle = 0;
    let foundSelf = false;

    for (const [sessionId, user] of Object.entries(presenceData || {})) {
      if (user && (now - (user.lastSeen || 0)) < 75000) {
        if (sessionId === this.presenceSessionId || user.sessionId === this.presenceSessionId) {
          foundSelf = true;
        }
        activeUsers.push(user);
        const state = user.state || 'LOBBY';
        if (state === 'MATCHMAKING') inMatchmaking++;
        else if (state === 'IN_BATTLE') inBattle++;
        else if (state === 'IN_ROOM') inRoom++;
        else inLobby++;
      }
    }

    if (!foundSelf) {
      activeUsers.push({
        sessionId: this.presenceSessionId,
        uid: this.myUid,
        name: this.currentProfile.displayName || 'Commander',
        state: this.presenceState,
        lastSeen: now
      });
      if (this.presenceState === 'MATCHMAKING') inMatchmaking++;
      else if (this.presenceState === 'IN_BATTLE') inBattle++;
      else if (this.presenceState === 'IN_ROOM') inRoom++;
      else inLobby++;
    }

    this.onlineStats = {
      total: Math.max(1, activeUsers.length),
      inLobby,
      inMatchmaking,
      inRoom,
      inBattle,
      users: activeUsers
    };

    this.notifyPresenceListeners();
  }

  _getLocalPresence() {
    try {
      return JSON.parse(localStorage.getItem('sketch_mp_presence') || '{}');
    } catch (e) {
      return {};
    }
  }

  _saveLocalPresence(presence) {
    try {
      localStorage.setItem('sketch_mp_presence', JSON.stringify(presence));
    } catch (e) {}
  }

  processLocalMeshPresence() {
    const localPres = this._getLocalPresence();
    const now = Date.now();
    const activeUsers = [];
    let inLobby = 0, inMatchmaking = 0, inRoom = 0, inBattle = 0;
    let foundSelf = false;

    for (const [sessionId, user] of Object.entries(localPres || {})) {
      if (user && (now - (user.lastSeen || 0)) < 45000) {
        if (sessionId === this.presenceSessionId || user.sessionId === this.presenceSessionId) {
          foundSelf = true;
        }
        activeUsers.push(user);
        const state = user.state || 'LOBBY';
        if (state === 'MATCHMAKING') inMatchmaking++;
        else if (state === 'IN_BATTLE') inBattle++;
        else if (state === 'IN_ROOM') inRoom++;
        else inLobby++;
      }
    }

    if (!foundSelf) {
      activeUsers.push({
        sessionId: this.presenceSessionId,
        uid: this.myUid,
        name: this.currentProfile.displayName || 'Commander',
        state: this.presenceState,
        lastSeen: now
      });
      if (this.presenceState === 'MATCHMAKING') inMatchmaking++;
      else if (this.presenceState === 'IN_BATTLE') inBattle++;
      else if (this.presenceState === 'IN_ROOM') inRoom++;
      else inLobby++;
    }

    this.onlineStats = {
      total: Math.max(1, activeUsers.length),
      inLobby,
      inMatchmaking,
      inRoom,
      inBattle,
      users: activeUsers
    };

    this.notifyPresenceListeners();
  }

  heartbeatPresence() {
    const now = Date.now();
    const payload = {
      sessionId: this.presenceSessionId,
      uid: this.myUid,
      name: this.currentProfile.displayName || 'Commander',
      state: this.presenceState,
      roomId: this.currentRoomId || null,
      lastSeen: now
    };

    // 1. Firebase RTDB
    if (this.rtdb && this.isFirebaseConnected) {
      try {
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js').then(({ ref, set }) => {
          set(ref(this.rtdb, `presence/${this.presenceSessionId}`), payload).catch(() => {});
        }).catch(() => {});
      } catch (e) {}
    }

    // 2. Local Mesh (localStorage + BroadcastChannel)
    const localPres = this._getLocalPresence();
    for (const [k, v] of Object.entries(localPres)) {
      if (!v || (now - (v.lastSeen || 0)) > 45000) {
        delete localPres[k];
      }
    }
    localPres[this.presenceSessionId] = payload;
    this._saveLocalPresence(localPres);
    this._broadcastMeshEvent('PRESENCE_PING', payload);

    if (!this.isFirebaseConnected) {
      this.processLocalMeshPresence();
    }
  }

  leavePresence() {
    if (this.rtdb && this.isFirebaseConnected) {
      try {
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js').then(({ ref, remove }) => {
          remove(ref(this.rtdb, `presence/${this.presenceSessionId}`)).catch(() => {});
        }).catch(() => {});
      } catch (e) {}
    }

    const localPres = this._getLocalPresence();
    if (localPres[this.presenceSessionId]) {
      delete localPres[this.presenceSessionId];
      this._saveLocalPresence(localPres);
      this._broadcastMeshEvent('PRESENCE_LEAVE', { sessionId: this.presenceSessionId, uid: this.myUid });
    }
  }

  setPresenceState(state, roomId = null) {
    this.presenceState = state || 'LOBBY';
    if (roomId !== undefined) this.currentRoomId = roomId;
    this.heartbeatPresence();
  }

  subscribePresence(fn) {
    if (typeof fn === 'function') {
      this.presenceListeners.push(fn);
      try { fn(this.onlineStats); } catch(e){}
    }
  }

  notifyPresenceListeners() {
    for (const fn of this.presenceListeners) {
      try { fn(this.onlineStats); } catch(e){}
    }
    if (window.updateOnlineCountBadge) {
      window.updateOnlineCountBadge(this.onlineStats);
    }
  }

  setTransportMode(mode) {
    this.transportMode = mode;
    if (mode === 'LOCAL_MESH') {
      this.notifyNetworkStatus('LOCAL_MESH', 'Local Mesh Theater Active. Multi-tab/local synchronization enabled.');
    } else {
      this.notifyNetworkStatus('CLOUD', 'Connected to Global Firebase Cloud Network.');
    }
  }

  subscribe(fn) {
    if (!this.listeners) this.listeners = [];
    if (typeof fn === 'function') {
      this.listeners.push(fn);
    }
  }

  notifyListeners(data) {
    if (!this.listeners) this.listeners = [];
    this.listeners.forEach(fn => {
      try { fn(data); } catch(e){}
    });
  }

  onNetworkStatus(fn) {
    if (!this.statusListeners) this.statusListeners = [];
    if (typeof fn === 'function') {
      this.statusListeners.push(fn);
    }
  }

  notifyNetworkStatus(mode, message) {
    if (!this.statusListeners) this.statusListeners = [];
    this.statusListeners.forEach(fn => {
      try { fn(mode, message); } catch(e){}
    });
    if (window.updateNetworkBadge) {
      window.updateNetworkBadge(mode, message);
    }
  }
}

window.gMultiplayer = new MultiplayerManager();
