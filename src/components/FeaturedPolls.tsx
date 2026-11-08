import React from 'react';
import { Poll } from '../types.js';
import { ArrowRight, CheckCircle2, Clock, Users, Plus, Sparkles, Calendar, Layers, BarChart3 } from 'lucide-react';

interface FeaturedPollsProps {
  polls: Poll[];
  onVote: (pollId: string) => void;
  onViewResults: (pollId: string) => void;
  onViewAll: () => void;
  onCreatePoll?: () => void;
  isAdmin?: boolean;
}

export const FeaturedPolls: React.FC<FeaturedPollsProps> = ({
  polls,
  onVote,
  onViewResults,
  onViewAll,
  onCreatePoll,
  isAdmin
}) => {
  const displayPolls = polls.slice(0, 4);

  const formatDeadline = (expiresAt?: string | null) => {
    if (!expiresAt) return 'No expiration';
    const date = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (diffHours < 0) return 'Ended';
    if (diffHours < 24) return `Closes in ${diffHours}h`;
    const diffDays = Math.ceil(diffHours / 24);
    return `Closes in ${diffDays}d`;
  };

  return (
    <section className="py-12 sm:py-16 border-b border-[rgba(167,139,250,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Public Opinion &amp; Decision Making</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Featured Polls
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#A5A0B5]">
              Participate in active campus elections, classroom decisions, and community polls.
            </p>
          </div>

          {displayPolls.length > 0 && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C084FC] hover:text-white transition-colors whitespace-nowrap self-start md:self-auto min-h-[44px] touch-target cursor-pointer"
            >
              <span>Explore all {polls.length} polls</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {displayPolls.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center mx-auto mb-4 border border-[rgba(167,139,250,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              No Public Polls Open At This Moment
            </h3>
            <p className="text-xs sm:text-sm text-[#A5A0B5] mb-6 max-w-md mx-auto leading-relaxed">
              New community polls and student decisions will appear here as soon as they are launched.
            </p>
            {isAdmin && onCreatePoll && (
              <button
                onClick={onCreatePoll}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create the First Poll</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {displayPolls.map((poll) => {
              const isClosed = poll.status === 'closed' || (poll.expiresAt && new Date(poll.expiresAt) <= new Date());
              const deadlineText = formatDeadline(poll.expiresAt);

              return (
                <div
                  key={poll.id}
                  className="bg-[#17122A] border border-[rgba(167,139,250,0.18)] rounded-2xl p-5 sm:p-6 transition-all hover:border-[rgba(167,139,250,0.4)] hover:shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover image if available */}
                    {poll.coverImage && (
                      <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden mb-4 border border-[rgba(167,139,250,0.15)] bg-[#100D20]">
                        <img
                          src={poll.coverImage}
                          alt={poll.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Metadata Header without pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#A5A0B5] mb-2.5">
                      <span className="font-semibold text-[#C084FC]">
                        {poll.category || 'General'}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Users className="w-3.5 h-3.5 text-violet-400" />
                        {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        {poll.options.length} options
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={`flex items-center gap-1 font-medium ${isClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {isClosed ? 'Closed' : deadlineText}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-2 line-clamp-2">
                      {poll.title}
                    </h3>

                    {/* Description */}
                    {poll.description && (
                      <p className="text-xs sm:text-sm text-[#A5A0B5] mb-4 line-clamp-2 leading-relaxed">
                        {poll.description}
                      </p>
                    )}

                    {/* Options Preview */}
                    <div className="space-y-1.5 my-3">
                      {poll.options.slice(0, 3).map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#100D20] text-xs text-slate-200 border border-[rgba(167,139,250,0.1)]"
                        >
                          <span className="truncate pr-2">{opt.text}</span>
                          {poll.showResultsBeforeClosure && (
                            <span className="font-mono tabular-nums text-[#A5A0B5] shrink-0 text-[11px]">
                              {opt.voteCount}
                            </span>
                          )}
                        </div>
                      ))}
                      {poll.options.length > 3 && (
                        <div className="text-[11px] text-[#A5A0B5] px-2 py-0.5 font-medium">
                          +{poll.options.length - 3} more options available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-2 border-t border-[rgba(167,139,250,0.15)] flex items-center justify-between gap-3">
                    <button
                      onClick={() => onVote(poll.id)}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isClosed ? 'View Poll' : 'Vote Now'}</span>
                    </button>

                    <button
                      onClick={() => onViewResults(poll.id)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-medium text-[#A5A0B5] hover:text-white px-2 py-2 transition-colors touch-target cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      <span>View Results</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
