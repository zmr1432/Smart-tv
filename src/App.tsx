import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel } from './types';
import { CHANNELS, CATEGORIES } from './data/channels';
import { VideoPlayer } from './components/VideoPlayer';
import { OSDOverlay } from './components/OSDOverlay';
import { CategoryMenu } from './components/CategoryMenu';
import { VirtualRemote } from './components/VirtualRemote';
import { CornerLogo } from './components/CornerLogo';
import { ActivationModal } from './components/ActivationModal';
import { LanguageModal } from './components/LanguageModal';
import { AppInstallAlertModal } from './components/AppInstallAlertModal';
import { getActivationStatus } from './utils/activation';
import { checkIsAppInstalled } from './utils/usePWAInstall';
import { getStoredTeluguChannels, syncTeluguChannelsFromUrl } from './utils/channelSync';
import { installAntiTamperProtection } from './utils/securityGuard';
import { sfx } from './utils/audio';
import { Smartphone, RotateCw } from 'lucide-react';
import { isMobileDevice, isSmartTVDevice, requestMobileLandscapeFullscreen } from './utils/device';
import { MobileGestureHUD } from './components/MobileGestureHUD';
import { MobileHeaderBar } from './components/MobileHeaderBar';
import { MultiChannelGrid } from './components/MultiChannelGrid';

export default function App() {
  // Live Dynamic Channels populated fresh from user Dropbox source
  const [channels, setChannels] = useState<Channel[]>(() => getStoredTeluguChannels());

  // Current playing channel
  const [currentChannel, setCurrentChannel] = useState<Channel>(() => {
    const initialList = getStoredTeluguChannels();
    return initialList[0] || CHANNELS[0];
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [showVolumeBar, setShowVolumeBar] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [multiViewMode, setMultiViewMode] = useState<'none' | 'epg6' | 'tv9'>('none');

  // Live Channel sync status
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Recently watched channels (tracks last 5 channels for quick access)
  const [recentlyWatched, setRecentlyWatched] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_recently_watched');
      const initialList = getStoredTeluguChannels();
      if (saved) {
        const parsedIds: string[] = JSON.parse(saved);
        const matched = parsedIds
          .map(id => initialList.find(c => c.id === id))
          .filter((c): c is Channel => Boolean(c));
        if (matched.length > 0) return matched.slice(0, 5);
      }
      return [initialList[0] || CHANNELS[0]];
    } catch (e) {
      console.error('Failed to load recently watched', e);
      return [CHANNELS[0]];
    }
  });

  // Favorites system (persisted in localStorage)
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_favorites');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
    // Default initial favorites
    return ['telugu-61-tv9-telugu', 'telugu-109-star-maa-hd'];
  });

  // Derived list of favorite Channel objects
  const favoriteChannels = favoriteChannelIds
    .map(id => channels.find(c => c.id === id))
    .filter((c): c is Channel => Boolean(c));

  // Check if channel is favorite
  const isFavorite = useCallback((channelId: string) => {
    return favoriteChannelIds.includes(channelId);
  }, [favoriteChannelIds]);

  // Channel List Menu State (Requested: opens on OK button)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Synchronize channels dynamically and silently in the background
  const handleSyncChannels = useCallback(async (_isInitial = false) => {
    setIsSyncing(true);
    try {
      const res = await syncTeluguChannelsFromUrl();
      if (res.success && res.channels.length > 0) {
        setChannels(res.channels);
        // If current channel was removed or changed, keep a valid current channel
        setCurrentChannel(prev => {
          const match = res.channels.find(c => c.id === prev.id || c.number === prev.number);
          return match || res.channels[0];
        });
      }
    } catch {
      // Silent error handling in background
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // On App Open: Immediately fetch latest channel updates from the Dropbox link
  useEffect(() => {
    handleSyncChannels(true);

    // Listen for custom event updates
    const handleExternalChannels = (e: any) => {
      if (e.detail?.channels) {
        setChannels(e.detail.channels);
      }
    };
    window.addEventListener('channels-updated', handleExternalChannels);

    // Auto-sync in background every 60 seconds
    const interval = setInterval(() => {
      handleSyncChannels(true);
    }, 60000);

    return () => {
      window.removeEventListener('channels-updated', handleExternalChannels);
      clearInterval(interval);
    };
  }, [handleSyncChannels]);

  // Install anti-inspection and anti-tamper shields
  useEffect(() => {
    const uninstall = installAntiTamperProtection();
    return () => {
      uninstall();
    };
  }, []);

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

  // OSD and Remote UI State
  const [isOSDVisible, setIsOSDVisible] = useState<boolean>(true);
  const [isRemoteOpen, setIsRemoteOpen] = useState<boolean>(false);
  const [isActivationOpen, setIsActivationOpen] = useState<boolean>(() => {
    try {
      const status = getActivationStatus();
      return !status.isActivated;
    } catch {
      return false;
    }
  });
  // App install alert before activation (hidden if app is already installed)
  const [showInstallAlert, setShowInstallAlert] = useState<boolean>(() => {
    try {
      return !checkIsAppInstalled() && !getActivationStatus().isActivated;
    } catch {
      return false;
    }
  });
  const [numberInputBuffer, setNumberInputBuffer] = useState<string>('');

  // Mobile landscape & device state (TV version remains normal)
  const [isMobile, setIsMobile] = useState<boolean>(() => isMobileDevice());
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });
  const [forceMobileLandscape, setForceMobileLandscape] = useState<boolean>(false);

  // Live license / trial expiry watcher (checks every 1 second)
  // When 3-minute trial or license finishes, automatically pops up the Activation Menu!
  const prevActivatedRef = useRef<boolean>(false);
  useEffect(() => {
    try {
      prevActivatedRef.current = getActivationStatus().isActivated;
    } catch {}
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      try {
        const curStatus = getActivationStatus();
        if (prevActivatedRef.current && !curStatus.isActivated) {
          // 3-Minute trial or subscription just expired!
          sfx.playError();
          setIsActivationOpen(true);
          setIsMenuOpen(false);
        }
        prevActivatedRef.current = curStatus.isActivated;
      } catch {}
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // Stop main player when EPG is running, Auto-play main player when EPG is closed
  const prevMultiViewModeRef = useRef<'none' | 'epg6' | 'tv9'>('none');
  useEffect(() => {
    if (multiViewMode !== 'none') {
      // EPG opened -> STOP main player immediately to save bandwidth & prevent sound overlap
      setIsPlaying(false);
    } else if (prevMultiViewModeRef.current !== 'none' && multiViewMode === 'none') {
      // EPG closed -> AUTO PLAY main player immediately
      setIsPlaying(true);
    }
    prevMultiViewModeRef.current = multiViewMode;
  }, [multiViewMode]);

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

  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const currIdx = channels.findIndex(c => c.id === currentChannel.id);
    setFocusedIndex(currIdx >= 0 ? currIdx : 0);
  }, [channels, currentChannel.id]);

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
    const currentIndex = channels.findIndex(c => c.id === currentChannel.id);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = channels.length - 1;
    if (nextIndex >= channels.length) nextIndex = 0;
    
    changeChannel(channels[nextIndex]);
  }, [channels, currentChannel.id, changeChannel]);

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
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (isMenuOpen || isRemoteOpen) return;
    if (target.closest('button, input, select, textarea, [role="button"], #mobile-landscape-toggle-btn')) return;

    gestureStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    gestureLastRef.current = { x: clientX, y: clientY };
    gestureLockedRef.current = null;
    gestureSwitchedChannelRef.current = false;
    gestureAccumulatedVolRef.current = 0;
  }, [isMenuOpen, isRemoteOpen]);

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
        const match = channels.find(ch => ch.number === parsed);
        if (match) {
          sfx.playChannelSwitch();
          changeChannel(match);
        }
        setNumberInputBuffer('');
      }, 1200);

      return updated;
    });
  }, [channels, changeChannel]);

  // Prevent browser context menu (long press / right click options popup)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  // Ensure Audio is UNMUTED and active on launch and on first user interaction
  useEffect(() => {
    setIsMuted(false);
    const unlockAudio = () => {
      setIsMuted(false);
      const video = document.getElementById('main-tv-video-element') as HTMLVideoElement | null;
      if (video) {
        video.muted = false;
        video.volume = Math.min(1, Math.max(0, volume / 100));
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [volume]);

  // Global Remote Control / Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent standard browser scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // If Activation Modal is open
      if (isActivationOpen) {
        if (e.key === 'Escape') {
          setIsActivationOpen(false);
        }
        return;
      }

      // If MultiChannelGrid is active, it handles its own navigation
      if (multiViewMode !== 'none') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          sfx.playBack();
          setMultiViewMode('none');
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
          const ch = channels[focusedIndex];
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
          setFocusedIndex(prev => Math.min(channels.length - 1, prev + 5));
          return;
        }

        // Up: Previous channel in list
        if (e.key === 'ArrowUp') {
          sfx.playTick();
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : channels.length - 1));
          return;
        }

        // Down: Next channel in list
        if (e.key === 'ArrowDown') {
          sfx.playTick();
          setFocusedIndex(prev => (prev < channels.length - 1 ? prev + 1 : 0));
          return;
        }

        // "OK" button (Enter or Space) while in menu: Tune to highlighted channel
        if (e.key === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
          const selectedChannel = channels[focusedIndex];
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

      // Activation Modal: A
      if (e.key === 'a' || e.key === 'A') {
        setIsActivationOpen(prev => !prev);
        return;
      }

      // EPG 6-Channel Grid: E
      if (e.key === 'e' || e.key === 'E') {
        sfx.playOk();
        closeCategoryMenu();
        setMultiViewMode('epg6');
        return;
      }

      // TV Mode 9-Channel Grid: T (Visible/Available only on TV, disabled on mobile)
      if (e.key === 't' || e.key === 'T') {
        if (!isMobileDevice()) {
          sfx.playOk();
          closeCategoryMenu();
          setMultiViewMode('tv9');
          return;
        }
      }

      // Sync Channels from Dropbox: S
      if (e.key === 's' || e.key === 'S') {
        sfx.playTick();
        handleSyncChannels(false);
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
    isActivationOpen,
    focusedIndex,
    channels,
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
    currentChannel.id,
    handleSyncChannels,
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

  return (
    <div
      ref={appContainerRef}
      id="smart-tv-app-root"
      style={{ ...mobileLandscapeStyles, WebkitTouchCallout: 'none', userSelect: 'none' }}
      className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none touch-none"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
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
        isPlaying={isPlaying && multiViewMode === 'none'}
        isMuted={isMuted || multiViewMode !== 'none'}
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
      />

      {/* 2.2 Menu Button with 3 sub-buttons (1: EPG 6 CH, 2: All Channels, 3: App Language) */}
      <MobileHeaderBar
        isMenuOpen={isMenuOpen}
        onOpenMenu={openCategoryMenu}
        onOpenEPG={() => {
          closeCategoryMenu();
          setMultiViewMode('epg6');
        }}
        onOpenLanguage={() => setIsLanguageModalOpen(true)}
        onOpenTVMode={() => {
          closeCategoryMenu();
          setMultiViewMode('tv9');
        }}
      />

      {/* 2.5 Right-Side Corner Watermark Logo */}
      <CornerLogo
        channelName={currentChannel.name}
        isMenuOpen={isMenuOpen}
      />

      {/* 3. Channel Menu Modal (Opens on OK Button) */}
      <CategoryMenu
        isOpen={isMenuOpen}
        currentChannel={currentChannel}
        channels={channels}
        favoriteChannelIds={favoriteChannelIds}
        focusedIndex={focusedIndex}
        onSelectChannel={(channel) => {
          changeChannel(channel);
          closeCategoryMenu();
        }}
        onToggleFavorite={toggleFavorite}
        onClose={closeCategoryMenu}
        setFocusedIndex={setFocusedIndex}
        onOpenActivation={() => setIsActivationOpen(true)}
        onOpenLanguage={() => setIsLanguageModalOpen(true)}
        onOpenEPG={() => {
          closeCategoryMenu();
          setMultiViewMode('epg6');
        }}
        onOpenTVMode={() => {
          if (!isMobileDevice()) {
            closeCategoryMenu();
            setMultiViewMode('tv9');
          }
        }}
        onRefreshChannels={() => handleSyncChannels(false)}
        isSyncing={isSyncing}
      />

      {/* 3.5 Multi-Channel Grid Overlay (1. EPG 6 CH / 2. TV Mode 9 CH on TV only) */}
      {multiViewMode !== 'none' && (
        <MultiChannelGrid
          mode={isMobileDevice() ? 'epg6' : multiViewMode}
          channels={channels}
          globalVolume={volume}
          onSelectChannelFullScreen={(channel) => {
            changeChannel(channel);
            setMultiViewMode('none');
            setIsPlaying(true);
          }}
          onClose={() => {
            setMultiViewMode('none');
            setIsPlaying(true);
          }}
          onSwitchMode={(mode) => setMultiViewMode(isMobileDevice() ? 'epg6' : mode)}
        />
      )}

      {/* 4. Virtual Smart TV Remote Control Widget */}
      <VirtualRemote
        isOpen={isRemoteOpen}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isFavorite={isFavorite(currentChannel.id)}
        onToggleFavorite={() => toggleFavorite(currentChannel.id)}
        onClose={() => setIsRemoteOpen(false)}
        onOpenEPG={() => {
          setIsRemoteOpen(false);
          setMultiViewMode('epg6');
        }}
        onOpenTVMode={() => {
          setIsRemoteOpen(false);
          setMultiViewMode('tv9');
        }}
        onDpadUp={() => {
          if (multiViewMode !== 'none' || isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
          } else {
            stepChannel(-1);
          }
        }}
        onDpadDown={() => {
          if (multiViewMode !== 'none' || isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
          } else {
            stepChannel(1);
          }
        }}
        onDpadLeft={() => {
          if (multiViewMode !== 'none' || isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
          } else {
            adjustVolume(-5);
          }
        }}
        onDpadRight={() => {
          if (multiViewMode !== 'none' || isMenuOpen) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
          } else {
            adjustVolume(5);
          }
        }}
        onOkPress={() => {
          if (multiViewMode !== 'none') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          } else if (!isMenuOpen) {
            openCategoryMenu();
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }}
        onBackPress={() => {
          if (multiViewMode !== 'none') {
            setMultiViewMode('none');
          } else if (isMenuOpen) {
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
        onOpenActivation={() => setIsActivationOpen(true)}
      />

      {/* 5.4 App Install Alert Dialog */}
      <AppInstallAlertModal
        isOpen={showInstallAlert}
        onClose={() => setShowInstallAlert(false)}
      />

      {/* 5.5 App Activation Modal (6-Digit TV Code & Code Generator) */}
      <ActivationModal
        isOpen={isActivationOpen}
        onClose={() => setIsActivationOpen(false)}
        onActivated={() => {
          setIsActivationOpen(false);
          setShowInstallAlert(false);
          setIsPlaying(true);
        }}
      />

      {/* 5.6 App Language Selection Modal (English, Telugu, Kannada, Tamil) */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* 6. Mobile Portrait Landscape Helper (Only for mobile in portrait mode; TV version is untouched) */}
      {isMobile && isPortrait && (
        <div 
          id="mobile-landscape-helper"
          className="fixed bottom-6 left-6 z-40 flex items-center pointer-events-auto"
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
            <span>{forceMobileLandscape ? 'Normal' : 'Landscape'}</span>
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
