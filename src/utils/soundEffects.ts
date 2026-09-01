export interface AudioSettings {
  masterEnabled: boolean;
  masterVolume: number; // 0 to 1
  clickSound: boolean;
  chimeSound: boolean;
  levelUpSound: boolean;
  pomodoroBell: boolean;
}

const STORAGE_KEY = 'syllabus3d_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  masterEnabled: true,
  masterVolume: 0.7,
  clickSound: true,
  chimeSound: true,
  levelUpSound: true,
  pomodoroBell: true
};

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch {
        this.settings = DEFAULT_SETTINGS;
      }
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch {}
    }
  }

  public setEnabled(val: boolean) {
    this.updateSettings({ masterEnabled: val });
  }

  public isEnabled(): boolean {
    return this.settings.masterEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.settings.masterEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playClick() {
    if (!this.settings.clickSound) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const volume = this.settings.masterVolume * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignored
    }
  }

  public playCompleteChime() {
    if (!this.settings.chimeSound) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const volume = this.settings.masterVolume * 0.18;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(volume, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.35);
      });
    } catch {
      // Ignored
    }
  }

  public playLevelUp() {
    if (!this.settings.levelUpSound) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const volume = this.settings.masterVolume * 0.15;
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        gain.gain.setValueAtTime(volume, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.4);
      });
    } catch {
      // Ignored
    }
  }

  public playPomodoroBell() {
    if (!this.settings.pomodoroBell) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const volume = this.settings.masterVolume * 0.25;
      const now = ctx.currentTime;
      
      // Resonant soft bell chime
      const harmonics = [587.33, 880.00, 1174.66]; // D5 major chord
      harmonics.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch {
      // Ignored
    }
  }
}

export const soundManager = new SoundEffectManager();
