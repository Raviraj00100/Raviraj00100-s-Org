import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Poll,
  PollCreateInput,
  ResultsVisibility,
  Suggestion,
  SuggestionCreateInput,
  IdeaStatus,
  SecurityAuditLog,
  AdminUser,
  AdminPermission,
  AdminAccountStatus,
  AdminStats,
  AdminInvitationInput,
  AdminApplicationInput
} from '../src/types.js';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'polls.create',
  'polls.edit',
  'polls.delete',
  'polls.view_results',
  'polls.moderate',
  'admins.invite',
  'admins.approve',
  'admins.suspend',
  'admins.remove',
  'settings.manage',
  'audit_logs.view'
];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'polls.create',
  'polls.edit',
  'polls.view_results',
  'polls.moderate'
];

interface VoteRecord {
  id: string;
  pollId: string;
  optionId: string;
  voterTokenHash: string;
  createdAt: string;
}

interface SuggestionVoteRecord {
  id: string;
  suggestionId: string;
  voterTokenHash: string;
  createdAt: string;
}

export interface AdminRecord extends AdminUser {
  passwordHash?: string;
}

interface DatabaseSchema {
  polls: Poll[];
  votes: VoteRecord[];
  suggestions: Suggestion[];
  suggestionVotes: SuggestionVoteRecord[];
  securityLogs: SecurityAuditLog[];
  admins: AdminRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'votesphere_db.json');
const SALT = process.env.VOTESPHERE_SECRET || 'votesphere_anonymous_salt_v3';
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'rajravi000100@gmail.com').trim().toLowerCase();
const OWNER_ID = process.env.OWNER_ID || 'vs_owner_' + crypto.createHash('sha256').update(OWNER_EMAIL + ':' + SALT).digest('hex').substring(0, 16);

function hashToken(token: string, saltModifier: string = ''): string {
  return crypto.createHash('sha256').update(`${token}:${SALT}:${saltModifier}`).digest('hex');
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    this.ensureSuperOwner();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.polls) && Array.isArray(parsed.votes)) {
          return {
            polls: parsed.polls,
            votes: parsed.votes,
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            suggestionVotes: Array.isArray(parsed.suggestionVotes) ? parsed.suggestionVotes : [],
            securityLogs: Array.isArray(parsed.securityLogs) ? parsed.securityLogs : [],
            admins: Array.isArray(parsed.admins) ? parsed.admins : []
          };
        }
      }
    } catch (e) {
      console.error('Error loading DB file, reinitializing empty database:', e);
    }
    const emptyData: DatabaseSchema = {
      polls: [],
      votes: [],
      suggestions: [],
      suggestionVotes: [],
      securityLogs: [],
      admins: []
    };
    this.save(emptyData);
    return emptyData;
  }

  private save(data: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  // --- Poll Operations ---
  public getPolls(filter?: { category?: string; query?: string; visibility?: string; status?: string; sort?: string }): Poll[] {
    let list = [...this.data.polls];

    // Filter unlisted polls out of public explore
    if (filter?.visibility === 'public') {
      list = list.filter(p => p.visibility === 'public');
    }
    if (filter?.category && filter.category !== 'All') {
      list = list.filter(p => p.category === filter.category);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(p => p.status === filter.status);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    // Auto-update expired polls
    const now = new Date();
    list.forEach(p => {
      if (p.expiresAt && new Date(p.expiresAt) <= now && p.status === 'active') {
        p.status = 'closed';
      }
    });

    // Sorting
    if (filter?.sort === 'most_voted') {
      list.sort((a, b) => b.totalVotes - a.totalVotes);
    } else if (filter?.sort === 'trending') {
      // Balanced decay: votes / (ageInHours + 2)^0.8
      list.sort((a, b) => {
        const ageA = Math.max(1, (Date.now() - new Date(a.createdAt).getTime()) / 3600000);
        const ageB = Math.max(1, (Date.now() - new Date(b.createdAt).getTime()) / 3600000);
        const scoreA = a.totalVotes / Math.pow(ageA + 2, 0.8);
        const scoreB = b.totalVotes / Math.pow(ageB + 2, 0.8);
        return scoreB - scoreA;
      });
    } else {
      // Default: Newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Sanitize creatorTokenHash from public results
    return list.map(p => {
      const { creatorTokenHash, ...rest } = p;
      return rest as Poll;
    });
  }

  public getPollsForAdmin(): Poll[] {
    const list = [...this.data.polls];
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.map(p => {
      const { creatorTokenHash, ...rest } = p;
      return rest as Poll;
    });
  }

  public getPollById(id: string, voterToken?: string, isCreatorRequest: boolean = false): Poll | null {
    const poll = this.data.polls.find(p => p.id === id);
    if (!poll) return null;

    // Check expiration
    if (poll.expiresAt && new Date(poll.expiresAt) <= new Date() && poll.status === 'active') {
      poll.status = 'closed';
      this.save(this.data);
    }

    const { creatorTokenHash, ...publicPoll } = poll;
    const hasVoted = voterToken ? this.hasVoted(id, voterToken) : false;

    // Respect Results Visibility
    // If 'creator_only' and not a creator request, hide vote counts
    // If 'after_vote' and neither voted nor closed, hide vote counts
    const isClosed = poll.status === 'closed';
    const hideResults = !isCreatorRequest && (
      poll.resultsVisibility === 'creator_only' ||
      (poll.resultsVisibility === 'after_vote' && !hasVoted && !isClosed)
    );

    if (hideResults) {
      return {
        ...publicPoll,
        options: publicPoll.options.map(o => ({
          ...o,
          voteCount: 0
        }))
      } as Poll;
    }

    return publicPoll as Poll;
  }

  public createPoll(input: PollCreateInput): { poll: Poll; creatorToken: string } {
    const pollId = 'poll_' + crypto.randomBytes(6).toString('hex');
    const creatorToken = 'crk_' + crypto.randomBytes(16).toString('hex');
    const creatorTokenHash = hashToken(creatorToken, pollId);

    // Filter, trim and deduplicate options
    const uniqueOptions: string[] = [];
    const seenLower = new Set<string>();

    for (const rawOpt of input.options) {
      const trimmed = rawOpt.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueOptions.push(trimmed);
      }
    }

    if (uniqueOptions.length < 2) {
      throw new Error('At least two unique, non-empty options are required to create a poll.');
    }

    const options = uniqueOptions.map((text, idx) => ({
      id: `opt_${idx + 1}_${crypto.randomBytes(3).toString('hex')}`,
      text,
      voteCount: 0,
      displayOrder: idx
    }));

    const resultsVis: ResultsVisibility = input.resultsVisibility || (input.showResultsBeforeClosure === false ? 'after_vote' : 'immediately');

    const newPoll: Poll = {
      id: pollId,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      category: input.category || 'General',
      coverImage: input.coverImage?.trim() || undefined,
      options,
      createdAt: new Date().toISOString(),
      startsAt: input.startsAt || null,
      expiresAt: input.expiresAt || null,
      status: 'active',
      visibility: input.visibility || 'public',
      allowMultipleChoices: !!input.allowMultipleChoices,
      allowVoteChanges: !!input.allowVoteChanges,
      randomizeOptions: !!input.randomizeOptions,
      resultsVisibility: resultsVis,
      showResultsBeforeClosure: resultsVis !== 'after_vote' && resultsVis !== 'creator_only',
      totalVotes: 0,
      creatorTokenHash
    };

    this.data.polls.unshift(newPoll);
    this.save(this.data);

    const { creatorTokenHash: _, ...publicPoll } = newPoll;
    return {
      poll: publicPoll as Poll,
      creatorToken
    };
  }

  public hasVoted(pollId: string, voterToken: string): boolean {
    const voterHash = hashToken(voterToken, pollId);
    return this.data.votes.some(v => v.pollId === pollId && v.voterTokenHash === voterHash);
  }

  public getVoterSelectedOptions(pollId: string, voterToken: string): string[] {
    const voterHash = hashToken(voterToken, pollId);
    return this.data.votes
      .filter(v => v.pollId === pollId && v.voterTokenHash === voterHash)
      .map(v => v.optionId);
  }

  public recordVote(pollId: string, optionIds: string[], voterToken: string): { success: boolean; message: string; poll?: Poll } {
    const poll = this.data.polls.find(p => p.id === pollId);
    if (!poll) {
      return { success: false, message: 'Poll not found.' };
    }

    if (poll.startsAt && new Date(poll.startsAt) > new Date()) {
      return { success: false, message: 'This poll has not opened for voting yet.' };
    }

    if (poll.status === 'closed' || (poll.expiresAt && new Date(poll.expiresAt) <= new Date())) {
      poll.status = 'closed';
      this.save(this.data);
      return { success: false, message: 'This poll has closed and is no longer accepting votes.' };
    }

    const voterHash = hashToken(voterToken, pollId);
    const existingVotes = this.data.votes.filter(v => v.pollId === pollId && v.voterTokenHash === voterHash);

    if (existingVotes.length > 0) {
      if (!poll.allowVoteChanges) {
        return { success: false, message: 'You have already recorded your vote in this poll.' };
      }

      // If vote changes allowed, remove previous votes first
      for (const oldVote of existingVotes) {
        const oldOpt = poll.options.find(o => o.id === oldVote.optionId);
        if (oldOpt) {
          oldOpt.voteCount = Math.max(0, oldOpt.voteCount - 1);
        }
      }
      this.data.votes = this.data.votes.filter(v => !(v.pollId === pollId && v.voterTokenHash === voterHash));
      poll.totalVotes = Math.max(0, poll.totalVotes - 1);
    }

    if (!optionIds || optionIds.length === 0) {
      return { success: false, message: 'Please select at least one option to vote.' };
    }

    if (!poll.allowMultipleChoices && optionIds.length > 1) {
      return { success: false, message: 'This poll only permits a single option to be selected.' };
    }

    // Verify all option IDs exist
    const validOptionIds = poll.options.map(o => o.id);
    for (const optId of optionIds) {
      if (!validOptionIds.includes(optId)) {
        return { success: false, message: 'Selected option not found in this poll.' };
      }
    }

    // Increment vote counts and record new votes
    for (const optId of optionIds) {
      const opt = poll.options.find(o => o.id === optId);
      if (opt) {
        opt.voteCount += 1;
      }
      this.data.votes.push({
        id: 'vote_' + crypto.randomBytes(6).toString('hex'),
        pollId,
        optionId: optId,
        voterTokenHash: voterHash,
        createdAt: new Date().toISOString()
      });
    }

    poll.totalVotes += 1;
    this.save(this.data);

    const { creatorTokenHash, ...publicPoll } = poll;
    return {
      success: true,
      message: existingVotes.length > 0 ? 'Your vote has been successfully updated!' : 'Your vote has been securely recorded!',
      poll: publicPoll as Poll
    };
  }

  // --- Creator Management ---
  public verifyCreatorToken(pollId: string, creatorToken: string): boolean {
    const poll = this.data.polls.find(p => p.id === pollId);
    if (!poll || !poll.creatorTokenHash) return false;
    const computedHash = hashToken(creatorToken, pollId);
    return poll.creatorTokenHash === computedHash;
  }

  public updatePollSettings(
    pollId: string,
    creatorToken: string,
    updates: {
      title?: string;
      description?: string;
      status?: 'active' | 'closed';
      visibility?: 'public' | 'unlisted';
      resultsVisibility?: ResultsVisibility;
      showResultsBeforeClosure?: boolean;
      options?: string[];
    },
    isAdmin: boolean = false
  ): { success: boolean; poll?: Poll; message: string } {
    if (!isAdmin && !this.verifyCreatorToken(pollId, creatorToken)) {
      return { success: false, message: 'Invalid or missing creator management token.' };
    }

    const poll = this.data.polls.find(p => p.id === pollId);
    if (!poll) return { success: false, message: 'Poll not found.' };

    if (updates.title && updates.title.trim().length >= 3) {
      poll.title = updates.title.trim();
    }
    if (typeof updates.description === 'string') {
      poll.description = updates.description.trim() || undefined;
    }
    if (updates.status) {
      poll.status = updates.status;
    }
    if (updates.visibility) {
      poll.visibility = updates.visibility;
    }
    if (updates.resultsVisibility) {
      poll.resultsVisibility = updates.resultsVisibility;
      poll.showResultsBeforeClosure = updates.resultsVisibility === 'immediately';
    } else if (typeof updates.showResultsBeforeClosure === 'boolean') {
      poll.showResultsBeforeClosure = updates.showResultsBeforeClosure;
      poll.resultsVisibility = updates.showResultsBeforeClosure ? 'immediately' : 'after_vote';
    }

    // Allow updating options if 0 votes recorded
    if (updates.options && poll.totalVotes === 0) {
      const cleanOpts = updates.options.map(o => o.trim()).filter(o => o.length > 0);
      if (cleanOpts.length >= 2) {
        poll.options = cleanOpts.map((text, idx) => ({
          id: `opt_${idx + 1}_${crypto.randomBytes(3).toString('hex')}`,
          text,
          voteCount: 0,
          displayOrder: idx
        }));
      }
    }

    this.save(this.data);
    const { creatorTokenHash, ...publicPoll } = poll;
    return { success: true, poll: publicPoll as Poll, message: 'Poll settings updated successfully.' };
  }

  public deletePoll(pollId: string, creatorToken: string, isAdmin: boolean = false): { success: boolean; message: string } {
    if (!isAdmin && !this.verifyCreatorToken(pollId, creatorToken)) {
      return { success: false, message: 'Invalid or missing creator management token.' };
    }

    const idx = this.data.polls.findIndex(p => p.id === pollId);
    if (idx === -1) return { success: false, message: 'Poll not found.' };

    this.data.polls.splice(idx, 1);
    this.data.votes = this.data.votes.filter(v => v.pollId !== pollId);
    this.save(this.data);

    return { success: true, message: 'Poll has been permanently deleted.' };
  }

  public getPollAuditLogs(pollId: string, creatorToken: string, isAdmin: boolean = false) {
    if (!isAdmin && !this.verifyCreatorToken(pollId, creatorToken)) {
      return null;
    }
    const pollVotes = this.data.votes.filter(v => v.pollId === pollId);
    return pollVotes.map(v => ({
      id: v.id,
      optionId: v.optionId,
      timestamp: v.createdAt
    }));
  }

  // --- Ideas & Upvoting ---
  public getSuggestions(filter?: { category?: string; sort?: 'trending' | 'top' | 'newest'; status?: string; query?: string; voterToken?: string }): Suggestion[] {
    let list = [...this.data.suggestions];

    if (filter?.category && filter.category !== 'All') {
      list = list.filter(s => s.category === filter.category);
    }

    if (filter?.status && filter.status !== 'All') {
      list = list.filter(s => s.status === filter.status);
    }

    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }

    if (filter?.sort === 'top') {
      list.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else if (filter?.sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: Trending
      list.sort((a, b) => {
        const ageHoursA = Math.max(1, (Date.now() - new Date(a.createdAt).getTime()) / 3600000);
        const ageHoursB = Math.max(1, (Date.now() - new Date(b.createdAt).getTime()) / 3600000);
        const scoreA = a.upvoteCount / Math.pow(ageHoursA + 2, 0.8);
        const scoreB = b.upvoteCount / Math.pow(ageHoursB + 2, 0.8);
        return scoreB - scoreA;
      });
    }

    if (filter?.voterToken) {
      const voterHash = hashToken(filter.voterToken, 'suggestion_global');
      const upvotedIds = new Set(
        this.data.suggestionVotes
          .filter(sv => sv.voterTokenHash === voterHash)
          .map(sv => sv.suggestionId)
      );
      return list.map(s => ({
        ...s,
        hasUpvoted: upvotedIds.has(s.id)
      }));
    }

    return list;
  }

  public getSuggestionById(id: string, voterToken?: string): Suggestion | null {
    const sug = this.data.suggestions.find(s => s.id === id);
    if (!sug) return null;

    let hasUpvoted = false;
    if (voterToken) {
      const voterHash = hashToken(voterToken, 'suggestion_global');
      hasUpvoted = this.data.suggestionVotes.some(sv => sv.suggestionId === id && sv.voterTokenHash === voterHash);
    }

    return {
      ...sug,
      hasUpvoted
    };
  }

  public createSuggestion(input: SuggestionCreateInput): Suggestion {
    const sug: Suggestion = {
      id: 'idea_' + crypto.randomBytes(6).toString('hex'),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category || 'General',
      imageUrl: input.imageUrl?.trim() || undefined,
      status: 'New',
      createdAt: new Date().toISOString(),
      upvoteCount: 1 // Initial creator upvote
    };

    this.data.suggestions.unshift(sug);
    this.save(this.data);
    return sug;
  }

  public updateSuggestionStatus(id: string, status: IdeaStatus): Suggestion | null {
    const sug = this.data.suggestions.find(s => s.id === id);
    if (!sug) return null;

    sug.status = status;
    this.save(this.data);
    return sug;
  }

  public toggleUpvoteSuggestion(suggestionId: string, voterToken: string): { success: boolean; hasUpvoted: boolean; upvoteCount: number; message: string } {
    const sug = this.data.suggestions.find(s => s.id === suggestionId);
    if (!sug) {
      return { success: false, hasUpvoted: false, upvoteCount: 0, message: 'Suggestion not found.' };
    }

    const voterHash = hashToken(voterToken, 'suggestion_global');
    const existingIdx = this.data.suggestionVotes.findIndex(sv => sv.suggestionId === suggestionId && sv.voterTokenHash === voterHash);

    if (existingIdx !== -1) {
      // Remove upvote
      this.data.suggestionVotes.splice(existingIdx, 1);
      sug.upvoteCount = Math.max(0, sug.upvoteCount - 1);
      this.save(this.data);
      return { success: true, hasUpvoted: false, upvoteCount: sug.upvoteCount, message: 'Upvote removed.' };
    } else {
      // Add upvote
      this.data.suggestionVotes.push({
        id: 'sv_' + crypto.randomBytes(6).toString('hex'),
        suggestionId,
        voterTokenHash: voterHash,
        createdAt: new Date().toISOString()
      });
      sug.upvoteCount += 1;
      this.save(this.data);
      return { success: true, hasUpvoted: true, upvoteCount: sug.upvoteCount, message: 'Upvoted successfully!' };
    }
  }

  // --- Real Stats Only (Zero Hardcoded Data) ---
  public getStats() {
    return {
      totalPolls: this.data.polls.length,
      totalVotes: this.data.polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0),
      totalSuggestions: this.data.suggestions.length
    };
  }

  // --- Multi-Administrator Management Methods ---

  private ensureSuperOwner() {
    if (!this.data.admins) {
      this.data.admins = [];
    }
    const existing = this.data.admins.find(a => a.email.toLowerCase() === OWNER_EMAIL || a.role === 'super_owner');
    if (!existing) {
      this.data.admins.unshift({
        id: OWNER_ID,
        email: OWNER_EMAIL,
        fullName: 'VoteSphere Super Owner',
        role: 'super_owner',
        status: 'ACTIVE',
        permissions: [...ALL_ADMIN_PERMISSIONS],
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: OWNER_ID
      });
      this.save(this.data);
    } else {
      let updated = false;
      if (existing.id !== OWNER_ID) {
        existing.id = OWNER_ID;
        updated = true;
      }
      if (existing.role !== 'super_owner') {
        existing.role = 'super_owner';
        updated = true;
      }
      if (existing.status !== 'ACTIVE') {
        existing.status = 'ACTIVE';
        updated = true;
      }
      if (existing.permissions.length !== ALL_ADMIN_PERMISSIONS.length) {
        existing.permissions = [...ALL_ADMIN_PERMISSIONS];
        updated = true;
      }
      if (updated) {
        this.save(this.data);
      }
    }
  }

  private sanitizeAdmin(admin: AdminRecord): AdminUser {
    const { passwordHash, ...safe } = admin;
    return safe;
  }

  public getAdminUsers(): AdminUser[] {
    this.ensureSuperOwner();
    return this.data.admins.map(a => this.sanitizeAdmin(a));
  }

  public getAdminUserById(id: string): AdminUser | undefined {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === id);
    return admin ? this.sanitizeAdmin(admin) : undefined;
  }

  public getAdminUserRecordById(id: string): AdminRecord | undefined {
    this.ensureSuperOwner();
    return this.data.admins.find(a => a.id === id);
  }

  public getAdminUserByEmail(email: string): AdminUser | undefined {
    this.ensureSuperOwner();
    const normalized = email.trim().toLowerCase();
    const admin = this.data.admins.find(a => a.email.toLowerCase() === normalized);
    return admin ? this.sanitizeAdmin(admin) : undefined;
  }

  public getAdminUserRecordByEmail(email: string): AdminRecord | undefined {
    this.ensureSuperOwner();
    const normalized = email.trim().toLowerCase();
    return this.data.admins.find(a => a.email.toLowerCase() === normalized);
  }

  public getAdminStats(): AdminStats {
    this.ensureSuperOwner();
    const list = this.data.admins;
    return {
      total: list.length,
      active: list.filter(a => a.status === 'ACTIVE').length,
      pending: list.filter(a => a.status === 'PENDING_APPROVAL').length,
      suspended: list.filter(a => a.status === 'SUSPENDED').length,
      rejected: list.filter(a => a.status === 'REJECTED').length
    };
  }

  public inviteAdmin(
    input: AdminInvitationInput,
    actorId: string,
    actorRole: 'super_owner' | 'admin' = 'super_owner'
  ): { success: boolean; admin?: AdminUser; invitationToken?: string; message: string } {
    this.ensureSuperOwner();
    const email = (input.email || '').trim().toLowerCase();
    const fullName = (input.fullName || '').trim();

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Valid administrator email address is required.' };
    }
    if (!fullName) {
      return { success: false, message: 'Administrator full name is required.' };
    }

    const existing = this.data.admins.find(a => a.email.toLowerCase() === email);
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { success: false, message: `An active administrator account already exists for ${email}.` };
      }
      if (existing.status === 'PENDING_APPROVAL') {
        return { success: false, message: `An application or invitation is already pending for ${email}.` };
      }
    }

    const inviteToken = 'vs_inv_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const newAdmin: AdminRecord = {
      id: 'adm_' + crypto.randomBytes(8).toString('hex'),
      email,
      fullName,
      role: 'admin',
      status: 'PENDING_APPROVAL',
      permissions: input.permissions && input.permissions.length > 0 ? input.permissions : [...DEFAULT_ADMIN_PERMISSIONS],
      invitedBy: actorId,
      invitationToken: inviteToken,
      invitationExpiresAt: expiresAt,
      requestDetails: input.requestDetails || `Direct administrator invitation initiated by ${actorRole}`,
      createdAt: new Date().toISOString()
    };

    this.data.admins.push(newAdmin);
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_INVITED',
      action: 'admins.invite',
      actorId,
      actorRole,
      targetId: newAdmin.id,
      result: 'success',
      details: `Administrator invitation created for ${fullName} (${email})`,
      metadata: { email, permissions: newAdmin.permissions }
    });

    return {
      success: true,
      admin: this.sanitizeAdmin(newAdmin),
      invitationToken: inviteToken,
      message: `Invitation generated successfully for ${email}.`
    };
  }

  public applyForAdmin(
    input: AdminApplicationInput,
    clientIp?: string
  ): { success: boolean; admin?: AdminUser; message: string } {
    this.ensureSuperOwner();
    const email = (input.email || '').trim().toLowerCase();
    const fullName = (input.fullName || '').trim();
    const requestDetails = (input.requestDetails || '').trim();

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Valid email address is required.' };
    }
    if (!fullName) {
      return { success: false, message: 'Full name is required.' };
    }
    if (!requestDetails) {
      return { success: false, message: 'Please provide reason or context for administrator access.' };
    }

    const existing = this.data.admins.find(a => a.email.toLowerCase() === email);
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return { success: false, message: 'An active administrator account already exists with this email address.' };
      }
      if (existing.status === 'PENDING_APPROVAL') {
        return { success: false, message: 'Your administrator application has already been submitted and is pending Super Owner review.' };
      }
      if (existing.status === 'SUSPENDED') {
        return { success: false, message: 'This account has been suspended by the platform owner.' };
      }
    }

    const newAdmin: AdminRecord = {
      id: 'adm_' + crypto.randomBytes(8).toString('hex'),
      email,
      fullName,
      role: 'admin',
      status: 'PENDING_APPROVAL',
      permissions: [...DEFAULT_ADMIN_PERMISSIONS],
      requestDetails,
      createdAt: new Date().toISOString()
    };

    this.data.admins.push(newAdmin);
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_APPLICATION_SUBMITTED',
      action: 'admin.apply',
      actorId: 'anonymous_applicant',
      actorRole: 'anonymous',
      targetId: newAdmin.id,
      result: 'success',
      ip: clientIp,
      details: `New administrator application submitted by ${fullName} (${email})`,
      metadata: { email, requestDetails }
    });

    return {
      success: true,
      admin: this.sanitizeAdmin(newAdmin),
      message: 'Your administrator application has been submitted successfully. The Super Owner will review your request.'
    };
  }

  public approveAdmin(
    adminId: string,
    actorId: string,
    customPermissions?: AdminPermission[]
  ): { success: boolean; admin?: AdminUser; setupToken?: string; message: string } {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      return { success: false, message: 'Administrator account record not found.' };
    }
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Super Owner account is already permanently active.' };
    }

    admin.status = 'ACTIVE';
    admin.approvedAt = new Date().toISOString();
    admin.approvedBy = actorId;
    if (customPermissions && Array.isArray(customPermissions) && customPermissions.length > 0) {
      admin.permissions = customPermissions;
    } else if (!admin.permissions || admin.permissions.length === 0) {
      admin.permissions = [...DEFAULT_ADMIN_PERMISSIONS];
    }

    // Ensure setup/invite token exists if password not yet set
    let setupToken = admin.invitationToken;
    if (!admin.passwordHash && !setupToken) {
      setupToken = 'vs_inv_' + crypto.randomBytes(16).toString('hex');
      admin.invitationToken = setupToken;
      admin.invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_APPROVED',
      action: 'admins.approve',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      details: `Administrator ${admin.fullName} (${admin.email}) approved with ${admin.permissions.length} permissions`,
      metadata: { permissions: admin.permissions }
    });

    return {
      success: true,
      admin: this.sanitizeAdmin(admin),
      setupToken,
      message: `Administrator ${admin.fullName} has been approved and activated.`
    };
  }

  public rejectAdmin(
    adminId: string,
    actorId: string,
    reason?: string
  ): { success: boolean; message: string } {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      return { success: false, message: 'Administrator record not found.' };
    }
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Super Owner cannot be rejected.' };
    }

    admin.status = 'REJECTED';
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_REJECTED',
      action: 'admins.reject',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      details: `Administrator application for ${admin.fullName} (${admin.email}) was rejected. Reason: ${reason || 'Not specified'}`,
      metadata: { reason }
    });

    return { success: true, message: `Application for ${admin.fullName} has been rejected.` };
  }

  public suspendAdmin(
    adminId: string,
    actorId: string,
    reason?: string
  ): { success: boolean; message: string } {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      return { success: false, message: 'Administrator record not found.' };
    }
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Super Owner account cannot be suspended.' };
    }

    admin.status = 'SUSPENDED';
    admin.suspendedAt = new Date().toISOString();
    admin.suspendedReason = reason || 'Suspended by Super Owner';
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_SUSPENDED',
      action: 'admins.suspend',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      severity: 'warning',
      details: `Administrator account ${admin.fullName} (${admin.email}) suspended. Reason: ${admin.suspendedReason}`,
      metadata: { reason: admin.suspendedReason }
    });

    return { success: true, message: `Administrator ${admin.fullName} has been suspended.` };
  }

  public reactivateAdmin(
    adminId: string,
    actorId: string
  ): { success: boolean; message: string } {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      return { success: false, message: 'Administrator record not found.' };
    }
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Super Owner is already active.' };
    }

    admin.status = 'ACTIVE';
    delete admin.suspendedAt;
    delete admin.suspendedReason;
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_REACTIVATED',
      action: 'admins.reactivate',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      details: `Administrator account ${admin.fullName} (${admin.email}) reactivated.`
    });

    return { success: true, message: `Administrator ${admin.fullName} has been reactivated.` };
  }

  public removeAdmin(
    adminId: string,
    actorId: string
  ): { success: boolean; message: string } {
    this.ensureSuperOwner();
    const idx = this.data.admins.findIndex(a => a.id === adminId);
    if (idx === -1) {
      return { success: false, message: 'Administrator record not found.' };
    }
    const admin = this.data.admins[idx];
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Security Constraint: Super Owner account cannot be removed.' };
    }

    this.data.admins.splice(idx, 1);
    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_REMOVED',
      action: 'admins.remove',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      severity: 'warning',
      details: `Administrator ${admin.fullName} (${admin.email}) permanently removed.`
    });

    return { success: true, message: `Administrator ${admin.fullName} has been permanently removed.` };
  }

  public updateAdminPermissions(
    adminId: string,
    permissions: AdminPermission[],
    actorId: string
  ): { success: boolean; admin?: AdminUser; message: string } {
    this.ensureSuperOwner();
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      return { success: false, message: 'Administrator record not found.' };
    }
    if (admin.role === 'super_owner') {
      return { success: false, message: 'Super Owner always retains all platform permissions.' };
    }

    const validPermissions = permissions.filter(p => ALL_ADMIN_PERMISSIONS.includes(p));
    admin.permissions = validPermissions;
    this.save(this.data);

    this.logSecurityEvent({
      type: 'PERMISSIONS_UPDATED',
      action: 'admins.permissions_update',
      actorId,
      actorRole: 'super_owner',
      targetId: admin.id,
      result: 'success',
      details: `Permissions updated for ${admin.fullName} (${admin.email}): ${validPermissions.join(', ')}`,
      metadata: { permissions: validPermissions }
    });

    return {
      success: true,
      admin: this.sanitizeAdmin(admin),
      message: `Permissions updated successfully for ${admin.fullName}.`
    };
  }

  public completeAdminSetup(
    invitationToken: string,
    password: string,
    fullName?: string
  ): { success: boolean; admin?: AdminUser; message: string } {
    this.ensureSuperOwner();
    if (!invitationToken || !password) {
      return { success: false, message: 'Invitation token and master password are required.' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters in length.' };
    }

    const admin = this.data.admins.find(a => a.invitationToken === invitationToken);
    if (!admin) {
      return { success: false, message: 'Invalid or expired invitation token.' };
    }

    if (admin.invitationExpiresAt && new Date(admin.invitationExpiresAt) < new Date()) {
      return { success: false, message: 'Invitation token has expired. Please request a new invitation.' };
    }

    if (admin.status === 'SUSPENDED' || admin.status === 'REJECTED') {
      return { success: false, message: 'This account has been suspended or rejected. Access denied.' };
    }

    admin.passwordHash = crypto.createHash('sha256').update(password + ':' + SALT).digest('hex');
    delete admin.invitationToken;
    delete admin.invitationExpiresAt;
    admin.status = 'ACTIVE';
    if (fullName && fullName.trim()) {
      admin.fullName = fullName.trim();
    }

    this.save(this.data);

    this.logSecurityEvent({
      type: 'ADMIN_SETUP_COMPLETED',
      action: 'admin.setup',
      actorId: admin.id,
      actorRole: admin.role,
      targetId: admin.id,
      result: 'success',
      details: `Administrator account setup completed for ${admin.fullName} (${admin.email})`
    });

    return {
      success: true,
      admin: this.sanitizeAdmin(admin),
      message: 'Administrator account setup completed successfully. You may now log in.'
    };
  }

  public verifyAdminCredentials(
    email: string,
    password: string
  ): { success: boolean; admin?: AdminUser; message?: string } {
    this.ensureSuperOwner();
    const normalized = email.trim().toLowerCase();
    const admin = this.data.admins.find(a => a.email.toLowerCase() === normalized);

    if (!admin) {
      return { success: false, message: 'Administrator account not found.' };
    }

    if (admin.status === 'PENDING_APPROVAL') {
      return { success: false, message: 'Your administrator application is pending approval by the Super Owner.' };
    }

    if (admin.status === 'SUSPENDED') {
      return { success: false, message: 'Your administrator account has been suspended by the Super Owner.' };
    }

    if (admin.status === 'REJECTED') {
      return { success: false, message: 'Your administrator request was not approved.' };
    }

    if (!admin.passwordHash) {
      return { success: false, message: 'Administrator account setup is incomplete. Please complete setup via invitation link.' };
    }

    const inputHash = crypto.createHash('sha256').update(password + ':' + SALT).digest('hex');
    const inputBuf = Buffer.from(inputHash, 'hex');
    const storedBuf = Buffer.from(admin.passwordHash, 'hex');

    if (inputBuf.length !== storedBuf.length || !crypto.timingSafeEqual(inputBuf, storedBuf)) {
      return { success: false, message: 'Invalid password credentials.' };
    }

    return {
      success: true,
      admin: this.sanitizeAdmin(admin)
    };
  }

  public updateAdminLastLogin(id: string) {
    const admin = this.data.admins.find(a => a.id === id);
    if (admin) {
      admin.lastLoginAt = new Date().toISOString();
      this.save(this.data);
    }
  }

  // --- Immutable Security Audit Logging ---
  public logSecurityEvent(
    eventOrType: string | {
      type: string;
      details: string;
      ip?: string;
      severity?: 'info' | 'warning' | 'critical';
      action?: string;
      actorId?: string;
      actorRole?: string;
      targetId?: string;
      result?: 'success' | 'failure';
      metadata?: Record<string, any>;
    },
    details?: string,
    ip?: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): SecurityAuditLog {
    let entry: SecurityAuditLog;

    if (typeof eventOrType === 'object') {
      entry = {
        id: 'sec_' + crypto.randomBytes(6).toString('hex'),
        timestamp: new Date().toISOString(),
        type: eventOrType.type,
        action: eventOrType.action || eventOrType.type,
        actorId: eventOrType.actorId,
        actorRole: eventOrType.actorRole,
        targetId: eventOrType.targetId,
        result: eventOrType.result || 'success',
        metadata: eventOrType.metadata,
        details: eventOrType.details,
        ip: eventOrType.ip,
        severity: eventOrType.severity || 'info'
      };
    } else {
      entry = {
        id: 'sec_' + crypto.randomBytes(6).toString('hex'),
        timestamp: new Date().toISOString(),
        type: eventOrType,
        action: eventOrType,
        details: details || '',
        ip,
        severity
      };
    }

    if (!this.data.securityLogs) {
      this.data.securityLogs = [];
    }
    this.data.securityLogs.unshift(entry);
    if (this.data.securityLogs.length > 1000) {
      this.data.securityLogs = this.data.securityLogs.slice(0, 1000);
    }
    this.save(this.data);
    return entry;
  }

  public getSecurityAuditLogs(limit: number = 200, actorId?: string): SecurityAuditLog[] {
    const logs = this.data.securityLogs || [];
    if (actorId) {
      return logs.filter(l => l.actorId === actorId).slice(0, limit);
    }
    return logs.slice(0, limit);
  }
}

export const db = new Database();
