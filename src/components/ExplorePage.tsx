import React, { useState, useEffect } from 'react';
import { Poll, PollCategory } from '../types.js';
import { fetchPolls } from '../lib/api.js';
import { Search, Filter, Plus, Users, Clock, CheckCircle2, ArrowRight, X, BarChart3, Layers } from 'lucide-react';

interface ExplorePageProps {
  onVote: (pollId: string) => void;
  onViewResults: (pollId: string) => void;
  onOpenCreate?: () => void;
  isAdmin?: boolean;
}

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

export const ExplorePage: React.FC<ExplorePageProps> = ({ onVote, onViewResults, onOpenCreate, isAdmin }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<PollCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active'>('active');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');

  useEffect(() => {
    loadPolls();
  }, [selectedCategory, selectedStatus]);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const data = await fetchPolls({
        visibility: 'public',
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        status: selectedStatus === 'active' ? 'active' : undefined
      });
      setPolls(data);
    } catch (err) {
      console.error('Failed to load polls', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolls = polls
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.totalVotes - a.totalVotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
            Public Directory
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
            Explore Active Polls
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#A5A0B5]">
            Browse campus votes, classroom decisions, and open polls from communities worldwide.
          </p>
        </div>

        {isAdmin && onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all shrink-0 self-start md:self-auto touch-target cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Poll</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search polls by question or topic..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all min-h-[44px]"
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

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'popular' | 'newest')}
              className="min-h-[44px] px-3 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] touch-target cursor-pointer"
            >
              <option value="popular">Most Voted</option>
              <option value="newest">Recently Created</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as 'all' | 'active')}
              className="min-h-[44px] px-3 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] touch-target cursor-pointer"
            >
              <option value="active">Active Only</option>
              <option value="all">All (Active &amp; Closed)</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter Segment */}
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

      {/* Grid of Polls */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[#A5A0B5]">Searching active polls...</p>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="text-center py-16 bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.18)] p-8 max-w-lg mx-auto shadow-lg">
          <p className="text-base font-semibold text-white mb-1">
            No polls found matching your filter
          </p>
          <p className="text-xs text-[#A5A0B5] mb-6">
            Try adjusting your search query or explore other categories.
          </p>
          {isAdmin && onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl touch-target cursor-pointer"
            >
              Create a Poll in this Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredPolls.map(poll => {
            const isClosed = poll.status === 'closed' || (poll.expiresAt && new Date(poll.expiresAt) <= new Date());
            return (
              <div
                key={poll.id}
                className="bg-[#17122A] border border-[rgba(167,139,250,0.18)] rounded-2xl p-5 sm:p-6 transition-all hover:border-[rgba(167,139,250,0.4)] hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {poll.coverImage && (
                    <div className="w-full h-36 rounded-xl overflow-hidden mb-4 border border-[rgba(167,139,250,0.15)] bg-[#100D20]">
                      <img
                        src={poll.coverImage}
                        alt={poll.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A5A0B5] mb-2.5">
                    <span className="font-semibold text-[#C084FC]">{poll.category || 'General'}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-slate-300">{poll.totalVotes} votes</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className={isClosed ? 'text-slate-500' : 'text-emerald-400'}>
                      {isClosed ? 'Closed' : 'Active'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug mb-2 line-clamp-2">
                    {poll.title}
                  </h3>

                  {poll.description && (
                    <p className="text-xs text-[#A5A0B5] mb-4 line-clamp-2 leading-relaxed">
                      {poll.description}
                    </p>
                  )}

                  <div className="text-[11px] text-slate-400 mb-4 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span>{poll.options.length} voting options available</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[rgba(167,139,250,0.15)] flex items-center justify-between gap-3">
                  <button
                    onClick={() => onVote(poll.id)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl transition-all shadow-md shadow-violet-500/20 touch-target cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isClosed ? 'View Poll' : 'Vote Now'}</span>
                  </button>

                  <button
                    onClick={() => onViewResults(poll.id)}
                    className="min-h-[44px] inline-flex items-center gap-1 text-xs font-medium text-[#A5A0B5] hover:text-white px-2 py-2 transition-colors touch-target cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Results</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
