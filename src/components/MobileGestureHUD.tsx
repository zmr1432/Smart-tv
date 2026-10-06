import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Tv } from 'lucide-react';
import { Channel } from '../types';
import { sfx } from '../utils/audio';
import { requestMobileLandscapeFullscreen } from '../utils/device';
import { getAppLanguage, onLanguageChange, t, AppLanguage } from '../utils/i18n';

interface MobileGestureHUDProps {
  onChannelNext?: () => void;
  onChannelPrev?: () => void;
  onVolumeChange?: (delta: number) => void;
  onToggleOSD?: () => void;
  volume?: number;
  currentChannel?: Channel;
  isRotatedLandscape?: boolean;
  // Props passed from App.tsx
  visible?: boolean;
  gestureType?: 'channel' | 'volume' | null;
  channelDirection?: 'next' | 'prev' | null;
  channel?: Channel;
  isMuted?: boolean;
}

export const MobileGestureHUD: React.FC<MobileGestureHUDProps> = ({
  onChannelNext,
  onChannelPrev,
  onVolumeChange,
  onToggleOSD,
  volume = 80,
  currentChannel,
  channel,
  isRotatedLandscape = false,
  visible = false,
  gestureType = null,
  channelDirection = null,
  isMuted = false,
}) => {
  const activeChannel = channel || currentChannel;
  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => getAppLanguage());

  useEffect(() => {
    return onLanguageChange((lang) => {
      setCurrentLang(lang);
    });
  }, []);

  // Local HUD state if used in standalone mode
  const [localFeedback, setLocalFeedback] = useState<{
    type: 'volume' | 'channel-up' | 'channel-down';
    value?: number;
    text?: string;
  } | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLocalHud = useCallback((feedback: {
    type: 'volume' | 'channel-up' | 'channel-down';
    value?: number;
    text?: string;
  }) => {
    setLocalFeedback(feedback);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setLocalFeedback(null);
    }, 1200);
  }, []);

  // Determine if gestures should be captured locally (only if external callbacks are provided)
  const isInteractiveMode = Boolean(onChannelNext || onChannelPrev || onVolumeChange || onToggleOSD);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isInteractiveMode) return;
    requestMobileLandscapeFullscreen(
      document.documentElement,
      document.querySelector('video')
    );

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isInteractiveMode || !touchStartRef.current) return;
    requestMobileLandscapeFullscreen(
      document.documentElement,
      document.querySelector('video')
    );

    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    let dx = touch.clientX - start.x;
    let dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;

    if (isRotatedLandscape) {
      const visualDx = dy;
      const visualDy = -dx;
      dx = visualDx;
      dy = visualDy;
    }

    // 1. VERTICAL SWIPE -> CHANGE CHANNELS
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.2 && dt < 800) {
      if (dy < 0) {
        sfx.playChannelSwitch();
        if (typeof onChannelNext === 'function') onChannelNext();
        showLocalHud({ 
          type: 'channel-up', 
          text: t('nextChannel', currentLang) 
        });
      } else {
        sfx.playChannelSwitch();
        if (typeof onChannelPrev === 'function') onChannelPrev();
        showLocalHud({ 
          type: 'channel-down', 
          text: t('prevChannel', currentLang) 
        });
      }
      touchStartRef.current = null;
      return;
    }

    // 2. HORIZONTAL SWIPE -> VOLUME CONTROL
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 800) {
      const step = dx > 0 ? 5 : -5;
      const newVol = Math.max(0, Math.min(100, volume + step));
      sfx.playTick();
      if (typeof onVolumeChange === 'function') onVolumeChange(step);
      showLocalHud({ 
        type: 'volume', 
        value: newVol 
      });
      touchStartRef.current = null;
      return;
    }

    // 3. TAP / DOUBLE TAP
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      const isTopHalf = isRotatedLandscape 
        ? touch.clientX > window.innerWidth / 2 
        : touch.clientY < window.innerHeight / 2;

      if (isTopHalf) {
        sfx.playChannelSwitch();
        if (typeof onChannelNext === 'function') onChannelNext();
        showLocalHud({ type: 'channel-up', text: t('nextChannel', currentLang) });
      } else {
        sfx.playChannelSwitch();
        if (typeof onChannelPrev === 'function') onChannelPrev();
        showLocalHud({ type: 'channel-down', text: t('prevChannel', currentLang) });
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 280 && lastTapRef.current !== 0) {
          if (typeof onToggleOSD === 'function') {
            onToggleOSD();
          }
        }
      }, 290);
    }

    touchStartRef.current = null;
  };

  // Determine what HUD UI to show:
  // Either from controlled props (App.tsx) or local feedback state
  const isDisplaying = visible || Boolean(localFeedback);
  const displayType = visible ? gestureType : localFeedback?.type;
  const isChannelUp = (visible && channelDirection === 'next') || localFeedback?.type === 'channel-up';
  const isChannelDown = (visible && channelDirection === 'prev') || localFeedback?.type === 'channel-down';

  return (
    <>
      {/* Gesture Capture Transparent Layer (ONLY active if standalone callback handlers exist) */}
      {isInteractiveMode && (
        <div
          className="fixed inset-0 z-20 touch-none pointer-events-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Visual Feedback Gesture HUD Overlay */}
      {isDisplaying && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-in zoom-in-90 duration-150">
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 px-8 py-5 rounded-3xl shadow-2xl flex flex-col items-center gap-3">
            {/* Volume HUD */}
            {(displayType === 'volume' || (!displayType && !isChannelUp && !isChannelDown)) && (
              <>
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-9 h-9 text-red-400" />
                  ) : (
                    <Volume2 className="w-9 h-9" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                  <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isMuted ? t('muted', currentLang) : t('volume', currentLang)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                <div className="w-40 h-3 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-150"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
                <span className="text-xl font-black font-mono text-white tracking-wider">
                  {isMuted ? '0%' : `${volume}%`}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {t('volHint', currentLang)}
                </span>
              </>
            )}

            {/* Channel Next HUD (Swipe Up) */}
            {isChannelUp && (
              <>
                <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 animate-bounce">
                  <ChevronUp className="w-10 h-10" />
                </div>
                <span className="text-sm font-extrabold text-cyan-300">
                  {t('nextChannel', currentLang)}
                </span>
                {activeChannel && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs">
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CH {activeChannel.number}: {activeChannel.name}</span>
                  </div>
                )}
                <span className="text-[10px] text-neutral-400">
                  {t('swipeUpNext', currentLang)}
                </span>
              </>
            )}

            {/* Channel Prev HUD (Swipe Down) */}
            {isChannelDown && (
              <>
                <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 animate-bounce">
                  <ChevronDown className="w-10 h-10" />
                </div>
                <span className="text-sm font-extrabold text-cyan-300">
                  {t('prevChannel', currentLang)}
                </span>
                {activeChannel && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs">
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CH {activeChannel.number}: {activeChannel.name}</span>
                  </div>
                )}
                <span className="text-[10px] text-neutral-400">
                  {t('swipeDownPrev', currentLang)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
