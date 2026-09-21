import React, { useState, useEffect } from 'react';
import { Channel, Category } from '../types';
import { Volume2, VolumeX, Clock, Heart, ShieldCheck } from 'lucide-react';

interface OSDOverlayProps {
  channel: Channel;
  category: Category;
  visible: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showVolumeBar: boolean;
  numberInputBuffer: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onToggleFullscreen: () => void;
  onOpenMenu: () => void;
  onToggleRemote: () => void;
  isRemoteOpen: boolean;
  onOpenHelp?: () => void;
}

export const OSDOverlay: React.FC<OSDOverlayProps> = ({
  channel,
  category,
  visible,
  volume,
  isMuted,
  isFullscreen,
  showVolumeBar,
  numberInputBuffer,
  isFavorite,
  onToggleFavorite,
  onToggleFullscreen,
  onOpenMenu,
  onToggleRemote,
  isRemoteOpen,
  onOpenHelp,
}) => {
  // Live local time state (ticks every second for real-time digital clock)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smart_tv_clock_24h') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleClockFormat = () => {
    setIs24Hour(prev => {
      const next = !prev;
      try {
        localStorage.setItem('smart_tv_clock_24h', String(next));
      } catch {}
      return next;
    });
  };

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const displayHours = is24Hour ? hours.toString().padStart(2, '0') : (hours % 12 || 12).toString().padStart(2, '0');
  const ampm = is24Hour ? '24H' : (hours >= 12 ? 'PM' : 'AM');
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div id="tv-osd-overlay" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-none">
        <div />
      </div>

      {/* Direct Channel Number Input Banner (Appears when typing digits) */}
      {numberInputBuffer && (
        <div 
          id="direct-channel-number-hud"
          className="self-center flex flex-col items-center justify-center px-8 py-5 rounded-3xl bg-neutral-900/95 border-2 border-amber-400 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        >
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            Tuning Channel Number
          </span>
          <div className="text-5xl font-black tracking-widest text-white font-mono">
            {numberInputBuffer}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1">Direct number entry...</span>
        </div>
      )}

      {/* Volume HUD Slider (Appears on volume keypress) */}
      {showVolumeBar && (
        <div 
          id="tv-volume-hud-indicator"
          className="self-center flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-neutral-900/95 border border-white/15 text-white shadow-2xl backdrop-blur-md transition-all"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-6 h-6 text-red-400 shrink-0" />
          ) : (
            <Volume2 className="w-6 h-6 text-amber-400 shrink-0" />
          )}
          <div className="flex flex-col gap-1 w-48">
            <div className="flex justify-between text-xs font-semibold text-neutral-300">
              <span>Volume</span>
              <span>{isMuted ? 'MUTE' : `${volume}%`}</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-150"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom TV Channel Information Banner (OSD) */}
      <div 
        id="main-tv-channel-banner"
        className={`w-full max-w-5xl mx-auto rounded-3xl bg-linear-to-t from-black/95 via-neutral-900/90 to-neutral-900/70 border border-white/15 p-5 sm:p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 pointer-events-auto ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Channel Number, Logo & Names */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center px-4 py-2 rounded-2xl bg-amber-500 text-neutral-950 font-black shadow-lg">
              <span className="text-xs uppercase tracking-tighter opacity-80 font-bold">CH</span>
              <span className="text-2xl font-mono leading-none">{channel.number}</span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {channel.logo}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {channel.name}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/10 text-neutral-200 border border-white/10">
                  {category.nameEnglish}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Favorite & Digital Clock */}
          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
            {/* Activation Status Badge */}
            {onOpenHelp && (
              <button
                id="banner-activation-status-badge"
                onClick={onOpenHelp}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer select-none"
                title="App Activated (Click for License & Help)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">యాక్టివేట్ అయింది</span>
              </button>
            )}

            {/* Favorite Toggle Button */}
            <button
              id="banner-toggle-favorite-btn"
              onClick={onToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                isFavorite
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-white/10 hover:bg-white/20 border-white/15 text-neutral-300 hover:text-white'
              }`}
              title={isFavorite ? "Remove from Favorites (Press B)" : "Add to Favorites (Press B)"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            {/* Digital Clock Widget placed in channel banner right side corner */}
            <div 
              id="banner-digital-clock"
              onClick={toggleClockFormat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-amber-400/40 text-white shadow-inner transition-all cursor-pointer select-none"
              title={`${formattedDate} • Current Time (Click to toggle 12H / 24H)`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-sm sm:text-base font-black tracking-wider text-white">
                  {displayHours}
                  <span className="text-amber-400 font-bold mx-0.5 animate-pulse">:</span>
                  {minutes}
                  <span className="text-neutral-500 text-xs font-bold mx-0.5">:</span>
                  <span className="text-xs text-neutral-300 font-bold">{seconds}</span>
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest ml-0.5">
                  {ampm}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Keys Quick Navigation Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-mono font-bold text-[10px] border border-white/10">OK / Enter</kbd>
              <span>Menu</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px] border border-rose-500/30">B / Fav</kbd>
              <span>Favorite</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-[10px] border border-white/10">▲ / ▼</kbd>
              <span>Change Channel</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-[10px] border border-white/10">◄ / ►</kbd>
              <span>Volume / Category</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-[10px] border border-white/10">Esc</kbd>
              <span>Back</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
