import React, { useState, useEffect } from 'react';
import { Suggestion } from '../types.js';
import { ChevronUp, MessageSquarePlus, Share2, Check, Sparkles, ArrowRight } from 'lucide-react';
import { toggleUpvoteSuggestion } from '../lib/api.js';

interface TrendingSuggestionsProps {
  suggestions: Suggestion[];
  onOpenCreateSuggestion: () => void;
  onViewAll: () => void;
}

export const TrendingSuggestions: React.FC<TrendingSuggestionsProps> = ({
  suggestions,
  onOpenCreateSuggestion,
  onViewAll
}) => {
  const [items, setItems] = useState<Suggestion[]>(suggestions);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setItems(suggestions);
  }, [suggestions]);

  const handleUpvote = async (id: string) => {
    setItems(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextVoted = !s.hasUpvoted;
          return {
            ...s,
            hasUpvoted: nextVoted,
            upvoteCount: nextVoted ? s.upvoteCount + 1 : Math.max(0, s.upvoteCount - 1)
          };
        }
        return s;
      })
    );

    try {
      const res = await toggleUpvoteSuggestion(id);
      setItems(prev =>
        prev.map(s => (s.id === id ? { ...s, hasUpvoted: res.hasUpvoted, upvoteCount: res.upvoteCount } : s))
      );
    } catch (e) {
      console.error('Failed to upvote suggestion', e);
      setItems(suggestions);
    }
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/#suggestions?id=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const topItems = items.slice(0, 3);

  return (
    <section className="py-12 sm:py-16 border-b border-[rgba(167,139,250,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Community Participation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Trending Suggestions
            </h2>
            <p className="mt-1 text-sm sm:text-base text-[#A5A0B5]">
              Submit ideas for classrooms, campus initiatives, or communities — and upvote the best suggestions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={onOpenCreateSuggestion}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Share an Idea</span>
            </button>
            {items.length > 0 && (
              <button
                onClick={onViewAll}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#A5A0B5] hover:text-white transition-colors touch-target cursor-pointer"
              >
                <span>View All Ideas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {topItems.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-lg max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center mx-auto mb-4 border border-[rgba(167,139,250,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              No Suggestions Submitted Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#A5A0B5] mb-6 max-w-md mx-auto leading-relaxed">
              Have an improvement idea for your campus, group, or classroom? Share it anonymously and let others upvote it!
            </p>
            <button
              onClick={onOpenCreateSuggestion}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Submit the First Idea</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {topItems.map((sug) => {
              const isCopied = copiedId === sug.id;
              return (
                <div
                  key={sug.id}
                  className="bg-[#17122A] border border-[rgba(167,139,250,0.18)] rounded-2xl p-5 sm:p-6 transition-all hover:border-[rgba(167,139,250,0.35)] hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-[#C084FC]">
                        {sug.category || 'Community'}
                      </span>
                      <button
                        onClick={() => handleShare(sug.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors touch-target flex items-center justify-center cursor-pointer"
                        title="Copy suggestion link"
                        aria-label="Share suggestion"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug mb-2 line-clamp-2">
                      {sug.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed line-clamp-3 mb-5">
                      {sug.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[rgba(167,139,250,0.15)] flex items-center justify-between">
                    <div className="text-xs text-[#A5A0B5] font-mono">
                      {new Date(sug.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>

                    <button
                      onClick={() => handleUpvote(sug.id)}
                      className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-target cursor-pointer ${
                        sug.hasUpvoted
                          ? 'bg-[#8B5CF6] text-white shadow-md shadow-violet-500/30 ring-2 ring-[#C084FC]/40'
                          : 'bg-[#100D20] text-[#A5A0B5] hover:text-white hover:bg-[#1E1738] border border-[rgba(167,139,250,0.18)]'
                      }`}
                      aria-label={`${sug.hasUpvoted ? 'Remove upvote' : 'Upvote idea'} (currently ${sug.upvoteCount})`}
                    >
                      <ChevronUp className={`w-4 h-4 stroke-[3] ${sug.hasUpvoted ? 'text-white' : 'text-violet-400'}`} />
                      <span className="font-mono tabular-nums">{sug.upvoteCount}</span>
                      <span className="text-[11px] font-normal">{sug.hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
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
