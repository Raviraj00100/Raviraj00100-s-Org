import React, { useState, useEffect } from 'react';
import {
  Poll,
  Suggestion,
  IdeaStatus,
  SecurityAuditLog,
  OwnerInfo,
  AdminUser,
  AdminPermission,
  AdminStats,
  AdminAccountStatus,
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS
} from '../types.js';
import {
  fetchAdminPolls,
  fetchSuggestions,
  updateSuggestionStatus,
  deletePoll,
  updatePollSettings,
  clearAdminToken,
  fetchSecurityAuditLogs,
  getOwnerInfo,
  fetchAdminUsers,
  fetchAdminStats,
  inviteAdminUser,
  approveAdminUser,
  rejectAdminUser,
  suspendAdminUser,
  reactivateAdminUser,
  removeAdminUser,
  updateAdminUserPermissions
} from '../lib/api.js';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Lock,
  Trash2,
  ExternalLink,
  Copy,
  BarChart3,
  LogOut,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  Layers,
  FileText,
  Sliders,
  UserCheck,
  UserX,
  Key,
  Shield,
  Send,
  UserPlus,
  UserMinus,
  Check,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  onOpenCreatePoll: () => void;
  onManagePoll: (pollId: string) => void;
  onViewPoll: (pollId: string) => void;
  onViewResults: (pollId: string) => void;
  onLogout: () => void;
  owner?: OwnerInfo | null;
}

type AdminSection = 'overview' | 'polls' | 'admins' | 'analytics' | 'audit' | 'ideas' | 'settings' | 'profile';

const PERMISSION_DETAILS: Record<AdminPermission, { label: string; desc: string }> = {
  'dashboard.view': { label: 'View Dashboard', desc: 'Access platform overview and dashboard metrics' },
  'polls.create': { label: 'Create Polls', desc: 'Create new ballots and publish to platform' },
  'polls.edit': { label: 'Edit Polls', desc: 'Edit poll options, title, and open/close status' },
  'polls.delete': { label: 'Delete Polls', desc: 'Permanently remove polls from the system' },
  'polls.view_results': { label: 'View Analytics', desc: 'Access voting counts and breakdown metrics' },
  'polls.moderate': { label: 'Moderate Ideas', desc: 'Review suggestions and update idea status' },
  'admins.invite': { label: 'Invite Admins', desc: 'Generate invitation links for potential administrators' },
  'admins.approve': { label: 'Approve Admins', desc: 'Approve or reject candidate administrator requests' },
  'admins.suspend': { label: 'Suspend Admins', desc: 'Temporarily freeze administrator account access' },
  'admins.remove': { label: 'Remove Admins', desc: 'Permanently revoke and delete administrator accounts' },
  'settings.manage': { label: 'System Settings', desc: 'Configure global security and platform controls' },
  'audit_logs.view': { label: 'Security Logs', desc: 'Inspect real-time security audit trails' }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenCreatePoll,
  onManagePoll,
  onViewPoll,
  onViewResults,
  onLogout,
  owner
}) => {
  const currentOwner = owner || getOwnerInfo();
  const isSuperOwner = currentOwner?.role === 'super_owner' || (!currentOwner?.role && currentOwner?.email === 'rajravi000100@gmail.com');
  const userPermissions: AdminPermission[] = isSuperOwner ? ALL_ADMIN_PERMISSIONS : (currentOwner?.permissions || []);

  const hasPerm = (p: AdminPermission) => isSuperOwner || userPermissions.includes(p);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [adminTabFilter, setAdminTabFilter] = useState<'all' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [copiedPollId, setCopiedPollId] = useState<string | null>(null);

  // Modals for Admin Management
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteDetails, setInviteDetails] = useState('');
  const [invitePerms, setInvitePerms] = useState<AdminPermission[]>([...DEFAULT_ADMIN_PERMISSIONS]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<string | null>(null);

  const [reviewAdmin, setReviewAdmin] = useState<AdminUser | null>(null);
  const [reviewPerms, setReviewPerms] = useState<AdminPermission[]>([...DEFAULT_ADMIN_PERMISSIONS]);
  const [reviewRejectReason, setReviewRejectReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [editPermsAdmin, setEditPermsAdmin] = useState<AdminUser | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<AdminPermission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const loadAuditLogs = async () => {
    if (!hasPerm('audit_logs.view')) return;
    setLoadingLogs(true);
    try {
      const logs = await fetchSecurityAuditLogs();
      setAuditLogs(logs);
    } catch (err: unknown) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAdminDirectory = async () => {
    if (!isSuperOwner && !hasPerm('admins.invite') && !hasPerm('admins.approve')) return;
    setLoadingAdmins(true);
    try {
      const [users, stats] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminStats()
      ]);
      setAdminUsers(users);
      setAdminStats(stats);
    } catch (err: unknown) {
      console.error('Failed to load administrators:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises: [Promise<Poll[]>, Promise<Suggestion[]>, Promise<SecurityAuditLog[]>, Promise<AdminUser[]>, Promise<AdminStats>] = [
        fetchAdminPolls(),
        fetchSuggestions({ sort: 'newest' }),
        hasPerm('audit_logs.view') ? fetchSecurityAuditLogs().catch(() => []) : Promise.resolve([]),
        (isSuperOwner || hasPerm('admins.invite') || hasPerm('admins.approve')) ? fetchAdminUsers().catch(() => []) : Promise.resolve([]),
        fetchAdminStats().catch(() => ({ total: 1, active: 1, pending: 0, suspended: 0, rejected: 0 }))
      ];

      const [adminPolls, fetchedIdeas, logs, users, stats] = await Promise.all(promises);
      setPolls(adminPolls);
      setSuggestions(fetchedIdeas);
      setAuditLogs(logs);
      setAdminUsers(users);
      setAdminStats(stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load administrator dashboard data';
      if (msg.includes('authorization') || msg.includes('Access denied') || msg.includes('401') || msg.includes('403')) {
        clearAdminToken();
        onLogout();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (pollId: string) => {
    const voterUrl = `${window.location.origin}/#poll/${pollId}`;
    navigator.clipboard.writeText(voterUrl);
    setCopiedPollId(pollId);
    setTimeout(() => setCopiedPollId(null), 2000);
    showNotification('Public voting link copied to clipboard!');
  };

  const handleTogglePollStatus = async (poll: Poll) => {
    if (!hasPerm('polls.edit')) {
      showNotification('Access denied: You do not have permission to edit polls.');
      return;
    }
    const newStatus = poll.status === 'active' ? 'closed' : 'active';
    try {
      const updated = await updatePollSettings(poll.id, '', { status: newStatus });
      setPolls(prev => prev.map(p => p.id === poll.id ? updated : p));
      showNotification(`Poll is now ${newStatus === 'active' ? 'open for voting' : 'closed'}.`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to update poll status');
    }
  };

  const handleDelete = async (pollId: string, title: string) => {
    if (!hasPerm('polls.delete')) {
      showNotification('Access denied: You do not have permission to delete polls.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete poll "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deletePoll(pollId, '');
      setPolls(prev => prev.filter(p => p.id !== pollId));
      showNotification('Poll has been permanently deleted.');
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to delete poll');
    }
  };

  const handleStatusChangeIdea = async (ideaId: string, nextStatus: IdeaStatus) => {
    if (!hasPerm('polls.moderate')) {
      showNotification('Access denied: You do not have permission to moderate suggestions.');
      return;
    }
    try {
      const updated = await updateSuggestionStatus(ideaId, nextStatus);
      setSuggestions(prev => prev.map(s => s.id === ideaId ? updated : s));
      showNotification(`Idea status updated to ${nextStatus}.`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to update idea status');
    }
  };

  // --- Administrator Management Actions ---

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteFullName.trim()) return;
    setInviteLoading(true);
    try {
      const res = await inviteAdminUser({
        email: inviteEmail.trim(),
        fullName: inviteFullName.trim(),
        permissions: invitePerms,
        requestDetails: inviteDetails.trim() || undefined
      });
      if (res.invitationToken) {
        setGeneratedInviteToken(res.invitationToken);
      }
      showNotification(res.message || 'Invitation created successfully.');
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to invite administrator.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleApproveAdmin = async (admin: AdminUser) => {
    setReviewLoading(true);
    try {
      const res = await approveAdminUser(admin.id, reviewPerms);
      showNotification(res.message || `Administrator ${admin.fullName} approved.`);
      setReviewAdmin(null);
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to approve administrator.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRejectAdmin = async (admin: AdminUser) => {
    setReviewLoading(true);
    try {
      const res = await rejectAdminUser(admin.id, reviewRejectReason.trim() || undefined);
      showNotification(res.message || `Application for ${admin.fullName} rejected.`);
      setReviewAdmin(null);
      setReviewRejectReason('');
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to reject application.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSuspendAdmin = async (admin: AdminUser) => {
    if (admin.role === 'super_owner') {
      showNotification('Super Owner account cannot be suspended.');
      return;
    }
    const reason = window.prompt(`Enter reason for suspending administrator ${admin.fullName}:`, 'Administrative review');
    if (reason === null) return;
    try {
      const res = await suspendAdminUser(admin.id, reason);
      showNotification(res.message || `${admin.fullName} suspended.`);
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to suspend administrator.');
    }
  };

  const handleReactivateAdmin = async (admin: AdminUser) => {
    try {
      const res = await reactivateAdminUser(admin.id);
      showNotification(res.message || `${admin.fullName} reactivated.`);
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to reactivate administrator.');
    }
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (admin.role === 'super_owner') {
      showNotification('Super Owner account cannot be removed.');
      return;
    }
    if (!window.confirm(`Permanently remove administrator ${admin.fullName} (${admin.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await removeAdminUser(admin.id);
      showNotification(res.message || `${admin.fullName} removed.`);
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to remove administrator.');
    }
  };

  const handleSavePermissions = async () => {
    if (!editPermsAdmin) return;
    setSavingPerms(true);
    try {
      const res = await updateAdminUserPermissions(editPermsAdmin.id, selectedPerms);
      showNotification(res.message || `Permissions updated for ${editPermsAdmin.fullName}.`);
      setEditPermsAdmin(null);
      loadAdminDirectory();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Failed to update permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  // Filtered lists
  const filteredPolls = polls.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  });

  const filteredAdmins = adminUsers.filter(a => {
    if (adminTabFilter !== 'all' && a.status !== adminTabFilter) return false;
    if (!adminSearchQuery.trim()) return true;
    const q = adminSearchQuery.toLowerCase();
    return a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const totalVotesCast = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const activePollsCount = polls.filter(p => p.status === 'active').length;
  const pendingApprovalsCount = adminStats?.pending || adminUsers.filter(a => a.status === 'PENDING_APPROVAL').length;

  // Chart data
  const categoryStats = polls.reduce((acc: Record<string, number>, p) => {
    const cat = p.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));
  const COLORS = ['#8B5CF6', '#A855F7', '#C084FC', '#38BDF8', '#34D399', '#F472B6'];

  const pollVotesData = polls.slice(0, 6).map(p => ({
    name: p.title.length > 18 ? p.title.slice(0, 16) + '...' : p.title,
    votes: p.totalVotes
  }));

  // Role-aware Navigation Menu
  const navMenuItems: Array<{ id: AdminSection; label: string; icon: any; count?: number }> = isSuperOwner
    ? [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'polls', label: 'Manage Polls', icon: Layers, count: polls.length },
        { id: 'admins', label: 'Manage Administrators', icon: Users, count: pendingApprovalsCount },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert, count: auditLogs.length },
        { id: 'ideas', label: 'Community Ideas', icon: FileText, count: suggestions.length },
        { id: 'settings', label: 'Platform Settings', icon: Sliders }
      ]
    : [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'polls', label: 'Manage Polls', icon: Layers, count: polls.length },
        ...(hasPerm('polls.moderate') ? [{ id: 'ideas' as AdminSection, label: 'Community Ideas', icon: FileText, count: suggestions.length }] : []),
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'profile', label: 'My Permissions', icon: ShieldCheck, count: userPermissions.length }
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Banner & Account Role Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[rgba(167,139,250,0.18)]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2">
            {isSuperOwner ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Owner (Permanent)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Authorized Administrator</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#17122A] text-slate-300 font-mono text-[11px] border border-[rgba(167,139,250,0.2)]">
              {currentOwner?.email || 'rajravi000100@gmail.com'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-200 text-[11px] font-mono">
              {userPermissions.length} Active Permissions
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            VoteSphere Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#A5A0B5] mt-1">
            {isSuperOwner
              ? 'Super Owner control: invite administrators, review candidate applications, manage permissions, and inspect security logs.'
              : 'Authorized administrator console for ballot coordination and participation monitoring.'}
          </p>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {hasPerm('polls.create') && (
            <button
              onClick={onOpenCreatePoll}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Poll</span>
            </button>
          )}

          <button
            onClick={() => {
              clearAdminToken();
              onLogout();
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#A5A0B5] hover:text-rose-400 border border-[rgba(167,139,250,0.2)] hover:border-rose-400/50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="mb-6 p-4 rounded-xl bg-violet-950/60 border border-violet-500/40 text-xs font-medium text-violet-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Sidebar Navigation + Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-2 sticky top-24">
          <div className="p-3 bg-[#100D20] rounded-2xl border border-[rgba(167,139,250,0.18)] shadow-lg space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#A5A0B5]">
              Control Center
            </div>
            {navMenuItems.map(item => {
              const active = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.id === 'audit') loadAuditLogs();
                    if (item.id === 'admins') loadAdminDirectory();
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-violet-500/20'
                      : 'text-[#A5A0B5] hover:text-white hover:bg-[#17122A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                      active ? 'bg-white/20 text-white' : item.id === 'admins' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-[#17122A] text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Super Owner Fast Action */}
          {isSuperOwner && (
            <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm text-xs space-y-3">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-violet-400" />
                <span>Invite Administrator</span>
              </div>
              <p className="text-[#A5A0B5] text-[11px] leading-relaxed">
                Add trusted colleagues with custom permissions for ballot authoring and moderation.
              </p>
              <button
                onClick={() => {
                  setGeneratedInviteToken(null);
                  setShowInviteModal(true);
                }}
                className="w-full min-h-[40px] py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Generate Invitation</span>
              </button>
            </div>
          )}
        </aside>

        {/* Mobile Horizontal Section Tabs */}
        <div className="lg:hidden col-span-1 flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {navMenuItems.map(item => {
            const active = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === 'audit') loadAuditLogs();
                  if (item.id === 'admins') loadAdminDirectory();
                }}
                className={`min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md'
                    : 'bg-[#100D20] text-[#A5A0B5] border border-[rgba(167,139,250,0.18)] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-[#17122A] text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Workspace */}
        <div className="lg:col-span-9 space-y-6 w-full">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900 text-rose-300 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadDashboardData}
                className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-xs text-[#A5A0B5]">Total Polls</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1 tabular-nums">
                    {polls.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Universal ballots</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-xs text-[#A5A0B5]">Votes Cast</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-[#C084FC] mt-1 tabular-nums">
                    {totalVotesCast}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">100% Anonymous</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-xs text-[#A5A0B5]">Active Polls</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                    {activePollsCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Open for voting</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-xs text-[#A5A0B5]">{isSuperOwner ? 'Pending Approvals' : 'Community Ideas'}</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 mt-1 tabular-nums">
                    {isSuperOwner ? pendingApprovalsCount : suggestions.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isSuperOwner ? 'Admin candidate requests' : 'User proposals'}
                  </div>
                </div>
              </div>

              {/* Participation Chart Preview */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Voting Distribution</h3>
                    <p className="text-xs text-[#A5A0B5]">Top active polls by total participant turnouts</p>
                  </div>
                  <button
                    onClick={() => setActiveSection('analytics')}
                    className="text-xs font-semibold text-[#C084FC] hover:underline cursor-pointer"
                  >
                    View Details &rarr;
                  </button>
                </div>

                {polls.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#A5A0B5]">
                    No polls created yet. Click "Create Poll" to begin.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pollVotesData}>
                        <XAxis dataKey="name" stroke="#A5A0B5" fontSize={11} tickLine={false} />
                        <YAxis stroke="#A5A0B5" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#100D20',
                            border: '1px solid rgba(167,139,250,0.3)',
                            borderRadius: '12px',
                            color: '#FFFFFF'
                          }}
                        />
                        <Bar dataKey="votes" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: MANAGE POLLS */}
          {activeSection === 'polls' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search polls by title or description..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs text-white placeholder-[#A5A0B5] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active (Open)</option>
                    <option value="closed">Closed</option>
                  </select>

                  {hasPerm('polls.create') && (
                    <button
                      onClick={onOpenCreatePoll}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl hover:opacity-90 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Poll</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredPolls.length === 0 ? (
                <div className="py-12 text-center bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-6">
                  <p className="text-sm text-[#A5A0B5]">No polls found matching the current criteria.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPolls.map(poll => (
                    <div
                      key={poll.id}
                      className="p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A5A0B5] mb-1">
                          <span className="font-semibold text-[#C084FC]">{poll.category || 'General'}</span>
                          <span>·</span>
                          <span className="font-mono">{poll.totalVotes} votes cast</span>
                          <span>·</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            poll.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          }`}>
                            {poll.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{poll.title}</h4>
                        {poll.description && (
                          <p className="text-xs text-[#A5A0B5] mt-1 line-clamp-1">{poll.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyLink(poll.id)}
                          className="p-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-300 hover:text-white cursor-pointer"
                          title="Copy Voting Link"
                        >
                          {copiedPollId === poll.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => onViewPoll(poll.id)}
                          className="px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                        >
                          View
                        </button>

                        {hasPerm('polls.edit') && (
                          <button
                            onClick={() => handleTogglePollStatus(poll)}
                            className="px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                          >
                            {poll.status === 'active' ? 'Close Poll' : 'Reopen'}
                          </button>
                        )}

                        {hasPerm('polls.delete') && (
                          <button
                            onClick={() => handleDelete(poll.id, poll.title)}
                            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            title="Delete Poll"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: MANAGE ADMINISTRATORS (Super Owner Only / Multi-Admin Control) */}
          {activeSection === 'admins' && isSuperOwner && (
            <div className="space-y-6">
              {/* Top 5 Administrator Stat KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-[11px] text-[#A5A0B5]">Total Directory</div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">{adminStats?.total || adminUsers.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-[11px] text-[#A5A0B5]">Active Admins</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{adminStats?.active || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-[11px] text-[#A5A0B5]">Pending Review</div>
                  <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{adminStats?.pending || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm">
                  <div className="text-[11px] text-[#A5A0B5]">Suspended</div>
                  <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{adminStats?.suspended || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-[#A5A0B5]">Rejected</div>
                  <div className="text-2xl font-bold font-mono text-slate-400 mt-1">{adminStats?.rejected || 0}</div>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={e => setAdminSearchQuery(e.target.value)}
                    placeholder="Search administrators by name or email..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs text-white placeholder-[#A5A0B5] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={adminTabFilter}
                    onChange={e => setAdminTabFilter(e.target.value as any)}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  >
                    <option value="all">All Accounts ({adminUsers.length})</option>
                    <option value="PENDING_APPROVAL">Pending Review ({adminStats?.pending || 0})</option>
                    <option value="ACTIVE">Active Admins ({adminStats?.active || 0})</option>
                    <option value="SUSPENDED">Suspended ({adminStats?.suspended || 0})</option>
                    <option value="REJECTED">Rejected ({adminStats?.rejected || 0})</option>
                  </select>

                  <button
                    onClick={() => {
                      setGeneratedInviteToken(null);
                      setShowInviteModal(true);
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl hover:opacity-90 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Admin</span>
                  </button>
                </div>
              </div>

              {/* Administrator Table / List */}
              {loadingAdmins ? (
                <div className="py-12 text-center text-xs text-[#A5A0B5]">Loading administrator directory...</div>
              ) : filteredAdmins.length === 0 ? (
                <div className="py-12 text-center bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-6">
                  <p className="text-sm text-[#A5A0B5]">No administrators found matching current filters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdmins.map(admin => {
                    const isSelfSuperOwner = admin.role === 'super_owner';
                    const isPending = admin.status === 'PENDING_APPROVAL';
                    const isActive = admin.status === 'ACTIVE';
                    const isSuspended = admin.status === 'SUSPENDED';

                    return (
                      <div
                        key={admin.id}
                        className={`p-5 rounded-2xl bg-[#17122A] border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          isPending ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-[rgba(167,139,250,0.18)]'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm">{admin.fullName}</span>
                            <span className="text-xs text-[#A5A0B5] font-mono">({admin.email})</span>

                            {isSelfSuperOwner ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Super Owner (Permanent)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                Administrator
                              </span>
                            )}

                            {/* Status Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPending
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                : isActive
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                : isSuspended
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}>
                              {admin.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Request details / note */}
                          {admin.requestDetails && (
                            <p className="text-xs text-slate-300 italic">
                              "{admin.requestDetails}"
                            </p>
                          )}

                          {/* Permissions summary */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-[#A5A0B5] font-medium">Permissions:</span>
                            {isSelfSuperOwner ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-900/40 text-amber-200 text-[11px] font-mono">
                                All Platform Privileges (Immutable)
                              </span>
                            ) : admin.permissions.length === 0 ? (
                              <span className="text-[11px] text-slate-500">None assigned</span>
                            ) : (
                              admin.permissions.slice(0, 4).map(p => (
                                <span key={p} className="px-2 py-0.5 rounded-md bg-[#100D20] border border-[rgba(167,139,250,0.15)] text-[#C084FC] text-[10px] font-mono">
                                  {p}
                                </span>
                              ))
                            )}
                            {!isSelfSuperOwner && admin.permissions.length > 4 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                +{admin.permissions.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {isPending && (
                            <button
                              onClick={() => {
                                setReviewAdmin(admin);
                                setReviewPerms(admin.permissions && admin.permissions.length > 0 ? [...admin.permissions] : [...DEFAULT_ADMIN_PERMISSIONS]);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold shadow-md hover:opacity-90 cursor-pointer"
                            >
                              Review &amp; Approve
                            </button>
                          )}

                          {!isSelfSuperOwner && isActive && (
                            <>
                              <button
                                onClick={() => {
                                  setEditPermsAdmin(admin);
                                  setSelectedPerms([...admin.permissions]);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                              >
                                Edit Permissions
                              </button>

                              <button
                                onClick={() => handleSuspendAdmin(admin)}
                                className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold cursor-pointer"
                              >
                                Suspend
                              </button>
                            </>
                          )}

                          {!isSelfSuperOwner && isSuspended && (
                            <button
                              onClick={() => handleReactivateAdmin(admin)}
                              className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}

                          {!isSelfSuperOwner && (
                            <button
                              onClick={() => handleRemoveAdmin(admin)}
                              className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              title="Permanently Remove Administrator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-4">
                <h3 className="text-base font-bold text-white font-display">Poll Categories Breakdown</h3>
                <p className="text-xs text-[#A5A0B5]">Distribution of active polls by category</p>

                {pieData.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#A5A0B5]">No poll category data available</div>
                ) : (
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#100D20',
                            border: '1px solid rgba(167,139,250,0.3)',
                            borderRadius: '12px',
                            color: '#FFFFFF'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY AUDIT LOGS (Super Owner Only / Protected) */}
          {activeSection === 'audit' && hasPerm('audit_logs.view') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-violet-400" />
                    <span>Real-Time Security Audit Trail</span>
                  </h3>
                  <p className="text-xs text-[#A5A0B5] mt-0.5">
                    Immutable security log recording administrator actions, credential verification, and permission enforcement.
                  </p>
                </div>

                <button
                  onClick={loadAuditLogs}
                  disabled={loadingLogs}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-6">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-white">All systems secure</p>
                  <p className="text-xs text-[#A5A0B5] mt-1">No security warnings or unauthorized access events recorded.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map(log => {
                    const isFail = log.result === 'failure' || log.type === 'LOGIN_FAILED' || log.type === 'UNAUTHORIZED_ACCESS';
                    const isSuccess = log.result === 'success' || log.type === 'LOGIN_SUCCESS';

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isFail
                              ? 'bg-rose-500/15 text-rose-400'
                              : isSuccess
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-violet-500/15 text-violet-400'
                          }`}>
                            {isFail ? <AlertCircle className="w-4 h-4" /> : isSuccess ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                                isFail
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                                  : isSuccess
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                  : 'bg-[#100D20] text-slate-300 border border-[rgba(167,139,250,0.2)]'
                              }`}>
                                {log.type}
                              </span>

                              {log.action && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/40 font-mono text-[10px]">
                                  {log.action}
                                </span>
                              )}

                              {log.actorRole && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-[#100D20]">
                                  actor: {log.actorRole}
                                </span>
                              )}

                              {log.ip && (
                                <span className="font-mono text-[11px] text-[#A5A0B5]">
                                  IP: {log.ip}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-200 font-medium leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 shrink-0 self-end sm:self-center">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: COMMUNITY IDEAS */}
          {activeSection === 'ideas' && (
            <div className="space-y-4">
              <p className="text-xs text-[#A5A0B5]">
                Review community suggestions submitted by users and assign roadmap status.
              </p>

              {suggestions.length === 0 ? (
                <div className="py-12 text-center bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-6">
                  <p className="text-sm text-[#A5A0B5]">No community suggestions submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(sug => (
                    <div
                      key={sug.id}
                      className="p-5 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-[#A5A0B5] mb-1">
                          <span className="font-semibold text-[#C084FC]">{sug.category || 'General'}</span>
                          <span>·</span>
                          <span className="font-mono text-emerald-400 font-semibold">{sug.upvoteCount} upvotes</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{sug.title}</h4>
                        <p className="text-xs text-[#A5A0B5] mt-1 line-clamp-2">{sug.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#A5A0B5]">Status:</span>
                        <select
                          value={sug.status}
                          disabled={!hasPerm('polls.moderate')}
                          onChange={e => handleStatusChangeIdea(sug.id, e.target.value as IdeaStatus)}
                          className="px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] disabled:opacity-50"
                        >
                          <option value="New">New</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: PLATFORM SETTINGS (Super Owner Only) */}
          {activeSection === 'settings' && isSuperOwner && (
            <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-6">
              <div>
                <h3 className="text-base font-bold text-white font-display">Super Owner Platform Settings</h3>
                <p className="text-xs text-[#A5A0B5] mt-0.5">Platform governance, administrator approval policies, and cryptographic security</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="block text-white text-sm">Designated Super Owner</strong>
                    <span className="text-[#A5A0B5]">Single immutable owner account with absolute governance</span>
                  </div>
                  <span className="font-mono text-emerald-400 text-xs font-semibold">rajravi000100@gmail.com</span>
                </div>

                <div className="p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="block text-white text-sm">Multi-Administrator Approval Workflow</strong>
                    <span className="text-[#A5A0B5]">Candidates must be reviewed and approved by Super Owner before access</span>
                  </div>
                  <span className="font-mono text-amber-300 text-xs">Active &amp; Enforced</span>
                </div>

                <div className="p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="block text-white text-sm">Cryptographic Session Revocation</strong>
                    <span className="text-[#A5A0B5]">Suspension or removal takes effect instantly on the administrator's next request</span>
                  </div>
                  <span className="font-mono text-slate-300 text-xs">Dynamic DB-backed</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: MY ACCOUNT & PERMISSIONS (For Administrators) */}
          {activeSection === 'profile' && !isSuperOwner && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#A855F7] text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {currentOwner?.fullName?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{currentOwner?.fullName || 'Administrator'}</h3>
                    <p className="text-xs text-[#A5A0B5] font-mono">{currentOwner?.email}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.15)] text-xs text-slate-300">
                  <div className="font-semibold text-white mb-1">Limited Administrator Role</div>
                  <p className="text-[#A5A0B5] leading-relaxed">
                    Your account has been approved by the platform Super Owner with specific granted permissions. You cannot change your own role, invite or approve other administrators, or access Super Owner system settings.
                  </p>
                </div>
              </div>

              {/* Granted Permissions Matrix */}
              <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-white">Your Permission Matrix</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_ADMIN_PERMISSIONS.map(perm => {
                    const granted = userPermissions.includes(perm);
                    const info = PERMISSION_DETAILS[perm];

                    return (
                      <div
                        key={perm}
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                          granted
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-[#100D20] border-[rgba(167,139,250,0.1)] text-slate-500 opacity-60'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          granted ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {granted ? <Check className="w-3 h-3 stroke-[3]" /> : <Lock className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{info.label}</div>
                          <div className="text-[11px] mt-0.5 text-[#A5A0B5]">{info.desc}</div>
                          <div className="font-mono text-[10px] text-slate-400 mt-1">{perm}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL 1: INVITE ADMINISTRATOR MODAL --- */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.25)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(167,139,250,0.18)]">
              <div className="flex items-center gap-2 text-white font-bold text-lg font-display">
                <UserPlus className="w-5 h-5 text-violet-400" />
                <span>Invite New Administrator</span>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedInviteToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Invitation Generated Successfully!</span>
                  </div>
                  <p>Share this single-use setup token with the candidate so they can set their password:</p>
                  <div className="p-2.5 rounded-lg bg-[#100D20] border border-emerald-500/30 font-mono text-emerald-300 text-xs break-all select-all flex items-center justify-between gap-2">
                    <span>{generatedInviteToken}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInviteToken);
                        showNotification('Invitation token copied to clipboard!');
                      }}
                      className="p-1.5 rounded bg-emerald-600/40 hover:bg-emerald-600 text-white shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The recipient can complete setup at the Administrator Portal under "Setup Account".
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteFullName}
                    onChange={e => setInviteFullName(e.target.value)}
                    placeholder="Jordan Lee"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="jordan@domain.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Context / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteDetails}
                    onChange={e => setInviteDetails(e.target.value)}
                    placeholder="Student Government election manager"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Assign Permissions ({invitePerms.length} selected)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)]">
                    {ALL_ADMIN_PERMISSIONS.map(perm => {
                      const checked = invitePerms.includes(perm);
                      return (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setInvitePerms(invitePerms.filter(p => p !== perm));
                              } else {
                                setInvitePerms([...invitePerms, perm]);
                              }
                            }}
                            className="rounded border-[rgba(167,139,250,0.3)] bg-[#17122A] text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-white text-xs font-medium">{PERMISSION_DETAILS[perm].label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({perm})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim() || !inviteFullName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {inviteLoading ? 'Generating...' : 'Create Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: REVIEW CANDIDATE APPLICATION --- */}
      {reviewAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.25)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(167,139,250,0.18)]">
              <div className="flex items-center gap-2 text-white font-bold text-lg font-display">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>Review Candidate Application</span>
              </div>
              <button
                onClick={() => setReviewAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] space-y-2">
              <div>
                <span className="text-slate-400">Candidate Name: </span>
                <span className="text-white font-bold">{reviewAdmin.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="text-violet-300 font-mono">{reviewAdmin.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Application Date: </span>
                <span className="text-slate-300">{new Date(reviewAdmin.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Stated Reason / Context:</span>
                <p className="p-2.5 rounded-lg bg-[#17122A] text-slate-200 border border-[rgba(167,139,250,0.15)] italic">
                  "{reviewAdmin.requestDetails || 'No additional note provided'}"
                </p>
              </div>
            </div>

            {/* Grantable Permissions Checklist */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Grant Permissions Upon Approval ({reviewPerms.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)]">
                {ALL_ADMIN_PERMISSIONS.map(perm => {
                  const checked = reviewPerms.includes(perm);
                  return (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setReviewPerms(reviewPerms.filter(p => p !== perm));
                          } else {
                            setReviewPerms([...reviewPerms, perm]);
                          }
                        }}
                        className="rounded border-[rgba(167,139,250,0.3)] bg-[#17122A] text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-white text-xs">{PERMISSION_DETAILS[perm].label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({perm})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rejection Note */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Rejection Reason (Optional, only used if rejecting)
              </label>
              <input
                type="text"
                value={reviewRejectReason}
                onChange={e => setReviewRejectReason(e.target.value)}
                placeholder="Applicant did not meet verification criteria..."
                className="w-full px-3 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={reviewLoading}
                onClick={() => handleRejectAdmin(reviewAdmin)}
                className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-semibold cursor-pointer"
              >
                Reject Application
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAdmin(null)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reviewLoading || reviewPerms.length === 0}
                  onClick={() => handleApproveAdmin(reviewAdmin)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {reviewLoading ? 'Approving...' : 'Approve & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT PERMISSIONS MODAL --- */}
      {editPermsAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.25)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(167,139,250,0.18)]">
              <div>
                <h3 className="text-white font-bold text-lg font-display">Edit Administrator Permissions</h3>
                <p className="text-[#A5A0B5] text-xs">
                  {editPermsAdmin.fullName} ({editPermsAdmin.email})
                </p>
              </div>
              <button
                onClick={() => setEditPermsAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto p-2 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)]">
              {ALL_ADMIN_PERMISSIONS.map(perm => {
                const checked = selectedPerms.includes(perm);
                const info = PERMISSION_DETAILS[perm];

                return (
                  <label
                    key={perm}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      checked
                        ? 'bg-violet-950/30 border-violet-500/30 text-white'
                        : 'bg-[#17122A] border-[rgba(167,139,250,0.1)] text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setSelectedPerms(selectedPerms.filter(p => p !== perm));
                        } else {
                          setSelectedPerms([...selectedPerms, perm]);
                        }
                      }}
                      className="rounded border-[rgba(167,139,250,0.3)] bg-[#100D20] text-violet-600 focus:ring-violet-500 mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-white">{info.label}</div>
                      <div className="text-[11px] text-[#A5A0B5]">{info.desc}</div>
                      <div className="font-mono text-[10px] text-violet-400">{perm}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400 font-mono text-[11px]">
                {selectedPerms.length} of {ALL_ADMIN_PERMISSIONS.length} granted
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditPermsAdmin(null)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingPerms}
                  onClick={handleSavePermissions}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {savingPerms ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
