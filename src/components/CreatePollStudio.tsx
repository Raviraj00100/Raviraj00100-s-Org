import React, { useState, useRef, useEffect } from 'react';
import { PollCreateResult, PollCategory } from '../types.js';
import { createPoll } from '../lib/api.js';
import { Plus, Trash2, Copy, Check, Share2, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Download, Eye, Calendar, Lock, Globe, ArrowRight } from 'lucide-react';
import QRCode from 'qrcode';

interface CreatePollStudioProps {
  onSuccessCreated: (result: PollCreateResult) => void;
  onCancel?: () => void;
}

const CATEGORIES: PollCategory[] = [
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

export const CreatePollStudio: React.FC<CreatePollStudioProps> = ({ onSuccessCreated, onCancel }) => {
  // Completely blank state by default - NO pre-filled dummy content
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);
  const [allowVoteChanges, setAllowVoteChanges] = useState(false);
  const [showResultsBeforeClosure, setShowResultsBeforeClosure] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Mobile preview tab toggle
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Form submission & validation states
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    options?: string;
    optionItem?: { [index: number]: string };
    expiresAt?: string;
  }>({});

  const [createdResult, setCreatedResult] = useState<PollCreateResult | null>(null);
  const [copiedVotingUrl, setCopiedVotingUrl] = useState(false);
  const [copiedManageUrl, setCopiedManageUrl] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render QR code upon poll creation
  useEffect(() => {
    if (createdResult && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, createdResult.votingUrl, {
        width: 170,
        margin: 2,
        color: {
          dark: '#0B0F19',
          light: '#FFFFFF'
        }
      });
    }
  }, [createdResult]);

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, '']);
    // Clear global option errors when adding
    setFieldErrors(prev => ({ ...prev, options: undefined }));
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);

    // Clear item error if resolved
    if (fieldErrors.optionItem && fieldErrors.optionItem[index]) {
      const nextItemErrors = { ...fieldErrors.optionItem };
      delete nextItemErrors[index];
      setFieldErrors(prev => ({ ...prev, optionItem: nextItemErrors, options: undefined }));
    }
  };

  const validateForm = () => {
    const errors: {
      title?: string;
      options?: string;
      optionItem?: { [index: number]: string };
      expiresAt?: string;
    } = {};

    let isValid = true;

    // 1. Validate Question / Title
    if (!title.trim()) {
      errors.title = 'Please enter a poll question.';
      isValid = false;
    } else if (title.trim().length < 3) {
      errors.title = 'Question must be at least 3 characters long.';
      isValid = false;
    }

    // 2. Validate Options
    const itemErrors: { [index: number]: string } = {};
    const filledOptions = options.map((o, idx) => ({ text: o.trim(), idx })).filter(o => o.text.length > 0);

    if (filledOptions.length < 2) {
      errors.options = 'At least two non-empty options are required.';
      isValid = false;
      // Mark empty ones
      options.forEach((opt, idx) => {
        if (!opt.trim()) {
          itemErrors[idx] = 'Please fill in this option or remove it.';
        }
      });
    }

    // Check for duplicate options (case-insensitive)
    const seen = new Set<string>();
    options.forEach((opt, idx) => {
      const clean = opt.trim().toLowerCase();
      if (clean) {
        if (seen.has(clean)) {
          itemErrors[idx] = 'Duplicate option. Options must be distinct.';
          errors.options = 'Each option must be unique.';
          isValid = false;
        } else {
          seen.add(clean);
        }
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      errors.optionItem = itemErrors;
    }

    // 3. Validate Expiration Date if enabled
    if (hasExpiry) {
      if (!expiresAt) {
        errors.expiresAt = 'Please select a closing date and time, or uncheck deadline.';
        isValid = false;
      } else {
        const chosenTime = new Date(expiresAt).getTime();
        if (isNaN(chosenTime) || chosenTime <= Date.now()) {
          errors.expiresAt = 'Closing date and time must be in the future.';
          isValid = false;
        }
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!validateForm()) {
      setErrorBanner('Please resolve the highlighted fields before creating your poll.');
      return;
    }

    const cleanOptions = options.map(o => o.trim()).filter(o => o.length > 0);

    setLoading(true);
    try {
      const res = await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || 'General & Opinions',
        coverImage: coverImage.trim() || undefined,
        options: cleanOptions,
        expiresAt: hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : null,
        visibility,
        allowMultipleChoices,
        allowVoteChanges,
        showResultsBeforeClosure
      });

      setCreatedResult(res);
      onSuccessCreated(res);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to publish poll. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVoting = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.votingUrl);
    setCopiedVotingUrl(true);
    setTimeout(() => setCopiedVotingUrl(false), 2000);
  };

  const handleCopyManage = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.managementUrl);
    setCopiedManageUrl(true);
    setTimeout(() => setCopiedManageUrl(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `votesphere-qr-${createdResult?.poll.id}.png`;
    a.click();
  };

  const handleShareWhatsApp = () => {
    if (!createdResult) return;
    const text = encodeURIComponent(`Vote on VoteSphere: "${createdResult.poll.title}"\n${createdResult.votingUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // If poll successfully created, show success dashboard
  if (createdResult) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.22)] shadow-2xl p-5 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Your Poll is Live!
              </h2>
              <p className="text-xs sm:text-sm text-[#A5A0B5] mt-1 leading-relaxed">
                Anyone receiving your voting link can participate immediately without registering an account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left: Voting Link & Social Sharing */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Public Voting Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdResult.votingUrl}
                    className="flex-1 min-h-[44px] px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-slate-200 select-all truncate"
                  />
                  <button
                    onClick={handleCopyVoting}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm touch-target cursor-pointer"
                  >
                    {copiedVotingUrl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedVotingUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Social Channels */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleShareWhatsApp}
                  className="min-h-[44px] flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#100D20] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors touch-target cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: createdResult.poll.title,
                        url: createdResult.votingUrl
                      }).catch(() => {});
                    } else {
                      handleCopyVoting();
                    }
                  }}
                  className="min-h-[44px] flex-1 min-w-[120px] py-2.5 px-4 rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#100D20] hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors touch-target cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#C084FC]" />
                  <span>Share Link</span>
                </button>
              </div>
            </div>

            {/* Right: Presentation QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#100D20] border border-[rgba(167,139,250,0.18)]">
              <canvas ref={qrCanvasRef} className="rounded-xl shadow-sm max-w-full bg-white p-2" />
              <button
                onClick={handleDownloadQR}
                className="min-h-[44px] mt-2 text-xs font-semibold text-[#C084FC] hover:text-white flex items-center gap-1.5 touch-target cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </button>
            </div>
          </div>

          {/* Critical Private Creator Token Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Private Creator Management Link</span>
            </div>
            <p className="text-xs sm:text-sm text-[#A5A0B5] leading-relaxed">
              Because VoteSphere requires <strong className="text-white">zero accounts</strong>, this secret management link is the only way you can close voting early, change results visibility, or delete this poll. Bookmark or save this link now!
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={createdResult.managementUrl}
                className="flex-1 min-h-[44px] px-3.5 py-2 text-xs font-mono rounded-xl border border-amber-500/30 bg-[#100D20] text-slate-200 truncate select-all"
              />
              <button
                onClick={handleCopyManage}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 shrink-0 touch-target cursor-pointer"
              >
                {copiedManageUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedManageUrl ? 'Saved' : 'Copy Key'}</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-[rgba(167,139,250,0.18)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href={`#poll/${createdResult.poll.id}`}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-md transition-all text-center touch-target"
            >
              <span>Go to Voting Page</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={`#results/${createdResult.poll.id}`}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-medium text-[#A5A0B5] hover:text-white rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#100D20] hover:bg-[#17122A] transition-colors text-center touch-target"
            >
              View Live Results Tally
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Active form creation view
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Page Title */}
      <div className="max-w-2xl mb-6 sm:mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#C084FC] mb-2">
          Poll Studio
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Create a New Poll
        </h1>
        <p className="mt-2 text-xs sm:text-sm md:text-base text-[#A5A0B5]">
          No sign-up or verification required. Fill in your question and choices below to publish instantly.
        </p>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 mb-6 rounded-xl bg-[#100D20] border border-[rgba(167,139,250,0.18)] max-w-sm">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-colors touch-target cursor-pointer ${
            mobileTab === 'form'
              ? 'bg-[#17122A] text-white shadow-sm border border-[rgba(167,139,250,0.3)]'
              : 'text-[#A5A0B5]'
          }`}
        >
          1. Edit Question &amp; Options
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-colors touch-target cursor-pointer ${
            mobileTab === 'preview'
              ? 'bg-[#17122A] text-white shadow-sm border border-[rgba(167,139,250,0.3)]'
              : 'text-[#A5A0B5]'
          }`}
        >
          2. Live Ballot Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left: Complete Poll Creation Form (7 cols on desktop) */}
        <div className={`lg:col-span-7 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.22)] shadow-xl p-5 sm:p-7 space-y-5 sm:space-y-6"
          >
            {/* Global Error Banner */}
            {errorBanner && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-snug">{errorBanner}</span>
              </div>
            )}

            {/* Field: Poll Question (Required) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="poll-title-input" className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                  Poll Question / Decision <span className="text-[#C084FC]">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#A5A0B5]">
                  {title.length}/240
                </span>
              </div>
              <input
                id="poll-title-input"
                type="text"
                maxLength={240}
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="What would you like everyone to vote on?"
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none ${
                  fieldErrors.title
                    ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:ring-2 focus:ring-rose-500'
                    : 'border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]'
                }`}
              />
              {fieldErrors.title && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.title}</span>
                </p>
              )}
            </div>

            {/* Field: Description (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="poll-description-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Context or Guidelines <span className="text-[#A5A0B5] font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] font-mono text-[#A5A0B5]">
                  {description.length}/500
                </span>
              </div>
              <textarea
                id="poll-description-input"
                rows={2}
                maxLength={500}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add any extra background context, guidelines, or instructions..."
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
              />
            </div>

            {/* Field: Category & Visibility (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="poll-category-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category <span className="text-[#A5A0B5] font-normal">(Optional)</span>
                </label>
                <select
                  id="poll-category-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] touch-target cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-[#100D20] text-white">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="poll-visibility-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Visibility
                </label>
                <select
                  id="poll-visibility-select"
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as 'public' | 'unlisted')}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] touch-target cursor-pointer"
                >
                  <option value="public" className="bg-[#100D20] text-white">Public (Discoverable in Explore)</option>
                  <option value="unlisted" className="bg-[#100D20] text-white">Unlisted (Direct Link Only)</option>
                </select>
              </div>
            </div>

            {/* Field: Voting Options (Required: minimum 2) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                    Voting Options <span className="text-[#C084FC]">*</span>
                  </span>
                  <p className="text-[11px] text-[#A5A0B5]">
                    Provide at least 2 distinct choices (up to 10 options).
                  </p>
                </div>
                <span className="text-xs font-mono text-[#A5A0B5]">
                  {options.length}/10
                </span>
              </div>

              {fieldErrors.options && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.options}</span>
                </p>
              )}

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const itemErr = fieldErrors.optionItem && fieldErrors.optionItem[idx];
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-xs text-[#A5A0B5] font-mono text-center shrink-0">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          maxLength={100}
                          value={opt}
                          onChange={e => handleOptionChange(idx, e.target.value)}
                          placeholder={`Enter Choice ${idx + 1}...`}
                          className={`flex-1 min-w-0 min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none ${
                            itemErr
                              ? 'border-rose-500 bg-rose-950/20 text-rose-100 focus:ring-2 focus:ring-rose-500'
                              : 'border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white placeholder-[#A5A0B5] focus:ring-2 focus:ring-[#8B5CF6]'
                          }`}
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A5A0B5] hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors shrink-0 touch-target cursor-pointer"
                            title="Remove choice"
                            aria-label={`Remove option ${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {itemErr && (
                        <p className="pl-8 text-[11px] text-rose-400">
                          {itemErr}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold text-[#C084FC] hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-[#100D20] touch-target cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add another voting choice</span>
                </button>
              )}
            </div>

            {/* Voting Settings & Optional Deadline */}
            <div className="pt-5 border-t border-[rgba(167,139,250,0.18)] space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Poll Rules &amp; Schedule
              </div>

              {/* Multi-choice toggle */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowMultipleChoices}
                  onChange={e => setAllowMultipleChoices(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                    Allow Multiple Choices
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#A5A0B5] block">
                    Voters can pick more than one option on the ballot.
                  </span>
                </div>
              </label>

              {/* Allow changing vote toggle */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowVoteChanges}
                  onChange={e => setAllowVoteChanges(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                    Allow Voters to Change Vote
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#A5A0B5] block">
                    Participants can switch their selection before the poll officially closes.
                  </span>
                </div>
              </label>

              {/* Show results toggle */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showResultsBeforeClosure}
                  onChange={e => setShowResultsBeforeClosure(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                    Show Live Results Immediately
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#A5A0B5] block">
                    Participants can see percentages right after voting (uncheck to hide until you close the poll).
                  </span>
                </div>
              </label>

              {/* Optional Expiry Date */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={e => {
                      setHasExpiry(e.target.checked);
                      if (!e.target.checked) {
                        setExpiresAt('');
                        setFieldErrors(prev => ({ ...prev, expiresAt: undefined }));
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] accent-[#8B5CF6]"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                      Set Automatic Closing Deadline <span className="text-[#A5A0B5] font-normal">(Optional)</span>
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#A5A0B5] block">
                      Automatically locks when the scheduled timer expires.
                    </span>
                  </div>
                </label>

                {hasExpiry && (
                  <div className="pl-7 pt-1">
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={e => {
                        setExpiresAt(e.target.value);
                        if (fieldErrors.expiresAt) setFieldErrors(prev => ({ ...prev, expiresAt: undefined }));
                      }}
                      className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-xl border border-[rgba(167,139,250,0.2)] bg-[#100D20] text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                    />
                    {fieldErrors.expiresAt && (
                      <p className="mt-1 text-xs text-rose-400">
                        {fieldErrors.expiresAt}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submission Actions */}
            <div className="pt-6 border-t border-[rgba(167,139,250,0.18)] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-medium text-[#A5A0B5] hover:text-white rounded-xl transition-colors touch-target cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Poll...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C084FC]" />
                    <span>Create &amp; Publish Poll</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Interactive Ballot Preview (5 cols on desktop, responsive tab on mobile) */}
        <div className={`lg:col-span-5 lg:sticky lg:top-24 ${mobileTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-[#17122A] rounded-2xl border border-[rgba(167,139,250,0.22)] shadow-xl p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(167,139,250,0.18)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C084FC]">
                <Eye className="w-4 h-4" />
                <span>Live Voter Preview</span>
              </div>
              <span className="text-[11px] font-mono text-[#A5A0B5]">
                Interactive Preview
              </span>
            </div>

            {/* Mock Ballot Rendering */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-[#A5A0B5]">
                <span className="font-semibold text-[#C084FC]">
                  {category || 'General & Opinions'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{allowMultipleChoices ? 'Multiple choices' : 'Single choice'}</span>
                {hasExpiry && expiresAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-[#A5A0B5]">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span>Scheduled</span>
                    </span>
                  </>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {title.trim() || 'Your question will appear here...'}
              </h3>

              {description.trim() && (
                <p className="text-xs text-[#A5A0B5] leading-relaxed">
                  {description.trim()}
                </p>
              )}

              {/* Dynamic Option Cards */}
              <div className="space-y-2 pt-2">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[rgba(167,139,250,0.18)] bg-[#100D20] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-4 h-4 border border-[rgba(167,139,250,0.4)] shrink-0 ${
                        allowMultipleChoices ? 'rounded' : 'rounded-full'
                      }`} />
                      <span className={`truncate ${opt.trim() ? 'text-white font-medium' : 'text-[#A5A0B5] italic'}`}>
                        {opt.trim() || `Option ${idx + 1}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A5A0B5] font-mono shrink-0">
                      0%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(167,139,250,0.18)] text-[11px] text-[#A5A0B5] flex items-center justify-between">
              <span>Zero-login anonymous voting</span>
              <span className="font-mono text-[#C084FC]">VoteSphere</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
