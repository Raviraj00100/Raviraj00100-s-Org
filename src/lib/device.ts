/**
 * Anonymous Device Identity Management
 * 
 * VoteSphere does not require accounts, logins, emails, or phone numbers.
 * Instead, each browser generates a cryptographically secure random token (UUIDv4-like)
 * stored locally. When voting, the server hashes this voter token along with the poll ID
 * to guarantee that one anonymous device credential cannot cast duplicate votes,
 * while preserving complete privacy.
 */

const VOTER_TOKEN_KEY = 'votesphere_voter_token';

export function getAnonymousVoterToken(): string {
  try {
    let token = localStorage.getItem(VOTER_TOKEN_KEY);
    if (!token) {
      token = generateSecureToken();
      localStorage.setItem(VOTER_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // In restricted sandbox or privacy mode
    return 'fallback_voter_' + Math.random().toString(36).substring(2, 15);
  }
}

function generateSecureToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback random hex string
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
