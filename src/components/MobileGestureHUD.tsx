import React from 'react';
import { Channel } from '../types';
import { Volume2, VolumeX, ChevronUp, ChevronDown, Tv } from 'lucide-react';

interface MobileGestureHUDProps {
  visible: boolean;
  gestureType: 'channel' | 'volume' | null;
  channelDirection: 'next' | 'prev' | null;
  channel: Channel;
  volume: number;
  isMuted: boolean;
}

export const MobileGestureHUD: React.FC<MobileGestureHUDProps> = ({
  visible,
  gestureType,
  channelDirection,
  channel,
  volume,
  isMuted,
}) => {
  if (!visible || !gestureType) return null;

  return (
    <div
      id="mobile-gesture-feedback-hud"
      className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center p-4 transition-opacity duration-200"
    >
      {gestureType === 'channel' && (
        <div className="flex flex-col items-center px-7 py-5 rounded-3xl bg-neutral-950/90 border-2 border-amber-400/80 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            {channelDirection === 'next' ? (
              <>
                <ChevronUp className="w-5 h-5 animate-bounce" />
                <span>తర్వాతి ఛానల్ (Next Channel)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5 animate-bounce" />
                <span>మునుపటి ఛానల్ (Previous Channel)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-neutral-950 font-black text-xl shadow-lg">
              {channel.number}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black text-white leading-tight">
                {channel.name}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {channel.currentProgram.title}
              </span>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-amber-300/80 font-medium tracking-wide">
            ▲ పైకి / ▼ క్రిందికి స్వైప్ చేసి ఛానల్ మార్చండి
          </div>
        </div>
      )}

      {gestureType === 'volume' && (
        <div className="flex flex-col items-center px-8 py-5 rounded-3xl bg-neutral-950/90 border-2 border-amber-400/80 text-white shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 min-w-[240px]">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-7 h-7 text-rose-400" />
            ) : (
              <Volume2 className="w-7 h-7 text-amber-400" />
            )}
            <span className="text-xl font-black font-mono">
              {isMuted ? 'MUTE' : `${volume}%`}
            </span>
          </div>

          {/* Volume Bar */}
          <div className="w-48 h-2.5 bg-neutral-800 rounded-full overflow-hidden mb-3 border border-white/10">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-100"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full text-[10px] text-neutral-400 font-bold px-1">
            <span>◄ లెఫ్ట్: డౌన్ (-)</span>
            <span>రైట్: అప్ (+) ►</span>
          </div>
        </div>
      )}
    </div>
  );
};
