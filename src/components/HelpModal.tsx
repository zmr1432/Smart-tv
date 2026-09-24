import React from 'react';
import { X, Tv, Smartphone } from 'lucide-react';
import { sfx } from '../utils/audio';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ 
  isOpen, 
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="remote-help-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfx.playBack();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/15 p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Remote Control Guide</h3>
              <p className="text-xs text-neutral-400">TV Remote & Keyboard Shortcuts</p>
            </div>
          </div>

          <button
            id="close-help-modal-btn"
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex flex-col gap-3 text-sm max-h-[50vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <div>
                <div className="font-semibold text-white">OK / Enter / Space</div>
                <div className="text-xs text-neutral-400">Open Channel Guide or Select Channel</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              OK / Enter
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <div>
                <div className="font-semibold text-white">Arrow Up / Down (▲ / ▼)</div>
                <div className="text-xs text-neutral-400">Channel Up / Down & Menu Navigation</div>
              </div>
            </div>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">▲</kbd>
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">▼</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <div className="font-semibold text-white">Arrow Left / Right (◄ / ►)</div>
                <div className="text-xs text-neutral-400">Volume Down / Up or Column Switch</div>
              </div>
            </div>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">◄</kbd>
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">►</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="font-semibold text-white">Number Keys (0-9)</div>
                <div className="text-xs text-neutral-400">Directly tune to channel number (e.g. 101, 102)</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              0 - 9
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <div>
                <div className="font-semibold text-white">B Key / Yellow Button</div>
                <div className="text-xs text-neutral-400">Toggle channel favorite status</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              B
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="font-semibold text-white">A Key / Activation</div>
                <div className="text-xs text-neutral-400">Open Device Activation (యాక్టివేషన్)</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-amber-300 font-mono text-xs font-bold">
              A
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <div>
                <div className="font-semibold text-white">M Key / F Key</div>
                <div className="text-xs text-neutral-400">M = Mute/Unmute, F = Fullscreen</div>
              </div>
            </div>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">M</kbd>
              <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">F</kbd>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">Esc / Backspace</div>
                <div className="text-xs text-neutral-400">Close channel menu or return to player</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              Esc
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="font-semibold text-white">Corner Logo</div>
                <div className="text-xs text-neutral-400">Click on top right logo to upload your custom channel watermark</div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-neutral-700 text-amber-300 font-mono text-xs font-semibold">
              Click Logo
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
          <Smartphone className="w-5 h-5 shrink-0 text-blue-400" />
          <span>
            You can operate the player using the on-screen virtual remote, computer keyboard shortcuts, or your Smart TV remote.
          </span>
        </div>

        <button
          id="ack-help-btn"
          onClick={() => {
            sfx.playBack();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all active:scale-98 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
