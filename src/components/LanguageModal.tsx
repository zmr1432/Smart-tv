import React, { useState, useEffect } from 'react';
import { Globe, Check, X, Sparkles } from 'lucide-react';
import { AppLanguage, LANGUAGES, LanguageOption, getAppLanguage, setAppLanguage, t } from '../utils/i18n';
import { sfx } from '../utils/audio';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageChanged?: (lang: AppLanguage) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  onLanguageChanged,
}) => {
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(() => getAppLanguage());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      const current = getAppLanguage();
      setSelectedLang(current);
      const idx = LANGUAGES.findIndex((l) => l.id === current);
      if (idx !== -1) setFocusedIndex(idx);
    }
  }, [isOpen]);

  // TV Remote D-pad navigation (Up, Down, OK, Back)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          sfx.playTick();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : LANGUAGES.length - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          sfx.playTick();
          setFocusedIndex((prev) => (prev < LANGUAGES.length - 1 ? prev + 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          const target = LANGUAGES[focusedIndex];
          if (target) {
            handleSelect(target.id);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          sfx.playBack();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, onClose]);

  if (!isOpen) return null;

  const handleSelect = (lang: AppLanguage) => {
    sfx.playOk();
    setSelectedLang(lang);
    setAppLanguage(lang);
    if (onLanguageChanged) {
      onLanguageChanged(lang);
    }
    setTimeout(() => {
      onClose();
    }, 250);
  };

  return (
    <div
      id="app-language-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="app-language-modal-content"
        className="w-full max-w-md rounded-3xl bg-neutral-900/95 border-2 border-amber-500/40 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-md">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5">
                {t('selectLanguage', selectedLang)}
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                {t('chooseLanguageSubtitle', selectedLang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-language-modal-btn"
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title={t('close', selectedLang)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Language Options Grid/List */}
        <div className="space-y-2.5 mb-5">
          {LANGUAGES.map((item: LanguageOption, idx: number) => {
            const isSelected = selectedLang === item.id;
            const isFocused = focusedIndex === idx;

            return (
              <button
                key={item.id}
                type="button"
                id={`lang-btn-${item.id}`}
                onClick={() => handleSelect(item.id)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-neutral-800 border-amber-400 shadow-lg shadow-amber-500/10'
                    : isFocused
                    ? 'bg-white/15 border-white/40 scale-[1.01]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl select-none" role="img" aria-label={item.nameEnglish}>
                    {item.flag}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {item.nativeName}
                      </span>
                      <span className="text-xs font-semibold text-neutral-400">
                        ({item.nameEnglish})
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {item.subtext}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-neutral-950 font-black text-xs shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Active</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/40 text-xs">
                    {idx + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Remote Navigation Hint */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1 text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Instant UI Switch
          </span>
          <span>▲▼ Select &nbsp;|&nbsp; OK Confirm</span>
        </div>
      </div>
    </div>
  );
};
