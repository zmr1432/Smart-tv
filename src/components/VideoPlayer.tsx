import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '../types';
import { AlertCircle, Play } from 'lucide-react';
import { requestMobileLandscapeFullscreen, isMobileDevice } from '../utils/device';
import Hls from 'hls.js';
import { detectStreamProtocol, getOptimizedHlsConfig, loadShakaPlayer } from '../utils/codecEngine';

// Android TV / Native WebView Google Media3 ExoPlayer Bridge Interface
declare global {
  interface Window {
    AndroidMedia3?: {
      playStream?: (url: string, isLive: boolean) => void;
      pauseStream?: () => void;
      setVolume?: (vol: number) => void;
      setMuted?: (muted: boolean) => void;
    };
    ExoPlayerBridge?: {
      loadMedia?: (url: string) => void;
      play?: () => void;
      pause?: () => void;
    };
  }
}

interface VideoPlayerProps {
  channel: Channel;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onPlayStateChange: (playing: boolean) => void;
  onVideoClick?: () => void;
}

/**
 * Universal Multi-Codec Video Player Engine
 * 
 * Features:
 * 1. Comprehensive Protocol & Codec Support:
 *    - HLS (.m3u8) Live & VOD with H.264/AVC, H.265/HEVC, AAC, MP3, AC-3 / E-AC-3 audio demuxing
 *    - MPEG-DASH (.mpd) via Google Shaka Player Engine
 *    - Direct MP4 / WebM / MKV / OGG media streaming
 *    - Native Apple HLS hardware pipeline on Safari & iOS
 *    - Hardware Android TV Media3 ExoPlayer Bridge
 * 
 * 2. Unmuted Direct Audio Architecture:
 *    - Audio is NEVER forced to mute on load or stream restart
 *    - Pure unmuted playback with full volume synchronization
 *    - Instant gesture-based audio unlock if browser policy requires initial interaction
 *    - Codec swap on audio track errors (AAC-LC <-> HE-AAC <-> MP3)
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({
  channel,
  isPlaying,
  isMuted,
  volume,
  onPlayStateChange,
  onVideoClick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const shakaRef = useRef<any>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const retryCountRef = useRef<number>(0);
  const stallTimerRef = useRef<any>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Fatal Stream Error & Fallback Recovery Policy
  const handleFatalStreamError = useCallback(() => {
    if (!usingFallback && channel.fallbackUrl && videoRef.current) {
      setUsingFallback(true);
      const v = videoRef.current;
      v.src = channel.fallbackUrl;
      v.load();
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => setHasError(true));
      }
    } else {
      setHasError(true);
    }
  }, [channel.fallbackUrl, usingFallback]);

  // Helper to safely play video with unmuted audio
  const safePlay = useCallback((video: HTMLVideoElement) => {
    if (!isPlayingRef.current) return;
    
    // Ensure sound is active and unmuted
    video.muted = isMuted;
    video.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          onPlayStateChange(true);
        })
        .catch(() => {
          // If browser blocked unmuted autoplay pending initial user interaction,
          // listen for the very first interaction and immediately start unmuted audio!
          const unlockAudio = () => {
            if (videoRef.current) {
              videoRef.current.muted = isMuted;
              videoRef.current.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));
              videoRef.current.play().then(() => {
                onPlayStateChange(true);
              }).catch(() => {});
            }
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
          };

          window.addEventListener('pointerdown', unlockAudio, { once: true });
          window.addEventListener('keydown', unlockAudio, { once: true });
          window.addEventListener('touchstart', unlockAudio, { once: true });
          
          onPlayStateChange(false);
        });
    }
  }, [isMuted, volume, onPlayStateChange]);

  // Universal Video Codec & Streaming Pipeline Initialization
  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);
    retryCountRef.current = 0;

    // Destroy any existing player instances cleanly
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (shakaRef.current) {
      shakaRef.current.destroy();
      shakaRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    // Ensure audio parameters are set cleanly before loading
    video.muted = isMuted;
    video.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));

    const rawStreamUrl = channel.streamUrl;
    // When served over HTTPS, avoid browser mixed-content blockage by proxying insecure HTTP streams
    const streamUrl = (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawStreamUrl.startsWith('http://'))
      ? `/api/proxy-stream?url=${encodeURIComponent(rawStreamUrl)}`
      : rawStreamUrl;

    const protocol = detectStreamProtocol(streamUrl, video);

    let handleWaiting: (() => void) | null = null;

    // 1. Android TV Native Media3 ExoPlayer Bridge (if inside native APK wrapper)
    if (window.AndroidMedia3?.playStream) {
      try {
        window.AndroidMedia3.playStream(streamUrl, true);
      } catch (err) {
        console.warn('AndroidMedia3 bridge call failed, falling back to web player:', err);
      }
    } else if (window.ExoPlayerBridge?.loadMedia) {
      try {
        window.ExoPlayerBridge.loadMedia(streamUrl);
        window.ExoPlayerBridge.play?.();
      } catch (err) {
        console.warn('ExoPlayerBridge call failed, falling back to web player:', err);
      }
    }

    // 2. MPEG-DASH (.mpd) Engine via Shaka Player
    if (protocol === 'dash') {
      loadShakaPlayer(video).then(player => {
        if (player) {
          shakaRef.current = player;
          player.load(streamUrl).then(() => {
            safePlay(video);
          }).catch((err: any) => {
            console.error('Shaka DASH load error:', err);
            handleFatalStreamError();
          });
        } else {
          // Fallback to native video tag
          video.src = streamUrl;
          safePlay(video);
        }
      });
    }
    // 3. Native Apple HLS (Safari, iOS, macOS)
    else if (protocol === 'native-hls') {
      video.src = streamUrl;
      safePlay(video);
    }
    // 4. HLS.js Universal Engine with Full Audio/Video Codec Support
    else if (protocol === 'hls' && Hls.isSupported()) {
      const hls = new Hls(getOptimizedHlsConfig());
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        safePlay(video);
      });

      // Buffer Stall & Live Drift Auto-Recovery on video element
      handleWaiting = () => {
        if (video && video.buffered.length > 0) {
          const liveEdge = video.buffered.end(video.buffered.length - 1);
          if (liveEdge - video.currentTime > 6) {
            video.currentTime = Math.max(0, liveEdge - 1.5);
          }
        }
      };
      video.addEventListener('waiting', handleWaiting);

      // Advanced Multi-Codec Error Recovery Policy
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Progressive retry with exponential backoff
              if (retryCountRef.current < 4) {
                retryCountRef.current += 1;
                setTimeout(() => {
                  if (hlsRef.current) hlsRef.current.startLoad();
                }, 1000 * retryCountRef.current);
              } else {
                hls.destroy();
                hlsRef.current = null;
                handleFatalStreamError();
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              // Codec and demuxer auto-recovery
              if (retryCountRef.current === 0) {
                retryCountRef.current += 1;
                hls.recoverMediaError();
              } else if (retryCountRef.current === 1) {
                // Audio Codec Swap: Switch between AAC-LC / HE-AAC / MP3 demuxers
                retryCountRef.current += 1;
                try {
                  hls.swapAudioCodec();
                } catch {}
                hls.recoverMediaError();
              } else if (retryCountRef.current === 2) {
                // Buffer hole jump
                retryCountRef.current += 1;
                if (video && !isNaN(video.currentTime)) {
                  video.currentTime += 0.5;
                }
                hls.recoverMediaError();
              } else {
                hls.destroy();
                hlsRef.current = null;
                handleFatalStreamError();
              }
              break;

            default:
              hls.destroy();
              hlsRef.current = null;
              handleFatalStreamError();
              break;
          }
        }
      });
    }
    // 5. Direct MP4 / WebM / Media Stream
    else {
      video.src = streamUrl;
      safePlay(video);
    }

    return () => {
      if (handleWaiting) {
        video.removeEventListener('waiting', handleWaiting);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (shakaRef.current) {
        shakaRef.current.destroy();
        shakaRef.current = null;
      }
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
      }
    };
  }, [channel.id, channel.streamUrl, handleFatalStreamError, safePlay, isMuted, volume]);

  // Synchronize Volume and Mute without interrupting live stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));
    }
    if (window.AndroidMedia3?.setVolume) {
      try {
        window.AndroidMedia3.setVolume(volume);
        window.AndroidMedia3.setMuted?.(isMuted);
      } catch {
        // Ignore native bridge sync errors
      }
    }
  }, [isMuted, volume]);

  // Play / Pause synchronization
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isPlaying) {
      if (hlsRef.current) {
        try {
          hlsRef.current.startLoad();
        } catch {}
      }
      v.muted = isMuted;
      v.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));
      if (v.paused) {
        const p = v.play();
        if (p !== undefined) {
          p.catch(() => onPlayStateChange(false));
        }
      }
      window.AndroidMedia3?.playStream?.(channel.streamUrl, true);
    } else {
      if (!v.paused) {
        v.pause();
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
        } catch {}
      }
      window.AndroidMedia3?.pauseStream?.();
    }
  }, [isPlaying, channel.streamUrl, onPlayStateChange, isMuted, volume]);

  // Block native browser context menu (long-press popups like Picture-in-Picture, copy frame, open in chrome)
  useEffect(() => {
    const blockMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    const el = videoRef.current;
    if (el) {
      el.addEventListener('contextmenu', blockMenu, { capture: true });
    }
    return () => {
      if (el) {
        el.removeEventListener('contextmenu', blockMenu, { capture: true });
      }
    };
  }, []);

  return (
    <div 
      id="tv-video-player-container"
      className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden select-none cursor-pointer"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onClick={() => {
        if (isMobileDevice()) {
          requestMobileLandscapeFullscreen(
            document.getElementById('smart-tv-app-root') || videoRef.current?.parentElement,
            videoRef.current
          );
        }
        onVideoClick?.();
      }}
    >
      {/* Live Universal Multi-Codec Video Element */}
      <video
        ref={videoRef}
        id="main-tv-video-element"
        data-engine="google-media3-universal-codec"
        className="w-full h-full object-fill bg-black pointer-events-none select-none"
        style={{
          objectFit: 'fill',
          width: '100%',
          height: '100%',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        autoPlay
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onPlaying={() => onPlayStateChange(true)}
        onError={handleFatalStreamError}
      />

      {/* Play/Pause overlay icon when user manually pauses */}
      {!isPlaying && (
        <div 
          id="video-paused-overlay"
          className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-10"
        >
          <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-transform animate-pulse">
            <Play className="w-10 h-10 ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Fatal Broadcast Error Screen */}
      {hasError && (
        <div 
          id="video-error-fallback"
          className="absolute inset-0 flex flex-col items-center justify-center bg-radial from-neutral-900 to-black text-center p-6 z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{channel.name}</h3>
          <p className="text-neutral-400 text-sm max-w-md mb-5">
            Live stream signal is temporarily unavailable. Please retry or choose another channel.
          </p>
          <button
            id="retry-stream-btn"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              retryCountRef.current = 0;
              if (videoRef.current) {
                videoRef.current.src = channel.streamUrl;
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            Retry Stream
          </button>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
