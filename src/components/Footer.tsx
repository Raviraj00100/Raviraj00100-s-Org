import React from 'react';
import { Logo } from './Logo.js';
import { ShieldCheck, Heart, Download } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.js';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenCreate?: () => void;
  isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCreate, isAdmin }) => {
  return (
    <footer className="border-t border-[rgba(167,139,250,0.18)] bg-[#090714] py-12 text-[#A5A0B5] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-5 space-y-3">
            <Logo size="md" showTagline={true} />
            <p className="text-sm text-[#A5A0B5] max-w-sm leading-relaxed">
              Every Vote. Every Voice. Every Choice. VoteSphere enables immediate consensus for classrooms, universities, clubs, and communities without passwords or mandatory accounts.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-tracking, privacy-first cryptographic token hashing</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-2">
            <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Platform Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  Home &amp; Live Tally
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  Explore Public Polls
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('suggestions')}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  Community Suggestions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  About VoteSphere
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition-colors cursor-pointer py-1"
                >
                  Privacy &amp; Security Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-[#C084FC] transition-colors flex items-center gap-1 font-medium text-slate-300 py-1 cursor-pointer"
                >
                  <span>{isAdmin ? 'Admin Control Center' : 'Owner Admin Portal'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* PWA & Security Guarantees */}
          <div className="md:col-span-4 space-y-3">
            <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Mobile Web App
            </div>
            <p className="leading-relaxed text-[#A5A0B5] text-xs">
              Install VoteSphere directly to your Android or iOS home screen for an ultra-fast, app-like voting experience anytime.
            </p>
            <div className="pt-1">
              <PWAInstallButton />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[rgba(167,139,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} VoteSphere. Open. Create. Share. Vote.
          </div>
          <div className="flex items-center gap-1">
            <span>Built for open classrooms &amp; vibrant student communities</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
