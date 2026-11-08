import React, { useState, useEffect } from 'react';
import { Poll } from '../types.js';
import { fetchPollById, submitVote } from '../lib/api.js';
import { Check, CheckCircle2, Clock, Users, ArrowRight, Share2, AlertCircle, BarChart3, Lock, ShieldCheck, QrCode, Copy, Sparkles, Layers, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

interface VotingPageProps {
  pollId: string;
  onViewResults: (pollId: string) => void;
  onNavigateHome: () => void;
}

export const VotingPage: React.FC<VotingPageProps> = ({ pollId, onViewResults, onNavigateHome }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [userSelectedIds, setUserSelectedIds] = useState<string[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState<boolean>(false);
  const [isChangingVote, setIsChangingVote] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const qrCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadPoll();
  }, [pollId]);

  const loadPoll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPollById(pollId);
      setPoll(data);
      setHasVoted(data.hasVoted);
      if (data.userSelectedOptionIds) {
        setUserSelectedIds(data.userSelectedOptionIds);
        setSelectedOptionIds(data.userSelectedOptionIds);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showShareModal && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, window.location.href, {
        width: 180,
        margin: 2
      });
    }
  }, [showShareModal]);

  const toggleSelectOption = (optionId: string) => {
    if ((hasVoted && !isChangingVote) || !poll || poll.status === 'closed') return;

    if (poll.allowMultipleChoices) {
      if (selectedOptionIds.includes(optionId)) {
        setSelectedOptionIds(selectedOptionIds.filter(id => id !== optionId));
      } else {
        setSelectedOptionIds([...selectedOptionIds, optionId]);
      }
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const handleVoteSubmit = async () => {
    if (selectedOptionIds.length === 0) {
      setError('Please choose at least one option to cast your ballot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitVote(pollId, selectedOptionIds);
      setPoll(res.poll);
      setHasVoted(true);
      setJustVoted(true);
      setIsChangingVote(false);
      setUserSelectedIds(selectedOptionIds);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A5A0B5]">Loading anonymous voting session...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Poll Unavailable</h2>
          <p className="text-sm text-[#A5A0B5] mb-6">{error}</p>
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl touch-target cursor-pointer"
          >
            Return to VoteSphere Home
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const isClosed = poll.status === 'closed' || (poll.expiresAt && new Date(poll.expiresAt) <= new Date());
  const isCreatorOnly = poll.resultsVisibility === 'creator_only';
  const canShowResults = !isCreatorOnly && (
    poll.resultsVisibility === 'immediately' ||
    (poll.resultsVisibility === 'after_vote' && (hasVoted || isClosed)) ||
    (poll.showResultsBeforeClosure || isClosed)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back to Home & Share strip */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onNavigateHome}
          className="min-h-[44px] text-xs font-medium text-[#A5A0B5] hover:text-white flex items-center gap-1.5 transition-colors touch-target cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#100D20] text-xs font-medium text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-violet-400" />
          <span>Share Poll</span>
        </button>
      </div>

      {/* Main Poll Voting Container */}
      <div className="bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.22)] shadow-2xl overflow-hidden">
        {/* Cover image if available */}
        {poll.coverImage && (
          <div className="w-full h-44 sm:h-56 overflow-hidden border-b border-[rgba(167,139,250,0.18)] bg-[#100D20]">
            <img
              src={poll.coverImage}
              alt={poll.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header Details */}
        <div className="p-6 sm:p-8 border-b border-[rgba(167,139,250,0.15)]">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A5A0B5] mb-3">
            <span className="font-semibold text-[#C084FC]">
              {poll.category || 'General'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              {poll.totalVotes} {poll.totalVotes === 1 ? 'vote cast' : 'votes cast'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isClosed ? 'Poll Closed' : poll.expiresAt ? `Closes ${new Date(poll.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Open Voting'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              {poll.allowMultipleChoices ? 'Select multiple options' : 'Select one option'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display leading-tight mb-3">
            {poll.title}
          </h1>

          {/* Description */}
          {poll.description && (
            <p className="text-sm sm:text-base text-[#A5A0B5] leading-relaxed mb-4">
              {poll.description}
            </p>
          )}

          {/* Instructions Kicker */}
          <div className="p-3.5 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.15)] text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Instructions:</strong> Tap your preferred option below, review your selection, and cast your ballot. Your vote is 100% anonymous and cryptographically protected.
            </div>
          </div>

          {/* Already Voted Banner */}
          {hasVoted && !justVoted && (
            <div className="mt-4 p-4 rounded-xl bg-violet-950/40 border border-violet-800/60 text-violet-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C084FC] shrink-0" />
                <span>You have already cast your anonymous vote from this device.</span>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {poll.allowVoteChanges && !isClosed && !isChangingVote && (
                  <button
                    onClick={() => setIsChangingVote(true)}
                    className="font-bold text-[#C084FC] underline hover:text-white cursor-pointer min-h-[36px]"
                  >
                    Change Vote
                  </button>
                )}
                {canShowResults && (
                  <button
                    onClick={() => onViewResults(pollId)}
                    className="font-bold text-[#C084FC] underline hover:text-white cursor-pointer min-h-[36px]"
                  >
                    View Live Results
                  </button>
                )}
              </div>
            </div>
          )}

          {isChangingVote && (
            <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-200 text-xs flex items-center justify-between gap-3">
              <span>Select your updated choice and click Update Vote below.</span>
              <button
                onClick={() => {
                  setIsChangingVote(false);
                  setSelectedOptionIds(userSelectedIds);
                }}
                className="text-[#A5A0B5] hover:text-white underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Just Voted Confirmation Banner */}
          {justVoted && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block text-white">Ballot Confirmed!</strong>
                  <span>Your vote was securely recorded and cryptographically hashed.</span>
                </div>
              </div>
              {canShowResults && (
                <button
                  onClick={() => onViewResults(pollId)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm self-end sm:self-auto transition-colors cursor-pointer min-h-[36px]"
                >
                  View Live Results
                </button>
              )}
            </div>
          )}

          {isClosed && !hasVoted && (
            <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>This poll has reached its deadline and is no longer accepting new votes.</span>
            </div>
          )}
        </div>

        {/* Voting Options */}
        <div className="p-6 sm:p-8 space-y-3">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs font-semibold uppercase tracking-wider text-[#A5A0B5] mb-2 flex items-center justify-between">
            <span>
              {hasVoted && !isChangingVote ? 'Your Recorded Selection' : poll.allowMultipleChoices ? 'Select all choices that apply' : 'Choose one option'}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {selectedOptionIds.length} selected
            </span>
          </div>

          <div className="space-y-3">
            {poll.options.map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              const isUserCastVote = userSelectedIds.includes(opt.id);
              const percentage = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;

              return (
                <div
                  key={opt.id}
                  onClick={() => toggleSelectOption(opt.id)}
                  className={`relative w-full text-left p-4 sm:p-5 rounded-2xl border text-sm transition-all overflow-hidden min-h-[56px] touch-target ${
                    hasVoted && !isChangingVote || isClosed
                      ? 'cursor-default'
                      : 'cursor-pointer hover:border-[rgba(167,139,250,0.5)] active:scale-[0.99]'
                  } ${
                    isSelected || isUserCastVote
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/15 ring-1 ring-[#8B5CF6] text-white'
                      : 'border-[rgba(167,139,250,0.18)] bg-[#100D20] text-slate-300'
                  }`}
                >
                  {/* Results Bar Background if voting is complete or closed */}
                  {(hasVoted || isClosed) && canShowResults && (
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                        isUserCastVote
                          ? 'bg-violet-600/30'
                          : 'bg-slate-800/40'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Radio / Checkbox Indicator */}
                      <div
                        className={`w-6 h-6 flex items-center justify-center shrink-0 transition-colors ${
                          poll.allowMultipleChoices ? 'rounded-lg' : 'rounded-full'
                        } border ${
                          isSelected || isUserCastVote
                            ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-sm'
                            : 'border-slate-500 bg-[#17122A]'
                        }`}
                      >
                        {(isSelected || isUserCastVote) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className={`font-medium break-words leading-snug ${
                        isSelected || isUserCastVote ? 'text-white' : 'text-slate-200'
                      }`}>
                        {opt.text}
                      </span>
                    </div>

                    {/* Vote counts & percentage if permitted */}
                    {(hasVoted || isClosed) && canShowResults && (
                      <div className="flex items-center gap-3 shrink-0 text-xs font-mono tabular-nums text-[#A5A0B5]">
                        <span className="hidden sm:inline">{opt.voteCount} votes</span>
                        <span className="font-bold text-white w-10 text-right">{percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results visibility info */}
          <div className="pt-2 text-[11px] text-[#A5A0B5] flex items-center justify-between">
            <span>
              Visibility:{' '}
              {poll.resultsVisibility === 'immediately'
                ? 'Live tallies public to all voters'
                : poll.resultsVisibility === 'after_vote'
                ? 'Visible after casting your vote'
                : 'Hidden until poll closes'}
            </span>
            <span className="font-mono text-emerald-400">100% Anonymous</span>
          </div>

          {/* Submit Action Strip */}
          {(!hasVoted || isChangingVote) && !isClosed && (
            <div className="pt-6 mt-4 border-t border-[rgba(167,139,250,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#A5A0B5]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero login. One vote per device verified.</span>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                {isChangingVote && (
                  <button
                    onClick={() => {
                      setIsChangingVote(false);
                      setSelectedOptionIds(userSelectedIds);
                    }}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#A5A0B5] hover:text-white touch-target cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleVoteSubmit}
                  disabled={submitting || selectedOptionIds.length === 0}
                  className="flex-1 sm:flex-initial min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Recording Vote...</span>
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isChangingVote ? 'Update Ballot' : 'Cast Your Anonymous Vote'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* After vote actions */}
          {(hasVoted || isClosed) && !isChangingVote && (
            <div className="pt-6 mt-4 border-t border-[rgba(167,139,250,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-[#A5A0B5]">
                Total participation: <strong className="text-white font-mono">{poll.totalVotes}</strong> anonymous voters
              </span>

              {canShowResults && (
                <button
                  onClick={() => onViewResults(pollId)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl shadow-md shadow-violet-500/20 touch-target cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Full Interactive Charts</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#100D20] rounded-2xl p-6 max-w-sm w-full border border-[rgba(167,139,250,0.25)] shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-bold text-white font-display">Share This Poll</h3>
            <p className="text-xs text-[#A5A0B5]">Project this QR code on a screen or share the direct link with your peers.</p>

            <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-fit">
              <canvas ref={qrCanvasRef} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#17122A] text-slate-200"
              />
              <button
                onClick={handleCopyLink}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors flex items-center gap-1.5 touch-target cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full min-h-[44px] py-2 text-xs font-medium text-[#A5A0B5] hover:text-white touch-target cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
