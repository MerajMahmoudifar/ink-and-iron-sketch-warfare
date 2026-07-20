// Ink & Iron: Sketch Warfare - Firebase Authentication & Database Module
// Configured for Live Firebase Project: ink-and-iron-1c654

const firebaseConfig = {
  apiKey: "AIzaSyC-jweIiF8o5Dt86EeHxhFgNzzIikkXomc",
  authDomain: "ink-and-iron-1c654.firebaseapp.com",
  databaseURL: "https://ink-and-iron-1c654-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ink-and-iron-1c654",
  storageBucket: "ink-and-iron-1c654.firebasestorage.app",
  messagingSenderId: "41595300123",
  appId: "1:41595300123:web:0d6c1ff9b33998ffc78bbe",
  measurementId: "G-7M24FMNEZY"
};

// Global Auth & User State
window.gAuth = {
  user: null,
  profile: null,
  isGuest: true,
  isInitialized: false,
  listeners: []
};

// Default Guest Profile
const GUEST_PROFILE = {
  uid: 'guest',
  displayName: 'Commander Guest',
  email: null,
  isGuest: true,
  rank: 'Recruit',
  totalMatches: 0,
  wins: 0,
  losses: 0,
  winRate: '0%'
};

class AuthManager {
  constructor() {
    this.firebaseApp = null;
    this.auth = null;
    this.db = null;
    this.rtdb = null;
    this.initFirebase();
  }

  async initFirebase() {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      
      this.firebaseApp = initializeApp(firebaseConfig);
      this.auth = getAuth(this.firebaseApp);
      this.sdk = { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, GoogleAuthProvider, signInWithPopup };

      // Dynamically load Firestore and Realtime Database
      try {
        const { getFirestore, doc, setDoc, getDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        this.db = getFirestore(this.firebaseApp);
        Object.assign(this.sdk, { doc, setDoc, getDoc, updateDoc, increment });
      } catch(e) { console.warn('[AuthManager] Firestore module skipped:', e); }

      try {
        const { getDatabase, ref, get, set, child, update } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        this.rtdb = getDatabase(this.firebaseApp);
        Object.assign(this.sdk, { ref, get, set, child, update });
      } catch(e) { console.warn('[AuthManager] Realtime DB module skipped:', e); }

      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          window.gAuth.user = user;
          window.gAuth.isGuest = false;
          window.gAuth.profile = await this.fetchUserProfile(user.uid, user.displayName, user.email);
        } else {
          this.setGuestState();
        }
        window.gAuth.isInitialized = true;
        this.notifyListeners();
      });
    } catch (err) {
      console.warn('[AuthManager] Firebase initialization error. Operating in Guest Mode:', err);
      this.setGuestState();
      window.gAuth.isInitialized = true;
      this.notifyListeners();
    }
  }

  setGuestState() {
    window.gAuth.user = null;
    window.gAuth.isGuest = true;
    const localStats = JSON.parse(localStorage.getItem('sketch_warfare_guest_stats') || '{}');
    const wins = localStats.wins || 0;
    const losses = localStats.losses || 0;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) + '%' : '0%';

    window.gAuth.profile = {
      ...GUEST_PROFILE,
      totalMatches: total,
      wins,
      losses,
      winRate
    };
  }

  async fetchUserProfile(uid, displayName, email) {
    const fallbackName = displayName || (email ? email.split('@')[0] : 'Commander');

    // 1. Try Firestore first
    if (this.db && this.sdk.getDoc) {
      try {
        const userRef = this.sdk.doc(this.db, 'users', uid);
        const snap = await this.sdk.getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const total = (data.wins || 0) + (data.losses || 0);
          const wins = data.wins || 0;
          return {
            uid,
            displayName: data.displayName || fallbackName,
            email,
            isGuest: false,
            rank: this.calculateRank(wins, total),
            rankProgress: this.getRankProgress(wins, total),
            totalMatches: total,
            wins,
            losses: data.losses || 0,
            winRate: total > 0 ? Math.round((wins / total) * 100) + '%' : '0%'
          };
        } else {
          const newProfile = { displayName: fallbackName, email: email || '', wins: 0, losses: 0, createdAt: new Date().toISOString() };
          await this.sdk.setDoc(userRef, newProfile);
          return { uid, ...newProfile, isGuest: false, rank: 'Recruit', rankProgress: this.getRankProgress(0, 0), totalMatches: 0, winRate: '0%' };
        }
      } catch (e) {
        console.warn('[AuthManager] Firestore fetch failed, trying Realtime DB:', e);
      }
    }

    // 2. Try Realtime Database (databaseURL) if Firestore is disabled
    if (this.rtdb && this.sdk.get) {
      try {
        const dbRef = this.sdk.ref(this.rtdb);
        const snap = await this.sdk.get(this.sdk.child(dbRef, `users/${uid}`));
        if (snap.exists()) {
          const data = snap.val();
          const total = (data.wins || 0) + (data.losses || 0);
          const wins = data.wins || 0;
          return {
            uid,
            displayName: data.displayName || fallbackName,
            email,
            isGuest: false,
            rank: this.calculateRank(wins, total),
            rankProgress: this.getRankProgress(wins, total),
            totalMatches: total,
            wins,
            losses: data.losses || 0,
            winRate: total > 0 ? Math.round((wins / total) * 100) + '%' : '0%'
          };
        } else {
          const newProfile = { displayName: fallbackName, email: email || '', wins: 0, losses: 0, createdAt: new Date().toISOString() };
          await this.sdk.set(this.sdk.ref(this.rtdb, `users/${uid}`), newProfile);
          return { uid, ...newProfile, isGuest: false, rank: 'Recruit', rankProgress: this.getRankProgress(0, 0), totalMatches: 0, winRate: '0%' };
        }
      } catch (e) {
        console.warn('[AuthManager] Realtime DB fetch failed:', e);
      }
    }

    return { ...GUEST_PROFILE, uid, displayName: fallbackName, isGuest: false };
  }

  static RANKS = [
    { name: 'Recruit',    minGames: 0,  minWins: 0  },
    { name: 'Corporal',   minGames: 3,  minWins: 1  },
    { name: 'Sergeant',   minGames: 8,  minWins: 4  },
    { name: 'Lieutenant', minGames: 15, minWins: 8  },
    { name: 'Captain',    minGames: 25, minWins: 14 },
    { name: 'Colonel',    minGames: 40, minWins: 24 },
    { name: 'General',    minGames: 60, minWins: 40 },
  ];

  calculateRank(wins, totalGames) {
    let rank = 'Recruit';
    for (const tier of AuthManager.RANKS) {
      if (totalGames >= tier.minGames && wins >= tier.minWins) {
        rank = tier.name;
      }
    }
    return rank;
  }

  getRankProgress(wins, totalGames) {
    const ranks = AuthManager.RANKS;

    // Find current rank index
    let currentIdx = 0;
    for (let i = 0; i < ranks.length; i++) {
      if (totalGames >= ranks[i].minGames && wins >= ranks[i].minWins) {
        currentIdx = i;
      }
    }

    // Already at max rank
    if (currentIdx >= ranks.length - 1) {
      return { atMax: true, currentRank: ranks[currentIdx].name };
    }

    const next = ranks[currentIdx + 1];
    const gamesProgress = next.minGames > 0 ? Math.min(totalGames / next.minGames, 1) : 1;
    const winsProgress  = next.minWins  > 0 ? Math.min(wins / next.minWins, 1) : 1;
    const overallProgress = Math.round(((gamesProgress + winsProgress) / 2) * 100);

    return {
      atMax: false,
      currentRank: ranks[currentIdx].name,
      nextRank: next.name,
      overallProgress,
      gamesNeeded: Math.max(0, next.minGames - totalGames),
      winsNeeded:  Math.max(0, next.minWins  - wins),
      gamesProgress: Math.round(gamesProgress * 100),
      winsProgress:  Math.round(winsProgress * 100),
    };
  }

  formatAuthError(e) {
    const code = e.code || '';
    if (code.includes('configuration-not-found')) {
      return 'Email/Password sign-in is disabled in Firebase. Enable Email/Password in Firebase Console -> Authentication -> Sign-in method.';
    }
    if (code.includes('email-already-in-use')) {
      return 'An account already exists with this email address.';
    }
    if (code.includes('weak-password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Invalid email address or password.';
    }
    return e.message || 'Authentication failed.';
  }

  async register(email, password, displayName) {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const cred = await this.sdk.createUserWithEmailAndPassword(this.auth, email, password);
      if (displayName) {
        await this.sdk.updateProfile(cred.user, { displayName });
      }
      return { success: true, user: cred.user };
    } catch (e) {
      return { success: false, error: this.formatAuthError(e) };
    }
  }

  async login(email, password) {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const cred = await this.sdk.signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: cred.user };
    } catch (e) {
      return { success: false, error: this.formatAuthError(e) };
    }
  }

  async loginWithGoogle() {
    if (!this.auth) return { success: false, error: 'Firebase Auth not initialized' };
    try {
      const provider = new this.sdk.GoogleAuthProvider();
      const cred = await this.sdk.signInWithPopup(this.auth, provider);
      return { success: true, user: cred.user };
    } catch (e) {
      return { success: false, error: this.formatAuthError(e) };
    }
  }

  async logout() {
    if (this.auth) {
      await this.sdk.signOut(this.auth);
    }
    this.setGuestState();
    this.notifyListeners();
  }

  async recordMatchResult(isWinner) {
    // Always update localStorage as a reliable backup
    const localKey = window.gAuth.isGuest ? 'sketch_warfare_guest_stats' : `sketch_warfare_stats_${window.gAuth.user?.uid || 'guest'}`;
    const localStats = JSON.parse(localStorage.getItem(localKey) || '{"wins":0,"losses":0}');
    if (isWinner) localStats.wins++;
    else localStats.losses++;
    localStorage.setItem(localKey, JSON.stringify(localStats));

    if (window.gAuth.isGuest) {
      this.setGuestState();
      this.notifyListeners();
      return;
    }

    const uid = window.gAuth.user?.uid;
    if (!uid) return;

    const showError = (msg) => {
      if (window.gApp?.ui?.showToast) {
        window.gApp.ui.showToast('Stats Error', msg);
      }
      console.error('[AuthManager] recordMatchResult error:', msg);
    };

    // 1. Try Realtime Database first (user's configured DB)
    if (this.rtdb && this.sdk.get && this.sdk.update) {
      try {
        const dbRef = this.sdk.ref(this.rtdb, `users/${uid}`);
        const snap = await this.sdk.get(dbRef);
        const data = snap.exists() ? snap.val() : { wins: 0, losses: 0, displayName: window.gAuth.profile?.displayName || '', email: window.gAuth.user.email || '' };
        const updates = {
          updatedAt: new Date().toISOString(),
          displayName: data.displayName || window.gAuth.profile?.displayName || '',
          email: data.email || window.gAuth.user.email || '',
          wins:   isWinner ? (data.wins   || 0) + 1 : (data.wins   || 0),
          losses: isWinner ? (data.losses || 0)     : (data.losses || 0) + 1
        };
        await this.sdk.update(dbRef, updates);
        window.gAuth.profile = await this.fetchUserProfile(uid, window.gAuth.user.displayName, window.gAuth.user.email);
        this.notifyListeners();
        return;
      } catch (e) {
        showError(`Realtime DB write failed: ${e.message}. Check Firebase Realtime DB rules.`);
      }
    }

    // 2. Fall back to Firestore
    if (this.db && this.sdk.setDoc && this.sdk.getDoc) {
      try {
        const userRef = this.sdk.doc(this.db, 'users', uid);
        const snap = await this.sdk.getDoc(userRef);
        const existing = snap.exists() ? snap.data() : { wins: 0, losses: 0 };
        const updateData = {
          updatedAt: new Date().toISOString(),
          displayName: existing.displayName || window.gAuth.profile?.displayName || '',
          wins:   isWinner ? (existing.wins   || 0) + 1 : (existing.wins   || 0),
          losses: isWinner ? (existing.losses || 0)     : (existing.losses || 0) + 1
        };
        await this.sdk.setDoc(userRef, updateData, { merge: true });
        window.gAuth.profile = await this.fetchUserProfile(uid, window.gAuth.user.displayName, window.gAuth.user.email);
        this.notifyListeners();
        return;
      } catch (e) {
        showError(`Firestore write failed: ${e.message}.`);
      }
    }

    // 3. Both DB paths failed — use the localStorage value we already saved above
    showError('Stats saved locally only. Check Firebase Console database rules.');
    // Patch local stats into profile so UI still updates this session
    const p = window.gAuth.profile || {};
    window.gAuth.profile = {
      ...p,
      wins:   localStats.wins,
      losses: localStats.losses,
      totalMatches: localStats.wins + localStats.losses,
      winRate: (localStats.wins + localStats.losses) > 0
        ? Math.round((localStats.wins / (localStats.wins + localStats.losses)) * 100) + '%' : '0%'
    };
    this.notifyListeners();
  }

  subscribe(fn) {
    window.gAuth.listeners.push(fn);
    if (window.gAuth.isInitialized) fn(window.gAuth);
  }

  notifyListeners() {
    window.gAuth.listeners.forEach(fn => fn(window.gAuth));
  }
}

window.gAuthManager = new AuthManager();
