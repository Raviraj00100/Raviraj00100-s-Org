import React from 'react';
import { ShieldCheck, Lock, EyeOff, KeyRound, CheckCircle2, Server } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      title: 'Zero Login Required',
      desc: 'Participants vote immediately without giving up their phone number, email address, Google account, or identity.',
      icon: EyeOff,
      badge: 'Privacy-First'
    },
    {
      title: 'Cryptographic Hashing',
      desc: 'Anonymous SHA-256 tokens detect duplicate ballots on the same device without storing personal identifying records.',
      icon: Lock,
      badge: 'Tamper-Proof'
    },
    {
      title: 'Secret Creator Control Tokens',
      desc: 'Poll creators receive an unguessable private cryptographic management token to close or edit polls without needing a password.',
      icon: KeyRound,
      badge: 'Zero Passwords'
    },
    {
      title: 'Owner-Only Admin Gate',
      desc: 'Platform administration is restricted to the single verified owner account with constant-time HMAC verification and rate limiting.',
      icon: Server,
      badge: 'Strict Security'
    }
  ];

  return (
    <section className="py-12 sm:py-16 border-b border-[rgba(167,139,250,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Integrity &amp; Privacy Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
            Security and Transparency
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#A5A0B5] leading-relaxed">
            VoteSphere is architected from the ground up to guarantee honest democratic consensus while safeguarding voter privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm hover:border-[rgba(167,139,250,0.35)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center border border-[rgba(167,139,250,0.2)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-emerald-400">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[rgba(167,139,250,0.12)] flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Architecture</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
