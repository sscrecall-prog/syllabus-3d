import React from 'react';

/**
 * Validates if the given string is a Telegram link or handle.
 * Matches:
 * - https://t.me/...
 * - http://t.me/...
 * - t.me/...
 * - https://telegram.me/...
 * - telegram.me/...
 * - tg://...
 * - https://web.telegram.org/...
 */
export function isTelegramUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('https://t.me/') ||
    trimmed.startsWith('http://t.me/') ||
    trimmed.startsWith('t.me/') ||
    trimmed.startsWith('https://telegram.me/') ||
    trimmed.startsWith('http://telegram.me/') ||
    trimmed.startsWith('telegram.me/') ||
    trimmed.startsWith('tg://') ||
    trimmed.includes('web.telegram.org') ||
    trimmed.startsWith('@')
  );
}

/**
 * Ensures the Telegram URL is safe and directly clickable in web browsers.
 * If user entered "t.me/xyz", converts it to "https://t.me/xyz".
 * If user entered "@channel", converts it to "https://t.me/channel".
 */
export function cleanTelegramUrl(url: string | undefined | null): string {
  if (!url) return '';
  let trimmed = url.trim();

  if (trimmed.startsWith('@')) {
    return `https://t.me/${trimmed.substring(1)}`;
  }
  if (trimmed.startsWith('tg://resolve?domain=')) {
    const domain = trimmed.replace('tg://resolve?domain=', '');
    return `https://t.me/${domain}`;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('tg://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extracts human-readable channel, group, or post details from a Telegram URL.
 */
export function parseTelegramDetails(url: string | undefined | null): {
  channelOrGroup: string;
  messageId?: string;
  isPrivate: boolean;
  displayLabel: string;
} {
  if (!url) {
    return { channelOrGroup: 'Telegram', isPrivate: false, displayLabel: 'Telegram Resource' };
  }

  const clean = cleanTelegramUrl(url);

  try {
    const urlObj = new URL(clean);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Private link like t.me/c/12345678/90
    if (pathParts[0] === 'c' && pathParts.length >= 2) {
      return {
        channelOrGroup: `Private Channel (${pathParts[1]})`,
        messageId: pathParts[2],
        isPrivate: true,
        displayLabel: pathParts[2] ? `Private Post #${pathParts[2]}` : 'Private Telegram Channel'
      };
    }

    // Public link like t.me/pinnacle_ssc/1234
    if (pathParts.length > 0) {
      const channel = pathParts[0];
      const msgId = pathParts[1];
      return {
        channelOrGroup: `@${channel}`,
        messageId: msgId,
        isPrivate: false,
        displayLabel: msgId ? `@${channel} (Post #${msgId})` : `@${channel}`
      };
    }
  } catch {}

  return { channelOrGroup: 'Telegram Link', isPrivate: false, displayLabel: 'Telegram Link' };
}

/**
 * Official Telegram Paper Airplane Brand Icon
 */
export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) =>
  React.createElement(
    'svg',
    { className, viewBox: '0 0 24 24', fill: 'currentColor' },
    React.createElement('path', {
      d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z'
    })
  );
