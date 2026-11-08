import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 sm:py-24 text-center">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#17122A] border border-[rgba(167,139,250,0.22)] shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-[#A5A0B5] max-w-md mx-auto leading-relaxed">
          The poll, suggestion, or link you are trying to access does not exist or may have been removed.
        </p>

        <div className="pt-3">
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 active:scale-95 touch-target cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to VoteSphere Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
