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
   * Subtle micro-pulse (10ms) - Button clicks, chips, pill clicks
   */
  public light() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(10);
    } catch {}
  }

  /**
   * Firm pulse (18ms) - Modal open/close, drawer presentation, toggles
   */
  public medium() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(18);
    } catch {}
  }

  /**
   * Celebratory pattern ([18ms, 45ms, 25ms]) - Completed task, topic mastered, reward unlocked
   */
  public success() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate([18, 45, 25]);
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
   * Ultra-light tactile click (6ms) - Tab swipe switch, drag steps, segmented controls
   */
  public selection() {
    if (!this.isEnabled()) return;
    try {
      navigator.vibrate(6);
    } catch {}
  }
}

export const haptics = new HapticsEngine();
