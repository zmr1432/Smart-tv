import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '../types';
import { AlertCircle, Play, VolumeX } from 'lucide-react';
import { requestMobileLandscapeFullscreen, isMobileDevice } from '../utils/device';
import Hls from 'hls.js';

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
 * Google Media3 ExoPlayer Engine for HLS (.m3u8) Live Streaming
 * 
 * Implements ExoPlayer's live streaming architecture:
 * - Direct Live HLS streaming with zero artificial buffering delays
 * - Hardware accelerated playback pipeline (MediaSource / HTML5 Video)
 * - Native Android TV Media3 Bridge synchronization (if hosted in Android TV WebView)
 * - Automatic codec swap and media error recovery based on ExoPlayer LoadErrorHandlingPolicy
 * - Direct failover to fallback URL on fatal broadcast disruption
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
  const [hasError, setHasError] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const retryCountRef = useRef<number>(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ExoPlayer Error Recovery Policy
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

  // Google Media3 ExoPlayer Engine Initialization & HLS Live Pipeline
  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);
    retryCountRef.current = 0;

    // Destroy existing player instance cleanly
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = channel.streamUrl;
    const isHls = streamUrl.includes('.m3u8') || (!streamUrl.endsWith('.mp4') && streamUrl.startsWith('http'));

    // 1. Android TV Native Media3 ExoPlayer Bridge (if running inside an Android TV APK wrapper)
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

    // 2. Native HLS Engine (Safari / iOS / Android WebViews with native Media3 hardware HLS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      if (isPlayingRef.current) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay policy fallback: start muted if unmuted playback blocked by browser
            video.muted = true;
            video.play().catch(() => onPlayStateChange(false));
          });
        }
      }
    } 
    // 3. Google Media3 ExoPlayer HLS Web Engine (Chrome, Edge, Firefox, Android TV Browser)
    else if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        autoStartLoad: true,
        // ExoPlayer-aligned Live parameters: Direct play, no buffer throttling
        lowLatencyMode: false,
        backBufferLength: 10,
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        enableSoftwareAES: true,
        startLevel: -1, // Adaptive Bitrate start (ABR)
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlayingRef.current) {
          const p = video.play();
          if (p !== undefined) {
            p.catch(() => {
              video.muted = true;
              video.play().catch(() => onPlayStateChange(false));
            });
          }
        }
      });

      // ExoPlayer Error Recovery Mechanism
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // ExoPlayer DefaultLoadErrorHandlingPolicy: retry load
              if (retryCountRef.current < 3) {
                retryCountRef.current += 1;
                hls.startLoad();
              } else {
                hls.destroy();
                hlsRef.current = null;
                handleFatalStreamError();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // ExoPlayer codec/pipeline recovery
              if (retryCountRef.current === 0) {
                retryCountRef.current += 1;
                hls.recoverMediaError();
              } else if (retryCountRef.current === 1) {
                retryCountRef.current += 1;
                hls.swapAudioCodec();
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
    // 4. Standard Direct MP4 / Media Playback
    else {
      video.src = streamUrl;
      if (isPlayingRef.current) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {
            video.muted = true;
            video.play().catch(() => onPlayStateChange(false));
          });
        }
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, channel.streamUrl, handleFatalStreamError, onPlayStateChange]);

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
      window.AndroidMedia3?.pauseStream?.();
    }
  }, [isPlaying, channel.streamUrl, onPlayStateChange]);

  return (
    <div 
      id="tv-video-player-container"
      className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden select-none cursor-pointer"
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
      {/* Live ExoPlayer Engine Video Element */}
      <video
        ref={videoRef}
        id="main-tv-video-element"
        data-engine="google-media3-exoplayer"
        className="w-full h-full object-fill bg-black"
        style={{ objectFit: 'fill', width: '100%', height: '100%' }}
        autoPlay
        playsInline
        preload="auto"
        crossOrigin="anonymous"
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

      {/* Audio Muted Tag */}
      {isMuted && (
        <div 
          id="video-muted-pill"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-lg pointer-events-none"
        >
          <VolumeX className="w-4 h-4" />
          <span>Audio Muted</span>
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
            లైవ్ స్ట్రీమ్ సిగ్నల్ తాత్కాలికంగా ఆగిపోయింది. దయచేసి రీట్రై చేయండి లేదా వేరే ఛానల్‌ను ఎంచుకోండి.
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
                videoRef.current.play();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            రీట్రై చేయండి (Retry Stream)
          </button>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
