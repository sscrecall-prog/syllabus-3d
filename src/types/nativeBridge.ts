/**
 * Android Native Floating Timer Bridge Contract & Safe Dispatcher
 */

export interface NativeFloatingTimerBridge {
  isOverlayPermissionGranted(): boolean;
  requestOverlayPermission(): void;
  startFloatingTimer(jsonState: string): void;
  updateFloatingTimer(jsonState: string): void;
  stopFloatingTimer(): void;
}

declare global {
  interface Window {
    AndroidBridge?: NativeFloatingTimerBridge;
  }
}

export const nativeBridge = {
  isAndroidAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.AndroidBridge);
  },

  isOverlayPermissionGranted(): boolean {
    if (this.isAndroidAvailable() && window.AndroidBridge?.isOverlayPermissionGranted) {
      try {
        return window.AndroidBridge.isOverlayPermissionGranted();
      } catch (e) {
        console.warn('[NativeBridge] isOverlayPermissionGranted failed:', e);
      }
    }
    return false;
  },

  requestOverlayPermission(): void {
    if (this.isAndroidAvailable() && window.AndroidBridge?.requestOverlayPermission) {
      try {
        window.AndroidBridge.requestOverlayPermission();
      } catch (e) {
        console.warn('[NativeBridge] requestOverlayPermission failed:', e);
      }
    }
  },

  startFloatingTimer(statePayload: object | string): void {
    if (this.isAndroidAvailable() && window.AndroidBridge?.startFloatingTimer) {
      try {
        const payload = typeof statePayload === 'string' ? statePayload : JSON.stringify(statePayload);
        window.AndroidBridge.startFloatingTimer(payload);
      } catch (e) {
        console.warn('[NativeBridge] startFloatingTimer failed:', e);
      }
    }
  },

  updateFloatingTimer(statePayload: object | string): void {
    if (this.isAndroidAvailable() && window.AndroidBridge?.updateFloatingTimer) {
      try {
        const payload = typeof statePayload === 'string' ? statePayload : JSON.stringify(statePayload);
        window.AndroidBridge.updateFloatingTimer(payload);
      } catch (e) {
        console.warn('[NativeBridge] updateFloatingTimer failed:', e);
      }
    }
  },

  stopFloatingTimer(): void {
    if (this.isAndroidAvailable() && window.AndroidBridge?.stopFloatingTimer) {
      try {
        window.AndroidBridge.stopFloatingTimer();
      } catch (e) {
        console.warn('[NativeBridge] stopFloatingTimer failed:', e);
      }
    }
  }
};
