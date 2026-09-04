/**
 * Mobile Haptic Feedback Engine
 * Provides subtle tactile feedback for key mobile user actions using navigator.vibrate
 */

class HapticsEngine {
  private enabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('syllabus3d_haptics_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator;
  }

  public isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem('syllabus3d_haptics_enabled', String(enabled));
    } catch {}
  }

  /**
   * Subtle micro-pulse (8ms) - Tab switches, chips, pill clicks
   */
  public light() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(8);
    } catch {}
  }

  /**
   * Firm pulse (16ms) - Play/pause, modal open/close, toggles
   */
  public medium() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(16);
    } catch {}
  }

  /**
   * Celebratory pattern ([15ms, 40ms, 25ms]) - Completed topic, loop done, reward unlocked
   */
  public success() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate([15, 40, 25]);
    } catch {}
  }

  /**
   * Double alert pulse ([25ms, 50ms, 25ms]) - Deletion, warnings, resets
   */
  public warning() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate([25, 50, 25]);
    } catch {}
  }

  /**
   * Ultra-light tap (5ms) - Sliders, rapid scrolling steps
   */
  public selection() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(5);
    } catch {}
  }
}

export const haptics = new HapticsEngine();
