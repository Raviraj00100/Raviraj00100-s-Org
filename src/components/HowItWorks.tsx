import React from 'react';
import { PenTool, Link2, BarChart3, KeyRound } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Craft Your Question',
      description: 'Define your poll question, enter voting options, choose single or multi-select, and set an optional closing timer. Zero accounts or phone verification required.',
      icon: PenTool,
      highlight: 'Zero sign-up barrier'
    },
    {
      num: '02',
      title: 'Share the Link or QR Code',
      description: 'Drop the direct voting link into your classroom group, campus Discord, WhatsApp, or Slack. Project the QR code on your classroom or auditorium display.',
      icon: Link2,
      highlight: 'Instant multi-device access'
    },
    {
      num: '03',
      title: 'Anonymous Real-Time Voting',
      description: 'Participants vote with a single tap. Cryptographic device hashing prevents duplicate ballots while preserving absolute voter privacy and anonymity.',
      icon: BarChart3,
      highlight: 'Anti-duplicate protection'
    },
    {
      num: '04',
      title: 'Secret Creator Control Link',
      description: 'Creators receive an autonomous management link upon creation to close voting early, monitor participation, or delete the poll at any time without passwords.',
      icon: KeyRound,
      highlight: 'Autonomous control'
    }
  ];

  return (
    <section id="how-it-works-section" className="py-12 sm:py-16 border-b border-[rgba(167,139,250,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
            Simplicity by Design
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
            How VoteSphere Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#A5A0B5]">
            Engineered for classrooms, university elections, student clubs, and everyday consensus — without the friction of passwords or mandatory emails.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative bg-[#17122A] border border-[rgba(167,139,250,0.18)] rounded-2xl p-5 sm:p-6 transition-all hover:border-[rgba(167,139,250,0.35)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-extrabold text-[#C084FC] tabular-nums">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center text-[#C084FC] border border-[rgba(167,139,250,0.2)]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[rgba(167,139,250,0.12)] text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
