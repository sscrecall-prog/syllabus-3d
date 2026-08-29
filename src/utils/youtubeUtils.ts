/**
 * YouTube URL Utilities for Topic Video Lectures
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

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
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

export function openYouTubeLectureInNewTab(url: string): void {
  const watchUrl = formatYouTubeWatchUrl(url);
  if (watchUrl) {
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  }
}
