import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel } from './types';
import { CHANNELS, CATEGORIES } from './data/channels';
import { VideoPlayer } from './components/VideoPlayer';
import { OSDOverlay } from './components/OSDOverlay';
import { CategoryMenu } from './components/CategoryMenu';
import { VirtualRemote } from './components/VirtualRemote';
import { HelpModal } from './components/HelpModal';
import { CornerLogo } from './components/CornerLogo';
import { sfx } from './utils/audio';
import { Smartphone, RotateCw } from 'lucide-react';
import { isMobileDevice, isSmartTVDevice, requestMobileLandscapeFullscreen } from './utils/device';
import { MobileGestureHUD } from './components/MobileGestureHUD';
import { MobileHeaderBar } from './components/MobileHeaderBar';
import { ActivationScreen } from './components/ActivationScreen';
import { ApkModal } from './components/ApkModal';
import { getActivationData, deactivateApp, ActivationData } from './utils/activation';

export default function App() {
  // Current playing channel
  const [currentChannel, setCurrentChannel] = useState<Channel>(CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [showVolumeBar, setShowVolumeBar] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Recently watched channels (tracks last 5 channels for quick access)
  const [recentlyWatched, setRecentlyWatched] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_recently_watched');
      if (saved) {
        const parsedIds: string[] = JSON.parse(saved);
        const matched = parsedIds
          .map(id => CHANNELS.find(c => c.id === id))
          .filter((c): c is Channel => Boolean(c));
        if (matched.length > 0) return matched.slice(0, 5);
      }
    } catch (e) {
      console.error('Failed to load recently watched', e);
    }
    return [CHANNELS[0]];
  });

  // Favorites system (persisted in localStorage)
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_favorites');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(id => CHANNELS.some(c => c.id === id));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
    // Default initial favorites
    return ['etv-telugu', 'maa-tv'];
  });

  // Derived list of favorite Channel objects
  const favoriteChannels = favoriteChannelIds
    .map(id => CHANNELS.find(c => c.id === id))
    .filter((c): c is Channel => Boolean(c));

  // Check if channel is favorite
  const isFavorite = useCallback((channelId: string) => {
    return favoriteChannelIds.includes(channelId);
  }, [favoriteChannelIds]);

  // Toggle favorite channel
  const toggleFavorite = useCallback((channelId: string) => {
    setFavoriteChannelIds(prev => {
      const exists = prev.includes(channelId);
      let next: string[];
      if (exists) {
        next = prev.filter(id => id !== channelId);
        sfx.playBack();
      } else {
        next = [...prev, channelId];
        sfx.playFav();
      }
      try {
        localStorage.setItem('smart_tv_favorites', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }
      return next;
    });
  }, []);

  // Channel List Menu State (Requested: opens on OK button)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Activation State (Required to unlock and open the TV app)
  const [activationData, setActivationData] = useState<ActivationData | null>(() => getActivationData());

  // OSD and Remote UI State
  const [isOSDVisible, setIsOSDVisible] = useState<boolean>(true);
  const [isRemoteOpen, setIsRemoteOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [numberInputBuffer, setNumberInputBuffer] = useState<string>('');

  // Mobile landscape & device state (TV version remains normal)
  const [isMobile, setIsMobile] = useState<boolean>(() => isMobileDevice());
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });
  const [forceMobileLandscape, setForceMobileLandscape] = useState<boolean>(false);

  // Sync mobile screen size and orientation
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // On Mobile: Automatically trigger landscape fullscreen when video player opens or is tapped
  useEffect(() => {
    if (!isMobileDevice()) return;

    const triggerMobileLandscape = () => {
      requestMobileLandscapeFullscreen(appContainerRef.current);
    };

    // Attempt immediately when player loads
    triggerMobileLandscape();

    // Auto-trigger on mobile touch/click gestures (browser permission requirement)
    const handleMobileGesture = () => {
      triggerMobileLandscape();
    };

    window.addEventListener('touchstart', handleMobileGesture, { passive: true });
    window.addEventListener('click', handleMobileGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleMobileGesture);
      window.removeEventListener('click', handleMobileGesture);
    };
  }, []);

  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const numberTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Show OSD temporarily
  const triggerOSD = useCallback((durationMs = 4000) => {
    setIsOSDVisible(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setIsOSDVisible(false);
    }, durationMs);
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (appContainerRef.current?.requestFullscreen) {
        appContainerRef.current.requestFullscreen().catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Open Channel List Menu (Opens when OK button or Enter is pressed)
  const openCategoryMenu = useCallback(() => {
    sfx.playOk();
    setIsMenuOpen(true);
    const currIdx = CHANNELS.findIndex(c => c.id === currentChannel.id);
    setFocusedIndex(currIdx >= 0 ? currIdx : 0);
  }, [currentChannel.id]);

  // Close Category Menu
  const closeCategoryMenu = useCallback(() => {
    setIsMenuOpen(false);
    triggerOSD();
  }, [triggerOSD]);

  // Change Channel
  const changeChannel = useCallback((newChannel: Channel) => {
    setCurrentChannel(newChannel);
    if (isMobileDevice()) {
      requestMobileLandscapeFullscreen(appContainerRef.current);
    }
    setRecentlyWatched(prev => {
      const filtered = prev.filter(c => c.id !== newChannel.id);
      const updated = [newChannel, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('smart_tv_recently_watched', JSON.stringify(updated.map(c => c.id)));
      } catch (e) {
        console.error('Failed to save recently watched', e);
      }
      return updated;
    });
    triggerOSD(5000);
  }, [triggerOSD]);

  // Clear Recently Watched list
  const clearRecentlyWatched = useCallback(() => {
    setRecentlyWatched([]);
    try {
      localStorage.removeItem('smart_tv_recently_watched');
    } catch (e) {}
  }, []);

  // Surf Channel Up / Down
  const stepChannel = useCallback((direction: number) => {
    const currentIndex = CHANNELS.findIndex(c => c.id === currentChannel.id);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = CHANNELS.length - 1;
    if (nextIndex >= CHANNELS.length) nextIndex = 0;
    
    changeChannel(CHANNELS[nextIndex]);
  }, [currentChannel.id, changeChannel]);

  // Adjust Volume
  const adjustVolume = useCallback((delta: number) => {
    setVolume(prev => {
      const next = Math.min(100, Math.max(0, prev + delta));
      return next;
    });
    setIsMuted(false);
    setShowVolumeBar(true);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = setTimeout(() => {
      setShowVolumeBar(false);
    }, 2500);
    triggerOSD(3000);
  }, [triggerOSD]);

  // Mobile Touch Gesture State & HUD Feedback
  const [gestureFeedback, setGestureFeedback] = useState<{
    visible: boolean;
    type: 'channel' | 'volume' | null;
    direction: 'next' | 'prev' | null;
  }>({
    visible: false,
    type: null,
    direction: null,
  });
  const gestureTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showGestureIndicator = useCallback((type: 'channel' | 'volume', direction: 'next' | 'prev' | null) => {
    setGestureFeedback({
      visible: true,
      type,
      direction,
    });
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = setTimeout(() => {
      setGestureFeedback(prev => ({ ...prev, visible: false }));
    }, 1200);
  }, []);

  // Gesture tracking refs (Up/Down: Channel Change, Right/Left: Volume Up/Down)
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureLastRef = useRef<{ x: number; y: number } | null>(null);
  const gestureLockedRef = useRef<'channel' | 'volume' | null>(null);
  const gestureSwitchedChannelRef = useRef<boolean>(false);
  const gestureAccumulatedVolRef = useRef<number>(0);

  const handleGestureStart = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    if (isMenuOpen || isHelpOpen || isRemoteOpen) return;
    if (target.closest('button, input, select, textarea, [role="button"], #mobile-landscape-toggle-btn')) return;

    gestureStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    gestureLastRef.current = { x: clientX, y: clientY };
    gestureLockedRef.current = null;
    gestureSwitchedChannelRef.current = false;
    gestureAccumulatedVolRef.current = 0;
  }, [isMenuOpen, isHelpOpen, isRemoteOpen]);

  const handleGestureMove = useCallback((clientX: number, clientY: number) => {
    if (!gestureStartRef.current) return;

    const rawDx = clientX - gestureStartRef.current.x;
    const rawDy = clientY - gestureStartRef.current.y;

    let dx = rawDx;
    let dy = rawDy;
    if (isMobile && forceMobileLandscape && isPortrait) {
      dx = rawDy;
      dy = -rawDx;
    }

    // Lock gesture direction once movement threshold is met
    if (!gestureLockedRef.current) {
      const dist = Math.hypot(dx, dy);
      if (dist > 15) {
        if (Math.abs(dy) > Math.abs(dx)) {
          gestureLockedRef.current = 'channel';
        } else {
          gestureLockedRef.current = 'volume';
        }
      }
    }

    if (gestureLockedRef.current === 'channel') {
      // Screen Up / Down: Channel Change
      // dy < -35: Swiped Up -> Next Channel
      // dy > 35: Swiped Down -> Previous Channel
      if (dy < -35 && !gestureSwitchedChannelRef.current) {
        gestureSwitchedChannelRef.current = true;
        sfx.playChannelSwitch();
        stepChannel(1);
        showGestureIndicator('channel', 'next');
      } else if (dy > 35 && !gestureSwitchedChannelRef.current) {
        gestureSwitchedChannelRef.current = true;
        sfx.playChannelSwitch();
        stepChannel(-1);
        showGestureIndicator('channel', 'prev');
      }
    } else if (gestureLockedRef.current === 'volume') {
      // Screen Right / Left: Volume Up / Down
      const last = gestureLastRef.current || gestureStartRef.current;
      let stepDx = clientX - last.x;
      if (isMobile && forceMobileLandscape && isPortrait) {
        stepDx = clientY - last.y;
      }
      gestureAccumulatedVolRef.current += stepDx;

      if (gestureAccumulatedVolRef.current >= 16) {
        // Dragging towards RIGHT SIDE -> Volume Up!
        const steps = Math.floor(gestureAccumulatedVolRef.current / 16);
        gestureAccumulatedVolRef.current -= steps * 16;
        sfx.playTick();
        adjustVolume(steps * 4);
        showGestureIndicator('volume', null);
      } else if (gestureAccumulatedVolRef.current <= -16) {
        // Dragging towards LEFT SIDE -> Volume Down!
        const steps = Math.floor(Math.abs(gestureAccumulatedVolRef.current) / 16);
        gestureAccumulatedVolRef.current += steps * 16;
        sfx.playTick();
        adjustVolume(-steps * 4);
        showGestureIndicator('volume', null);
      }
      gestureLastRef.current = { x: clientX, y: clientY };
    }
  }, [isMobile, forceMobileLandscape, isPortrait, stepChannel, adjustVolume, showGestureIndicator]);

  const handleGestureEnd = useCallback((clientX: number, clientY: number) => {
    if (gestureStartRef.current) {
      const rawDx = clientX - gestureStartRef.current.x;
      const rawDy = clientY - gestureStartRef.current.y;
      const duration = Date.now() - gestureStartRef.current.time;
      const dist = Math.hypot(rawDx, rawDy);

      // Fast flick fallback if user flicked quickly
      if (!gestureSwitchedChannelRef.current && dist > 30 && duration < 320) {
        let dx = rawDx;
        let dy = rawDy;
        if (isMobile && forceMobileLandscape && isPortrait) {
          dx = rawDy;
          dy = -rawDx;
        }

        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical swipe
          if (dy < 0) {
            sfx.playChannelSwitch();
            stepChannel(1);
            showGestureIndicator('channel', 'next');
          } else {
            sfx.playChannelSwitch();
            stepChannel(-1);
            showGestureIndicator('channel', 'prev');
          }
        } else {
          // Horizontal swipe
          if (dx > 0) {
            sfx.playTick();
            adjustVolume(5);
            showGestureIndicator('volume', null);
          } else {
            sfx.playTick();
            adjustVolume(-5);
            showGestureIndicator('volume', null);
          }
        }
      } else if (dist < 12 && duration < 350) {
        // Gentle tap on video toggles OSD
        triggerOSD();
        if (isMobileDevice()) {
          requestMobileLandscapeFullscreen(appContainerRef.current);
        }
      }
    }

    gestureStartRef.current = null;
    gestureLastRef.current = null;
    gestureLockedRef.current = null;
    gestureSwitchedChannelRef.current = false;
  }, [isMobile, forceMobileLandscape, isPortrait, stepChannel, adjustVolume, showGestureIndicator, triggerOSD]);

  // Number input handling for direct channel tuning
  const handleDigitInput = useCallback((digit: string) => {
    setNumberInputBuffer(prev => {
      const updated = (prev + digit).slice(0, 3);
      if (numberTimerRef.current) clearTimeout(numberTimerRef.current);
      
      numberTimerRef.current = setTimeout(() => {
        const parsed = parseInt(updated, 10);
        const match = CHANNELS.find(ch => ch.number === parsed);
        if (match) {
          sfx.playChannelSwitch();
          changeChannel(match);
        }
        setNumberInputBuffer('');
      }, 1200);

      return updated;
    });
  }, [changeChannel]);

  // Global Remote Control / Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If app is not activated, let ActivationScreen handle keyboard input
      if (!activationData || !activationData.isActivated) {
        return;
      }

      // Prevent standard browser scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // If Help Modal is open
      if (isHelpOpen) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          setIsHelpOpen(false);
        }
        return;
      }

      // 1. If Channel List Menu is OPEN:
      if (isMenuOpen) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          sfx.playBack();
          closeCategoryMenu();
          return;
        }

        // Blue Key (B): Toggle Favorite on highlighted channel
        if (e.key === 'b' || e.key === 'B') {
          const ch = CHANNELS[focusedIndex];
          if (ch) toggleFavorite(ch.id);
          return;
        }

        // ArrowLeft or PageUp: Quick jump up 5 channels
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          sfx.playTick();
          setFocusedIndex(prev => Math.max(0, prev - 5));
          return;
        }

        // ArrowRight or PageDown: Quick jump down 5 channels
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          sfx.playTick();
          setFocusedIndex(prev => Math.min(CHANNELS.length - 1, prev + 5));
          return;
        }

        // Up: Previous channel in list
        if (e.key === 'ArrowUp') {
          sfx.playTick();
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : CHANNELS.length - 1));
          return;
        }

        // Down: Next channel in list
        if (e.key === 'ArrowDown') {
          sfx.playTick();
          setFocusedIndex(prev => (prev < CHANNELS.length - 1 ? prev + 1 : 0));
          return;
        }

        // "OK" button (Enter or Space) while in menu: Tune to highlighted channel
        if (e.key === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
          const selectedChannel = CHANNELS[focusedIndex];
          if (selectedChannel) {
            sfx.playChannelSwitch();
            changeChannel(selectedChannel);
            closeCategoryMenu();
          }
          return;
        }

        return;
      }

      // 2. If Category Menu is CLOSED (Watching TV Video):
      
      // Pressing OK / Enter opens the Channel Category Menu!
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        openCategoryMenu();
        return;
      }

      // Favorite toggle hotkey when watching TV: B key
      if (e.key === 'b' || e.key === 'B') {
        toggleFavorite(currentChannel.id);
        triggerOSD();
        return;
      }

      // Space toggles Play/Pause or Opens Menu
      if (e.key === ' ' || e.code === 'Space') {
        sfx.playTick();
        setIsPlaying(prev => !prev);
        triggerOSD();
        return;
      }

      // Remote D-Pad Up / Down: Channel Surfing
      if (e.key === 'ArrowUp') {
        sfx.playChannelSwitch();
        stepChannel(-1);
        return;
      }

      if (e.key === 'ArrowDown') {
        sfx.playChannelSwitch();
        stepChannel(1);
        return;
      }

      // Remote D-Pad Left / Right: Volume Control
      if (e.key === 'ArrowLeft') {
        sfx.playTick();
        adjustVolume(-5);
        return;
      }

      if (e.key === 'ArrowRight') {
        sfx.playTick();
        adjustVolume(5);
        return;
      }

      // Fullscreen Toggle: F
      if (e.key === 'f' || e.key === 'F') {
        sfx.playTick();
        toggleFullscreen();
        return;
      }

      // Mute Toggle: M
      if (e.key === 'm' || e.key === 'M') {
        sfx.playTick();
        setIsMuted(prev => !prev);
        setShowVolumeBar(true);
        if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
        volumeTimerRef.current = setTimeout(() => setShowVolumeBar(false), 2000);
        triggerOSD();
        return;
      }

      // Remote Toggle: R
      if (e.key === 'r' || e.key === 'R') {
        setIsRemoteOpen(prev => !prev);
        return;
      }

      // Help Modal: H or ?
      if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        setIsHelpOpen(prev => !prev);
        return;
      }

      // Number keys for direct channel dialing
      if (/^[0-9]$/.test(e.key)) {
        sfx.playTick();
        handleDigitInput(e.key);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMenuOpen,
    isHelpOpen,
    focusedIndex,
    openCategoryMenu,
    closeCategoryMenu,
    changeChannel,
    stepChannel,
    adjustVolume,
    toggleFullscreen,
    handleDigitInput,
    triggerOSD,
    favoriteChannels,
    recentlyWatched,
    toggleFavorite,
    currentChannel.id
  ]);

  // Initial OSD display on mount
  useEffect(() => {
    triggerOSD(6000);
  }, [triggerOSD]);

  const activeCategory = CATEGORIES.find(c => c.id === currentChannel.categoryId) || CATEGORIES[0];

  // Mobile forced landscape styles if user is holding phone in portrait
  const mobileLandscapeStyles: React.CSSProperties = (isMobile && forceMobileLandscape && isPortrait) ? {
    position: 'fixed',
    top: 0,
    left: '100vw',
    width: '100vh',
    height: '100vw',
    transform: 'rotate(90deg)',
    transformOrigin: 'top left',
    zIndex: 50,
  } : {};

  // If app is not yet activated, display the Activation Screen
  if (!activationData || !activationData.isActivated) {
    return (
      <>
        <ActivationScreen
          onActivated={() => {
            const fresh = getActivationData();
            setActivationData(fresh);
            setIsPlaying(true);
            triggerOSD(6000);
          }}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />
        <ApkModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div
      ref={appContainerRef}
      id="smart-tv-app-root"
      style={mobileLandscapeStyles}
      className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none touch-none"
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handleGestureStart(t.clientX, t.clientY, e.target as HTMLElement);
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handleGestureMove(t.clientX, t.clientY);
        }
      }}
      onTouchEnd={(e) => {
        if (e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          handleGestureEnd(t.clientX, t.clientY);
        }
      }}
      onTouchCancel={() => {
        gestureStartRef.current = null;
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        handleGestureStart(e.clientX, e.clientY, e.target as HTMLElement);
      }}
      onMouseMove={(e) => {
        triggerOSD();
        if (e.buttons === 1 && gestureStartRef.current) {
          handleGestureMove(e.clientX, e.clientY);
        }
      }}
      onMouseUp={(e) => {
        if (gestureStartRef.current) {
          handleGestureEnd(e.clientX, e.clientY);
        }
      }}
      onClick={() => triggerOSD()}
    >
      {/* 1. Full Screen Video Player */}
      <VideoPlayer
        channel={currentChannel}
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        onPlayStateChange={setIsPlaying}
        onVideoClick={triggerOSD}
      />

      {/* 2. TV On-Screen Display (OSD) Overlay */}
      <OSDOverlay
        channel={currentChannel}
        category={activeCategory}
        visible={isOSDVisible && !isMenuOpen}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        showVolumeBar={showVolumeBar}
        numberInputBuffer={numberInputBuffer}
        isFavorite={isFavorite(currentChannel.id)}
        onToggleFavorite={() => toggleFavorite(currentChannel.id)}
        onToggleFullscreen={toggleFullscreen}
        onOpenMenu={openCategoryMenu}
        onToggleRemote={() => setIsRemoteOpen(prev => !prev)}
        isRemoteOpen={isRemoteOpen}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* 2.2 Mobile-Only Small Menu Button on Right Side (Never visible in TV version) */}
      {isMobile && !isSmartTVDevice() && (
        <MobileHeaderBar
          isMenuOpen={isMenuOpen}
          onOpenMenu={openCategoryMenu}
        />
      )}

      {/* 2.5 Right-Side Corner Logo (Requested by User) */}
      <CornerLogo
        channelName={currentChannel.name}
        isMenuOpen={isMenuOpen}
      />

      {/* 3. Channel Menu Modal (Opens on OK Button) */}
      <CategoryMenu
        isOpen={isMenuOpen}
        currentChannel={currentChannel}
        channels={CHANNELS}
        favoriteChannelIds={favoriteChannelIds}
        focusedIndex={focusedIndex}
        onSelectChannel={(channel) => {
          changeChannel(channel);
          closeCategoryMenu();
        }}
        onToggleFavorite={toggleFavorite}
        onClose={closeCategoryMenu}
        setFocusedIndex={setFocusedIndex}
      />

      {/* 4. Virtual Smart TV Remote Control Widget */}
      <VirtualRemote
        isOpen={isRemoteOpen}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isFavorite={isFavorite(currentChannel.id)}
        onToggleFavorite={() => toggleFavorite(currentChannel.id)}
        onClose={() => setIsRemoteOpen(false)}
        onDpadUp={() => {
          if (isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
          } else {
            stepChannel(-1);
          }
        }}
        onDpadDown={() => {
          if (isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
          } else {
            stepChannel(1);
          }
        }}
        onDpadLeft={() => {
          if (isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
          } else {
            adjustVolume(-5);
          }
        }}
        onDpadRight={() => {
          if (isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
          } else {
            adjustVolume(5);
          }
        }}
        onOkPress={() => {
          if (!isMenuOpen) {
            openCategoryMenu();
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }}
        onBackPress={() => {
          if (isMenuOpen) {
            closeCategoryMenu();
          } else {
            triggerOSD();
          }
        }}
        onMenuPress={() => {
          if (isMenuOpen) {
            closeCategoryMenu();
          } else {
            openCategoryMenu();
          }
        }}
        onToggleFullscreen={toggleFullscreen}
        onToggleMute={() => {
          setIsMuted(prev => !prev);
          setShowVolumeBar(true);
          setTimeout(() => setShowVolumeBar(false), 2000);
        }}
        onVolumeChange={adjustVolume}
        onChannelStep={stepChannel}
        onNumberPress={handleDigitInput}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 5. Shortcuts Help Modal & License Details */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        deviceId={activationData?.deviceId}
        activationCode={activationData?.code}
        onDeactivate={() => {
          deactivateApp();
          setActivationData(null);
        }}
        onOpenApkModal={() => setIsApkModalOpen(true)}
      />

      {/* 5.5 APK & WebAPK Install / Download Modal */}
      <ApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* 6. Mobile Portrait Landscape Helper (Only for mobile in portrait mode; TV version is untouched) */}
      {isMobile && isPortrait && (
        <div 
          id="mobile-landscape-helper"
          className="fixed bottom-6 right-6 z-40 flex items-center pointer-events-auto"
        >
          <button
            id="mobile-landscape-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              requestMobileLandscapeFullscreen(appContainerRef.current);
              setForceMobileLandscape(prev => !prev);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-2xl transition-all active:scale-95 border border-amber-300/40"
            title="Switch Mobile Landscape Fullscreen"
          >
            <RotateCw className="w-4 h-4" />
            <span>{forceMobileLandscape ? 'నార్మల్' : 'ల్యాండ్‌స్కేప్'}</span>
          </button>
        </div>
      )}
      {/* 7. Mobile Screen Gesture HUD (Up/Down Channel, Right/Left Volume) */}
      <MobileGestureHUD
        visible={gestureFeedback.visible}
        gestureType={gestureFeedback.type}
        channelDirection={gestureFeedback.direction}
        channel={currentChannel}
        volume={volume}
        isMuted={isMuted}
      />
    </div>
  );
}
