import React from 'react';
import { X, Tv, Keyboard, Smartphone, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { sfx } from '../utils/audio';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: string;
  activationCode?: string;
  onDeactivate?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ 
  isOpen, 
  onClose,
  deviceId,
  activationCode,
  onDeactivate,
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
            className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <div className="font-bold text-amber-300">OK Button / Enter Key</div>
                <div className="text-xs text-neutral-400">Open TV Guide & select channel</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-amber-400 text-neutral-950 font-black font-mono text-xs">
              OK / Enter
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <div>
                <div className="font-bold text-rose-300">B Key / FAV Button</div>
                <div className="text-xs text-neutral-400">Add or remove active channel from Favorites</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold font-mono text-xs border border-rose-500/30">
              B / FAV
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">▲ / ▼ (Up / Down)</div>
                <div className="text-xs text-neutral-400">Previous / Next channel or navigate list in guide</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              Arrow Up / Down
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">◄ / ► (Left / Right)</div>
                <div className="text-xs text-neutral-400">Switch genres in menu or adjust volume</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              Arrow Left / Right
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">F Key</div>
                <div className="text-xs text-neutral-400">Toggle Fullscreen mode</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              F
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">M Key</div>
                <div className="text-xs text-neutral-400">Mute / Unmute audio</div>
              </div>
            </div>
            <kbd className="px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200 font-mono text-xs">
              M
            </kbd>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" />
              <div>
                <div className="font-semibold text-white">Esc / Backspace</div>
                <div className="text-xs text-neutral-400">Close TV guide or return to player</div>
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

        {/* Activation Status Card */}
        {deviceId && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>యాక్టివేషన్ స్థితి: యాక్టివేట్ చేయబడింది (Active)</span>
              </div>
              {onDeactivate && (
                <button
                  id="reset-activation-btn"
                  onClick={() => {
                    sfx.playBack();
                    onDeactivate();
                    onClose();
                  }}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Reset Activation to test activation screen"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>రీసెట్ / డీయాక్టివేట్</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="text-neutral-400">డివైస్ ID:</span>
              <span className="font-mono font-bold text-amber-300">{deviceId}</span>
            </div>
            {activationCode && (
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="text-neutral-400">యాక్టివేషన్ కోడ్:</span>
                <span className="font-mono font-bold text-emerald-400">{activationCode}</span>
              </div>
            )}
          </div>
        )}

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
