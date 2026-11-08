import React, { useState } from 'react';
import { Suggestion, IdeaStatus } from '../types.js';
import { X, ChevronUp, Share2, Check, Calendar, ShieldCheck } from 'lucide-react';

interface IdeaDetailsModalProps {
  suggestion: Suggestion | null;
  onClose: () => void;
  onToggleUpvote?: (id: string) => void;
  onUpvote?: (id: string) => void;
}

const STATUS_CONFIG: Record<IdeaStatus, { label: string; bg: string; text: string; border: string }> = {
  'New': { label: 'New Idea', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Under Review': { label: 'Under Review', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Planned': { label: 'Planned', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  'In Progress': { label: 'In Progress', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Completed': { label: 'Implemented', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export const IdeaDetailsModal: React.FC<IdeaDetailsModalProps> = ({ suggestion, onClose, onToggleUpvote, onUpvote }) => {
  const [copied, setCopied] = useState(false);

  if (!suggestion) return null;

  const statusInfo = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG['New'];
  const handleVote = () => {
    if (onToggleUpvote) onToggleUpvote(suggestion.id);
    else if (onUpvote) onUpvote(suggestion.id);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#suggestions?id=${suggestion.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-[#100D20] rounded-2xl shadow-2xl border border-[rgba(167,139,250,0.22)] overflow-hidden my-8 p-5 sm:p-7 space-y-6 animate-scale-up">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
            <span className="text-xs font-semibold text-[#C084FC] bg-[#8B5CF6]/10 px-2.5 py-1 rounded-lg border border-[rgba(167,139,250,0.18)]">
              {suggestion.category || 'General'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Title & Description */}
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display leading-snug">
            {suggestion.title}
          </h2>

          <div className="text-xs text-[#A5A0B5] flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span>Submitted on {new Date(suggestion.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="pt-2 text-xs sm:text-sm text-[#A5A0B5] leading-relaxed whitespace-pre-wrap bg-[#17122A]/70 p-4 rounded-xl border border-[rgba(167,139,250,0.15)]">
            {suggestion.description}
          </div>
        </div>

        {/* Action strip: Upvote & Share */}
        <div className="pt-5 border-t border-[rgba(167,139,250,0.18)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleVote}
              className={`min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm touch-target cursor-pointer ${
                suggestion.hasUpvoted
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-violet-500/25 ring-2 ring-[#C084FC]/40'
                  : 'bg-[#17122A] hover:bg-[#1E1738] text-white border border-[rgba(167,139,250,0.2)]'
              }`}
            >
              <ChevronUp className={`w-4 h-4 stroke-[3] ${suggestion.hasUpvoted ? 'text-white' : 'text-violet-400'}`} />
              <span className="font-mono tabular-nums text-sm">{suggestion.upvoteCount}</span>
              <span>{suggestion.hasUpvoted ? 'Upvoted' : 'Upvote Suggestion'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#17122A] text-xs font-medium text-[#A5A0B5] hover:text-white hover:bg-[#1E1738] transition-colors touch-target cursor-pointer"
              title="Copy share link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied Link' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#A5A0B5]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Anonymous Community Vote</span>
          </div>
        </div>
      </div>
    </div>
  );
};
