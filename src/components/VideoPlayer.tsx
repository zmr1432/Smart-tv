import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '../types';
import { AlertCircle, Play, VolumeX } from 'lucide-react';
import { requestMobileLandscapeFullscreen, isMobileDevice } from '../utils/device';
import Hls from 'hls.js';

interface VideoPlayerProps {
  channel: Channel;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onPlayStateChange: (playing: boolean) => void;
  onVideoClick?: () => void;
}

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

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle fatal video errors smoothly
  const handleVideoError = useCallback(() => {
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

  // Direct Stream Player: Plays directly like Google Chrome without buffer restrictions or loading overlays
  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = channel.streamUrl;
    const isHls = streamUrl.includes('.m3u8') || (!streamUrl.endsWith('.mp4') && streamUrl.startsWith('http'));

    // 1. Direct Native Playback (Safari / iOS / Chrome Native HLS if enabled)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
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
    // 2. Direct Hls.js Playback - standard direct stream, NO buffer limits or watchdog interference
    else if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        autoStartLoad: true,
        // Standard streaming without custom buffer delays or watchdog interruptions
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlayingRef.current) {
          const p = video.play();
          if (p !== undefined) {
            p.catch(() => {
              // Direct fallback to muted play if browser policy requires it
              video.muted = true;
              video.play().catch(() => onPlayStateChange(false));
            });
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              handleVideoError();
              break;
          }
        }
      });
    } 
    // 3. Direct MP4 / Standard Media Playback
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
  }, [channel.id, channel.streamUrl, handleVideoError, onPlayStateChange]);

  // Volume & Mute synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume / 100));
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
    } else {
      if (!v.paused) {
        v.pause();
      }
    }
  }, [isPlaying, onPlayStateChange]);

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
      {/* Video Element - Direct Playback, No Buffer Restriction */}
      <video
        ref={videoRef}
        id="main-tv-video-element"
        className="w-full h-full object-fill bg-black"
        style={{ objectFit: 'fill', width: '100%', height: '100%' }}
        autoPlay
        playsInline
        preload="auto"
        onPlaying={() => onPlayStateChange(true)}
        onError={handleVideoError}
      />

      {/* Play/Pause overlay icon when user explicitly pauses */}
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

      {/* Muted Warning Tag */}
      {isMuted && (
        <div 
          id="video-muted-pill"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-lg pointer-events-none"
        >
          <VolumeX className="w-4 h-4" />
          <span>Audio Muted</span>
        </div>
      )}

      {/* Error Fallback screen */}
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
            ఛానల్ సిగ్నల్ అందుబాటులో లేదు. దయచేసి వేరే ఛానల్‌ను ఎంచుకోండి.
          </p>
          <button
            id="retry-stream-btn"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.src = channel.streamUrl;
                videoRef.current.load();
                videoRef.current.play();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            రీట్రై చేయండి (Retry)
          </button>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
