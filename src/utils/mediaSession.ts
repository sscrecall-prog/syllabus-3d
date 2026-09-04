/**
 * Lock-Screen & Background Audio Control (MediaSession API)
 * Enables study timer and ambient soundscape controls directly from the phone lock-screen,
 * notification drawer, and connected Bluetooth earbuds.
 */

export interface MediaSessionMetadataOptions {
  title: string;
  artist?: string;
  album?: string;
}

export interface MediaSessionActionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

class MediaSessionManager {
  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  public updateMetadata(options: MediaSessionMetadataOptions) {
    if (!this.isSupported() || !window.MediaMetadata) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: options.title,
        artist: options.artist || 'Syllabus 3D • Focus Chamber',
        album: options.album || 'Deep Study Session',
        artwork: [
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (e) {
      console.warn('[MediaSession] Failed to set metadata:', e);
    }
  }

  public setPlaybackState(state: 'playing' | 'paused' | 'none') {
    if (!this.isSupported()) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {}
  }

  public setActionHandlers(handlers: MediaSessionActionHandlers) {
    if (!this.isSupported()) return;

    const actionMap: [MediaSessionAction, (() => void) | undefined][] = [
      ['play', handlers.onPlay],
      ['pause', handlers.onPause],
      ['stop', handlers.onStop],
      ['nexttrack', handlers.onNext],
      ['previoustrack', handlers.onPrevious]
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        if (handler) {
          navigator.mediaSession.setActionHandler(action, () => {
            handler();
          });
        } else {
          navigator.mediaSession.setActionHandler(action, null);
        }
      } catch (e) {
        // Some browsers don't support all actions
      }
    });
  }

  public clear() {
    if (!this.isSupported()) return;
    try {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
    } catch {}
  }
}

export const mediaSessionManager = new MediaSessionManager();
