import React from 'react';
import { 
  Power, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  RotateCcw, Home, Menu, Maximize, Minimize,
  HelpCircle, X, Heart, KeyRound
} from 'lucide-react';
import { sfx } from '../utils/audio';

interface VirtualRemoteProps {
  isOpen: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isFavorite?: boolean;
  onClose: () => void;
  onDpadUp: () => void;
  onDpadDown: () => void;
  onDpadLeft: () => void;
  onDpadRight: () => void;
  onOkPress: () => void;
  onBackPress: () => void;
  onMenuPress: () => void;
  onToggleFavorite?: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onVolumeChange: (delta: number) => void;
  onChannelStep: (delta: number) => void;
  onNumberPress: (digit: string) => void;
  onOpenHelp: () => void;
  onOpenActivation?: () => void;
}

export const VirtualRemote: React.FC<VirtualRemoteProps> = ({
  isOpen,
  isMuted,
  isFullscreen,
  isFavorite = false,
  onClose,
  onDpadUp,
  onDpadDown,
  onDpadLeft,
  onDpadRight,
  onOkPress,
  onBackPress,
  onMenuPress,
  onToggleFavorite,
  onToggleFullscreen,
  onToggleMute,
  onVolumeChange,
  onChannelStep,
  onNumberPress,
  onOpenHelp,
  onOpenActivation,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="virtual-tv-remote-widget"
      className="fixed bottom-6 right-6 z-50 w-72 sm:w-80 rounded-[36px] bg-neutral-900/95 border-2 border-neutral-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white p-5 flex flex-col gap-4 select-none animate-in slide-in-from-bottom-8 duration-300"
    >
      {/* Remote Top Crown & Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Infrared / Power LED */}
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-neutral-300 uppercase">
            TV REMOTE CONTROL
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenActivation && (
            <button
              id="remote-activation-btn"
              onClick={onOpenActivation}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors"
              title="Device Activation / లైసెన్స్"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}
          <button
            id="remote-help-btn"
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors"
            title="Keyboard Shortcuts Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            id="close-virtual-remote-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Close Remote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Power, Mute & Fullscreen Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          id="remote-power-btn"
          onClick={() => {
            sfx.playBack();
            onMenuPress();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-400 transition-all active:scale-95 cursor-pointer"
          title="TV Menu / Power"
        >
          <Power className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">POWER</span>
        </button>

        <button
          id="remote-mute-btn"
          onClick={() => {
            sfx.playTick();
            onToggleMute();
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
            isMuted 
              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
              : 'bg-neutral-800/80 hover:bg-neutral-750 border-neutral-700 text-neutral-300'
          }`}
          title="Mute / Unmute"
        >
          {isMuted ? <VolumeX className="w-4 h-4 mb-0.5" /> : <Volume2 className="w-4 h-4 mb-0.5" />}
          <span className="text-[9px] font-bold">{isMuted ? 'UNMUTE' : 'MUTE'}</span>
        </button>

        <button
          id="remote-fullscreen-btn"
          onClick={() => {
            sfx.playTick();
            onToggleFullscreen();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 transition-all active:scale-95 cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 mb-0.5" /> : <Maximize className="w-4 h-4 mb-0.5" />}
          <span className="text-[9px] font-bold">FULLSCREEN</span>
        </button>
      </div>

      {/* D-PAD DIRECTIONAL WHEEL WITH CENTRAL 'OK' BUTTON */}
      <div className="flex flex-col items-center justify-center my-1">
        <div className="relative w-48 h-48 rounded-full bg-linear-to-b from-neutral-800 to-neutral-850 border border-neutral-700 shadow-inner flex items-center justify-center p-2">
          
          {/* UP ARROW BUTTON */}
          <button
            id="remote-dpad-up"
            onClick={() => {
              sfx.playTick();
              onDpadUp();
            }}
            className="absolute top-2 w-14 h-11 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-t-full transition-colors active:scale-90 cursor-pointer"
            title="Up / Previous Channel"
          >
            <ChevronUp className="w-7 h-7" />
          </button>

          {/* DOWN ARROW BUTTON */}
          <button
            id="remote-dpad-down"
            onClick={() => {
              sfx.playTick();
              onDpadDown();
            }}
            className="absolute bottom-2 w-14 h-11 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-b-full transition-colors active:scale-90 cursor-pointer"
            title="Down / Next Channel"
          >
            <ChevronDown className="w-7 h-7" />
          </button>

          {/* LEFT ARROW BUTTON */}
          <button
            id="remote-dpad-left"
            onClick={() => {
              sfx.playTick();
              onDpadLeft();
            }}
            className="absolute left-2 w-11 h-14 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-l-full transition-colors active:scale-90 cursor-pointer"
            title="Left / Volume Down"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* RIGHT ARROW BUTTON */}
          <button
            id="remote-dpad-right"
            onClick={() => {
              sfx.playTick();
              onDpadRight();
            }}
            className="absolute right-2 w-11 h-14 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded-r-full transition-colors active:scale-90 cursor-pointer"
            title="Right / Volume Up"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* CENTRAL "OK" BUTTON - OPENS CHANNEL LIST */}
          <button
            id="remote-ok-btn"
            onClick={() => {
              sfx.playOk();
              onOkPress();
            }}
            className="relative z-10 w-20 h-20 rounded-full bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 transition-all active:scale-90 cursor-pointer border-2 border-amber-200"
            title="Open Channel List / Select (OK)"
          >
            <span className="text-xl font-black tracking-tight leading-none">OK</span>
            <span className="text-[9px] font-bold tracking-tighter opacity-90 mt-0.5">LIST</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons Row: Back, Fav, Home, Menu */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          id="remote-back-btn"
          onClick={() => {
            sfx.playBack();
            onBackPress();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 transition-all active:scale-95 cursor-pointer"
          title="Back / Exit (Esc)"
        >
          <RotateCcw className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">BACK</span>
        </button>

        <button
          id="remote-fav-btn"
          onClick={() => {
            if (onToggleFavorite) onToggleFavorite();
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
            isFavorite
              ? 'bg-rose-500/25 border-rose-400 text-rose-300'
              : 'bg-neutral-800/80 hover:bg-neutral-750 border-neutral-700 text-neutral-300'
          }`}
          title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={`w-4 h-4 mb-0.5 ${isFavorite ? 'fill-rose-500 text-rose-400' : ''}`} />
          <span className="text-[9px] font-bold">FAV</span>
        </button>

        <button
          id="remote-home-btn"
          onClick={() => {
            sfx.playTick();
            onBackPress();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 transition-all active:scale-95 cursor-pointer"
          title="Home"
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">HOME</span>
        </button>

        <button
          id="remote-menu-btn"
          onClick={() => {
            sfx.playOk();
            onMenuPress();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 transition-all active:scale-95 cursor-pointer"
          title="Channel List"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">LIST</span>
        </button>
      </div>

      {/* Rocker Switches: Volume & Channel Surfing */}
      <div className="grid grid-cols-2 gap-3">
        {/* Volume Rocker */}
        <div className="flex flex-col items-center bg-neutral-800/60 rounded-2xl p-1.5 border border-neutral-700">
          <span className="text-[9px] font-bold text-neutral-400 mb-1">VOL</span>
          <div className="flex w-full gap-1">
            <button
              id="remote-vol-down"
              onClick={() => {
                sfx.playTick();
                onVolumeChange(-5);
              }}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold active:scale-95 transition-all text-center"
            >
              -
            </button>
            <button
              id="remote-vol-up"
              onClick={() => {
                sfx.playTick();
                onVolumeChange(5);
              }}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold active:scale-95 transition-all text-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Channel Rocker */}
        <div className="flex flex-col items-center bg-neutral-800/60 rounded-2xl p-1.5 border border-neutral-700">
          <span className="text-[9px] font-bold text-neutral-400 mb-1">CH</span>
          <div className="flex w-full gap-1">
            <button
              id="remote-ch-prev"
              onClick={() => {
                sfx.playChannelSwitch();
                onChannelStep(-1);
              }}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold active:scale-95 transition-all text-center"
              title="Previous Channel"
            >
              ▼
            </button>
            <button
              id="remote-ch-next"
              onClick={() => {
                sfx.playChannelSwitch();
                onChannelStep(1);
              }}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold active:scale-95 transition-all text-center"
              title="Next Channel"
            >
              ▲
            </button>
          </div>
        </div>
      </div>

      {/* Direct Channel Selection Number Pad */}
      <div className="border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Channel Numbers (123)
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            Direct Tune
          </span>
        </div>

        <div 
          id="remote-numpad-grid"
          className="grid grid-cols-3 gap-1.5"
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`num-key-${digit}`}
              onClick={() => {
                sfx.playTick();
                onNumberPress(digit);
              }}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-base font-mono font-bold text-neutral-200 active:scale-95 transition-all text-center cursor-pointer border border-white/5"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            id="num-key-0"
            onClick={() => {
              sfx.playTick();
              onNumberPress('0');
            }}
            className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-base font-mono font-bold text-neutral-200 active:scale-95 transition-all text-center cursor-pointer border border-white/5"
          >
            0
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};
