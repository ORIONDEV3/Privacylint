import { SecurityControlItem } from './types';

export const SECURITY_CONTROLS_CATALOG: SecurityControlItem[] = [
  {
    id: 'SEC-01',
    number: 1,
    name: 'HTTPS and SSL/TLS Encryption',
    category: 'Transport Layer Security',
    status: 'Needs Configuration',
    riskLevel: 'Medium',
    description:
      'Enforces TLS 1.3 encryption in transit, HSTS headers, and automatic HTTP-to-HTTPS redirection on production ingress.',
    verificationEvidence:
      'Server sets Strict-Transport-Security (max-age=31536000; includeSubDomains) and checks x-forwarded-proto in production mode. Local container dev server listens on HTTP port 3000 behind Cloud Run TLS termination.',
    codeLocation: 'server.ts:44 (HSTS & TLS Proto Check Middleware)',
    recommendedAction:
      'Enable NODE_ENV=production behind Cloud Run / reverse-proxy ingress to enforce strict 301 HTTPS redirection.',
    liveVerified: false,
  },
  {
    id: 'SEC-02',
    number: 2,
    name: 'Secure Password Hashing',
    category: 'Authentication & Cryptography',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Hashes all user credentials using memory-hard cryptographic KDF (scrypt / Argon2id format) with 16-byte random salt and timing-safe comparison.',
    verificationEvidence:
      'Verified via crypto.scryptSync (N=16384, r=8, p=1, 64-byte key) + crypto.timingSafeEqual in server.ts. Zero plaintext passwords stored in memory or database seed.',
    codeLocation: 'server.ts:78 (hashPasswordScrypt & verifyPasswordTimingSafe)',
    recommendedAction: 'Maintain N>=16384 memory cost factor and periodic credential rotation policy.',
    liveVerified: true,
  },
  {
    id: 'SEC-03',
    number: 3,
    name: 'Parameterized SQL Queries',
    category: 'Database Security',
    status: 'Not Verified',
    riskLevel: 'Medium',
    description:
      'Uses positional parameterized SQL statements ($1, $2) across all database reads and writes to prevent SQL injection.',
    verificationEvidence:
      'Schema DDL (backend_scaffold/schema.sql) and query builders enforce $1..$n bindings. Marked Not Verified at runtime because DATABASE_URL is not connected in local preview sandbox (running in-memory repository store).',
    codeLocation: 'backend_scaffold/schema.sql & src/engine/scanner.ts',
    recommendedAction:
      'Provision PostgreSQL / Supabase instance via DATABASE_URL and run automated pg-pool parameterized query integration suite.',
    liveVerified: false,
  },
  {
    id: 'SEC-04',
    number: 4,
    name: 'Input Validation, Sanitization and XSS Prevention',
    category: 'Input Hygiene',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Validates all API request payloads against strict Zod schemas, strips unsafe HTML tags, and relies on React automatic DOM escaping.',
    verificationEvidence:
      'All POST/PATCH endpoints in server.ts validate bodies with Zod (LoginSchema, ScanTriggerSchema, StatusUpdateSchema, RepoConnectSchema, FixRequestSchema) and reject malformed payloads with HTTP 400.',
    codeLocation: 'server.ts:112 (Zod Validation Schemas & stripUnsafeTags)',
    recommendedAction: 'Keep strict Zod .strict() object schemas on all newly added API routes.',
    liveVerified: true,
  },
  {
    id: 'SEC-05',
    number: 5,
    name: 'Role-Based Access Control (RBAC)',
    category: 'Authorization',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Enforces granular role permissions (ADMIN, SECURITY_ANALYST, DEVELOPER) on backend API routes, not merely in client UI visibility.',
    verificationEvidence:
      'requireRole() middleware in server.ts verifies the authenticated session role before allowing finding status changes, team management, or security audits, logging denied attempts to audit_logs.',
    codeLocation: 'server.ts:165 (requireRole RBAC Guard Middleware)',
    recommendedAction: 'Audit role permission matrices quarterly against principle of least privilege.',
    liveVerified: true,
  },
  {
    id: 'SEC-06',
    number: 6,
    name: 'Environment Variables and Secret Protection',
    category: 'Secrets Management',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Isolates GEMINI_API_KEY, SESSION_SECRET, and DATABASE_URL exclusively on the server; client bundle never imports @google/genai or secret keys.',
    verificationEvidence:
      'Verified: @google/genai is imported only in server.ts. Client communicates via /api/remediation/generate. .env.example documents required secrets without exposing live credentials.',
    codeLocation: 'server.ts:24 & /.env.example',
    recommendedAction: 'Rotate SESSION_SECRET and API keys every 90 days via secret manager.',
    liveVerified: true,
  },
  {
    id: 'SEC-07',
    number: 7,
    name: 'API Rate Limiting',
    category: 'Availability & Abuse Prevention',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Applies sliding-window rate limits per client IP on authentication, scanning, and AI remediation endpoints with standard RateLimit headers.',
    verificationEvidence:
      'Active sliding-window limiter in server.ts sets X-RateLimit-Limit, X-RateLimit-Remaining, and returns HTTP 429 with Retry-After when threshold is exceeded.',
    codeLocation: 'server.ts:56 (rateLimiterMiddleware)',
    recommendedAction: 'Back rate-limit counters with Redis when scaling horizontally across multiple instances.',
    liveVerified: true,
  },
  {
    id: 'SEC-08',
    number: 8,
    name: 'Safe Error Handling',
    category: 'Resilience & Anti-Leakage',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Returns generic, correlation-tagged error responses to clients while keeping stack traces and diagnostic context restricted to server logs.',
    verificationEvidence:
      'Global Express error handler catches unhandled exceptions, generates a safe correlationId, omits err.stack from JSON output, and logs redacted diagnostics.',
    codeLocation: 'server.ts:435 (safeErrorHandler)',
    recommendedAction: 'Forward server-side error correlation IDs to a DPDP-compliant SIEM.',
    liveVerified: true,
  },
  {
    id: 'SEC-09',
    number: 9,
    name: 'Secure Sessions, Cookies and JWT',
    category: 'Session Management',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Issues HMAC-SHA256 signed session tokens in HttpOnly, SameSite=Lax/Strict cookies with bounded expiry and server-side revocation on logout.',
    verificationEvidence:
      'Login endpoint sets Set-Cookie: pl_session=<signed_token>; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax and tracks active session IDs in server revocation store.',
    codeLocation: 'server.ts:92 (signSessionToken & verifySessionToken)',
    recommendedAction: 'Append Secure cookie attribute automatically when TLS is active in production.',
    liveVerified: true,
  },
  {
    id: 'SEC-10',
    number: 10,
    name: 'Security Headers and CORS',
    category: 'Browser & Origin Hardening',
    status: 'Implemented',
    riskLevel: 'Low',
    description:
      'Sets strict security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) and restricts CORS to explicit allowlist origins.',
    verificationEvidence:
      'Live HTTP response headers include X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, X-XSS-Protection: 0, and explicit origin validation.',
    codeLocation: 'server.ts:32 (securityHeadersAndCorsMiddleware)',
    recommendedAction: 'Review CORS_ALLOWED_ORIGINS allowlist prior to custom domain cutover.',
    liveVerified: true,
  },
];
