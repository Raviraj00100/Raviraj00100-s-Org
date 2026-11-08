import React from 'react';
import { Logo } from './Logo.js';
import { ShieldCheck, Users, Zap, CheckCircle2, Lock, ArrowRight, Heart, Sparkles, School, GraduationCap, Building2 } from 'lucide-react';

interface AboutPageProps {
  onOpenCreate?: () => void;
  onExplore: () => void;
  isAdmin?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenCreate, onExplore, isAdmin }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12 sm:space-y-16">
      {/* Hero section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[rgba(167,139,250,0.25)] text-[#C084FC] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The VoteSphere Manifesto</span>
        </div>
        <h1 className="text-fluid-hero font-extrabold tracking-tight text-white font-display text-balance">
          Decisions Begin With a Voice.
        </h1>
        <p className="text-base sm:text-lg text-[#A5A0B5] leading-relaxed max-w-2xl mx-auto text-balance">
          Bring people together, collect genuine opinions, and make better decisions. No accounts. No passwords. Just your voice.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center border border-[rgba(167,139,250,0.2)]">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Friction Access</h3>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
            Eliminating passwords, logins, OTPs, and registrations allows anyone with a link or QR code to participate within seconds.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 text-[#C084FC] flex items-center justify-center border border-[rgba(167,139,250,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Cryptographic Anonymity</h3>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
            Voter signatures are hashed server-side with salted SHA-256 tokens. No personal identifiers, emails, or phone numbers are ever stored.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">True Consensus</h3>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
            From classroom topics and college fests to group direction, VoteSphere democratizes group consensus across all communities.
          </p>
        </div>
      </div>

      {/* Real-World Use Cases */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Engineered For Every Gathering
          </h2>
          <p className="text-xs sm:text-sm text-[#A5A0B5] mt-1">
            How educators, student leaders, and teams use VoteSphere daily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] space-y-3">
            <div className="flex items-center gap-2 text-[#C084FC] font-semibold text-xs uppercase tracking-wider">
              <School className="w-4 h-4" />
              <span>Classrooms &amp; Schools</span>
            </div>
            <h4 className="font-bold text-white text-base">Classroom Decisions</h4>
            <p className="text-xs text-[#A5A0B5] leading-relaxed">
              Teachers can project a QR code onto the screen: “Which topic should we review for tomorrow’s test?” Students scan and vote with a single tap.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] space-y-3">
            <div className="flex items-center gap-2 text-[#A855F7] font-semibold text-xs uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>Colleges &amp; Universities</span>
            </div>
            <h4 className="font-bold text-white text-base">Student Senate &amp; Fests</h4>
            <p className="text-xs text-[#A5A0B5] leading-relaxed">
              Organize class representative elections, select guest speakers, decide festival themes, and crowdsource campus facility suggestions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Clubs &amp; Organizations</span>
            </div>
            <h4 className="font-bold text-white text-base">Agile Team Decisions</h4>
            <p className="text-xs text-[#A5A0B5] leading-relaxed">
              Resolve debates on tech stacks, meeting times, project names, or club budget allocation without messy group chat threads.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#8B5CF6] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold font-display">Ready to collect opinions?</h3>
          <p className="text-violet-100 text-xs sm:text-sm">
            Explore live public polls right now without creating an account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExplore}
            className="min-h-[44px] px-6 py-3 rounded-xl bg-white text-violet-900 hover:bg-violet-50 font-semibold text-xs sm:text-sm transition-all shadow-md touch-target cursor-pointer"
          >
            Explore Active Polls
          </button>
          {isAdmin && onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="min-h-[44px] px-5 py-3 rounded-xl bg-black/25 hover:bg-black/40 text-white font-medium text-xs sm:text-sm transition-all border border-white/20 touch-target cursor-pointer"
            >
              + Create Poll
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
