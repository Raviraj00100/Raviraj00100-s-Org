import React, { useState, useEffect } from 'react';
import { Suggestion, PollCategory } from '../types.js';
import { fetchSuggestions, createSuggestion, toggleUpvoteSuggestion } from '../lib/api.js';
import { ChevronUp, Plus, Search, Share2, Check, MessageSquarePlus, X, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { IdeaDetailsModal } from './IdeaDetailsModal.js';

const CATEGORIES: Array<PollCategory | 'All'> = [
  'All',
  'Education & College',
  'Campus & Student Life',
  'Events & Entertainment',
  'Sports',
  'Technology',
  'Organizations',
  'Community',
  'Lifestyle',
  'General',
  'Other'
];

export const SuggestionsPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PollCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'trending' | 'top' | 'newest'>('trending');
  const [searchQuery, setSearchQuery] = useState('');

  // Submit suggestion modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<PollCategory>('Campus & Student Life');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModalSuggestion, setSelectedModalSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [selectedCategory, sortBy]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await fetchSuggestions({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sort: sortBy
      });
      setSuggestions(data);
    } catch (e) {
      console.error('Failed to load suggestions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id: string) => {
    // Optimistic toggle
    setSuggestions(prev =>
      prev.map(s => {
        if (s.id === id) {
          const next = !s.hasUpvoted;
          return {
            ...s,
            hasUpvoted: next,
            upvoteCount: next ? s.upvoteCount + 1 : Math.max(0, s.upvoteCount - 1)
          };
        }
        return s;
      })
    );

    try {
      const res = await toggleUpvoteSuggestion(id);
      setSuggestions(prev =>
        prev.map(s => (s.id === id ? { ...s, hasUpvoted: res.hasUpvoted, upvoteCount: res.upvoteCount } : s))
      );
    } catch (e) {
      console.error('Failed to upvote', e);
      loadSuggestions();
    }
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/#suggestions?id=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newTitle.trim()) {
      setSubmitError('Please enter a short title for your suggestion.');
      return;
    }
    if (!newDesc.trim()) {
      setSubmitError('Please describe your idea in detail.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSuggestion({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory
      });
      setSuggestions([created, ...suggestions]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Title & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
            People's Voice
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
            Community Suggestions Board
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#A5A0B5]">
            Submit ideas for classrooms, campus initiatives, and community improvements without an account.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all shrink-0 self-start md:self-auto touch-target cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Share Your Idea</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search community suggestions..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'trending' | 'top' | 'newest')}
              className="min-h-[44px] px-3 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] touch-target cursor-pointer"
            >
              <option value="trending">Trending Voice</option>
              <option value="top">Most Upvoted</option>
              <option value="newest">Recently Submitted</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 touch-target cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-md shadow-violet-500/20'
                    : 'bg-[#100D20] text-[#A5A0B5] border border-[rgba(167,139,250,0.18)] hover:text-white hover:bg-[#17122A]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggestion Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[#A5A0B5]">Loading community ideas...</p>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="text-center py-16 bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-8 max-w-lg mx-auto shadow-lg">
          <p className="text-base font-semibold text-white mb-1">
            No suggestions found
          </p>
          <p className="text-xs text-[#A5A0B5] mb-6">
            Have an idea for campus or classroom improvements? Be the first to submit!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl touch-target cursor-pointer"
          >
            Submit an Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredSuggestions.map(sug => {
            const isCopied = copiedId === sug.id;
            return (
              <div
                key={sug.id}
                className="bg-[#17122A] border border-[rgba(167,139,250,0.18)] rounded-2xl p-5 sm:p-6 transition-all hover:border-[rgba(167,139,250,0.4)] hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#C084FC]">
                      {sug.category}
                    </span>
                    <button
                      onClick={() => handleShare(sug.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors touch-target flex items-center justify-center cursor-pointer"
                      title="Copy link"
                      aria-label="Share suggestion"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <h3
                    onClick={() => setSelectedModalSuggestion(sug)}
                    className="text-base font-bold text-white leading-snug mb-2 line-clamp-2 hover:text-[#C084FC] cursor-pointer transition-colors"
                  >
                    {sug.title}
                  </h3>

                  <p
                    onClick={() => setSelectedModalSuggestion(sug)}
                    className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed line-clamp-4 mb-6 cursor-pointer"
                  >
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

      {/* Submit Idea Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#100D20] rounded-2xl shadow-2xl border border-[rgba(167,139,250,0.25)] overflow-hidden my-8 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(167,139,250,0.15)] mb-5">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Share a Community Suggestion
                </h2>
                <p className="text-xs text-[#A5A0B5]">
                  Completely anonymous. No login or registration required.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg touch-target cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmitSuggestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Idea / Suggestion Title <span className="text-[#C084FC]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What would improve your campus, class, or community?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#17122A] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as PollCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#17122A] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] min-h-[44px]"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Detailed Explanation <span className="text-[#C084FC]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Provide context, why it matters, or how it could be implemented..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#17122A] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#A5A0B5] hover:text-white touch-target cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newDesc.trim()}
                  className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50 touch-target cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Post Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Idea Detail Modal */}
      {selectedModalSuggestion && (
        <IdeaDetailsModal
          suggestion={selectedModalSuggestion}
          onClose={() => setSelectedModalSuggestion(null)}
          onUpvote={handleUpvote}
        />
      )}
    </div>
  );
};
