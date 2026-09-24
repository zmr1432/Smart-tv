import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  KeyRound, CheckCircle2, AlertCircle, Copy, Check, RotateCcw, 
  ShieldCheck, X, Sparkles 
} from 'lucide-react';
import { 
  getDeviceCode, 
  applyActivation, 
  getActivationStatus, 
  generateNewDeviceCode,
  ActivationStatus 
} from '../utils/activation';
import { sfx } from '../utils/audio';
import { DEFAULT_CORNER_LOGO } from './CornerLogo';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  onActivated,
}) => {
  const [deviceCode, setDeviceCodeState] = useState<string>(getDeviceCode());
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [status, setStatus] = useState<ActivationStatus>(getActivationStatus());
  const [copiedDevice, setCopiedDevice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Refresh status on open and start live 1-second tick for countdowns
  useEffect(() => {
    if (isOpen) {
      const curCode = getDeviceCode();
      setDeviceCodeState(curCode);
      setStatus(getActivationStatus());
      setErrorMsg('');
      setSuccessMsg('');
      setEnteredCode('');
      setTimeout(() => inputRef.current?.focus(), 150);

      const timer = setInterval(() => {
        setStatus(getActivationStatus());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  // Copy helper
  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      sfx.playTick();
      setCopiedDevice(true);
      setTimeout(() => setCopiedDevice(false), 2000);
    } catch {}
  };

  // Perform activation
  const handleActivate = useCallback((codeToUse?: string) => {
    const code = (codeToUse || enteredCode).trim();
    if (!code) {
      sfx.playError();
      setErrorMsg('దయచేసి యాక్టివేషన్ కోడ్ ఎంటర్ చేయండి.');
      return;
    }

    const result = applyActivation(code, deviceCode);
    if (result.success) {
      sfx.playSuccess();
      setErrorMsg('');
      setSuccessMsg(`🎉 యాక్టివేషన్ విజయవంతమైంది! (${result.planName})`);
      setStatus(getActivationStatus());
      onActivated?.();
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } else {
      sfx.playError();
      setErrorMsg(result.error || 'చెల్లని యాక్టివేషన్ కోడ్. దయచేసి సరైన కోడ్ ఎంటర్ చేయండి.');
    }
  }, [deviceCode, enteredCode, onActivated]);

  // Handle regenerating device code
  const handleRegenerateDeviceCode = () => {
    sfx.playTick();
    const newCode = generateNewDeviceCode();
    setDeviceCodeState(newCode);
    setStatus(getActivationStatus());
    setEnteredCode('');
    setErrorMsg('');
    setSuccessMsg('కొత్త 8-డిజిట్ TV కోడ్ రూపొందించబడింది.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Virtual numpad key press
  const handleNumpadPress = (digit: string) => {
    sfx.playTick();
    setErrorMsg('');
    if (enteredCode.length < 10) {
      setEnteredCode(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    sfx.playBack();
    setEnteredCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sfx.playBack();
    setEnteredCode('');
    setErrorMsg('');
  };

  // Keyboard navigation for shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status.isActivated) {
          sfx.playBack();
          onClose();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleActivate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleActivate, onClose, status.isActivated]);

  if (!isOpen) return null;

  return (
    <div 
      id="app-activation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/90 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && status.isActivated) {
          sfx.playBack();
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-radial from-neutral-900 via-neutral-900 to-[#070b14] border border-amber-500/30 p-5 sm:p-7 shadow-[0_0_80px_rgba(245,158,11,0.15)] text-white space-y-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <img 
              src={DEFAULT_CORNER_LOGO} 
              alt="Logo" 
              className="h-9 sm:h-11 max-w-[120px] object-contain filter drop-shadow" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span>App Activation</span>
                </h2>
                {status.isActivated ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Active ({status.remainingDays >= 1 ? `${status.remainingDays} Days` : status.remainingTimeFormatted})
                    </span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>యాక్టివేషన్ అవసరం</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">TV & Mobile Device License Activation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status.isActivated && (
              <button
                id="close-activation-modal-btn"
                onClick={() => {
                  sfx.playBack();
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 border border-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DEVICE ACTIVATION CONTENT */}
        <div className="space-y-4">
          {/* 8-Digit Device TV Code Card */}
          <div className="relative p-4 sm:p-5 rounded-3xl bg-neutral-950/80 border-2 border-amber-500/40 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                మీ TV / మొబైల్ కోడ్ (8-Digit Device Code)
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-[0.2em] drop-shadow-md">
                  {deviceCode}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                ఈ 8-అంకెల కోడ్ ద్వారా మీ యాక్టివేషన్ కోడ్ పొందండి.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(deviceCode)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="Copy 8-digit Device Code"
              >
                {copiedDevice ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>కాపీ చేయండి</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRegenerateDeviceCode}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
                title="Generate New 8-digit Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>కొత్త కోడ్</span>
              </button>
            </div>
          </div>

          {/* 3-Minute Trial Text */}
          <div className="flex items-center justify-center py-2 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold tracking-wide text-center">
            <span>3 నిమిషాల ట్రయల్ కోడ్ 1432</span>
          </div>

          {/* Code Entry Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 block">
              యాక్టివేషన్ కోడ్ ఎంటర్ చేయండి (Enter Activation Code)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  setErrorMsg('');
                  setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                }}
                placeholder="యాక్టివేషన్ కోడ్ నమోదు చేయండి"
                className="flex-1 px-4 py-3 rounded-2xl bg-neutral-950 border-2 border-white/20 focus:border-amber-400 text-xl font-mono font-bold text-white tracking-widest placeholder-neutral-600 focus:outline-none transition-all shadow-inner text-center sm:text-left"
              />
              <button
                type="button"
                onClick={() => handleActivate()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
              >
                యాక్టివేట్ చేయండి
              </button>
            </div>
          </div>

          {/* Error or Success Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Virtual TV Remote Numpad (Designed for TV Remote / Mobile) */}
          <div className="p-3 rounded-2xl bg-neutral-950/60 border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block text-center">
              TV Remote On-Screen Numpad
            </span>
            <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleNumpadPress(d)}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 text-white font-mono font-bold text-lg transition-all border border-white/10 active:scale-95 cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-rose-900/50 text-neutral-400 hover:text-rose-300 font-bold text-xs transition-all border border-white/10 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 text-white font-mono font-bold text-lg transition-all border border-white/10 active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-amber-900/50 text-neutral-400 hover:text-amber-300 font-bold text-xs transition-all border border-white/10 cursor-pointer"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Current Active Plan Status Box (if active) */}
          {status.isActivated && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{status.planName}</h4>
                  <p className="text-xs text-neutral-300">
                    గడువు: <strong>{status.expiresAtDate}</strong> ({status.remainingTimeFormatted} మిగిలివుంది)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sfx.playBack();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                టీవీ చూడండి (Continue)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
