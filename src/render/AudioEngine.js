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
    this.musicVolume = parseInt(localStorage.getItem('sketch_warfare_vol_music') || '60', 10) / 100;

    // Music loop state
    this.currentMusicTrack = null;
    this.currentMusicSource = null;
    this.currentMusicGain = null;

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
      'ambient_warroom': 'assets/audio/ambient_warroom.wav',
      'music_menu': 'assets/audio/music_menu.wav'
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
      if (!this.currentMusicTrack || !this.currentMusicSource) {
        this.startMenuMusic(1.5);
      }
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
        // Fallback: If asset cannot be fetched, procedural fallback will play
      }
    });

    await Promise.allSettled(loadPromises);
    this.isPreloaded = true;
    this.isPreloading = false;

    if (this.desiredMusicTrack && (!this.currentMusicTrack || !this.currentMusicSource)) {
      this.playMusic(this.desiredMusicTrack, 1.5);
    }
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

        if (options.playbackRate !== undefined) {
          source.playbackRate.setValueAtTime(options.playbackRate, now);
        }

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
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }
      case 'ui_paper': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);
        gain.gain.setValueAtTime(vol * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
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
      case 'phase_action': {
        const dur = 0.4;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + dur);
        gain.gain.setValueAtTime(vol * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
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

  playMarching(isVehicle = false, isEnemy = false) {
    if (isVehicle) {
      this.playSfx('engine_vehicle', { volume: isEnemy ? 0.55 : 0.70, pitchVar: 0.04, playbackRate: isEnemy ? 0.85 : 1.0 });
    } else {
      this.playSfx('march_infantry', { volume: isEnemy ? 0.50 : 0.65, pitchVar: 0.05, playbackRate: isEnemy ? 0.88 : 1.0 });
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

  // ─── DYNAMIC MUSIC & AMBIENT CROSS-FADER ────────────────────────────────────

  async playMusic(trackKey, fadeDuration = 1.2) {
    try {
      this.init();
      if (!this.ctx) return;

      this.desiredMusicTrack = trackKey;

      if (this.currentMusicTrack === trackKey && this.currentMusicSource) {
        return; // Already playing this track
      }

      let buffer = this.buffers.get(trackKey);
      if (!buffer) {
        const url = this.audioManifest[trackKey];
        if (url) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              buffer = await this.ctx.decodeAudioData(arrayBuffer);
              this.buffers.set(trackKey, buffer);
            }
          } catch(err){}
        }
      }

      if (!buffer) return;
      if (this.desiredMusicTrack !== trackKey) return;
      if (this.currentMusicTrack === trackKey && this.currentMusicSource) return;

      const now = this.ctx.currentTime;
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.musicVolume);

      // Fade out and stop existing track
      if (this.currentMusicSource && this.currentMusicGain) {
        const oldGain = this.currentMusicGain;
        const oldSource = this.currentMusicSource;
        oldGain.gain.setValueAtTime(oldGain.gain.value, now);
        oldGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
        setTimeout(() => {
          try {
            oldSource.stop();
            oldSource.disconnect();
            oldGain.disconnect();
          } catch(e){}
        }, Math.floor(fadeDuration * 1000) + 50);
      }

      // Create and fade in new track
      const newSource = this.ctx.createBufferSource();
      newSource.buffer = buffer;
      newSource.loop = true;

      const newGain = this.ctx.createGain();
      newGain.gain.setValueAtTime(0.0001, now);
      newGain.gain.linearRampToValueAtTime(targetGain, now + fadeDuration);

      newSource.connect(newGain);
      newGain.connect(this.ctx.destination);
      newSource.start(now);

      this.currentMusicTrack = trackKey;
      this.currentMusicSource = newSource;
      this.currentMusicGain = newGain;
    } catch (e) {}
  }

  startMenuMusic(fade = 1.2) {
    this.playMusic('music_menu', fade);
  }

  startBattleMusic(fade = 1.2) {
    this.playMusic('ambient_warroom', fade);
  }

  startAmbient() {
    this.startBattleMusic();
  }

  stopMusic(fade = 0.8) {
    try {
      if (this.currentMusicSource && this.currentMusicGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.currentMusicGain.gain.setValueAtTime(this.currentMusicGain.gain.value, now);
        this.currentMusicGain.gain.linearRampToValueAtTime(0.0001, now + fade);
        const oldSource = this.currentMusicSource;
        const oldGain = this.currentMusicGain;
        this.currentMusicTrack = null;
        this.currentMusicSource = null;
        this.currentMusicGain = null;
        setTimeout(() => {
          try {
            oldSource.stop();
            oldSource.disconnect();
            oldGain.disconnect();
          } catch(e){}
        }, Math.floor(fade * 1000) + 50);
      }
    } catch (e) {}
  }

  stopAmbient() {
    this.stopMusic();
  }

  // ─── SETTINGS & VOLUME CONTROLS ─────────────────────────────────────────────

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('sketch_warfare_muted', this.isMuted);

    if (this.currentMusicGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.musicVolume);
      this.currentMusicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_master', Math.round(this.masterVolume * 100));

    if (this.currentMusicGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.musicVolume);
      try {
        this.currentMusicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.currentMusicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      } catch(e){}
    }
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_sfx', Math.round(this.sfxVolume * 100));
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('sketch_warfare_vol_music', Math.round(this.musicVolume * 100));

    if (this.currentMusicGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : (this.masterVolume * this.musicVolume);
      try {
        this.currentMusicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.currentMusicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      } catch(e){}
    }
  }
}
