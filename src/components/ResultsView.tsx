import React, { useState, useEffect } from 'react';
import { Poll } from '../types.js';
import { fetchPollById } from '../lib/api.js';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Trophy, Users, Clock, ArrowRight, Share2, Copy, Check, CheckCircle2, AlertCircle, Download, Printer } from 'lucide-react';

interface ResultsViewProps {
  pollId: string;
  onNavigateHome: () => void;
  onBackToVote: (pollId: string) => void;
}

const CHART_COLORS = ['#8B5CF6', '#A855F7', '#C084FC', '#38BDF8', '#34D399', '#F472B6', '#FBBF24', '#60A5FA'];

export const ResultsView: React.FC<ResultsViewProps> = ({ pollId, onNavigateHome, onBackToVote }) => {
  const [poll, setPoll] = useState<(Poll & { isCreator?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
  }, [pollId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPollById(pollId);
      setPoll(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportCSV = () => {
    if (!poll) return;
    const lines = [
      ['Poll Title', `"${poll.title.replace(/"/g, '""')}"`],
      ['Category', `"${(poll.category || '').replace(/"/g, '""')}"`],
      ['Total Votes', poll.totalVotes.toString()],
      ['Created At', poll.createdAt],
      ['Status', poll.status],
      [],
      ['Option Choice', 'Vote Count', 'Percentage']
    ];
    poll.options.forEach(opt => {
      const pct = poll.totalVotes > 0 ? ((opt.voteCount / poll.totalVotes) * 100).toFixed(1) : '0';
      lines.push([`"${opt.text.replace(/"/g, '""')}"`, opt.voteCount.toString(), `${pct}%`]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `votesphere-results-${poll.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#A5A0B5]">Calculating verified vote tallies...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Results Unavailable</h2>
          <p className="text-sm text-[#A5A0B5] mb-6">{error || 'Poll not found.'}</p>
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

  // Respect creator_only privacy
  if (poll.resultsVisibility === 'creator_only' && !poll.isCreator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-[#17122A] border border-[rgba(167,139,250,0.18)] shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Results are Private</h2>
          <p className="text-sm text-[#A5A0B5] mb-6">
            The organizer has designated results for this poll to be visible only to authorized creators and administrators.
          </p>
          <button
            onClick={() => onBackToVote(pollId)}
            className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] rounded-xl touch-target cursor-pointer"
          >
            Back to Voting Page
          </button>
        </div>
      </div>
    );
  }

  const isClosed = poll.status === 'closed' || (poll.expiresAt && new Date(poll.expiresAt) <= new Date());
  const totalVotes = poll.totalVotes;

  // Find winner(s)
  const sortedOptions = [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  const leadingCount = sortedOptions[0]?.voteCount || 0;
  const isWinnerTied = sortedOptions.filter(o => o.voteCount === leadingCount).length > 1;
  const winner = leadingCount > 0 ? sortedOptions[0] : null;

  const chartData = poll.options.map((opt) => ({
    name: opt.text,
    value: opt.voteCount,
    percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={onNavigateHome}
          className="min-h-[44px] text-xs font-medium text-[#A5A0B5] hover:text-white flex items-center gap-1.5 transition-colors self-start touch-target cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!isClosed && (
            <button
              onClick={() => onBackToVote(pollId)}
              className="min-h-[40px] text-xs font-semibold text-[#C084FC] hover:text-white px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
            >
              Cast / Change Vote
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-medium text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
            title="Download CSV breakdown"
          >
            <Download className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-medium text-[#A5A0B5] hover:text-white hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-xs font-medium text-white hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Results'}</span>
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="bg-[#17122A] rounded-3xl border border-[rgba(167,139,250,0.22)] shadow-2xl overflow-hidden space-y-6">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-[rgba(167,139,250,0.15)]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A5A0B5] mb-2">
            <span className="font-semibold text-[#C084FC]">{poll.category || 'General'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              {totalVotes} total votes
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isClosed ? 'Concluded' : 'Live Active Tally'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display leading-tight mb-2">
            {poll.title}
          </h1>

          {poll.description && (
            <p className="text-sm text-[#A5A0B5] leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* Winner Spotlight Banner */}
        {winner && (
          <div className="mx-5 sm:mx-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-600/15 via-[#8B5CF6]/10 to-transparent border border-[rgba(167,139,250,0.3)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-[#C084FC]">
                {isWinnerTied ? 'Leading Tie' : isClosed ? 'Winning Choice' : 'Currently Leading'}
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {winner.text}
              </div>
              <div className="text-xs text-[#A5A0B5] font-mono tabular-nums">
                {winner.voteCount} votes ({totalVotes > 0 ? Math.round((winner.voteCount / totalVotes) * 100) : 0}%)
              </div>
            </div>
          </div>
        )}

        {/* Zero Votes Banner */}
        {totalVotes === 0 && (
          <div className="mx-5 sm:mx-8 p-4 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] text-xs sm:text-sm text-[#A5A0B5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>No votes have been cast in this poll yet. Be the first to participate!</span>
            {!isClosed && (
              <button
                onClick={() => onBackToVote(pollId)}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Cast First Vote
              </button>
            )}
          </div>
        )}

        {/* Visual Charts Grid */}
        <div className="px-5 sm:px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-64 relative flex items-center justify-center">
              {totalVotes === 0 ? (
                <div className="text-center text-xs text-[#A5A0B5]">
                  No votes recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#100D20] text-white p-3 rounded-xl text-xs shadow-xl border border-[rgba(167,139,250,0.3)]">
                              <p className="font-semibold">{data.name}</p>
                              <p className="font-mono text-[#A5A0B5]">
                                {data.value} votes ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="text-xs text-[#A5A0B5] font-medium">Distribution Breakdown</div>
          </div>

          {/* Bar Chart Tally Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {poll.options.map((opt, idx) => {
              const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              const isLead = opt.voteCount === leadingCount && leadingCount > 0;
              const color = CHART_COLORS[idx % CHART_COLORS.length];

              return (
                <div key={opt.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-slate-200 truncate pr-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate">{opt.text}</span>
                      {isLead && (
                        <span className="text-[10px] uppercase font-bold text-[#C084FC] bg-violet-950/60 border border-violet-800/60 px-1.5 py-0.5 rounded">
                          Lead
                        </span>
                      )}
                    </span>
                    <span className="font-mono tabular-nums text-[#A5A0B5] shrink-0">
                      <strong className="text-white">{opt.voteCount}</strong> ({percentage}%)
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-3 rounded-full bg-[#100D20] overflow-hidden border border-[rgba(167,139,250,0.1)]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(percentage, totalVotes > 0 ? 2 : 0)}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit & Security Footer */}
        <div className="p-4 bg-[#100D20] border-t border-[rgba(167,139,250,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A5A0B5]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic SHA-256 duplicate submission protection active</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Created {new Date(poll.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
