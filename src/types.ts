export type PollCategory = 
  | 'Education & College'
  | 'Campus & Student Life'
  | 'Events & Entertainment'
  | 'Sports'
  | 'Technology'
  | 'Organizations'
  | 'Community'
  | 'Lifestyle'
  | 'General'
  | 'Other';

export type ResultsVisibility = 'immediately' | 'after_vote' | 'creator_only';

export type IdeaStatus = 'New' | 'Under Review' | 'Planned' | 'In Progress' | 'Completed';

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  displayOrder?: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  category?: PollCategory | string;
  coverImage?: string;
  options: PollOption[];
  createdAt: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  status: 'active' | 'closed';
  visibility: 'public' | 'unlisted';
  allowMultipleChoices: boolean;
  allowVoteChanges?: boolean;
  randomizeOptions?: boolean;
  resultsVisibility: ResultsVisibility;
  showResultsBeforeClosure: boolean; // Backwards compatible alias
  totalVotes: number;
  creatorTokenHash?: string;
}

export interface PollCreateInput {
  title: string;
  description?: string;
  category?: string;
  coverImage?: string;
  options: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
  visibility?: 'public' | 'unlisted';
  allowMultipleChoices?: boolean;
  allowVoteChanges?: boolean;
  randomizeOptions?: boolean;
  resultsVisibility?: ResultsVisibility;
  showResultsBeforeClosure?: boolean;
}

export interface PollCreateResult {
  poll: Poll;
  creatorToken: string;
  votingUrl: string;
  managementUrl: string;
}

export interface VotePayload {
  pollId: string;
  selectedOptionIds: string[];
  voterToken: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  status: IdeaStatus;
  createdAt: string;
  upvoteCount: number;
  hasUpvoted?: boolean;
}

export interface SuggestionCreateInput {
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
}

export interface SystemStats {
  totalPolls: number;
  totalVotes: number;
  totalSuggestions: number;
}

export type AdminPermission =
  | 'dashboard.view'
  | 'polls.create'
  | 'polls.edit'
  | 'polls.delete'
  | 'polls.view_results'
  | 'polls.moderate'
  | 'admins.invite'
  | 'admins.approve'
  | 'admins.suspend'
  | 'admins.remove'
  | 'settings.manage'
  | 'audit_logs.view';

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

export type AdminAccountStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_owner' | 'admin';
  status: AdminAccountStatus;
  permissions: AdminPermission[];
  invitedBy?: string;
  invitationToken?: string;
  invitationExpiresAt?: string;
  requestDetails?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}

export interface AdminStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
}

export interface AdminInvitationInput {
  email: string;
  fullName: string;
  permissions?: AdminPermission[];
  requestDetails?: string;
}

export interface AdminApplicationInput {
  email: string;
  fullName: string;
  requestDetails: string;
}

export interface AdminSetupInput {
  invitationToken: string;
  password: string;
  fullName?: string;
}

export interface OwnerInfo {
  id: string;
  email: string;
  fullName?: string;
  role: 'super_owner' | 'owner' | 'admin';
  permissions: AdminPermission[];
  status?: AdminAccountStatus;
}

export interface OwnerLoginResult {
  success: boolean;
  token: string;
  owner: OwnerInfo;
  expiresAt: string;
}

// Backwards-compatible alias for existing imports
export type AdminLoginResult = OwnerLoginResult;

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  type: string;
  action?: string;
  actorId?: string;
  actorRole?: 'super_owner' | 'admin' | 'anonymous' | string;
  targetId?: string;
  result?: 'success' | 'failure';
  metadata?: Record<string, any>;
  details: string;
  ip?: string;
  severity: 'info' | 'warning' | 'critical';
}
