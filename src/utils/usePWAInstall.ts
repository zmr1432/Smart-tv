import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global cached prompt so any component can access the captured event
let cachedDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

export function checkIsAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Standalone display mode (PWA installed on Android, Windows, Mac, Linux)
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;

    // 2. iOS Safari standalone mode
    if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;

    // 3. Android TWA / APK wrapper referrer
    if (document.referrer.includes('android-app://')) return true;

    // 4. Stored installation flag after user accepted install
    if (localStorage.getItem('jnn_tv_app_installed') === 'true') return true;
  } catch (e) {
    console.error('Error checking install status:', e);
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    cachedDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach(listener => listener(cachedDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    cachedDeferredPrompt = null;
    try {
      localStorage.setItem('jnn_tv_app_installed', 'true');
    } catch {}
    promptListeners.forEach(listener => listener(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => cachedDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsAppInstalled());
  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  });

  useEffect(() => {
    const handlePromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    promptListeners.add(handlePromptChange);

    const updateStatus = () => {
      setIsInstalled(checkIsAppInstalled());
    };

    updateStatus();
    window.addEventListener('appinstalled', updateStatus);

    return () => {
      promptListeners.delete(handlePromptChange);
      window.removeEventListener('appinstalled', updateStatus);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'fallback'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          cachedDeferredPrompt = null;
          try {
            localStorage.setItem('jnn_tv_app_installed', 'true');
          } catch {}
        }
        return choice.outcome;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    if (isIOS) {
      return 'ios';
    }

    return 'fallback';
  }, [deferredPrompt, isIOS]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    markAsInstalled: () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('jnn_tv_app_installed', 'true');
      } catch {}
    }
  };
}
