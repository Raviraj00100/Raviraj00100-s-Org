import React from 'react';
import { Shield, Lock, EyeOff, Key, Database, AlertCircle, ArrowRight } from 'lucide-react';

interface PrivacyPageProps {
  onNavigateHome: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-10 sm:space-y-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
          <Shield className="w-4 h-4" />
          <span>Security &amp; Privacy Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Privacy Policy &amp; Integrity Principles
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#A5A0B5] leading-relaxed">
          VoteSphere was architected from day one on a strict premise: <strong className="text-white">your identity is your own business</strong>. Here is our complete, transparent technical explanation of how voting records and data are handled.
        </p>
      </div>

      {/* 4 Pillars of VoteSphere Privacy */}
      <div className="space-y-5 sm:space-y-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">1. Zero Personal Data Collected</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed sm:pl-12">
            VoteSphere has <strong className="text-white">no registration, no Google OAuth, no passwords, and no email or phone number requests</strong> for voters. We cannot sell, leak, or compromise your personal identity because we never ask for or store it.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">2. Cryptographic Salted SHA-256 Hashing</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed sm:pl-12">
            To prevent one person from repeatedly voting dozens of times on the same poll, an anonymous client token is generated in your browser and transmitted over HTTPS. The server combines this token with a server-side salt and hashes it with SHA-256. Only this irreversibly hashed signature is stored alongside the poll ID. It cannot be converted back into any device details.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">3. Secret Creator Tokens</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed sm:pl-12">
            Because there are no user accounts, poll creators receive a high-entropy secret management URL when publishing. Only someone with this secret key can close the poll, update visibility, or delete it. Save this key when creating a poll, as it cannot be recovered if lost.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">4. Public vs Unlisted Polls</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed sm:pl-12">
            Public polls are discoverable in the VoteSphere Explore directory. Unlisted polls are strictly private to individuals possessing the unique voting URL or QR code, making them ideal for confidential team or classroom ballots.
          </p>
        </div>
      </div>

      {/* Limitations Transparency */}
      <div className="p-5 rounded-2xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] text-xs text-[#A5A0B5] space-y-2">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-[#C084FC]" />
          <span>Practical Limitations Disclosure</span>
        </div>
        <p className="leading-relaxed">
          Because VoteSphere values maximum privacy and zero biometric or personal tracking, device token hashing is tied to browser storage. Clearing browser local storage or switching to a completely different incognito profile could technically allow an additional vote in low-friction informal polls. For high-stakes governmental elections, multi-factor national ID solutions are required. VoteSphere is designed for rapid consensus in schools, colleges, clubs, and modern workplaces.
        </p>
      </div>

      {/* Home Return */}
      <div className="pt-4 border-t border-[rgba(167,139,250,0.18)]">
        <button
          onClick={onNavigateHome}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all touch-target cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Return to VoteSphere Home</span>
        </button>
      </div>
    </div>
  );
};
