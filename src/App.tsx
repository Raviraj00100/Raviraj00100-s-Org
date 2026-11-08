import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { HeroSection } from './components/HeroSection.js';
import { HowItWorks } from './components/HowItWorks.js';
import { FeaturedPolls } from './components/FeaturedPolls.js';
import { TrendingSuggestions } from './components/TrendingSuggestions.js';
import { ExplorePage } from './components/ExplorePage.js';
import { SuggestionsPage } from './components/SuggestionsPage.js';
import { VotingPage } from './components/VotingPage.js';
import { ResultsView } from './components/ResultsView.js';
import { ManagePollPage } from './components/ManagePollPage.js';
import { CreatePollStudio } from './components/CreatePollStudio.js';
import { AboutPage } from './components/AboutPage.js';
import { PrivacyPage } from './components/PrivacyPage.js';
import { MobileNav } from './components/MobileNav.js';
import { NotFoundPage } from './components/NotFoundPage.js';
import { Footer } from './components/Footer.js';
import { AdminLoginPage } from './components/AdminLoginPage.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { SecuritySection } from './components/SecuritySection.js';
import { OfflineIndicator } from './components/OfflineIndicator.js';
import { fetchPolls, fetchSuggestions, fetchSystemStats, isAdminLoggedIn, verifyAdminSession, clearAdminToken, getOwnerInfo } from './lib/api.js';
import { Poll, Suggestion, SystemStats, PollCreateResult, OwnerInfo } from './types.js';

interface RouteState {
  view: 'home' | 'create' | 'explore' | 'suggestions' | 'about' | 'privacy' | 'poll' | 'results' | 'manage' | 'admin' | 'notfound';
  paramId?: string;
  token?: string;
}

export default function App() {
  const [route, setRoute] = useState<RouteState>({ view: 'home' });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(isAdminLoggedIn());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [owner, setOwner] = useState<OwnerInfo | null>(getOwnerInfo());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<SystemStats | undefined>();

  // Check admin session validity on mount
  useEffect(() => {
    async function checkSession() {
      if (isAdminLoggedIn()) {
        try {
          const valid = await verifyAdminSession();
          setIsAdmin(valid);
          setOwner(valid ? getOwnerInfo() : null);
        } catch {
          setIsAdmin(false);
          setOwner(null);
        } finally {
          setIsAuthChecking(false);
        }
      } else {
        setIsAdmin(false);
        setOwner(null);
        setIsAuthChecking(false);
      }
    }
    checkSession();
  }, []);

  // Parse Hash Route
  const parseHash = () => {
    const rawHash = window.location.hash.replace(/^#/, '');
    const [path, queryString] = rawHash.split('?');
    const params = new URLSearchParams(queryString || '');
    const currentlyAdmin = isAdminLoggedIn();

    if (!path || path === 'home') {
      setRoute({ view: 'home' });
    } else if (path === 'admin' || path === 'admin/dashboard') {
      setRoute({ view: 'admin' });
    } else if (path === 'admin/create' || path === 'create') {
      // Guard: Public visitors entering #create or #admin/create must be authorized
      if (currentlyAdmin) {
        setRoute({ view: 'create' });
      } else {
        setRoute({ view: 'admin' });
      }
    } else if (path === 'explore') {
      setRoute({ view: 'explore' });
    } else if (path === 'suggestions') {
      setRoute({ view: 'suggestions' });
    } else if (path === 'about') {
      setRoute({ view: 'about' });
    } else if (path === 'privacy') {
      setRoute({ view: 'privacy' });
    } else if (path.startsWith('poll/')) {
      const id = path.replace('poll/', '');
      setRoute({ view: 'poll', paramId: id });
    } else if (path.startsWith('results/')) {
      const id = path.replace('results/', '');
      setRoute({ view: 'results', paramId: id });
    } else if (path.startsWith('manage/') || path.startsWith('admin/manage/')) {
      const id = path.replace(/^(admin\/)?manage\//, '');
      const token = params.get('token') || '';
      // If neither an active admin session nor creator token, guard access
      if (!currentlyAdmin && !token) {
        setRoute({ view: 'admin' });
      } else {
        setRoute({ view: 'manage', paramId: id, token });
      }
    } else {
      setRoute({ view: 'notfound' });
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {
        // Safe in restricted sandboxes
      }
    }
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [isAdmin]);

  // Fetch live ecosystem data
  useEffect(() => {
    loadEcosystemData();
  }, []);

  const loadEcosystemData = async () => {
    try {
      const [fetchedPolls, fetchedSuggestions, fetchedStats] = await Promise.all([
        fetchPolls({ visibility: 'public' }),
        fetchSuggestions({ sort: 'trending' }),
        fetchSystemStats()
      ]);
      setPolls(fetchedPolls);
      setSuggestions(fetchedSuggestions);
      setStats(fetchedStats);
    } catch (e) {
      console.error('Failed to load live data:', e);
    }
  };

  const navigateTo = (view: string, paramId?: string) => {
    if (view === 'home') {
      window.location.hash = '';
    } else if (view === 'create') {
      window.location.hash = isAdmin ? 'create' : 'admin';
    } else if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (view === 'explore') {
      window.location.hash = 'explore';
    } else if (view === 'suggestions') {
      window.location.hash = 'suggestions';
    } else if (view === 'about') {
      window.location.hash = 'about';
    } else if (view === 'privacy') {
      window.location.hash = 'privacy';
    } else if (view === 'poll' && paramId) {
      window.location.hash = `poll/${paramId}`;
    } else if (view === 'results' && paramId) {
      window.location.hash = `results/${paramId}`;
    } else if (view === 'manage' && paramId) {
      window.location.hash = `manage/${paramId}`;
    }
  };

  const handlePollCreated = (res: PollCreateResult) => {
    setPolls(prev => [res.poll, ...prev]);
    loadEcosystemData();
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAdmin(false);
    setOwner(null);
    window.location.hash = '';
    setRoute({ view: 'home' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090714] text-white transition-colors w-full overflow-x-hidden">
      {/* Offline Connectivity Status Toast */}
      <OfflineIndicator />

      {/* Top Bar Navigation */}
      <Navbar
        currentTab={route.view}
        onNavigate={(tab) => navigateTo(tab)}
        onOpenCreateModal={isAdmin ? () => navigateTo('create') : undefined}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full pb-20 md:pb-0">
        {route.view === 'home' && (
          <div>
            <HeroSection
              onOpenCreate={isAdmin ? () => navigateTo('create') : undefined}
              onExplore={() => navigateTo('explore')}
              onLearnMore={() => {
                const el = document.getElementById('how-it-works-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onSuggestions={() => navigateTo('suggestions')}
              stats={stats}
              isAdmin={isAdmin}
            />

            <FeaturedPolls
              polls={polls}
              onVote={(id) => navigateTo('poll', id)}
              onViewResults={(id) => navigateTo('results', id)}
              onViewAll={() => navigateTo('explore')}
              onCreatePoll={isAdmin ? () => navigateTo('create') : undefined}
              isAdmin={isAdmin}
            />

            <HowItWorks />

            <SecuritySection />

            <TrendingSuggestions
              suggestions={suggestions}
              onOpenCreateSuggestion={() => navigateTo('suggestions')}
              onViewAll={() => navigateTo('suggestions')}
            />
          </div>
        )}

        {/* Admin Login & Portal */}
        {route.view === 'admin' && (
          isAuthChecking ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-medium">Verifying owner authentication...</div>
            </div>
          ) : isAdmin ? (
            <AdminDashboard
              onOpenCreatePoll={() => navigateTo('create')}
              onManagePoll={(id) => navigateTo('manage', id)}
              onViewPoll={(id) => navigateTo('poll', id)}
              onViewResults={(id) => navigateTo('results', id)}
              onLogout={handleLogout}
              owner={owner}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={(loggedOwner) => {
                setIsAdmin(true);
                setIsAuthChecking(false);
                if (loggedOwner) setOwner(loggedOwner);
                window.location.hash = 'admin';
                setRoute({ view: 'admin' });
              }}
              onNavigateHome={() => navigateTo('home')}
            />
          )
        )}

        {/* Create Poll Studio (Restricted to Authorized Admins/Creators) */}
        {route.view === 'create' && (
          isAuthChecking ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-medium">Verifying owner authentication...</div>
            </div>
          ) : isAdmin ? (
            <CreatePollStudio
              onSuccessCreated={handlePollCreated}
              onCancel={() => navigateTo('admin')}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={(loggedOwner) => {
                setIsAdmin(true);
                setIsAuthChecking(false);
                if (loggedOwner) setOwner(loggedOwner);
                window.location.hash = 'create';
                setRoute({ view: 'create' });
              }}
              onNavigateHome={() => navigateTo('home')}
            />
          )
        )}

        {route.view === 'explore' && (
          <ExplorePage
            onVote={(id) => navigateTo('poll', id)}
            onViewResults={(id) => navigateTo('results', id)}
            onOpenCreate={isAdmin ? () => navigateTo('create') : undefined}
            isAdmin={isAdmin}
          />
        )}

        {route.view === 'suggestions' && (
          <SuggestionsPage />
        )}

        {route.view === 'about' && (
          <AboutPage
            onOpenCreate={isAdmin ? () => navigateTo('create') : undefined}
            onExplore={() => navigateTo('explore')}
            isAdmin={isAdmin}
          />
        )}

        {route.view === 'privacy' && (
          <PrivacyPage
            onNavigateHome={() => navigateTo('home')}
          />
        )}

        {/* Shared Poll URL -> Public Voting Page Only */}
        {route.view === 'poll' && route.paramId && (
          <VotingPage
            pollId={route.paramId}
            onViewResults={(id) => navigateTo('results', id)}
            onNavigateHome={() => navigateTo('home')}
          />
        )}

        {/* Public Results View (Subject to resultsVisibility restrictions) */}
        {route.view === 'results' && route.paramId && (
          <ResultsView
            pollId={route.paramId}
            onNavigateHome={() => navigateTo('home')}
            onBackToVote={(id) => navigateTo('poll', id)}
          />
        )}

        {/* Creator / Admin Poll Management Page */}
        {route.view === 'manage' && route.paramId && (
          <ManagePollPage
            pollId={route.paramId}
            creatorToken={route.token || ''}
            onNavigateHome={() => navigateTo(isAdmin ? 'admin' : 'home')}
            onViewResults={(id) => navigateTo('results', id)}
            onViewPoll={(id) => navigateTo('poll', id)}
          />
        )}

        {route.view === 'notfound' && (
          <NotFoundPage
            onNavigateHome={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Minimalist Footer */}
      <Footer
        onNavigate={(tab) => navigateTo(tab)}
        onOpenCreate={isAdmin ? () => navigateTo('create') : undefined}
        isAdmin={isAdmin}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileNav
        currentTab={route.view}
        onNavigate={(tab) => navigateTo(tab)}
        onOpenCreate={isAdmin ? () => navigateTo('create') : undefined}
        isAdmin={isAdmin}
      />
    </div>
  );
}
