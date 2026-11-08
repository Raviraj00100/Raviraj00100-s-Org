import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall.js';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the install triggers
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.22)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Install VoteSphere App</h4>
              <p className="text-xs text-[#A5A0B5]">Fast, 1-tap anonymous voting right from your home screen.</p>
            </div>
          </div>
          <button
            onClick={install}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 active:scale-95 transition-all self-stretch sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Install Web App</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
        aria-label="Install VoteSphere on your device"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border border-[rgba(167,139,250,0.22)] bg-[#100D20] hover:bg-[#17122A] text-xs font-medium text-white flex items-center justify-center gap-2 active:scale-95 transition-colors cursor-pointer ${className}`}
          aria-label="Add VoteSphere to iPhone home screen"
        >
          <Smartphone className="w-4 h-4 text-violet-400" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#100D20] border border-[rgba(167,139,250,0.25)] p-6 shadow-2xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-display">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#A5A0B5] leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#17122A] border border-[rgba(167,139,250,0.15)]">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Tap the <strong className="text-white inline-flex items-center gap-1 mx-0.5"><Share className="w-3.5 h-3.5 inline text-violet-400" /> Share</strong> button in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#17122A] border border-[rgba(167,139,250,0.15)]">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#17122A] border border-[rgba(167,139,250,0.15)]">
                  <span className="w-5 h-5 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Launch VoteSphere directly as a standalone app!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
