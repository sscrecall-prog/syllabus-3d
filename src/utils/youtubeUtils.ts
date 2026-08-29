/**
 * YouTube URL Utilities for Topic Video Lectures & Timestamp Sync
 */

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  
  // Standard patterns:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://youtube.com/live/VIDEO_ID
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Also check if user directly pasted an 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeMaxResThumbnailUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(url: string, startSeconds: number = 0): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  const startParam = startSeconds > 0 ? `&start=${Math.floor(startSeconds)}` : '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0${startParam}`;
}

export function formatYouTubeWatchUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const videoId = extractYouTubeVideoId(trimmed);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getYouTubeWatchUrlWithTimestamp(url: string, startSeconds: number): string {
  const base = formatYouTubeWatchUrl(url);
  if (!base) return '';
  const seconds = Math.floor(startSeconds);
  if (base.includes('?')) {
    return `${base}&t=${seconds}s`;
  }
  return `${base}?t=${seconds}s`;
}

export function openYouTubeLectureInNewTab(url: string, startSeconds?: number): void {
  const watchUrl = startSeconds !== undefined && startSeconds > 0 
    ? getYouTubeWatchUrlWithTimestamp(url, startSeconds)
    : formatYouTubeWatchUrl(url);
  if (watchUrl) {
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Converts timestamp string "12:45" or "1:15:30" or "05:00" to total seconds
 */
export function parseTimestampToSeconds(timestampStr: string): number {
  if (!timestampStr) return 0;
  const clean = timestampStr.replace(/[\[\]⏱️@()]/g, '').trim();
  const parts = clean.split(':').map(p => Number(p.trim()));

  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    // hh:mm:ss
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // mm:ss
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Converts total seconds into "mm:ss" or "hh:mm:ss" format
 */
export function formatSecondsToTimestamp(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Parses all timestamp mentions from notes text, e.g.
 * - ⏱️ [12:45] Formula for Inradius
 * - [08:30] Key theorem
 */
export function extractTimestampsFromText(notesText: string): { label: string; seconds: number; lineText: string }[] {
  if (!notesText) return [];
  const results: { label: string; seconds: number; lineText: string }[] = [];
  const lines = notesText.split('\n');

  const regex = /(?:⏱️\s*)?(?:\[|@)?(\d{1,2}:\d{2}(?::\d{2})?)(?:\])?/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match && match[1]) {
      const label = match[1];
      const seconds = parseTimestampToSeconds(label);
      const cleanLine = line.replace(/^[\s*\->#]+/, '').trim();
      results.push({
        label,
        seconds,
        lineText: cleanLine
      });
    }
  }

  return results;
}
