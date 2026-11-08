import React, { useState, useEffect, useRef } from 'react';
import { Poll } from '../types.js';
import { verifyCreatorManagement, updatePollSettings, deletePoll } from '../lib/api.js';
import { Shield, KeyRound, Lock, Unlock, Eye, EyeOff, Globe, LockKeyhole, Trash2, Download, Copy, Check, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

interface ManagePollPageProps {
  pollId: string;
  creatorToken: string;
  onNavigateHome: () => void;
  onViewResults: (pollId: string) => void;
  onViewPoll: (pollId: string) => void;
}

export const ManagePollPage: React.FC<ManagePollPageProps> = ({
  pollId,
  creatorToken,
  onNavigateHome,
  onViewResults,
  onViewPoll
}) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadManagement();
  }, [pollId, creatorToken]);

  const loadManagement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyCreatorManagement(pollId, creatorToken);
      setPoll(res.poll);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unauthorized creator management token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poll && qrCanvasRef.current) {
      const votingUrl = `${window.location.origin}/#poll/${poll.id}`;
      QRCode.toCanvas(qrCanvasRef.current, votingUrl, {
        width: 160,
        margin: 2
      });
    }
  }, [poll]);

  const handleToggleStatus = async () => {
    if (!poll) return;
    const nextStatus = poll.status === 'active' ? 'closed' : 'active';
    try {
      const updated = await updatePollSettings(pollId, creatorToken, { status: nextStatus });
      setPoll(updated);
      showNotice(`Poll is now ${nextStatus === 'active' ? 'open for voting' : 'closed'}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleToggleVisibility = async () => {
    if (!poll) return;
    const nextVisibility = poll.visibility === 'public' ? 'unlisted' : 'public';
    try {
      const updated = await updatePollSettings(pollId, creatorToken, { visibility: nextVisibility });
      setPoll(updated);
      showNotice(`Poll visibility changed to ${nextVisibility}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  const handleToggleShowResults = async () => {
    if (!poll) return;
    const nextVal = !poll.showResultsBeforeClosure;
    try {
      const updated = await updatePollSettings(pollId, creatorToken, { showResultsBeforeClosure: nextVal });
      setPoll(updated);
      showNotice(`Live results visibility updated.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const handleDeletePoll = async () => {
    setIsDeleting(true);
    try {
      await deletePoll(pollId, creatorToken);
      alert('This poll has been permanently deleted.');
      onNavigateHome();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete poll');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCopyVotingLink = () => {
    if (!poll) return;
    const url = `${window.location.origin}/#poll/${poll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current || !poll) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `votesphere-qr-${poll.id}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A5A0B5]">Verifying creator token credentials...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.22)] shadow-xl">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Unauthorized Management Token</h2>
          <p className="text-xs sm:text-sm text-[#A5A0B5] mb-6">
            {error || 'You need the private creator link provided during poll creation to access management tools.'}
          </p>
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl touch-target cursor-pointer"
          >
            Return to VoteSphere Home
          </button>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === 'closed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onNavigateHome}
          className="min-h-[44px] text-xs font-medium text-[#A5A0B5] hover:text-white flex items-center gap-1.5 transition-colors touch-target self-start cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onViewPoll(poll.id)}
            className="min-h-[44px] text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
          >
            Open Voting View
          </button>
          <button
            onClick={() => onViewResults(poll.id)}
            className="min-h-[44px] text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
          >
            View Live Results
          </button>
        </div>
      </div>

      {/* Creator Notice Toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.22)] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-[rgba(167,139,250,0.18)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            <KeyRound className="w-4 h-4" />
            <span>Private Creator Dashboard</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-display leading-tight mb-2">
            {poll.title}
          </h1>

          <p className="text-xs text-[#A5A0B5]">
            Poll ID: <span className="font-mono text-slate-300">{poll.id}</span> · Created on {new Date(poll.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Action Controls Bento */}
        <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Status Control */}
          <div className="p-5 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5]">
                  Voting Status
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                  isClosed ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isClosed ? 'Closed' : 'Active & Accepting Votes'}
                </span>
              </div>
              <p className="text-xs text-[#A5A0B5] mb-4 leading-relaxed">
                {isClosed ? 'Voting is locked. No more votes can be cast.' : 'Anyone with the link can cast an anonymous vote.'}
              </p>
            </div>

            <button
              onClick={handleToggleStatus}
              className={`min-h-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 touch-target cursor-pointer ${
                isClosed
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white'
              }`}
            >
              {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isClosed ? 'Reopen Voting' : 'Close Voting Now'}</span>
            </button>
          </div>

          {/* Visibility Control */}
          <div className="p-5 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5]">
                  Directory Visibility
                </span>
                <span className="text-xs font-bold capitalize text-[#C084FC]">
                  {poll.visibility}
                </span>
              </div>
              <p className="text-xs text-[#A5A0B5] mb-4 leading-relaxed">
                {poll.visibility === 'public'
                  ? 'Public polls appear on the Explore page and search.'
                  : 'Unlisted polls are secret and only accessible via direct link.'}
              </p>
            </div>

            <button
              onClick={handleToggleVisibility}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-[rgba(167,139,250,0.2)] bg-[#17122A] hover:bg-[#1E1738] text-white flex items-center justify-center gap-2 transition-all active:scale-95 touch-target cursor-pointer"
            >
              {poll.visibility === 'public' ? <LockKeyhole className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Switch to {poll.visibility === 'public' ? 'Unlisted' : 'Public'}</span>
            </button>
          </div>

          {/* Results Visibility */}
          <div className="p-5 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5]">
                  Live Results Display
                </span>
                <span className="text-xs font-bold text-white">
                  {poll.showResultsBeforeClosure ? 'Visible to Voters' : 'Hidden until Close'}
                </span>
              </div>
              <p className="text-xs text-[#A5A0B5] mb-4 leading-relaxed">
                Control whether voters can view tally percentages immediately after casting their vote.
              </p>
            </div>

            <button
              onClick={handleToggleShowResults}
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-[rgba(167,139,250,0.2)] bg-[#17122A] hover:bg-[#1E1738] text-white flex items-center justify-center gap-2 transition-all active:scale-95 touch-target cursor-pointer"
            >
              {poll.showResultsBeforeClosure ? <EyeOff className="w-3.5 h-3.5 text-[#C084FC]" /> : <Eye className="w-3.5 h-3.5 text-[#C084FC]" />}
              <span>{poll.showResultsBeforeClosure ? 'Hide Results from Voters' : 'Make Results Visible'}</span>
            </button>
          </div>

          {/* Share & QR Assets */}
          <div className="p-5 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5] mb-2">
                Voting Link &amp; Presentation QR
              </div>
              <p className="text-xs text-[#A5A0B5] mb-3 leading-relaxed">
                Download the QR code for projector slides or campus posters.
              </p>
              <div className="hidden">
                <canvas ref={qrCanvasRef} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleCopyVotingLink}
                className="min-h-[44px] w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Voting Link'}</span>
              </button>
              <button
                onClick={handleDownloadQR}
                className="min-h-[44px] w-full sm:w-auto py-2.5 px-3.5 rounded-xl text-xs font-semibold border border-[rgba(167,139,250,0.2)] bg-[#17122A] hover:bg-[#1E1738] text-white flex items-center justify-center gap-1.5 transition-colors touch-target cursor-pointer"
                title="Download QR image"
              >
                <Download className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>QR PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-5 sm:p-7 bg-rose-950/20 border-t border-rose-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-300">
                Permanently Delete Poll
              </h3>
              <p className="text-xs text-rose-400/80 mt-0.5 leading-relaxed">
                Irreversible. Erases the poll question, all choices, and all recorded votes permanently.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800 hover:bg-rose-900/40 transition-colors whitespace-nowrap self-start sm:self-auto touch-target cursor-pointer"
              >
                Delete Poll...
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[44px] px-3 py-2 text-xs text-[#A5A0B5] hover:text-white touch-target cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePoll}
                  disabled={isDeleting}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 touch-target cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
