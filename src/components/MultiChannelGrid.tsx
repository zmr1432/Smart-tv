import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel } from '../types';
import Hls from 'hls.js';
import { 
  Volume2, 
  VolumeX, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Tv, 
  Maximize2,
  Sparkles,
  ArrowUpDown,
  LayoutGrid
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface MultiChannelGridProps {
  channels: Channel[];
  globalVolume: number;
  onSelectChannelFullScreen: (channel: Channel) => void;
  onClose: () => void;
  mode?: 'epg6' | 'tv9' | string;
  onSwitchMode?: (mode: any) => void;
}

// Individual Channel Tile
const TilePlayer = React.memo<{
  channel: Channel;
  hasAudio: boolean;
  isFocused: boolean;
  audioCountdown: number;
  volume: number;
  isMuted: boolean;
  onSingleClick: () => void;
  onFocusTile: () => void;
  onDirectAudioSwitch: () => void;
}>(({
  channel,
  hasAudio,
  isFocused,
  audioCountdown,
  volume,
  isMuted,
  onSingleClick,
  onFocusTile,
  onDirectAudioSwitch,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hasError, setHasError] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    setHasError(false);
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.muted = !hasAudio || isMuted;
    video.volume = hasAudio && !isMuted ? Math.min(1, Math.max(0, volume / 100)) : 0;

    const streamUrl = channel.streamUrl;

    if (Hls.isSupported() && (streamUrl.includes('.m3u8') || streamUrl.includes('/hls/'))) {
      const hls = new Hls({
        enableWorker: true,
        autoStartLoad: true,
        lowLatencyMode: false,
        backBufferLength: 2,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        maxBufferSize: 10 * 1000 * 1000,
        startLevel: 0,
        progressive: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setHasError(true);
            hls.destroy();
            hlsRef.current = null;
          }
        }
      });
    } else {
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, channel.streamUrl, hasAudio, isMuted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !hasAudio || isMuted;
      videoRef.current.volume = hasAudio && !isMuted ? Math.min(1, Math.max(0, volume / 100)) : 0;
      if (hasAudio && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [hasAudio, isMuted, volume]);

  return (
    <div
      id={`multi-channel-tile-${channel.number}`}
      onPointerDown={(e) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        onFocusTile();
      }}
      onPointerUp={(e) => {
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        if (dx < 15 && dy < 15) {
          sfx.playChannelSwitch();
          onSingleClick();
        }
      }}
      onMouseEnter={onFocusTile}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      className={`relative w-full h-full bg-black rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between ${
        isFocused
          ? 'border-cyan-400 ring-4 ring-cyan-400/50 shadow-2xl shadow-cyan-500/40 scale-[1.015] z-20'
          : hasAudio
          ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20'
          : 'border-white/15 hover:border-white/40'
      }`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-fill bg-neutral-950 pointer-events-none"
        playsInline
        autoPlay
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
      />

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 p-3 text-center pointer-events-none">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-12 h-12 object-contain mb-2 rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv className="w-10 h-10 text-neutral-500 mb-2" />
          )}
          <span className="text-xs font-bold text-white truncate max-w-full">{channel.name}</span>
          <span className="text-[10px] text-amber-400/90 mt-1">Connecting Live...</span>
        </div>
      )}

      {/* Audio countdown banner (3s countdown) */}
      {isFocused && !hasAudio && audioCountdown > 0 && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-bold text-[10px] shadow-lg backdrop-blur-md animate-pulse pointer-events-none">
          <Volume2 className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>Audio in {audioCountdown}s</span>
        </div>
      )}

      {/* Top Tile Bar */}
      <div className="relative z-20 flex items-center justify-between p-1.5 sm:p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-1.5 py-0.5 rounded font-black font-mono text-[10px] sm:text-xs shrink-0 shadow-sm ${
              isFocused
                ? 'bg-cyan-400 text-neutral-950'
                : 'bg-neutral-800 text-cyan-300 border border-neutral-700'
            }`}
          >
            {channel.number}
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-white truncate drop-shadow-md">
            {channel.name}
          </span>
        </div>

        {hasAudio ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[9px] sm:text-[10px] shadow-md animate-pulse shrink-0">
            <Volume2 className="w-3 h-3 fill-neutral-950" />
            <span className="hidden sm:inline">LIVE AUDIO</span>
          </div>
        ) : isFocused ? null : (
          <div className="p-1 rounded-full bg-black/50 text-neutral-400 backdrop-blur-sm shrink-0">
            <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
        )}
      </div>

      {/* Bottom Tile Bar */}
      <div className="relative z-20 flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] sm:text-[10px] text-neutral-300 font-semibold truncate flex items-center gap-1 pointer-events-none">
          <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
          <span>Single Click Fullscreen</span>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sfx.playOk();
            onDirectAudioSwitch();
          }}
          className={`px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-all active:scale-95 ${
            hasAudio
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
          }`}
          title="Play Audio on this channel"
        >
          {hasAudio ? 'Sound Playing' : 'Switch Audio'}
        </button>
      </div>
    </div>
  );
});

TilePlayer.displayName = 'TilePlayer';

export const MultiChannelGrid: React.FC<MultiChannelGridProps> = ({
  channels,
  globalVolume,
  onSelectChannelFullScreen,
  onClose,
}) => {
  const pageSize = 6;
  const rows = 2;
  const totalPages = Math.ceil(channels.length / pageSize);

  const [pageIndex, setPageIndex] = useState<number>(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [audioIndex, setAudioIndex] = useState<number>(0);
  const [audioCountdown, setAudioCountdown] = useState<number>(0);

  const currentChannels = channels.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const nextPage = useCallback(() => {
    sfx.playChannelSwitch();
    setPageIndex((prev) => (prev + 1) % totalPages);
    setFocusedIndex(0);
    setAudioIndex(0);
  }, [totalPages]);

  const prevPage = useCallback(() => {
    sfx.playChannelSwitch();
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
    setFocusedIndex(0);
    setAudioIndex(0);
  }, [totalPages]);

  // Audio countdown logic (3 seconds on focused tile activates audio automatically)
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (focusedIndex === audioIndex) {
      setAudioCountdown(0);
      return;
    }

    setAudioCountdown(3);
    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, Math.ceil((3000 - elapsed) / 1000));
      setAudioCountdown(rem);
    }, 250);

    timerRef.current = setTimeout(() => {
      setAudioIndex(focusedIndex);
      sfx.playOk();
      setAudioCountdown(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [focusedIndex, audioIndex, pageIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playBack();
        onClose();
        return;
      }

      const totalInPage = currentChannels.length;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focusedIndex < 3) {
          prevPage();
        } else {
          sfx.playTick();
          setFocusedIndex((prev) => Math.max(0, prev - 3));
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedIndex + 3 >= totalInPage) {
          nextPage();
        } else {
          sfx.playTick();
          setFocusedIndex((prev) => Math.min(totalInPage - 1, prev + 3));
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sfx.playTick();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalInPage - 1));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        sfx.playTick();
        setFocusedIndex((prev) => (prev < totalInPage - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'PageUp' || e.key === 'ChannelUp') {
        e.preventDefault();
        prevPage();
        return;
      }

      if (e.key === 'PageDown' || e.key === 'ChannelDown') {
        e.preventDefault();
        nextPage();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const active = currentChannels[focusedIndex];
        if (active) {
          sfx.playChannelSwitch();
          onSelectChannelFullScreen(active);
        }
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        sfx.playOk();
        setAudioIndex(focusedIndex);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChannels, focusedIndex, nextPage, prevPage, onClose, onSelectChannelFullScreen]);

  // Touch Swipe for Up/Down batches
  const touchStartYRef = useRef(0);

  return (
    <div
      id="multi-channel-grid-modal"
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          touchStartYRef.current = e.touches[0].clientY;
        }
      }}
      onTouchEnd={(e) => {
        if (e.changedTouches.length > 0) {
          const dy = e.changedTouches[0].clientY - touchStartYRef.current;
          if (dy < -60) nextPage();
          else if (dy > 60) prevPage();
        }
      }}
      className="fixed inset-0 z-50 bg-[#040814] flex flex-col select-none overflow-hidden"
    >
      {/* Header matching original app */}
      <header className="px-3 sm:px-6 py-2.5 bg-gradient-to-r from-[#070e24] via-[#0b1739] to-[#070e24] border-b border-[#1e3a8a]/60 flex items-center justify-between gap-2 shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-black text-xs shadow-md">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>6 CH EPG MODE</span>
          </div>

          <div className="text-[11px] sm:text-xs text-neutral-300 font-semibold flex items-center gap-1.5">
            <span className="text-cyan-400 font-mono font-bold">
              Channels {pageIndex * pageSize + 1} - {Math.min(channels.length, (pageIndex + 1) * pageSize)}
            </span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{channels.length} Total</span>
            <span className="hidden md:inline px-2 py-0.5 rounded bg-white/10 text-[10px] text-neutral-300">
              Page {pageIndex + 1} of {totalPages}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Batch */}
          <button
            type="button"
            id="multi-grid-prev-btn"
            onClick={prevPage}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            title="Up: Previous 6 Channels"
          >
            <ChevronUp className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Up / Prev</span>
          </button>

          {/* Next Batch */}
          <button
            type="button"
            id="multi-grid-next-btn"
            onClick={nextPage}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            title="Down: Next 6 Channels"
          >
            <span className="hidden sm:inline">Down / Next</span>
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Close */}
          <button
            type="button"
            id="multi-grid-close-btn"
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 border border-white/15 text-white transition-all cursor-pointer ml-1"
            title="Close Multi-Grid (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 6-Channel Grid Matrix: 2 Rows x 3 Columns */}
      <div className="flex-1 p-2 sm:p-4 grid grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 gap-2 sm:gap-3.5 overflow-hidden">
        {currentChannels.map((channel, idx) => (
          <TilePlayer
            key={channel.id}
            channel={channel}
            hasAudio={idx === audioIndex}
            isFocused={idx === focusedIndex}
            audioCountdown={idx === focusedIndex ? audioCountdown : 0}
            volume={globalVolume}
            isMuted={false}
            onSingleClick={() => onSelectChannelFullScreen(channel)}
            onFocusTile={() => setFocusedIndex(idx)}
            onDirectAudioSwitch={() => setAudioIndex(idx)}
          />
        ))}
      </div>

      {/* Bottom Hint Banner */}
      <footer className="px-4 py-2 bg-[#060c20]/90 border-t border-[#1e3a8a]/40 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span><b>సూచన:</b> ఏ ఛానెల్ పైనైనా <b>3 సెకన్లు</b> ఉంటే ఆడియో ప్లే అవుతుంది • <b>సింగిల్ క్లిక్</b> తో ఫుల్‌స్క్రీన్</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-cyan-300 font-mono text-[10px]">
          <span>Up / Down: 6 CH బ్యాచ్</span>
          <span>•</span>
          <span>A: ఆడియో</span>
          <span>•</span>
          <span>Enter: ఫుల్‌స్క్రీన్</span>
        </div>
      </footer>
    </div>
  );
};
