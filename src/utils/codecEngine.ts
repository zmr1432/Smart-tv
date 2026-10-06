import Hls from 'hls.js';

export type StreamFormat = 'hls' | 'dash' | 'native-hls' | 'native-mp4';

/**
 * Multi-Format Stream Protocol Detector
 * Detects HLS, MPEG-DASH, Direct Media (MP4, WebM, MKV, OGG) & Apple Native HLS
 */
export function detectStreamFormat(url: string, video?: HTMLVideoElement | null): StreamFormat {
  const clean = (url || '').trim().toLowerCase();

  // 1. MPEG-DASH (.mpd)
  if (clean.includes('.mpd') || clean.includes('/dash/') || clean.includes('manifest.mpd')) {
    return 'dash';
  }

  // 2. HLS (.m3u8, /hls/, chunklist, playlist.m3u8, liveabr)
  if (
    clean.includes('.m3u8') ||
    clean.includes('/hls/') ||
    clean.includes('chunklist') ||
    clean.includes('playlist.m3u8') ||
    clean.includes('liveabr')
  ) {
    // Apple Native HLS for Safari, iOS, Apple TV
    if (video && video.canPlayType('application/vnd.apple.mpegurl') && !Hls.isSupported()) {
      return 'native-hls';
    }
    return Hls.isSupported() ? 'hls' : 'native-hls';
  }

  // 3. Direct Media (MP4, WebM, MKV, MOV, OGG)
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.ogg') ||
    clean.includes('.mp4?') ||
    clean.includes('.webm?')
  ) {
    return 'native-mp4';
  }

  // Default fallback
  return Hls.isSupported() ? 'hls' : 'native-mp4';
}

/**
 * Optimal Hls.js configuration for Low-Latency Live TV & VOD Streams
 */
export function getOptimalHlsConfig(): any {
  return {
    enableWorker: true,
    autoStartLoad: true,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 60 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 2,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 5,
    maxFragLookUpTolerance: 0.25,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 8,
    fragLoadingTimeOut: 20000,
    manifestLoadingTimeOut: 20000,
    fragLoadingMaxRetry: 6,
    manifestLoadingMaxRetry: 6,
    levelLoadingMaxRetry: 6,
    startLevel: -1,
    progressive: true,
    xhrSetup: (xhr: XMLHttpRequest) => {
      xhr.withCredentials = false;
    },
  };
}

/**
 * Initializes Google Shaka Player for Adaptive MPEG-DASH (.mpd) playback
 */
export async function initShakaPlayer(videoElement: HTMLVideoElement): Promise<any | null> {
  if (typeof window === 'undefined') return null;

  try {
    const shakaModule = await import('shaka-player');
    const shaka = (shakaModule as any).default || shakaModule || (window as any).shaka;

    if (shaka) {
      if (shaka.polyfill && typeof shaka.polyfill.installAll === 'function') {
        shaka.polyfill.installAll();
      }

      if (shaka.Player && shaka.Player.isBrowserSupported && shaka.Player.isBrowserSupported()) {
        const player = new shaka.Player();
        await player.attach(videoElement);

        player.configure({
          streaming: {
            bufferingGoal: 20,
            rebufferingGoal: 3,
            bufferBehind: 30,
            retryParameters: {
              maxAttempts: 5,
              baseDelay: 1000,
              backoffFactor: 2,
              fuzzFactor: 0.5,
              timeout: 20000,
            },
          },
        });

        return player;
      }
    }
  } catch (err) {
    console.warn('Shaka Player could not be initialized:', err);
  }

  return null;
}

/**
 * Android TV Media3 / ExoPlayer Hardware Bridge Pipeline
 * Calls native bridge methods if running inside an Android TV APK wrapper
 */
export function triggerAndroidMediaBridges(streamUrl: string): boolean {
  if (typeof window === 'undefined') return false;

  const win = window as any;

  // 1. Android Media3 Bridge
  if (win.AndroidMedia3 && typeof win.AndroidMedia3.playStream === 'function') {
    try {
      win.AndroidMedia3.playStream(streamUrl, true);
      return true;
    } catch (e) {
      console.warn('AndroidMedia3 bridge call failed, falling back to web player:', e);
    }
  }

  // 2. Android ExoPlayer Bridge
  if (win.ExoPlayerBridge && typeof win.ExoPlayerBridge.loadMedia === 'function') {
    try {
      win.ExoPlayerBridge.loadMedia(streamUrl);
      win.ExoPlayerBridge.play?.();
      return true;
    } catch (e) {
      console.warn('ExoPlayerBridge call failed, falling back to web player:', e);
    }
  }

  return false;
}

// Aliases for compatibility with player components
export const detectStreamProtocol = detectStreamFormat;
export const getOptimizedHlsConfig = getOptimalHlsConfig;
export const loadShakaPlayer = initShakaPlayer;
