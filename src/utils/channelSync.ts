import { Channel } from '../types';
import { TELUGU_CHANNELS } from '../data/teluguChannels';
import { parseChannelsFromText } from './playlistParser';
import { getSecureSourceUrl, encryptStorage, decryptStorage } from './securityGuard';

const STORAGE_CACHE_KEY = 'smart_tv_cache';
const STORAGE_SYNC_TIME_KEY = 'smart_tv_telugu_last_sync';

export interface SyncResult {
  success: boolean;
  count: number;
  message: string;
  timestamp: string;
  channels: Channel[];
}

/**
 * Get stored Telugu channels from encrypted localStorage cache, or fall back to bundled channels
 */
export function getStoredTeluguChannels(): Channel[] {
  try {
    const rawCipher = localStorage.getItem(STORAGE_CACHE_KEY);
    if (rawCipher) {
      const decrypted = decryptStorage(rawCipher);
      const parsed = JSON.parse(decrypted);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((ch: any) => ({
          id: ch.id,
          number: ch.number,
          categoryId: ch.categoryId || 'entertainment',
          name: ch.name,
          logo: ch.logo || '',
          streamUrl: ch.streamUrl || `/api/live/${ch.number}/playlist.m3u8`,
          fallbackUrl: ch.fallbackUrl,
          poster: ch.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          resolution: ch.resolution || '720p HD',
        }));
      }
    }
  } catch (err) {
    console.error('Failed to read cached channels:', err);
  }
  return TELUGU_CHANNELS;
}

/**
 * Get the timestamp of the last successful sync
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_SYNC_TIME_KEY);
  } catch {
    return null;
  }
}

/**
 * Fetch and parse channels directly from the secure source.
 * 1. Checks `/api/channels` (Server fetches fresh Dropbox source, masks real streams & hides source URL)
 * 2. Encrypts cached channel data before storing in browser localStorage
 */
export async function syncTeluguChannelsFromUrl(): Promise<SyncResult> {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Primary: Server Protected Endpoint (Zero CORS, hides Dropbox link & upstream stream hosts)
  try {
    const backendRes = await fetch(`/api/channels?_t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        const channels: Channel[] = data.channels;

        // Encrypt cache before saving into browser localStorage
        localStorage.setItem(STORAGE_CACHE_KEY, encryptStorage(JSON.stringify(channels)));
        localStorage.setItem(STORAGE_SYNC_TIME_KEY, now);

        // Notify app
        window.dispatchEvent(new CustomEvent('channels-updated', { detail: { channels } }));

        return {
          success: true,
          count: channels.length,
          message: `${channels.length} లైవ్ ఛానల్స్ విజయవంతంగా అప్‌డేట్ అయ్యాయి!`,
          timestamp: now,
          channels,
        };
      }
    }
  } catch (e) {
    // If backend is unreachable, continue to fallback
  }

  // 2. Client Fallback (Only if server API was unreachable)
  const secureUrl = getSecureSourceUrl();
  const fetchCandidates = [
    secureUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(secureUrl)}&_t=${Date.now()}`,
    `https://corsproxy.io/?url=${encodeURIComponent(secureUrl)}`,
  ];

  for (const targetUrl of fetchCandidates) {
    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, application/json, */*',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) continue;

      const rawText = await res.text();
      const rawChannels = parseChannelsFromText(rawText);

      if (rawChannels.length > 0) {
        // Obfuscate stream URLs to route through protected relay
        const protectedChannels = rawChannels.map((ch) => ({
          ...ch,
          streamUrl: `/api/live/${ch.number}/playlist.m3u8`,
        }));

        localStorage.setItem(STORAGE_CACHE_KEY, encryptStorage(JSON.stringify(protectedChannels)));
        localStorage.setItem(STORAGE_SYNC_TIME_KEY, now);

        window.dispatchEvent(new CustomEvent('channels-updated', { detail: { channels: protectedChannels } }));

        return {
          success: true,
          count: protectedChannels.length,
          message: `${protectedChannels.length} లైవ్ ఛానల్స్ విజయవంతంగా అప్‌డేట్ అయ్యాయి!`,
          timestamp: now,
          channels: protectedChannels,
        };
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  // 3. Fallback to encrypted stored channels
  const cachedChannels = getStoredTeluguChannels();
  return {
    success: false,
    count: cachedChannels.length,
    message: `${cachedChannels.length} ఛానల్స్ లోడ్ చేయబడ్డాయి (రక్షిత కాష్)`,
    timestamp: now,
    channels: cachedChannels,
  };
}
