import React, { useState, useEffect } from 'react';
import { Logo } from './Logo.js';
import { PWAInstallButton } from './PWAInstallButton.js';
import { Sun, Moon, Plus, Compass, MessageSquareText, Sparkles, Menu, X, Info, ShieldCheck, Lock, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenCreateModal?: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenCreateModal, isAdmin, onLogout }) => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let savedTheme: string | null = null;
    let prefersDark = true;
    try {
      savedTheme = localStorage.getItem('votesphere_theme');
      prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      // Sandbox-safe
    }
    const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    try {
      if (newDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('votesphere_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('votesphere_theme', 'light');
      }
    } catch {
      if (newDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'explore', label: 'Explore Polls', icon: Compass },
    { id: 'suggestions', label: 'Community Suggestions', icon: MessageSquareText },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[rgba(167,139,250,0.18)] bg-[#090714]/85 dark:bg-[#090714]/90 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Brand Logo */}
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-xl text-left shrink-0 cursor-pointer touch-target"
              aria-label="VoteSphere Home"
            >
              <Logo size="md" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              {navItems.map(item => {
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'text-[#C084FC] font-semibold'
                        : 'text-[#A5A0B5] hover:text-white'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions & Utilities */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* In-App PWA Install Button (desktop / tablet) */}
              <div className="hidden lg:block">
                <PWAInstallButton />
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] cursor-pointer"
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Authorized Admin Button or Portal link */}
              {isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('admin')}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl hover:bg-emerald-900/40 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Center</span>
                  </button>

                  {onOpenCreateModal && (
                    <button
                      onClick={onOpenCreateModal}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-md shadow-violet-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Create Poll</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('admin')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#A5A0B5] hover:text-white hover:bg-[#17122A] rounded-xl transition-colors border border-transparent hover:border-[rgba(167,139,250,0.18)] cursor-pointer"
                  title="Owner & Administrator Portal"
                >
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Admin</span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-11 h-11 rounded-xl text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-violet-400" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-sm h-full bg-[#100D20] border-r border-[rgba(167,139,250,0.22)] shadow-2xl p-6 flex flex-col justify-between z-10 overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[rgba(167,139,250,0.15)] mb-6">
                <Logo size="sm" showTagline={false} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#17122A] transition-colors touch-target flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5" aria-label="Mobile Navigation">
                {navItems.map(item => {
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                        active
                          ? 'bg-[#17122A] text-white border border-[rgba(167,139,250,0.3)] shadow-sm'
                          : 'text-[#A5A0B5] hover:text-white hover:bg-[#17122A]/60'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? 'text-[#C084FC]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Admin Access Section */}
              <div className="mt-6 pt-6 border-t border-[rgba(167,139,250,0.15)] space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A5A0B5] px-2 mb-2">
                  Administration
                </div>
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[48px] flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                    currentTab === 'admin'
                      ? 'bg-[#17122A] text-white border border-[rgba(167,139,250,0.3)]'
                      : 'text-[#A5A0B5] hover:text-white hover:bg-[#17122A]/60'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-violet-400" />}
                  <span>{isAdmin ? 'Admin Control Center' : 'Owner Admin Portal'}</span>
                </button>

                {isAdmin && onOpenCreateModal && (
                  <button
                    onClick={() => {
                      onOpenCreateModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] shadow-md shadow-violet-500/20"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create New Poll</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Bottom: App Install CTA */}
            <div className="pt-6 border-t border-[rgba(167,139,250,0.15)]">
              <PWAInstallButton variant="banner" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
