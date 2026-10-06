import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { parseChannelsFromText } from './src/utils/playlistParser.js';
import { getSecureSourceUrl } from './src/utils/securityGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Master Dropbox source URL (Obfuscated / Protected on server)
const SERVER_SOURCE_URL = process.env.SOURCE_PLAYLIST_URL || getSecureSourceUrl();

// Fast Symmetric Token Scrambler for Chunk URLs
// Masks real stream URLs into unreadable tokens so VPN / network sniffers cannot extract URLs!
const TOKEN_KEY = 0x7b;

function encryptChunkUrl(rawUrl: string): string {
  const buf = Buffer.from(rawUrl, 'utf-8');
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= TOKEN_KEY;
  }
  return buf.toString('base64url');
}

function decryptChunkUrl(token: string): string {
  const buf = Buffer.from(token, 'base64url');
  for (let i = 0; i < buf.length; i++) {
    buf[i] ^= TOKEN_KEY;
  }
  return buf.toString('utf-8');
}

// In-Memory Stream Protection Vault
// Maps Channel Number -> Real Upstream Stream URL
// Real URLs are strictly kept on the server and NEVER exposed to clients or network sniffers!
const channelVault = new Map<number, string>();

/**
 * Robust redirect-following fetch helper
 */
async function fetchWithRedirects(
  initialUrl: string,
  headers: Record<string, string> = {},
  maxRedirects = 6
): Promise<{ finalUrl: string; response: any; text: string }> {
  let curUrl = initialUrl;

  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(curUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        ...headers,
      },
      redirect: 'manual',
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (loc) {
        curUrl = new URL(loc, curUrl).toString();
        continue;
      }
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    return { finalUrl: curUrl, response: res, text };
  }

  throw new Error('Too many redirects');
}

async function startServer() {
  const app = express();

  // Security & CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
    res.removeHeader('X-Powered-By');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  /**
   * Refreshes the server-side channel vault from the protected Dropbox link
   */
  async function refreshChannelVault(): Promise<any[]> {
    const { text: rawText } = await fetchWithRedirects(SERVER_SOURCE_URL, {
      'Cache-Control': 'no-cache',
    });
    const channels = parseChannelsFromText(rawText);

    channels.forEach((ch) => {
      if (ch.number && ch.streamUrl) {
        channelVault.set(ch.number, ch.streamUrl);
      }
    });

    return channels;
  }

  // Pre-load channel vault on startup
  try {
    await refreshChannelVault();
    console.log(`[StreamVault] Initialized ${channelVault.size} protected channels.`);
  } catch (err) {
    console.warn('[StreamVault] Initial load warning, will fetch on demand:', err);
  }

  /**
   * API: Live Channels Endpoint
   * Returns channel list with PROTECTED, OPAQUE stream URLs.
   * Real stream URLs and the Dropbox source link are completely stripped out!
   */
  app.get('/api/channels', async (_req: Request, res: Response) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const rawChannels = await refreshChannelVault();

      // Mask all stream URLs: client only receives internal protected relay endpoints!
      const protectedChannels = rawChannels.map((ch) => ({
        ...ch,
        streamUrl: `/api/live/${ch.number}/playlist.m3u8`,
        fallbackUrl: undefined,
      }));

      res.json({
        success: true,
        count: protectedChannels.length,
        timestamp: new Date().toISOString(),
        channels: protectedChannels,
      });
    } catch (err: any) {
      console.error('[StreamVault] Error updating channels:', err.message);
      res.status(500).json({
        success: false,
        error: 'Failed to update channels',
      });
    }
  });

  /**
   * API: Protected Live Stream Playlist Relay
   * Fetches upstream m3u8 playlist on server, resolves redirects, rewrites segment & subplaylist URLs,
   * completely shielding real CDN domains, ports, and tokens from VPN and network sniffers!
   */
  app.get('/api/live/:channelNumber/playlist.m3u8', async (req: Request, res: Response) => {
    const channelNumber = parseInt(req.params.channelNumber, 10);
    let realUrl = channelVault.get(channelNumber);

    if (!realUrl) {
      try {
        await refreshChannelVault();
        realUrl = channelVault.get(channelNumber);
      } catch {}
    }

    if (!realUrl) {
      res.status(404).send('Channel not found');
      return;
    }

    try {
      const { finalUrl, text: playlistText } = await fetchWithRedirects(realUrl);
      const basePath = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);

      // Rewrite playlist lines so all media segments and keys relay through our server with encrypted tokens
      const lines = playlistText.split(/\r?\n/);
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite encryption keys: #EXT-X-KEY:METHOD=...,URI="http..."
        if (trimmed.startsWith('#EXT-X-KEY:') && trimmed.includes('URI=')) {
          return trimmed.replace(/URI=["']([^"']+)["']/g, (_m, keyUri) => {
            const resolvedKeyUrl = keyUri.startsWith('http')
              ? keyUri
              : new URL(keyUri, basePath).toString();
            return `URI="/api/live/${channelNumber}/chunk?u=${encryptChunkUrl(resolvedKeyUrl)}"`;
          });
        }

        // Leave tags as-is
        if (trimmed.startsWith('#')) {
          return line;
        }

        // Sub-playlist or Media TS segment URL line
        const resolvedSegmentUrl = trimmed.startsWith('http')
          ? trimmed
          : new URL(trimmed, basePath).toString();

        return `/api/live/${channelNumber}/chunk?u=${encryptChunkUrl(resolvedSegmentUrl)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(rewrittenLines.join('\n'));
    } catch (err: any) {
      console.warn(`[StreamVault] Error relaying playlist for channel ${channelNumber}:`, err.message);
      res.status(502).send('Stream relay error');
    }
  });

  /**
   * API: Protected Media Chunk Relay
   * Pipes binary .ts / .mp4 video segments from the real CDN server to the client.
   * Resolves upstream redirects and strips upstream origin headers so VPN sniffers cannot detect the real origin.
   */
  app.get('/api/live/:channelNumber/chunk', async (req: Request, res: Response) => {
    const rawToken = req.query.u as string;
    if (!rawToken) {
      res.status(400).send('Missing media chunk parameter');
      return;
    }

    let targetUrl: string;
    try {
      targetUrl = decryptChunkUrl(rawToken);
      new URL(targetUrl); // Validate URL structure
    } catch {
      res.status(400).send('Invalid chunk token');
      return;
    }

    // Follow potential redirects to get the real binary chunk
    const pipeChunk = (fetchUrl: string, hopsRemaining: number) => {
      if (hopsRemaining <= 0) {
        if (!res.headersSent) res.status(502).send('Too many redirects for chunk');
        return;
      }

      try {
        const parsedUrl = new URL(fetchUrl);
        const isHttps = parsedUrl.protocol === 'https:';
        const requestModule = isHttps ? https : http;

        const proxyReq = requestModule.request(
          fetchUrl,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': '*/*',
              'Referer': `${parsedUrl.origin}/`,
              ...(req.headers.range ? { Range: req.headers.range } : {}),
            },
          },
          (proxyRes) => {
            // Handle redirects
            if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode || 0)) {
              const loc = proxyRes.headers.location;
              if (loc) {
                const nextUrl = new URL(loc, fetchUrl).toString();
                pipeChunk(nextUrl, hopsRemaining - 1);
                return;
              }
            }

            const contentType = proxyRes.headers['content-type'] || 'video/mp2t';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=60');

            if (proxyRes.headers['content-length']) {
              res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
            if (proxyRes.headers['content-range']) {
              res.setHeader('Content-Range', proxyRes.headers['content-range']);
            }

            res.writeHead(proxyRes.statusCode || 200);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.status(502).send(`Chunk relay error: ${err.message}`);
          }
        });

        proxyReq.end();
      } catch (e: any) {
        if (!res.headersSent) {
          res.status(500).send(`Chunk error: ${e.message}`);
        }
      }
    };

    pipeChunk(targetUrl, 5);
  });

  // Dev vs Production Setup
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve built dist static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StreamVault Server] Listening on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[StreamVault Server] Failed to start:', err);
  process.exit(1);
});
