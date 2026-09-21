import React, { useEffect, useRef, useState } from 'react';
import { Channel } from '../types';
import { AlertCircle, Loader2, Play, VolumeX } from 'lucide-react';
import { requestMobileLandscapeFullscreen, isMobileDevice } from '../utils/device';

interface VideoPlayerProps {
  channel: Channel;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onPlayStateChange: (playing: boolean) => void;
  onVideoClick?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  isPlaying,
  isMuted,
  volume,
  onPlayStateChange,
  onVideoClick,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  // When channel changes, reset video and play
  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);
    setIsBuffering(true);

    if (videoRef.current) {
      videoRef.current.src = channel.streamUrl;
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback: try muted
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {
              onPlayStateChange(false);
            });
          }
        });
      }
    }
  }, [channel.id]);

  // Volume and mute sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [isMuted, volume]);

  // Play / Pause sync
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => onPlayStateChange(false));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const handleVideoError = () => {
    if (!usingFallback && channel.fallbackUrl && videoRef.current) {
      setUsingFallback(true);
      videoRef.current.src = channel.fallbackUrl;
      videoRef.current.load();
      videoRef.current.play().catch(() => setHasError(true));
    } else {
      setHasError(true);
      setIsBuffering(false);
    }
  };

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
      <video
        ref={videoRef}
        id="main-tv-video-element"
        className="w-full h-full object-fill bg-black"
        style={{ objectFit: 'fill', width: '100%', height: '100%' }}
        autoPlay
        playsInline
        loop
        preload="auto"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          onPlayStateChange(true);
          // Automatically trigger landscape fullscreen on mobile when video plays
          if (isMobileDevice()) {
            requestMobileLandscapeFullscreen(
              document.getElementById('smart-tv-app-root') || videoRef.current?.parentElement,
              videoRef.current
            );
          }
        }}
        onCanPlay={() => setIsBuffering(false)}
        onError={handleVideoError}
      />

      {/* Buffering Indicator */}
      {isBuffering && !hasError && (
        <div 
          id="video-buffering-indicator" 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-10"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neutral-900/90 border border-white/10 text-white shadow-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide">Loading channel...</span>
              <span className="text-xs text-neutral-400 font-mono">Tuning {channel.name} ({channel.number})</span>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause overlay icon when paused */}
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

      {/* Error Fallback broadcast screen */}
      {hasError && (
        <div 
          id="video-error-fallback"
          className="absolute inset-0 flex flex-col items-center justify-center bg-radial from-neutral-900 to-black text-center p-6 z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{channel.name} - Signal Check</h3>
          <p className="text-neutral-400 text-sm max-w-md mb-5">
            Live stream is temporarily unavailable. Please select another channel using the remote or guide.
          </p>
          <button
            id="retry-stream-btn"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsBuffering(true);
              if (videoRef.current) {
                videoRef.current.src = channel.streamUrl;
                videoRef.current.load();
                videoRef.current.play();
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition-colors shadow-lg active:scale-95"
          >
            Retry Stream
          </button>
        </div>
      )}
    </div>
  );
};
