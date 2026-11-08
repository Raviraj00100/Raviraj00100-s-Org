import React from 'react';
import { Sparkles, Compass, Plus, MessageSquareText, Info, Lock, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenCreate?: () => void;
  isAdmin?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onNavigate, onOpenCreate, isAdmin }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100D20]/95 backdrop-blur-xl border-t border-[rgba(167,139,250,0.18)] shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 transition-colors touch-target ${
            currentTab === 'home'
              ? 'text-[#C084FC] font-semibold'
              : 'text-[#A5A0B5] hover:text-white'
          }`}
          aria-label="Home"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Explore */}
        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 transition-colors touch-target ${
            currentTab === 'explore'
              ? 'text-[#C084FC] font-semibold'
              : 'text-[#A5A0B5] hover:text-white'
          }`}
          aria-label="Explore Polls"
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Explore</span>
        </button>

        {/* Center Button: If Admin, show Create (+); If public, show Ideas */}
        {isAdmin && onOpenCreate ? (
          <div className="flex items-center justify-center -mt-6">
            <button
              onClick={onOpenCreate}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#8B5CF6] via-[#A855F7] to-[#C084FC] text-white flex items-center justify-center shadow-lg shadow-violet-500/35 active:scale-95 transition-transform touch-target border-2 border-[#100D20]"
              aria-label="Create New Poll"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('suggestions')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 transition-colors touch-target ${
              currentTab === 'suggestions'
                ? 'text-[#C084FC] font-semibold'
                : 'text-[#A5A0B5] hover:text-white'
            }`}
            aria-label="Community Suggestions"
          >
            <MessageSquareText className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Ideas</span>
          </button>
        )}

        {/* About */}
        <button
          onClick={() => onNavigate('about')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 transition-colors touch-target ${
            currentTab === 'about'
              ? 'text-[#C084FC] font-semibold'
              : 'text-[#A5A0B5] hover:text-white'
          }`}
          aria-label="About VoteSphere"
        >
          <Info className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">About</span>
        </button>

        {/* Admin Access (or Dashboard if logged in) */}
        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 transition-colors touch-target ${
            currentTab === 'admin'
              ? 'text-[#C084FC] font-semibold'
              : 'text-[#A5A0B5] hover:text-white'
          }`}
          aria-label="Admin Portal"
        >
          {isAdmin ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
          <span className="text-[10px] tracking-tight">{isAdmin ? 'Admin' : 'Owner'}</span>
        </button>
      </div>
    </div>
  );
};
