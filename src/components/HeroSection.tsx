import React, { useState } from 'react';
import { SphereVisual } from './SphereVisual.js';
import { ArrowRight, ShieldCheck, Zap, Share2, Check, Sparkles, Lock, BarChart2, HelpCircle } from 'lucide-react';

interface HeroSectionProps {
  onOpenCreate?: () => void;
  onExplore: () => void;
  onLearnMore?: () => void;
  onSuggestions?: () => void;
  stats?: { totalVotes: number; totalPolls: number; totalSuggestions: number };
  isAdmin?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCreate,
  onExplore,
  onLearnMore,
  onSuggestions,
  stats,
  isAdmin
}) => {
  // Interactive preview card state
  const [selectedPreviewOption, setSelectedPreviewOption] = useState<number>(0);

  const previewOptions = [
    { label: 'Universal 1-Tap Access', desc: 'Direct browser link, zero registration needed' },
    { label: 'Anonymous Device Security', desc: 'Cryptographic SHA-256 tokens prevent duplicate votes' },
    { label: 'Real-Time Live Tallies', desc: 'Instant percentage bars and verifiable results' },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-[rgba(167,139,250,0.18)]">
      {/* Background ambient glow - carefully constrained to prevent horizontal scroll */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 bg-gradient-to-tr from-[#8B5CF6]/20 via-[#A855F7]/15 to-[#C084FC]/10 blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Description & Primary Action Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Small Brand Kicker (No Pill, clean typography) */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span>Universal Anonymous Voting</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="text-[#A5A0B5] font-normal normal-case">Zero Login Required</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-fluid-hero font-extrabold tracking-tight text-white font-display text-balance">
              Your Voice.{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#8B5CF6] bg-clip-text text-transparent">
                Your Choice.
              </span>{' '}
              Your Vote.
            </h1>

            {/* Description */}
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#A5A0B5] leading-relaxed max-w-xl text-balance">
              Discover community polls, share your opinion and make your voice count.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onExplore}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#8B5CF6] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all cursor-pointer touch-target"
              >
                <span>Explore Polls</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => {
                  if (onLearnMore) {
                    onLearnMore();
                  } else {
                    const el = document.getElementById('how-it-works-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-medium text-white hover:text-[#C084FC] bg-[#17122A] hover:bg-[#1E1738] rounded-xl border border-[rgba(167,139,250,0.22)] active:scale-[0.98] transition-all cursor-pointer touch-target"
              >
                <HelpCircle className="w-4 h-4 text-[#A855F7]" />
                <span>Learn More</span>
              </button>

              {isAdmin && onOpenCreate && (
                <button
                  onClick={onOpenCreate}
                  className="min-h-[48px] inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-xl hover:bg-emerald-900/50 transition-colors cursor-pointer touch-target"
                >
                  <span>+ Create Poll</span>
                </button>
              )}
            </div>

            {/* Trust Markers */}
            <div className="mt-8 pt-6 border-t border-[rgba(167,139,250,0.15)] flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#A5A0B5]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Anonymous</span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Direct 1-Tap Vote</span>
              </div>
              <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Share via QR &amp; Link</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Ballot Illustration */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            {/* Ambient 3D Sphere in background */}
            <div className="absolute inset-0 h-full pointer-events-none opacity-70 overflow-hidden">
              <SphereVisual className="w-full h-full" />
            </div>

            {/* Interactive Ballot Card */}
            <div className="relative w-full max-w-md bg-[#17122A] rounded-2xl p-5 sm:p-7 shadow-2xl border border-[rgba(167,139,250,0.22)] z-20">
              <div className="flex items-center justify-between text-xs text-[#A5A0B5] mb-3">
                <span className="font-semibold text-[#C084FC] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Ballot Preview</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Anonymous Token</span>
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                How should our community cast votes?
              </h3>
              <p className="text-xs text-[#A5A0B5] mt-1 mb-4">
                Tap an option to experience the 1-tap voting workflow
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {previewOptions.map((opt, idx) => {
                  const isSelected = selectedPreviewOption === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPreviewOption(idx)}
                      className={`relative w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer min-h-[50px] touch-target ${
                        isSelected
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 text-white ring-1 ring-[#8B5CF6]'
                          : 'border-[rgba(167,139,250,0.15)] bg-[#100D20] text-[#A5A0B5] hover:text-white hover:border-[#8B5CF6]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white'
                              : 'border-slate-500'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold block truncate text-white">{opt.label}</span>
                            <span className="text-[11px] text-[#A5A0B5] block truncate">{opt.desc}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] uppercase font-bold text-[#C084FC] shrink-0">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Note */}
              <div className="mt-4 pt-3 border-t border-[rgba(167,139,250,0.12)] flex items-center justify-between text-xs text-[#A5A0B5]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <BarChart2 className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Instant live tallies</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400">100% Anonymous</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Ecosystem Statistics Strip */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[rgba(167,139,250,0.15)] pt-6">
          <div className="p-4 rounded-2xl bg-[#17122A]/60 border border-[rgba(167,139,250,0.15)]">
            <div className="text-xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {(stats?.totalPolls || 0).toLocaleString()}
            </div>
            <div className="text-xs text-[#A5A0B5] mt-1 font-medium">Polls Created</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#17122A]/60 border border-[rgba(167,139,250,0.15)]">
            <div className="text-xl sm:text-3xl font-extrabold text-[#C084FC] font-mono tabular-nums">
              {(stats?.totalVotes || 0).toLocaleString()}
            </div>
            <div className="text-xs text-[#A5A0B5] mt-1 font-medium">Votes Cast</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#17122A]/60 border border-[rgba(167,139,250,0.15)]">
            <div className="text-xl sm:text-3xl font-extrabold text-[#A855F7] font-mono tabular-nums">
              {(stats?.totalSuggestions || 0).toLocaleString()}
            </div>
            <div className="text-xs text-[#A5A0B5] mt-1 font-medium">Community Suggestions</div>
          </div>
        </div>
      </div>
    </section>
  );
};
