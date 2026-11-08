import {
  Poll,
  PollCreateInput,
  PollCreateResult,
  Suggestion,
  SuggestionCreateInput,
  SystemStats,
  IdeaStatus,
  ResultsVisibility,
  AdminLoginResult,
  SecurityAuditLog,
  OwnerInfo,
  AdminUser,
  AdminPermission,
  AdminStats,
  AdminInvitationInput,
  AdminApplicationInput,
  AdminSetupInput
} from '../types.js';
import { getAnonymousVoterToken } from './device.js';

const API_BASE = '/api';
const ADMIN_TOKEN_KEY = 'votesphere_admin_token';
const OWNER_INFO_KEY = 'votesphere_owner_info';

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Sandbox safe
  }
}

export function getOwnerInfo(): OwnerInfo | null {
  try {
    const raw = sessionStorage.getItem(OWNER_INFO_KEY) || localStorage.getItem(OWNER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOwnerInfo(owner: OwnerInfo) {
  try {
    const serialized = JSON.stringify(owner);
    sessionStorage.setItem(OWNER_INFO_KEY, serialized);
    localStorage.setItem(OWNER_INFO_KEY, serialized);
  } catch {
    // Sandbox safe
  }
}

export function setAdminSession(token: string, owner?: OwnerInfo) {
  setAdminToken(token);
  if (owner) {
    setOwnerInfo(owner);
  }
}

export function clearAdminToken() {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(OWNER_INFO_KEY);
    localStorage.removeItem(OWNER_INFO_KEY);
  } catch {
    // Sandbox safe
  }
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}

/**
 * Standardized Bearer authorization headers for all protected admin and management calls.
 * Sends both Authorization: Bearer <token> (RFC 6750) and x-admin-token for maximum compatibility.
 */
export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`,
    'x-admin-token': token
  };
}

/**
 * Universal safe JSON fetch helper.
 * - Always requests Accept: application/json
 * - Reads text first to protect against HTML responses (Vite fallback, proxies, 404s)
 * - Guarantees that raw JSON parse syntax errors (e.g. Unexpected token '<', "<html>...") are NEVER thrown
 * - Safely surfaces structured error messages
 */
async function safeFetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr: unknown) {
    throw new Error('Network connection failed. Please ensure the VoteSphere server is running.');
  }

  const rawText = await res.text();
  let data: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      // Non-JSON response received (e.g. HTML from Vite SPA or server error page)
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Access denied: Owner administrator authorization required.');
        }
        if (res.status === 404) {
          throw new Error(`API endpoint ${url} not found (404).`);
        }
        if (res.status === 405) {
          throw new Error('Method Not Allowed: POST request required for this action.');
        }
        if (res.status === 429) {
          throw new Error('Too many requests. Please wait a few moments before trying again.');
        }
        throw new Error(`Server returned error HTTP ${res.status}. Expected JSON response.`);
      }
      throw new Error(`Invalid response format from server at ${url}. Expected JSON.`);
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function adminLogin(identifier: string, password?: string): Promise<AdminLoginResult> {
  const payload = password ? { identifier, password } : { identifier, password: identifier };
  const data = await safeFetchJson<AdminLoginResult>(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (data?.token) {
    setAdminSession(data.token, data.owner);
  }
  return data;
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const data = await safeFetchJson<{ authorized: boolean; owner?: OwnerInfo }>(`${API_BASE}/admin/verify`, {
      headers: getAdminAuthHeaders()
    });
    if (!data || !data.authorized) {
      clearAdminToken();
      return false;
    }
    if (data.owner) {
      setOwnerInfo(data.owner);
    }
    return true;
  } catch {
    clearAdminToken();
    return false;
  }
}

export async function fetchAdminPolls(): Promise<Poll[]> {
  try {
    return await safeFetchJson<Poll[]>(`${API_BASE}/admin/polls`, {
      headers: getAdminAuthHeaders()
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Owner administrator authorization') || msg.includes('Access denied') || msg.includes('401') || msg.includes('403')) {
      clearAdminToken();
    }
    throw err;
  }
}

export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  return await safeFetchJson<SecurityAuditLog[]>(`${API_BASE}/admin/audit-logs`, {
    headers: getAdminAuthHeaders()
  });
}

export async function fetchSystemStats(): Promise<SystemStats> {
  return await safeFetchJson<SystemStats>(`${API_BASE}/stats`);
}

export async function fetchPolls(params?: { category?: string; query?: string; visibility?: string; status?: string; sort?: string }): Promise<Poll[]> {
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') searchParams.set('category', params.category);
  if (params?.query) searchParams.set('query', params.query);
  if (params?.visibility) searchParams.set('visibility', params.visibility);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.sort) searchParams.set('sort', params.sort);

  return await safeFetchJson<Poll[]>(`${API_BASE}/polls?${searchParams.toString()}`);
}

export async function fetchPollById(id: string): Promise<Poll & { hasVoted: boolean; userSelectedOptionIds: string[]; isCreator?: boolean }> {
  const voterToken = getAnonymousVoterToken();
  return await safeFetchJson<Poll & { hasVoted: boolean; userSelectedOptionIds: string[]; isCreator?: boolean }>(`${API_BASE}/polls/${id}?voterToken=${encodeURIComponent(voterToken)}`);
}

export async function createPoll(input: PollCreateInput): Promise<PollCreateResult> {
  return await safeFetchJson<PollCreateResult>(`${API_BASE}/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify(input)
  });
}

export async function submitVote(pollId: string, optionIds: string[]): Promise<{ poll: Poll; userSelectedOptionIds: string[]; message: string }> {
  const voterToken = getAnonymousVoterToken();
  return await safeFetchJson<{ poll: Poll; userSelectedOptionIds: string[]; message: string }>(`${API_BASE}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      optionIds,
      voterToken
    })
  });
}

export async function verifyCreatorManagement(pollId: string, creatorToken: string): Promise<{ authorized: boolean; poll: Poll; auditLogs?: Array<{ id: string; optionId: string; timestamp: string }> }> {
  return await safeFetchJson<{ authorized: boolean; poll: Poll; auditLogs?: Array<{ id: string; optionId: string; timestamp: string }> }>(`${API_BASE}/polls/${pollId}/manage`, {
    headers: {
      ...(creatorToken ? { 'x-creator-token': creatorToken } : {}),
      ...getAdminAuthHeaders()
    }
  });
}

export async function updatePollSettings(
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
  }
): Promise<Poll> {
  const data = await safeFetchJson<{ poll: Poll }>(`${API_BASE}/polls/${pollId}/manage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(creatorToken ? { 'x-creator-token': creatorToken } : {}),
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify(updates)
  });
  return data.poll;
}

export async function deletePoll(pollId: string, creatorToken: string): Promise<void> {
  await safeFetchJson<{ success: boolean }>(`${API_BASE}/polls/${pollId}/manage`, {
    method: 'DELETE',
    headers: {
      ...(creatorToken ? { 'x-creator-token': creatorToken } : {}),
      ...getAdminAuthHeaders()
    }
  });
}

export async function fetchSuggestions(params?: { category?: string; sort?: 'trending' | 'top' | 'newest'; status?: string; query?: string }): Promise<Suggestion[]> {
  const voterToken = getAnonymousVoterToken();
  const searchParams = new URLSearchParams();
  if (params?.category && params.category !== 'All') searchParams.set('category', params.category);
  if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
  if (params?.sort) searchParams.set('sort', params.sort);
  if (params?.query) searchParams.set('query', params.query);
  searchParams.set('voterToken', voterToken);

  return await safeFetchJson<Suggestion[]>(`${API_BASE}/suggestions?${searchParams.toString()}`);
}

export async function fetchSuggestionById(id: string): Promise<Suggestion> {
  const voterToken = getAnonymousVoterToken();
  return await safeFetchJson<Suggestion>(`${API_BASE}/suggestions/${id}?voterToken=${encodeURIComponent(voterToken)}`);
}

export async function createSuggestion(input: SuggestionCreateInput): Promise<Suggestion> {
  return await safeFetchJson<Suggestion>(`${API_BASE}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateSuggestionStatus(id: string, status: IdeaStatus): Promise<Suggestion> {
  return await safeFetchJson<Suggestion>(`${API_BASE}/suggestions/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify({ status })
  });
}

export async function toggleUpvoteSuggestion(suggestionId: string): Promise<{ hasUpvoted: boolean; upvoteCount: number }> {
  const voterToken = getAnonymousVoterToken();
  return await safeFetchJson<{ hasUpvoted: boolean; upvoteCount: number }>(`${API_BASE}/suggestions/${suggestionId}/upvote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterToken })
  });
}

// --- Multi-Administrator Management Client API ---

export async function fetchAdminStats(): Promise<AdminStats> {
  return await safeFetchJson<AdminStats>(`${API_BASE}/admin/stats`, {
    headers: getAdminAuthHeaders()
  });
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return await safeFetchJson<AdminUser[]>(`${API_BASE}/admin/users`, {
    headers: getAdminAuthHeaders()
  });
}

export async function inviteAdminUser(input: AdminInvitationInput): Promise<{ success: boolean; admin?: AdminUser; invitationToken?: string; message: string }> {
  return await safeFetchJson<{ success: boolean; admin?: AdminUser; invitationToken?: string; message: string }>(`${API_BASE}/admin/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify(input)
  });
}

export async function applyAdminAccess(input: AdminApplicationInput): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function setupAdminAccount(input: AdminSetupInput): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function approveAdminUser(id: string, permissions?: AdminPermission[]): Promise<{ success: boolean; admin?: AdminUser; setupToken?: string; message: string }> {
  return await safeFetchJson<{ success: boolean; admin?: AdminUser; setupToken?: string; message: string }>(`${API_BASE}/admin/users/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify({ permissions })
  });
}

export async function rejectAdminUser(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/users/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify({ reason })
  });
}

export async function suspendAdminUser(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/users/${id}/suspend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify({ reason })
  });
}

export async function reactivateAdminUser(id: string): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/users/${id}/reactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    }
  });
}

export async function removeAdminUser(id: string): Promise<{ success: boolean; message: string }> {
  return await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders()
  });
}

export async function updateAdminUserPermissions(id: string, permissions: AdminPermission[]): Promise<{ success: boolean; admin?: AdminUser; message: string }> {
  return await safeFetchJson<{ success: boolean; admin?: AdminUser; message: string }>(`${API_BASE}/admin/users/${id}/permissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAdminAuthHeaders()
    },
    body: JSON.stringify({ permissions })
  });
}

export async function fetchPlatformSettings(): Promise<any> {
  return await safeFetchJson<any>(`${API_BASE}/admin/settings`, {
    headers: getAdminAuthHeaders()
  });
}
