/**
 * AudioEngine.js
 * Studio-Grade Tactical Dieselpunk Audio Engine for Ink & Iron: Sketch Warfare.
 * Supports pre-decoded Web Audio AudioBuffer caching, random micro-pitch modulation,
 * looping war-room ambience, and high-fidelity mathematical DSP procedural fallbacks.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.isPreloaded = false;
    this.isPreloading = false;

    // Volume state
    this.isMuted = localStorage.getItem('sketch_warfare_muted') === 'true';
    this.masterVolume = parseInt(localStorage.getItem('sketch_warfare_vol_master') || '80', 10) / 100;
    this.sfxVolume = parseInt(localStorage.getItem('sketch_warfare_vol_sfx') || '100', 10) / 100;
    this.ambientVolume = 0.4;

    // Ambient loop source node
    this.ambientSource = null;
    this.ambientGain = null;

    // Registry of audio files
    this.audioManifest = {
      'ui_click': 'assets/audio/ui_click.wav',
      'ui_switch': 'assets/audio/ui_switch.wav',
      'ui_paper': 'assets/audio/ui_paper.wav',
      'ui_stamp': 'assets/audio/ui_stamp.wav',
      'ui_tick': 'assets/audio/ui_tick.wav',
      'ui_denied': 'assets/audio/ui_denied.wav',
      'unit_select': 'assets/audio/unit_select.wav',
      'march_infantry': 'assets/audio/march_infantry.wav',
      'engine_vehicle': 'assets/audio/engine_vehicle.wav',
      'capture_zone': 'assets/audio/capture_zone.wav',
      'shot_rifle': 'assets/audio/shot_rifle.wav',
      'shot_anti_tank': 'assets/audio/shot_anti_tank.wav',
      'shot_tank_cannon': 'assets/audio/shot_tank_cannon.wav',
      'explosion_artillery': 'assets/audio/explosion_artillery.wav',
      'smudge_defeat': 'assets/audio/smudge_defeat.wav',
      'ability_flare': 'assets/audio/ability_flare.wav',
      'ability_smoke': 'assets/audio/ability_smoke.wav',
      'phase_countdown': 'assets/audio/phase_countdown.wav',
      'phase_action': 'assets/audio/phase_action.wav',
      'victory_fanfare': 'assets/audio/victory_fanfare.wav',
      'defeat_dirge': 'assets/audio/defeat_dirge.wav',
      'ambient_warroom': 'assets/audio/ambient_warroom.wav'
    };

    // Attach unlock listener on first user interaction
    this.setupUnlockListeners();
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.isPreloaded && !this.isPreloading) {
        this.preloadAll();
      }
    } catch (e) {
      console.warn('[AudioEngine] Context initialization error:', e);
    }
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.init();
      ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(ev => {
        window.removeEventListener(ev, unlock);
      });
    };
    ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(ev => {
      window.addEventListener(ev, unlock, { once: true, passive: true });
    });
  }

  async preloadAll() {
    if (!this.ctx || this.isPreloaded || this.isPreloading) return;
    this.isPreloading = true;

    const loadPromises = Object.entries(this.audioManifest).map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(key, audioBuffer);
      } catch (err) {
        // Fallback: If asset cannot be fetched, we will use procedural synthesis
        // console.debug(`[AudioEngine] Falling back to procedural for ${key}`);
      }
    });

    await Promise.allSettled(loadPromises);
    this.isPreloaded = true;
    this.isPreloading = false;
  }

  getEffectiveGain(baseGain = 1.0) {
    if (this.isMuted) return 0;
    return Math.max(0, baseGain * this.masterVolume * this.sfxVolume);
  }

  /**
   * Primary Sound Effect Playback with Random Micro-Pitch Modulation
   */
  playSfx(key, options = {}) {
    try {
      this.init();
      if (!this.ctx) return;

      const baseGain = options.volume !== undefined ? options.volume : 1.0;
      const vol = this.getEffectiveGain(baseGain);
      if (vol <= 0) return;

      const now = this.ctx.currentTime;
      const buffer = this.buffers.get(key);

      if (buffer) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Dynamic pitch variation (default +- 4%) to prevent acoustic repetition fatigue
        const pitchVariance = options.pitchVar !== undefined ? options.pitchVar : 0.04;
        const detuneCents = (Math.random() * 2 - 1) * (pitchVariance * 1200);
        source.detune.setValueAtTime(detuneCents, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, now);

        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
      } else {
        // Fallback to high-fidelity procedural synthesizer
        this.playProceduralFallback(key, vol);
      }
    } catch (e) {
      // Audio execution should never interrupt gameplay
    }
  }

  /**
   * Procedural DSP Synthesizer Fallbacks
   */
  playProceduralFallback(key, vol) {
    if (!this.ctx || vol <= 0) return;
    const now = this.ctx.currentTime;
    const sr = this.ctx.sampleRate;

    switch (key) {
      case 'ui_click':
      case 'ui_tick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2600, now);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      case 'ui_paper': {
        const len = Math.floor(sr * 0.12);
        const buf = this.ctx.createBuffer(1, len, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / len));
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
        break;
      }
      case 'ui_stamp': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(vol * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'shot_rifle':
      case 'shot_anti_tank':
      case 'shot_tank_cannon': {
        const isHeavy = key !== 'shot_rifle';
        const dur = isHeavy ? 0.35 : 0.18;
        const len = Math.floor(sr * dur);
        const buf = this.ctx.createBuffer(1, len, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * (dur / 4)));
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isHeavy ? 600 : 1400, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
        break;
      }
      case 'explosion_artillery': {
        const dur = 0.7;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + dur);
        oscGain.gain.setValueAtTime(vol * 0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + dur);
        break;
      }
      default: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(vol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    }
  }

  // ─── HIGH-LEVEL GAME EVENT METHODS ──────────────────────────────────────────

  playClick() {
    this.playSfx('ui_click', { volume: 0.65, pitchVar: 0.05 });
  }

  playPencilScratch() {
    this.playSfx('ui_tick', { volume: 0.5, pitchVar: 0.08 });
  }

  playSwitch() {
    this.playSfx('ui_switch', { volume: 0.6, pitchVar: 0.03 });
  }

  playPaper() {
    this.playSfx('ui_paper', { volume: 0.7, pitchVar: 0.04 });
  }

  playStamp() {
    this.playSfx('ui_stamp', { volume: 0.85, pitchVar: 0.03 });
  }

  playSpawnSound() {
    this.playStamp();
  }

  playTick() {
    this.playSfx('ui_tick', { volume: 0.45, pitchVar: 0.06 });
  }

  playDenied() {
    this.playSfx('ui_denied', { volume: 0.75, pitchVar: 0.02 });
  }

  playUnitSelect() {
    this.playSfx('unit_select', { volume: 0.7, pitchVar: 0.05 });
  }

  playMarching(isVehicle = false) {
    if (isVehicle) {
      this.playSfx('engine_vehicle', { volume: 0.6, pitchVar: 0.04 });
    } else {
      this.playSfx('march_infantry', { volume: 0.65, pitchVar: 0.06 });
    }
  }

  playGunfire(heavy = false) {
    if (heavy) {
      this.playSfx('shot_anti_tank', { volume: 0.85, pitchVar: 0.04 });
    } else {
      this.playSfx('shot_rifle', { volume: 0.75, pitchVar: 0.05 });
    }
  }

  playGunshot(heavy = false) {
    this.playGunfire(heavy);
  }

  playTankCannon() {
    this.playSfx('shot_tank_cannon', { volume: 0.9, pitchVar: 0.03 });
  }

  playExplosion(heavy = true) {
    this.playSfx('explosion_artillery', { volume: heavy ? 0.95 : 0.8, pitchVar: 0.04 });
  }

  playEraserSmudge() {
    this.playSfx('smudge_defeat', { volume: 0.75, pitchVar: 0.05 });
  }

  playFlareSound() {
    this.playSfx('ability_flare', { volume: 0.8, pitchVar: 0.04 });
  }

  playSmokeSound() {
    this.playSfx('ability_smoke', { volume: 0.75, pitchVar: 0.03 });
  }

  playAlarmSound() {
    this.playCountdownTick();
  }

  playCountdownTick() {
    this.playSfx('phase_countdown', { volume: 0.7, pitchVar: 0.02 });
  }

  playActionWhistle() {
    this.playSfx('phase_action', { volume: 0.85, pitchVar: 0.03 });
  }

  playCaptureZone() {
    this.playSfx('capture_zone', { volume: 0.8, pitchVar: 0.03 });
  }

  playVictorySound() {
    this.playSfx('victory_fanfare', { volume: 0.95, pitchVar: 0.0 });
  }

  playDefeatSound() {
    this.playSfx('defeat_dirge', { volume: 0.9, pitchVar: 0.0 });
  }

  // ─── AMBIENT ROOM-TONE CONTROLLER ──────────────────────────────────────────

  startAmbient() {
    try {
      this.init();
      if (!this.ctx || this.ambientSource) return;

      const buffer = this.buffers.get('ambient_warroom');
      if (!buffer) return;

      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      this.ambientGain = this.ctx.createGain();
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.ambientVolume);

      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 1.5);

      this.ambientSource.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.ambientSource.start(0);
    } catch (e) {}
  }

  stopAmbient() {
    try {
      if (this.ambientSource && this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (this.ambientSource) {
            try { this.ambientSource.stop(); } catch(e){}
            this.ambientSource = null;
            this.ambientGain = null;
          }
        }, 850);
      }
    } catch (e) {}
  }

  // ─── SETTINGS & VOLUME CONTROLS ─────────────────────────────────────────────

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('sketch_warfare_muted', this.isMuted);

    if (this.ambientGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.ambientVolume);
      this.ambientGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_master', Math.round(this.masterVolume * 100));

    if (this.ambientGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.ambientVolume);
      this.ambientGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_sfx', Math.round(this.sfxVolume * 100));
  }
}
