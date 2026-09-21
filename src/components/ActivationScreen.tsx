import React, { useState, useEffect, useCallback } from 'react';
import { Tv, KeyRound, CheckCircle2, AlertCircle, Copy, Check, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getDeviceId, activateWithCode } from '../utils/activation';

interface ActivationScreenProps {
  onActivated: (code: string) => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const handleKeyPress = useCallback((val: string) => {
    sfx.playTick();
    setErrorMsg(null);
    setInputCode(prev => {
      if (prev.length >= 8) return prev;
      return prev + val;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    sfx.playBack();
    setErrorMsg(null);
    setInputCode(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    sfx.playBack();
    setErrorMsg(null);
    setInputCode('');
  }, []);

  const handleSetDemoCode = useCallback(() => {
    sfx.playOk();
    setErrorMsg(null);
    setInputCode('123456');
  }, []);

  const handleSubmit = useCallback(() => {
    const result = activateWithCode(inputCode);
    if (result.success) {
      sfx.playSuccess();
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        onActivated(inputCode.trim().toUpperCase());
      }, 1200);
    } else {
      sfx.playBack();
      setErrorMsg(result.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [inputCode, onActivated]);

  // Physical Keyboard Listener (TV Remote Number Keys & PC Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleBackspace, handleSubmit, handleClear, isSuccess]);

  const handleCopyDevice = () => {
    if (!deviceId) return;
    navigator.clipboard?.writeText(deviceId);
    setCopied(true);
    sfx.playTick();
    setTimeout(() => setCopied(false), 2000);
  };

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div
      id="smart-tv-activation-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-white select-none overflow-y-auto p-4 sm:p-6"
      style={{
        backgroundImage: 'radial-gradient(ellipse at center, #1a160d 0%, #0a0a0a 70%, #000000 100%)',
      }}
    >
      <div 
        className={`w-full max-w-xl rounded-3xl bg-neutral-900/90 border border-amber-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-transform duration-200 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 shadow-xl shadow-amber-500/20">
              <Tv className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 border-2 border-amber-400 flex items-center justify-center text-amber-400">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            స్మార్ట్ టీవీ యాక్టివేషన్
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">
            Smart TV App Activation & License Setup
          </p>
        </div>

        {/* Device Information Card */}
        <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                డివైస్ ఐడీ (Device Identifier)
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-amber-300 tracking-wider">
                {deviceId || 'TV-8821-AP'}
              </div>
            </div>
          </div>

          <button
            id="copy-device-id-btn"
            onClick={handleCopyDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-all cursor-pointer active:scale-95"
            title="Copy Device ID"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">కాపీ చేయబడింది</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>ID కాపీ చేయండి</span>
              </>
            )}
          </button>
        </div>

        {/* Code Input Display */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2 text-center">
            యాక్టివేషన్ కోడ్ నమోదు చేయండి (Enter Activation Code)
          </label>

          <div 
            id="activation-code-input-display"
            className="flex items-center justify-center gap-2 sm:gap-3 py-3 px-4 rounded-2xl bg-black/60 border-2 border-amber-400/50 shadow-inner"
          >
            {Array.from({ length: 6 }).map((_, idx) => {
              const char = inputCode[idx] || '';
              const isCurrent = inputCode.length === idx;
              return (
                <div
                  key={idx}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black font-mono transition-all ${
                    char
                      ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 shadow-md shadow-amber-500/20'
                      : isCurrent
                      ? 'bg-neutral-800 text-white border-2 border-amber-400/60 animate-pulse'
                      : 'bg-neutral-900/80 text-neutral-600 border border-white/10'
                  }`}
                >
                  {char || (isCurrent ? '_' : '•')}
                </div>
              );
            })}
          </div>

          {/* Quick Demo Code Suggestion Button */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              type="button"
              id="quick-demo-code-btn"
              onClick={handleSetDemoCode}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>టెస్టింగ్ డెమో కోడ్ వాడండి (Demo Code: 123456)</span>
            </button>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center justify-center gap-2 text-center">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 text-center animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <span>యాక్టివేషన్ విజయవంతమైంది! టీవీ ప్లేయర్ ఓపెన్ అవుతోంది...</span>
          </div>
        )}

        {/* On-Screen TV Remote & Mobile Keypad */}
        <div className="mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
            {keypadButtons.map((digit) => (
              <button
                key={digit}
                type="button"
                id={`keypad-digit-${digit}`}
                onClick={() => handleKeyPress(digit)}
                disabled={isSuccess}
                className="h-11 sm:h-12 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 active:bg-amber-500 active:text-neutral-950 font-mono font-bold text-lg text-white border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="keypad-clear-btn"
              onClick={handleClear}
              disabled={isSuccess || inputCode.length === 0}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 border border-white/10 transition-all cursor-pointer disabled:opacity-40"
            >
              మొత్తం తుడవండి (Clear)
            </button>
            <button
              type="button"
              id="keypad-backspace-btn"
              onClick={handleBackspace}
              disabled={isSuccess || inputCode.length === 0}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 border border-white/10 transition-all cursor-pointer disabled:opacity-40"
            >
              ⌫ రద్దు చేయండి (Backspace)
            </button>
          </div>
        </div>

        {/* Activation Button */}
        <button
          type="button"
          id="activate-app-submit-btn"
          onClick={handleSubmit}
          disabled={isSuccess}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-98 ${
            isSuccess
              ? 'bg-emerald-500 text-neutral-950'
              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/25 border border-amber-300/40 hover:shadow-amber-400/40'
          } disabled:opacity-75`}
        >
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>యాక్టివేట్ చేయబడింది!</span>
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              <span>యాప్ యాక్టివేట్ చేయండి (Activate Now)</span>
            </>
          )}
        </button>

        {/* Footer Instructions */}
        <div className="mt-4 text-center text-[11px] text-neutral-400 leading-relaxed flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>రిమోట్ లేదా కీబోర్డ్ నంబర్ల ద్వారా కూడా కోడ్ ఎంటర్ చేసి Enter నొక్కవచ్చు.</span>
        </div>
      </div>
    </div>
  );
};
