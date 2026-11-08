import React, { useState } from 'react';
import { adminLogin, applyAdminAccess, setupAdminAccount } from '../lib/api.js';
import { OwnerInfo } from '../types.js';
import { Lock, Mail, KeyRound, ShieldAlert, ArrowRight, AlertCircle, Eye, EyeOff, UserPlus, CheckCircle2, FileText, User } from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: (owner?: OwnerInfo) => void;
  onNavigateHome: () => void;
}

type AuthTab = 'login' | 'apply' | 'setup';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply form state
  const [applyFullName, setApplyFullName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Setup form state
  const [setupToken, setSetupToken] = useState('');
  const [setupFullName, setSetupFullName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your administrator email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await adminLogin(email.trim(), password.trim());
      onLoginSuccess(result.owner);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Access denied: Invalid administrator credentials or account not approved.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyFullName.trim() || !applyEmail.trim() || !applyReason.trim()) {
      setApplyError('Please fill in all required fields.');
      return;
    }

    setApplyLoading(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const result = await applyAdminAccess({
        fullName: applyFullName.trim(),
        email: applyEmail.trim(),
        requestDetails: applyReason.trim()
      });
      setApplySuccess(result.message || 'Application submitted successfully! The Super Owner will review your request.');
      setApplyFullName('');
      setApplyEmail('');
      setApplyReason('');
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupToken.trim() || !setupPassword.trim()) {
      setSetupError('Invitation token and password are required.');
      return;
    }
    if (setupPassword.length < 8) {
      setSetupError('Password must be at least 8 characters in length.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Passwords do not match.');
      return;
    }

    setSetupLoading(true);
    setSetupError(null);
    setSetupSuccess(null);
    try {
      const result = await setupAdminAccount({
        invitationToken: setupToken.trim(),
        password: setupPassword.trim(),
        fullName: setupFullName.trim() || undefined
      });
      setSetupSuccess(result.message || 'Account setup completed successfully! You can now log in.');
      setSetupToken('');
      setSetupPassword('');
      setSetupConfirmPassword('');
      setTimeout(() => {
        setActiveTab('login');
      }, 2000);
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : 'Failed to complete account setup.');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.22)] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#A855F7] text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-500/25">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-display">
            VoteSphere Administrator Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A0B5] max-w-sm mx-auto leading-relaxed">
            Multi-tier role management with permanent Super Owner authorization and approval controls.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-[#100D20] p-1.5 rounded-2xl border border-[rgba(167,139,250,0.18)]">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`min-h-[38px] text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-violet-500/20'
                : 'text-[#A5A0B5] hover:text-white hover:bg-white/5'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('apply'); setApplyError(null); }}
            className={`min-h-[38px] text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'apply'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-violet-500/20'
                : 'text-[#A5A0B5] hover:text-white hover:bg-white/5'
            }`}
          >
            Apply for Access
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('setup'); setSetupError(null); }}
            className={`min-h-[38px] text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'setup'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-violet-500/20'
                : 'text-[#A5A0B5] hover:text-white hover:bg-white/5'
            }`}
          >
            Setup Account
          </button>
        </div>

        {/* TAB 1: SIGN IN */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Super Owner & Administrators:</strong> Only the single provisioned Super Owner and approved active administrators can access this portal.
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@votesphere.app"
                    autoComplete="email"
                    required
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] shadow-md shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Authenticate</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: APPLY FOR ACCESS */}
        {activeTab === 'apply' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-xs text-violet-200 flex items-start gap-2.5">
              <UserPlus className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Pending Approval System:</strong> All applications enter <code className="px-1 py-0.5 bg-violet-900/60 rounded text-[11px] font-mono">PENDING_APPROVAL</code>. Only the Super Owner can approve applications and assign permissions.
              </div>
            </div>

            {applySuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-snug">{applySuccess}</span>
              </div>
            )}

            {applyError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{applyError}</span>
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={applyFullName}
                    onChange={e => setApplyFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Work / Candidate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={applyEmail}
                    onChange={e => setApplyEmail(e.target.value)}
                    placeholder="alex@organization.org"
                    required
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Access Reason & Context
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <textarea
                    rows={3}
                    value={applyReason}
                    onChange={e => setApplyReason(e.target.value)}
                    placeholder="Explain your team role, organization, and why administrator access is requested..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={applyLoading || !applyFullName.trim() || !applyEmail.trim() || !applyReason.trim()}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] shadow-md shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {applyLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </span>
                ) : (
                  <span>Submit Application to Super Owner</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: COMPLETE SETUP */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Approved Account Setup:</strong> If you received an invitation token or your application was approved, configure your password here.
              </div>
            </div>

            {setupSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-snug">{setupSuccess}</span>
              </div>
            )}

            {setupError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Invitation / Setup Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={setupToken}
                    onChange={e => setSetupToken(e.target.value)}
                    placeholder="vs_inv_..."
                    required
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={setupFullName}
                    onChange={e => setSetupFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Create Master Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(!showSetupPassword)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupConfirmPassword}
                    onChange={e => setSetupConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] font-mono transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={setupLoading || !setupToken.trim() || !setupPassword.trim() || setupPassword.length < 8}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {setupLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Configuring Account...</span>
                  </span>
                ) : (
                  <span>Activate Administrator Account</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back to Public Voting */}
        <div className="pt-2 text-center border-t border-[rgba(167,139,250,0.18)]">
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] inline-flex items-center justify-center text-xs font-medium text-[#A5A0B5] hover:text-white transition-colors cursor-pointer"
          >
            &larr; Return to Public Voting
          </button>
        </div>
      </div>
    </div>
  );
};
