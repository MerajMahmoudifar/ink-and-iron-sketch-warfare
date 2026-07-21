/**
 * D1Service.js
 * Handles local user identity, settings synchronization with Cloudflare D1, and Admin Panel API requests.
 */

export class D1Service {
  constructor() {
    this.storageKey = 'sketch_user_profile_v1';
    this.adminTokenKey = 'sketch_admin_token_v1';
    this.user = this.loadOrCreateLocalUser();
  }

  loadOrCreateLocalUser() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load user profile from LocalStorage", e);
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      username: 'Commander ' + Math.floor(100 + Math.random() * 900),
      master_volume: 80,
      sfx_volume: 100,
      audio_muted: false,
      planning_duration: 20,
      playback_speed: 3,
      wins: 0,
      losses: 0,
      is_banned: false
    };

    this.saveLocalUser(newUser);
    return newUser;
  }

  saveLocalUser(userObj) {
    this.user = { ...this.user, ...userObj };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.user));
    } catch (e) {
      console.warn("Failed to save local user", e);
    }
  }

  async syncSettings(updates = {}) {
    this.saveLocalUser(updates);

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.user)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.saveLocalUser({
            ...data.user,
            audio_muted: Boolean(data.user.audio_muted),
            is_banned: Boolean(data.user.is_banned)
          });
        }
        return { success: true, user: this.user };
      } else if (res.status === 403) {
        const data = await res.json();
        if (data.is_banned) {
          this.user.is_banned = true;
          this.saveLocalUser(this.user);
          return { success: false, is_banned: true, message: "User account suspended" };
        }
      }
    } catch (err) {
      console.log("Offline mode or sync delay:", err.message);
    }
    return { success: true, offline: true, user: this.user };
  }

  // Admin Panel API Methods
  async loginAdmin(passcode) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid passcode');
    }

    const data = await res.json();
    sessionStorage.setItem(this.adminTokenKey, passcode);
    return data;
  }

  getAdminAuthHeader() {
    const passcode = sessionStorage.getItem(this.adminTokenKey) || "meraj7782";
    return {
      'Authorization': `Bearer ${passcode}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchAllUsers() {
    const res = await fetch('/api/admin/users', {
      headers: this.getAdminAuthHeader()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }

    const data = await res.json();
    return data.users || [];
  }

  async updateUser(id, updates) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeader(),
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }

    return await res.json();
  }

  async deleteUser(id) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeader()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }

    return await res.json();
  }
}

export const d1Service = new D1Service();
