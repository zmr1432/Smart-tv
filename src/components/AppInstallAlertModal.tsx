import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sfx } from '../utils/audio';

interface AppInstallAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallAlertModal: React.FC<AppInstallAlertModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstalled, isIOS, install } = usePWAInstall();
  const [selectedBtn, setSelectedBtn] = useState<'yes' | 'no'>('yes');
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showFallbackGuide, setShowFallbackGuide] = useState<boolean>(false);

  // If the app is already installed, do NOT show the alert message!
  if (isInstalled) {
    return null;
  }

  // Keyboard / Smart TV Remote Control D-pad support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIOSGuide || showFallbackGuide) {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setShowIOSGuide(false);
          setShowFallbackGuide(false);
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sfx.playTick();
        setSelectedBtn('no');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sfx.playTick();
        setSelectedBtn('yes');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedBtn === 'yes') {
          handleYesClick();
        } else {
          handleNoClick();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        handleNoClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedBtn, showIOSGuide, showFallbackGuide]);

  if (!isOpen) return null;

  const handleNoClick = () => {
    sfx.playBack();
    onClose();
  };

  const handleYesClick = async () => {
    sfx.playSuccess();
    const result = await install();
    if (result === 'accepted') {
      onClose();
    } else if (result === 'ios') {
      setShowIOSGuide(true);
    } else if (result === 'fallback') {
      // Browser didn't show prompt (or already prompted / desktop browser)
      setShowFallbackGuide(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      id="app-install-alert-modal"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleNoClick();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border-2 border-amber-500/50 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white space-y-4 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Install Guide Step */}
        {showIOSGuide ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Install on Apple iOS</h3>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                1. Tap the <strong>Share (⎋)</strong> button in Safari browser.<br />
                2. Scroll down and select <strong>Add to Home Screen (+)</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playTick();
                setShowIOSGuide(false);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all"
            >
              OK
            </button>
          </div>
        ) : showFallbackGuide ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">App install</h3>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                Click <strong>Install (⬇️)</strong> at the top of your browser or select <strong>Add to Home screen</strong> in the menu (⋮).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playTick();
                setShowFallbackGuide(false);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {/* Header with App Install title and icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-white tracking-wide">
                  App install
                </h3>
                <p className="text-xs text-neutral-400">Jnn tv Player Setup</p>
              </div>
            </div>

            {/* Alert Message Text */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-white/10 text-center">
              <p className="text-sm font-semibold text-neutral-200">
                Do you want to install the app on your device?
              </p>
            </div>

            {/* Buttons: Yes and No */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleNoClick}
                onMouseEnter={() => setSelectedBtn('no')}
                className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all border cursor-pointer active:scale-95 ${
                  selectedBtn === 'no'
                    ? 'bg-neutral-800 text-white border-white/30 shadow-lg ring-2 ring-neutral-400/30'
                    : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white hover:bg-neutral-800'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={handleYesClick}
                onMouseEnter={() => setSelectedBtn('yes')}
                className={`py-3 px-4 rounded-2xl text-sm font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                  selectedBtn === 'yes'
                    ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 scale-[1.02]'
                    : 'bg-amber-500/80 text-neutral-950 hover:bg-amber-400'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Yes</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
