import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  Tv, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Clock, 
  Sparkles,
  Calendar,
  Delete
} from 'lucide-react';
import { 
  getOrGenerateDeviceCode, 
  regenerateDeviceCode, 
  verifyAndApplyActivation, 
  getActivationStatus,
  ActivationStatus 
} from '../utils/activation';
import { sfx } from '../utils/audio';
import { getAppLanguage, onLanguageChange, t, AppLanguage } from '../utils/i18n';

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
  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => getAppLanguage());
  const [deviceCode, setDeviceCode] = useState<string>(() => getOrGenerateDeviceCode());
  const [inputCode, setInputCode] = useState<string>('');
  const [status, setStatus] = useState<ActivationStatus>(() => getActivationStatus());
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return onLanguageChange((lang) => {
      setCurrentLang(lang);
    });
  }, []);

  // Sync state whenever opened
  useEffect(() => {
    if (isOpen) {
      const code = getOrGenerateDeviceCode();
      setDeviceCode(code);
      setStatus(getActivationStatus());
      setErrorMsg('');
      setSuccessMsg('');
      setInputCode('');
      setTimeout(() => inputRef.current?.focus(), 150);

      const interval = setInterval(() => {
        setStatus(getActivationStatus());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle Copy Device Code
  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(deviceCode);
      sfx.playTick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Handle "కొత్త కోడ్" (Regenerate 8-digit device code)
  const handleRegenerateCode = () => {
    sfx.playTick();
    const newCode = regenerateDeviceCode();
    setDeviceCode(newCode);
    setStatus(getActivationStatus());
    setInputCode('');
    setErrorMsg('');
    setSuccessMsg(t('newCode', currentLang));
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Handle Activation Submit
  const handleActivate = (codeToVerify?: string) => {
    const code = (codeToVerify || inputCode).trim();
    if (!code) {
      sfx.playError();
      setErrorMsg(t('enterValidCode', currentLang));
      return;
    }

    const result = verifyAndApplyActivation(code, deviceCode);
    if (result.success) {
      sfx.playSuccess();
      setErrorMsg('');
      setSuccessMsg(`${t('activationSuccess', currentLang)} (${result.planName})`);
      setStatus(getActivationStatus());
      onActivated?.();
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } else {
      sfx.playError();
      setErrorMsg(result.error || t('invalidCode', currentLang));
    }
  };

  // On-screen TV Keypad input
  const handleKeypadPress = (digit: string) => {
    sfx.playTick();
    setErrorMsg('');
    if (inputCode.length < 12) {
      setInputCode(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    sfx.playTick();
    setInputCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sfx.playTick();
    setInputCode('');
    setErrorMsg('');
  };

  // Keyboard navigation & remote input
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
  }, [isOpen, inputCode, deviceCode, status.isActivated]);

  if (!isOpen) return null;

  return (
    <div 
      id="app-activation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none overflow-y-auto"
    >
      <div 
        className="w-full max-w-xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-zinc-900/70 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {t('activationTitle', currentLang)}
              </h2>
              <span className="text-[11px] text-zinc-400">
                {t('activationSubtitle', currentLang)}
              </span>
            </div>
          </div>

          {status.isActivated && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={t('close', currentLang)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. 8-Digit Device Code Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-amber-400" />
                <span>{t('yourDeviceCode', currentLang)}</span>
              </span>

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerateCode}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                title={t('newCode', currentLang)}
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('newCode', currentLang)}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-4 py-3">
              <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-[0.25em]">
                {deviceCode}
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied', currentLang) : t('copy', currentLang)}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              {t('deviceCodeDesc', currentLang)}
            </p>
          </div>

          {/* 2. Current Activation Status Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                status.isActivated ? 'bg-emerald-500/20 text-emerald-400' : status.isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {status.isActivated ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{t('statusLabel', currentLang)}</span>
                  <span className={status.isActivated ? 'text-emerald-400' : status.isExpired ? 'text-rose-400' : 'text-amber-400'}>
                    {status.isActivated ? t('statusActive', currentLang) : status.isExpired ? t('statusExpired', currentLang) : t('statusInactive', currentLang)}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                  {status.isActivated && (
                    <>
                      <span>{t('remainingTime', currentLang)} <strong className="text-white">{status.remainingTimeFormatted}</strong></span>
                      <span>• {t('expiresAt', currentLang)} {status.expiresAtDate}</span>
                    </>
                  )}
                  {!status.isActivated && (
                    <span>{t('freeTrialHint', currentLang)} <strong className="text-cyan-400 font-mono">1432</strong></span>
                  )}
                </div>
              </div>
            </div>

            {status.isActivated && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {status.planName}
              </span>
            )}
          </div>

          {/* 4. Activation Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              {t('enterActivationCode', currentLang)}
            </label>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setErrorMsg('');
                  setInputCode(e.target.value.replace(/\D/g, ''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleActivate();
                  }
                }}
                placeholder={t('codePlaceholder', currentLang)}
                className="flex-1 px-4 py-3 bg-black/70 border border-white/20 rounded-xl text-white font-mono text-base tracking-widest focus:outline-none focus:border-amber-400 text-center"
              />

              <button
                onClick={() => handleActivate()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {t('activateBtn', currentLang)}
              </button>
            </div>

            {/* Error & Success Toasts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* 5. Smart TV On-Screen Number Keypad */}
          <div className="p-3 bg-zinc-900/40 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2 text-center">
              {t('tvKeypad', currentLang)}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/10 text-white font-mono text-base font-bold transition-all active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                {t('clear', currentLang)}
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-black/60 hover:bg-white/15 border border-white/10 text-white font-mono text-base font-bold transition-all active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-bold text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Telugu Live TV License System</span>
          <span className="text-zinc-500 font-medium">Smart TV & Mobile Activation</span>
        </div>
      </div>
    </div>
  );
};
