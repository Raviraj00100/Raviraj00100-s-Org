import http from 'http';
import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, ALL_ADMIN_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS } from './server/db.js';
import { AdminPermission } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const SALT = process.env.VOTESPHERE_SECRET || 'votesphere_anonymous_salt_v3';

// SUPER OWNER PROVISIONING (Permanent Single Super Owner)
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'rajravi000100@gmail.com').trim().toLowerCase();
const OWNER_ID = process.env.OWNER_ID || 'vs_owner_' + crypto.createHash('sha256').update(OWNER_EMAIL + ':' + SALT).digest('hex').substring(0, 16);
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.OWNER_SECRET_KEY || 'VoteSphere@Owner2026!';
const OWNER_PASSWORD_HASH = crypto.createHash('sha256').update(OWNER_PASSWORD + ':' + SALT).digest('hex');

// In-Memory Rate Limiting for Admin Login (5 failed attempts = 15 min lock)
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}
const loginRateLimits = new Map<string, RateLimitEntry>();

function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimits.get(ip);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil > now) {
    return { allowed: false, waitSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (now - entry.lockedUntil > 15 * 60 * 1000) {
    loginRateLimits.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordLoginFailure(ip: string): { locked: boolean; waitSeconds?: number } {
  const now = Date.now();
  const entry = loginRateLimits.get(ip) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // 15 min lockout
    loginRateLimits.set(ip, entry);
    return { locked: true, waitSeconds: 900 };
  }
  loginRateLimits.set(ip, entry);
  return { locked: false };
}

function clearLoginRateLimit(ip: string) {
  loginRateLimits.delete(ip);
}

// Token payload structure
export interface AdminTokenPayload {
  sub: string;
  email: string;
  fullName?: string;
  role: 'super_owner' | 'admin';
  permissions: AdminPermission[];
  iat: number;
  exp: number;
  nonce: string;
}

export interface AdminAuthResult {
  valid: boolean;
  status: 200 | 401 | 403;
  error?: string;
  payload?: AdminTokenPayload;
}

// Cryptographically signed session tokens for Super Owner and Administrators
function generateAdminToken(admin: {
  id: string;
  email: string;
  fullName?: string;
  role: 'super_owner' | 'admin';
  permissions: AdminPermission[];
}): { token: string; expiresAt: string } {
  const issuedAt = Date.now();
  const expiresAtMs = issuedAt + 12 * 60 * 60 * 1000; // 12-hour session
  const payload: AdminTokenPayload = {
    sub: admin.id,
    email: admin.email.toLowerCase(),
    fullName: admin.fullName,
    role: admin.role,
    permissions: admin.permissions,
    iat: issuedAt,
    exp: expiresAtMs,
    nonce: crypto.randomBytes(12).toString('hex')
  };
  const payloadStr = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SALT).update(payloadStr).digest('hex');
  const token = Buffer.from(`${payloadStr}::${signature}`).toString('base64');
  return { token, expiresAt: new Date(expiresAtMs).toISOString() };
}

function generateOwnerToken(): { token: string; expiresAt: string } {
  return generateAdminToken({
    id: OWNER_ID,
    email: OWNER_EMAIL,
    fullName: 'VoteSphere Super Owner',
    role: 'super_owner',
    permissions: [...ALL_ADMIN_PERMISSIONS]
  });
}

function verifyAdminSession(token?: string | null): AdminAuthResult {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      valid: false,
      status: 401,
      error: 'Unauthorized: Session token is missing. Please log in as an authorized administrator.'
    };
  }

  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const [payloadStr, signature] = raw.split('::');
    if (!payloadStr || !signature) {
      return {
        valid: false,
        status: 401,
        error: 'Unauthorized: Malformed session token format.'
      };
    }

    const expectedSig = crypto.createHmac('sha256', SALT).update(payloadStr).digest('hex');
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {
        valid: false,
        status: 401,
        error: 'Unauthorized: Invalid session token signature.'
      };
    }

    const payload: AdminTokenPayload = JSON.parse(payloadStr);

    // Expiration check: 401 if expired
    if (!payload.exp || Date.now() > payload.exp) {
      return {
        valid: false,
        status: 401,
        error: 'Unauthorized: Session token has expired. Please log in again.'
      };
    }

    // Check if Super Owner
    const isSuperOwner = (payload.role === 'super_owner' || (payload.role as any) === 'owner') &&
      payload.email && payload.email.trim().toLowerCase() === OWNER_EMAIL &&
      payload.sub === OWNER_ID;

    if (isSuperOwner) {
      return {
        valid: true,
        status: 200,
        payload: {
          ...payload,
          fullName: 'VoteSphere Super Owner',
          role: 'super_owner',
          permissions: [...ALL_ADMIN_PERMISSIONS]
        }
      };
    }

    // Database lookup for Administrator status
    // Enforces immediate revocation when administrator is suspended or deleted
    const adminRecord = db.getAdminUserRecordById(payload.sub);
    if (!adminRecord) {
      return {
        valid: false,
        status: 401,
        error: 'Unauthorized: Administrator account no longer exists.'
      };
    }

    if (adminRecord.status === 'SUSPENDED') {
      return {
        valid: false,
        status: 403,
        error: `Forbidden: Administrator account has been suspended by the Super Owner. Reason: ${adminRecord.suspendedReason || 'Administrative suspension'}`
      };
    }

    if (adminRecord.status === 'REJECTED') {
      return {
        valid: false,
        status: 403,
        error: 'Forbidden: Administrator application was rejected by the Super Owner.'
      };
    }

    if (adminRecord.status !== 'ACTIVE') {
      return {
        valid: false,
        status: 403,
        error: 'Forbidden: Administrator account is not active or awaiting approval.'
      };
    }

    return {
      valid: true,
      status: 200,
      payload: {
        ...payload,
        fullName: adminRecord.fullName,
        role: adminRecord.role,
        permissions: adminRecord.permissions || []
      }
    };
  } catch {
    return {
      valid: false,
      status: 401,
      error: 'Unauthorized: Invalid session token format.'
    };
  }
}

// Super Owner specific validation
function verifyOwnerSession(token?: string | null): AdminAuthResult {
  const result = verifyAdminSession(token);
  if (!result.valid) return result;
  if (result.payload?.role !== 'super_owner') {
    return {
      valid: false,
      status: 403,
      error: 'Forbidden: Super Owner authorization required. Only the platform Super Owner can perform this action.'
    };
  }
  return result;
}

function verifyOwnerToken(token?: string | null): boolean {
  return verifyOwnerSession(token).valid;
}

function verifyAdminToken(token?: string | null): boolean {
  return verifyAdminSession(token).valid;
}

function extractAdminToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return (req.headers['x-admin-token'] as string) || (req.query.adminToken as string);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const addr = req.socket.remoteAddress || 'unknown';
  if (addr === '::1' || addr === '::ffff:127.0.0.1') return '127.0.0.1';
  return addr;
}

function requireOwnerAuth(req: Request, res: Response, next: NextFunction) {
  res.type('application/json');
  const token = extractAdminToken(req);
  const auth = verifyOwnerSession(token);

  if (!auth.valid) {
    const clientIp = getClientIp(req);
    if (auth.status === 403) {
      db.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        action: 'super_owner.required',
        actorId: 'anonymous',
        actorRole: 'anonymous',
        result: 'failure',
        ip: clientIp,
        severity: 'warning',
        details: 'Forbidden: Non-super-owner account attempted Super Owner access'
      });
      return res.status(403).json({ error: auth.error });
    }
    return res.status(401).json({ authorized: false, error: auth.error });
  }

  (req as any).admin = auth.payload;
  (req as any).owner = auth.payload;
  next();
}

function requirePermission(perm: AdminPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.type('application/json');
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);

    if (!auth.valid) {
      const clientIp = getClientIp(req);
      if (auth.status === 403) {
        return res.status(403).json({ error: auth.error });
      }
      return res.status(401).json({ authorized: false, error: auth.error });
    }

    const admin = auth.payload!;
    (req as any).admin = admin;
    (req as any).owner = admin;

    if (admin.role === 'super_owner' || (admin.permissions && admin.permissions.includes(perm))) {
      return next();
    }

    const clientIp = getClientIp(req);
    db.logSecurityEvent({
      type: 'INSUFFICIENT_PERMISSIONS',
      action: perm,
      actorId: admin.sub,
      actorRole: admin.role,
      result: 'failure',
      ip: clientIp,
      severity: 'warning',
      details: `Administrator ${admin.email} attempted action '${perm}' without required permission`,
      metadata: { requiredPermission: perm, currentPermissions: admin.permissions }
    });

    return res.status(403).json({
      error: `Forbidden: Missing required administrator permission '${perm}'. Please contact the Super Owner.`
    });
  };
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Parse JSON and URL-encoded request bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure all API responses include Content-Type: application/json
  app.use('/api', (_req, res, next) => {
    res.type('application/json');
    next();
  });

  // --- API Routes ---
  const router = express.Router();

  // Authentication Handler for Super Owner and Administrators
  const handleAdminLogin = (req: Request, res: Response) => {
    res.type('application/json');
    const clientIp = getClientIp(req);
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      db.logSecurityEvent({
        type: 'LOGIN_LOCKED',
        action: 'admin.login',
        actorId: 'anonymous',
        actorRole: 'anonymous',
        result: 'failure',
        ip: clientIp,
        severity: 'warning',
        details: `Rate limit lockout active (${rateCheck.waitSeconds}s remaining)`
      });
      return res.status(429).json({
        error: `Too many failed login attempts. Access temporarily locked for ${rateCheck.waitSeconds} seconds.`
      });
    }

    const body = req.body || {};
    const userIdentifier = (body.identifier || body.email || body.username || body.adminEmail || '').trim().toLowerCase();
    const userPassword = (body.password || body.passkey || body.secret || '').trim();

    if (!userIdentifier) {
      return res.status(400).json({ error: 'Administrator email address is required.' });
    }
    if (!userPassword) {
      return res.status(400).json({ error: 'Master password is required.' });
    }

    // 1. Check Super Owner Credentials
    const isSuperOwnerEmail = userIdentifier === OWNER_EMAIL || userIdentifier === OWNER_ID;
    const inputHash = crypto.createHash('sha256').update(userPassword + ':' + SALT).digest('hex');
    const inputHashBuf = Buffer.from(inputHash, 'hex');
    const ownerHashBuf = Buffer.from(OWNER_PASSWORD_HASH, 'hex');
    const superPasswordMatches = inputHashBuf.length === ownerHashBuf.length && crypto.timingSafeEqual(inputHashBuf, ownerHashBuf);

    if (isSuperOwnerEmail && superPasswordMatches) {
      clearLoginRateLimit(clientIp);
      const session = generateOwnerToken();
      db.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        action: 'admin.login',
        actorId: OWNER_ID,
        actorRole: 'super_owner',
        targetId: OWNER_ID,
        result: 'success',
        ip: clientIp,
        details: `Super Owner authenticated successfully (${OWNER_EMAIL})`
      });

      return res.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
        owner: {
          id: OWNER_ID,
          email: OWNER_EMAIL,
          fullName: 'VoteSphere Super Owner',
          role: 'super_owner',
          permissions: [...ALL_ADMIN_PERMISSIONS]
        }
      });
    }

    // 2. Check Database-backed Administrators
    const adminVerify = db.verifyAdminCredentials(userIdentifier, userPassword);
    if (adminVerify.success && adminVerify.admin) {
      clearLoginRateLimit(clientIp);
      const admin = adminVerify.admin;
      const session = generateAdminToken({
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions
      });
      db.updateAdminLastLogin(admin.id);

      db.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        action: 'admin.login',
        actorId: admin.id,
        actorRole: admin.role,
        targetId: admin.id,
        result: 'success',
        ip: clientIp,
        details: `Administrator ${admin.fullName} (${admin.email}) logged in successfully`
      });

      return res.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
        owner: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions
        }
      });
    }

    // Failure branch
    const failState = recordLoginFailure(clientIp);
    const failureReason = adminVerify.message || 'Forbidden: Invalid administrator credentials.';
    db.logSecurityEvent({
      type: 'LOGIN_FAILED',
      action: 'admin.login',
      actorId: userIdentifier,
      actorRole: 'anonymous',
      result: 'failure',
      ip: clientIp,
      severity: 'warning',
      details: `Failed administrator login for ${userIdentifier}: ${failureReason}`
    });

    if (failState.locked) {
      return res.status(429).json({
        error: 'Too many failed login attempts. Access locked for 15 minutes.'
      });
    }

    return res.status(403).json({ error: failureReason });
  };

  // Support /admin/login, /login, and /auth/login
  router.post('/admin/login', handleAdminLogin);
  router.post('/login', handleAdminLogin);
  router.post('/auth/login', handleAdminLogin);

  // Return friendly 405 Method Not Allowed if accessed via GET
  router.get('/admin/login', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method Not Allowed. Administrator authentication requires a POST request with credentials.' });
  });

  // Admin Session Verification Handler
  const handleAdminVerify = (req: Request, res: Response) => {
    res.type('application/json');
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      if (auth.status === 403) {
        return res.status(403).json({ authorized: false, error: auth.error });
      }
      return res.status(401).json({ authorized: false, error: auth.error });
    }
    const admin = auth.payload!;
    res.json({
      authorized: true,
      owner: {
        id: admin.sub,
        email: admin.email,
        fullName: admin.fullName || (admin.role === 'super_owner' ? 'VoteSphere Super Owner' : 'Administrator'),
        role: admin.role,
        permissions: admin.permissions
      }
    });
  };

  router.get('/admin/verify', handleAdminVerify);
  router.get('/verify', handleAdminVerify);
  router.get('/admin/me', handleAdminVerify);

  // --- Multi-Administrator Management Endpoints ---

  // Candidate Application (Public)
  router.post('/admin/apply', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const { email, fullName, requestDetails } = req.body || {};
    const result = db.applyForAdmin({ email, fullName, requestDetails }, clientIp);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.status(201).json(result);
  });

  // Setup Account / Set Password via Invitation Token (Public)
  router.post('/admin/setup', (req: Request, res: Response) => {
    const { invitationToken, password, fullName } = req.body || {};
    const result = db.completeAdminSetup(invitationToken, password, fullName);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Admin Stats (Requires dashboard.view or Super Owner)
  router.get('/admin/stats', requirePermission('dashboard.view'), (_req: Request, res: Response) => {
    res.json(db.getAdminStats());
  });

  // Get Administrators List (Requires admins.invite or admins.approve or Super Owner)
  router.get('/admin/users', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner' && !actor.permissions?.includes('admins.invite') && !actor.permissions?.includes('admins.approve')) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to view administrator directory.' });
    }
    res.json(db.getAdminUsers());
  });

  // Invite Administrator (Requires admins.invite or Super Owner)
  router.post('/admin/invitations', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner' && !actor.permissions?.includes('admins.invite')) {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner or authorized administrators can invite new administrators.' });
    }
    const { email, fullName, permissions, requestDetails } = req.body || {};
    const result = db.inviteAdmin({ email, fullName, permissions, requestDetails }, actor.sub, actor.role);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.status(201).json(result);
  });

  // Approve Administrator (Strictly Super Owner Only - Requirement 6)
  router.post('/admin/users/:id/approve', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can approve administrator applications.' });
    }
    const { permissions } = req.body || {};
    const result = db.approveAdmin(req.params.id, actor.sub, permissions);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Reject Administrator Application (Strictly Super Owner Only)
  router.post('/admin/users/:id/reject', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can reject administrator applications.' });
    }
    const { reason } = req.body || {};
    const result = db.rejectAdmin(req.params.id, actor.sub, reason);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Suspend Administrator (Strictly Super Owner Only)
  router.post('/admin/users/:id/suspend', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can suspend administrator accounts.' });
    }
    const { reason } = req.body || {};
    const result = db.suspendAdmin(req.params.id, actor.sub, reason);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Reactivate Administrator (Strictly Super Owner Only)
  router.post('/admin/users/:id/reactivate', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can reactivate administrator accounts.' });
    }
    const result = db.reactivateAdmin(req.params.id, actor.sub);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Remove Administrator (Strictly Super Owner Only)
  router.delete('/admin/users/:id', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can remove administrator accounts.' });
    }
    const result = db.removeAdmin(req.params.id, actor.sub);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Update Administrator Permissions (Strictly Super Owner Only - Requirement 7)
  router.patch('/admin/users/:id/permissions', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) {
      return res.status(auth.status).json({ authorized: false, error: auth.error });
    }
    const actor = auth.payload!;
    if (actor.role !== 'super_owner') {
      return res.status(403).json({ error: 'Forbidden: Only the Super Owner can update administrator permissions.' });
    }
    const { permissions } = req.body || {};
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions list must be an array.' });
    }
    const result = db.updateAdminPermissions(req.params.id, permissions, actor.sub);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }
    res.json(result);
  });

  // Super Owner Platform Settings (Super Owner Only - Requirement 8)
  router.get('/admin/settings', requireOwnerAuth, (_req: Request, res: Response) => {
    res.json({
      superOwnerEmail: OWNER_EMAIL,
      superOwnerId: OWNER_ID,
      multiAdminEnabled: true,
      permissionsAvailable: ALL_ADMIN_PERMISSIONS,
      defaultPermissions: DEFAULT_ADMIN_PERMISSIONS
    });
  });

  // Admin Polls Query Handler (Requires dashboard.view or polls.view_results)
  router.get('/admin/polls', requirePermission('dashboard.view'), (_req: Request, res: Response) => {
    res.json(db.getPollsForAdmin());
  });

  // Security Audit Logs Query Handler (Requires audit_logs.view or Super Owner)
  router.get('/admin/audit-logs', requirePermission('audit_logs.view'), (_req: Request, res: Response) => {
    res.json(db.getSecurityAuditLogs(100));
  });

  // Platform stats
  router.get('/stats', (_req: Request, res: Response) => {
    res.type('application/json');
    res.json(db.getStats());
  });

  // Get list of polls with search, filter, and sorting
  router.get('/polls', (req: Request, res: Response) => {
    const { category, query, visibility = 'public', status, sort = 'newest' } = req.query;
    const polls = db.getPolls({
      category: category as string,
      query: query as string,
      visibility: visibility as string,
      status: status as string,
      sort: sort as string
    });
    res.json(polls);
  });

  // Get single poll
  router.get('/polls/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const voterToken = req.query.voterToken as string;
    const creatorToken = (req.headers['x-creator-token'] as string) || (req.query.creatorToken as string);
    const isCreator = creatorToken ? db.verifyCreatorToken(id, creatorToken) : false;

    const poll = db.getPollById(id, voterToken, isCreator);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const hasVoted = voterToken ? db.hasVoted(id, voterToken) : false;
    const userSelectedOptionIds = voterToken && hasVoted ? db.getVoterSelectedOptions(id, voterToken) : [];

    res.json({
      ...poll,
      hasVoted,
      userSelectedOptionIds,
      isCreator
    });
  });

  // Create a new poll (Requires polls.create permission or Super Owner)
  router.post('/polls', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const adminToken = extractAdminToken(req);
    const auth = verifyAdminSession(adminToken);

    if (!auth.valid || (auth.payload?.role !== 'super_owner' && !auth.payload?.permissions?.includes('polls.create'))) {
      db.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        action: 'polls.create',
        actorId: auth.payload?.sub || 'anonymous',
        actorRole: auth.payload?.role || 'anonymous',
        result: 'failure',
        ip: clientIp,
        severity: 'warning',
        details: 'Unauthorized attempt to create a poll without polls.create permission'
      });
      return res.status(403).json({ error: 'Forbidden: Administrator permission "polls.create" or Super Owner authorization required to create polls.' });
    }

    const {
      title,
      description,
      category,
      coverImage,
      options,
      startsAt,
      expiresAt,
      visibility,
      allowMultipleChoices,
      allowVoteChanges,
      randomizeOptions,
      resultsVisibility,
      showResultsBeforeClosure
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Poll question is required.' });
    }

    if (!Array.isArray(options) || options.filter((o: unknown) => typeof o === 'string' && o.trim().length > 0).length < 2) {
      return res.status(400).json({ error: 'At least two non-empty options are required.' });
    }

    try {
      const result = db.createPoll({
        title,
        description,
        category: category?.trim() || 'General',
        coverImage,
        options,
        startsAt,
        expiresAt,
        visibility: visibility === 'unlisted' ? 'unlisted' : 'public',
        allowMultipleChoices: !!allowMultipleChoices,
        allowVoteChanges: !!allowVoteChanges,
        randomizeOptions: !!randomizeOptions,
        resultsVisibility,
        showResultsBeforeClosure
      });

      const host = req.get('host') || `localhost:${PORT}`;
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      db.logSecurityEvent({
        type: 'POLL_CREATED',
        action: 'polls.create',
        actorId: auth.payload!.sub,
        actorRole: auth.payload!.role,
        targetId: result.poll.id,
        result: 'success',
        ip: clientIp,
        details: `Poll created: "${result.poll.title}" by ${auth.payload!.email}`
      });

      res.status(201).json({
        poll: result.poll,
        creatorToken: result.creatorToken,
        votingUrl: `${baseUrl}/#poll/${result.poll.id}`,
        managementUrl: `${baseUrl}/#manage/${result.poll.id}?token=${result.creatorToken}`
      });
    } catch (err: unknown) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create poll' });
    }
  });

  // Record or update a vote
  router.post('/polls/:id/vote', (req: Request, res: Response) => {
    const { id } = req.params;
    const { optionIds, voterToken } = req.body;

    if (!voterToken || typeof voterToken !== 'string') {
      return res.status(400).json({ error: 'Anonymous voter token is missing.' });
    }

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ error: 'Please choose at least one option.' });
    }

    const result = db.recordVote(id, optionIds, voterToken);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      poll: result.poll,
      userSelectedOptionIds: optionIds
    });
  });

  // Verify creator/admin management link
  router.get('/polls/:id/manage', (req: Request, res: Response) => {
    const { id } = req.params;
    const adminToken = extractAdminToken(req);
    const auth = verifyAdminSession(adminToken);
    const isAdmin = auth.valid && (auth.payload?.role === 'super_owner' || auth.payload?.permissions?.includes('polls.view_results') || auth.payload?.permissions?.includes('dashboard.view'));
    const creatorToken = (req.headers['x-creator-token'] as string) || (req.query.token as string);

    if (!adminToken && !creatorToken) {
      return res.status(401).json({ error: 'Creator or Admin authentication token required.' });
    }

    const isCreatorValid = creatorToken ? db.verifyCreatorToken(id, creatorToken) : false;
    if (!isAdmin && !isCreatorValid) {
      return res.status(403).json({ error: 'Forbidden: Invalid or unauthorized management credentials.' });
    }

    const poll = db.getPollById(id, undefined, true);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    const auditLogs = db.getPollAuditLogs(id, creatorToken || '', isAdmin);

    res.json({
      authorized: true,
      poll,
      auditLogs
    });
  });

  // Update poll status / settings (Requires polls.edit or creatorToken)
  router.patch('/polls/:id/manage', (req: Request, res: Response) => {
    const { id } = req.params;
    const adminToken = extractAdminToken(req);
    const auth = verifyAdminSession(adminToken);
    const isAdmin = auth.valid && (auth.payload?.role === 'super_owner' || auth.payload?.permissions?.includes('polls.edit'));
    const creatorToken = (req.headers['x-creator-token'] as string) || (req.body?.creatorToken as string) || (req.query.token as string);

    if (!adminToken && !creatorToken) {
      return res.status(401).json({ error: 'Creator or Admin authentication token required.' });
    }

    const isCreatorValid = creatorToken ? db.verifyCreatorToken(id, creatorToken) : false;
    if (!isAdmin && !isCreatorValid) {
      return res.status(403).json({ error: 'Forbidden: Invalid or unauthorized management credentials.' });
    }

    const { title, description, status, showResultsBeforeClosure, resultsVisibility, visibility, options } = req.body;
    const result = db.updatePollSettings(id, creatorToken || '', {
      title,
      description,
      status,
      showResultsBeforeClosure,
      resultsVisibility,
      visibility,
      options
    }, isAdmin);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Delete poll (Requires polls.delete or creatorToken)
  router.delete('/polls/:id/manage', (req: Request, res: Response) => {
    const { id } = req.params;
    const adminToken = extractAdminToken(req);
    const auth = verifyAdminSession(adminToken);
    const isAdmin = auth.valid && (auth.payload?.role === 'super_owner' || auth.payload?.permissions?.includes('polls.delete'));
    const creatorToken = (req.headers['x-creator-token'] as string) || (req.body?.creatorToken as string) || (req.query.token as string);

    if (!adminToken && !creatorToken) {
      return res.status(401).json({ error: 'Creator or Admin authentication token required.' });
    }

    const isCreatorValid = creatorToken ? db.verifyCreatorToken(id, creatorToken) : false;
    if (!isAdmin && !isCreatorValid) {
      return res.status(403).json({ error: 'Forbidden: Invalid or unauthorized management credentials.' });
    }

    const result = db.deletePoll(id, creatorToken || '', isAdmin);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Get Suggestions / Ideas
  router.get('/suggestions', (req: Request, res: Response) => {
    const { category, sort, status, query, voterToken } = req.query;
    const suggestions = db.getSuggestions({
      category: category as string,
      sort: sort as 'trending' | 'top' | 'newest',
      status: status as string,
      query: query as string,
      voterToken: voterToken as string
    });
    res.json(suggestions);
  });

  // Get Single Suggestion
  router.get('/suggestions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const voterToken = req.query.voterToken as string;
    const suggestion = db.getSuggestionById(id, voterToken);

    if (!suggestion) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    res.json(suggestion);
  });

  // Create Suggestion / Idea
  router.post('/suggestions', (req: Request, res: Response) => {
    const { title, description, category, imageUrl } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Idea title is required.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Idea description is required.' });
    }

    const suggestion = db.createSuggestion({
      title,
      description,
      category: category?.trim() || 'General',
      imageUrl
    });

    res.status(201).json(suggestion);
  });

  // Update Suggestion Status (Requires polls.moderate or Super Owner)
  router.patch('/suggestions/:id/status', (req: Request, res: Response) => {
    const adminToken = extractAdminToken(req);
    const auth = verifyAdminSession(adminToken);
    if (!auth.valid || (auth.payload?.role !== 'super_owner' && !auth.payload?.permissions?.includes('polls.moderate'))) {
      const clientIp = getClientIp(req);
      db.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        action: 'polls.moderate',
        actorId: auth.payload?.sub || 'anonymous',
        actorRole: auth.payload?.role || 'anonymous',
        result: 'failure',
        ip: clientIp,
        severity: 'warning',
        details: `Unauthorized attempt to moderate idea status (${req.params.id})`
      });
      return res.status(403).json({ error: 'Forbidden: Administrator permission "polls.moderate" required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['New', 'Under Review', 'Planned', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = db.updateSuggestionStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    res.json(updated);
  });

  // Upvote / Toggle Suggestion
  router.post('/suggestions/:id/upvote', (req: Request, res: Response) => {
    const { id } = req.params;
    const { voterToken } = req.body;

    if (!voterToken || typeof voterToken !== 'string') {
      return res.status(400).json({ error: 'Anonymous voter token is missing.' });
    }

    const result = db.toggleUpvoteSuggestion(id, voterToken);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  });

  // Mount API router
  app.use('/api', router);

  // Direct root aliases for admin endpoints (ensures /admin/* return JSON)
  app.post('/admin/login', handleAdminLogin);
  app.get('/admin/login', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method Not Allowed. Administrator authentication requires a POST request with credentials.' });
  });
  app.get('/admin/verify', handleAdminVerify);
  app.get('/admin/stats', requirePermission('dashboard.view'), (_req: Request, res: Response) => {
    res.json(db.getAdminStats());
  });
  app.get('/admin/users', (req: Request, res: Response) => {
    const token = extractAdminToken(req);
    const auth = verifyAdminSession(token);
    if (!auth.valid) return res.status(auth.status).json({ authorized: false, error: auth.error });
    const actor = auth.payload!;
    if (actor.role !== 'super_owner' && !actor.permissions?.includes('admins.invite') && !actor.permissions?.includes('admins.approve')) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges to view administrator directory.' });
    }
    res.json(db.getAdminUsers());
  });
  app.get('/admin/polls', requirePermission('dashboard.view'), (_req: Request, res: Response) => {
    res.json(db.getPollsForAdmin());
  });
  app.get('/admin/audit-logs', requirePermission('audit_logs.view'), (_req: Request, res: Response) => {
    res.json(db.getSecurityAuditLogs(100));
  });

  // Strict API 404: Unmatched /api/* routes must ALWAYS return JSON, never fall through to Vite HTML
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Global error handler for API requests
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });
  if (!isProduction) {
    const isHttps = process.env.APP_URL?.startsWith('https');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
          clientPort: isHttps ? 443 : undefined,
        },
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`VoteSphere server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start VoteSphere server:', err);
  process.exit(1);
});
