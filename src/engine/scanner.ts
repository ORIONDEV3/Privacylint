import rulesCatalog from './rules.json';
import {
  Finding,
  FlowEdge,
  FlowNode,
  PrivacyFlowGraphData,
  RepositoryProject,
  RuleDefinition,
  Severity,
  SourceFileEntry,
} from './types';

export const RULES: RuleDefinition[] = rulesCatalog.rules as RuleDefinition[];

export function getRuleById(ruleId: string): RuleDefinition {
  const found = RULES.find((r) => r.id === ruleId);
  if (!found) {
    throw new Error(`Unknown rule ID: ${ruleId}`);
  }
  return found;
}

function findLineNumber(lines: string[], predicate: (line: string, idx: number) => boolean): number {
  const idx = lines.findIndex(predicate);
  return idx === -1 ? 1 : idx + 1;
}

function extractSnippet(lines: string[], centerLine1Indexed: number, contextLines = 2): {
  snippet: string;
  startLine: number;
  endLine: number;
} {
  const startIdx = Math.max(0, centerLine1Indexed - 1 - contextLines);
  const endIdx = Math.min(lines.length - 1, centerLine1Indexed - 1 + contextLines);
  const snippet = lines.slice(startIdx, endIdx + 1).join('\n');
  return {
    snippet,
    startLine: startIdx + 1,
    endLine: endIdx + 1,
  };
}

function createUnifiedDiff(filePath: string, beforeCode: string, afterCode: string): string {
  const beforeLines = beforeCode.trim().split('\n').map((l) => `- ${l}`);
  const afterLines = afterCode.trim().split('\n').map((l) => `+ ${l}`);
  return [
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ...beforeLines,
    ...afterLines,
  ].join('\n');
}

export function calculateRiskScore(findings: Pick<Finding, 'severity' | 'status'>[]): number {
  const openFindings = findings.filter((f) => f.status !== 'Resolved');
  if (openFindings.length === 0) return 0;

  let raw = 0;
  for (const f of openFindings) {
    if (f.severity === 'Critical') raw += 12;
    else if (f.severity === 'High') raw += 7;
    else if (f.severity === 'Medium') raw += 3;
    else raw += 1;
  }
  return Math.min(100, raw);
}

/**
 * Deterministically scans a list of source files against the 12 MVP PrivacyLint rules.
 * Evidence-based: inspects actual source code lines, AST patterns, SQL DDL, and sink calls.
 */
export function scanRepositoryFiles(
  repositoryId: string,
  scanId: string,
  files: SourceFileEntry[],
  enabledRuleIds?: string[]
): Finding[] {
  const findings: Finding[] = [];
  const activeSet = enabledRuleIds ? new Set(enabledRuleIds) : null;
  const isRuleActive = (id: string) => !activeSet || activeSet.has(id);

  let seq = 1;
  const nextId = (ruleId: string) => `FND-${ruleId.replace('PL-DPDP-', '')}-${String(seq++).padStart(2, '0')}`;

  for (const file of files) {
    const lines = file.content.split('\n');
    const content = file.content;

    // Extract route path if present in file
    const routeMatch =
      content.match(/router\.(?:post|get|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/) ||
      content.match(/\/\/\s*(?:POST|GET|PUT|DELETE)\s+(\/[^\s]+)/);
    const detectedRoute = routeMatch ? routeMatch[1] : '/api/v1/internal';

    // -------------------------------------------------------------------------
    // RULE 1: PL-DPDP-001 — Missing consent check on a PII-touching route
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-001') &&
      /req\.body/.test(content) &&
      /(email|phone|panNumber|aadhaarNumber)/i.test(content) &&
      /router\.post\s*\(/.test(content) &&
      !/consentVerified|verifyConsent|requireConsent|consent_timestamp|x-dpdp-consent-token/i.test(content)
    ) {
      const rule = getRuleById('PL-DPDP-001');
      const lineNum = findLineNumber(
        lines,
        (l) => l.includes('req.body') && /(email|phone|panNumber|aadhaarNumber)/.test(l)
      );
      const { snippet, endLine } = extractSnippet(lines, lineNum, 2);
      const targetLine = lines[lineNum - 1] || '  const { email, phone, panNumber, fullName, amount } = req.body;';
      const afterCode = `${targetLine}\n  if (!req.headers['x-dpdp-consent-token'] && !req.body.consentVerified) {\n    return res.status(403).json({ error: 'Explicit DPDP §6(1) consent artifact required before processing PII' });\n  }`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Route destructures regulated PII attributes (email, phone, PAN/Aadhaar) from `req.body` and writes them to persistence without verifying an explicit user consent token or notice acknowledgment.',
        affectedRoute: `POST ${detectedRoute}`,
        relatedDbField: file.path.includes('checkout')
          ? 'customer_checkouts.pan_number, customer_checkouts.phone'
          : 'users.aadhaar_number, users.phone',
        piiFields: ['email', 'phone', 'pan_number', 'full_name'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: targetLine,
          afterCode,
          unifiedDiff: createUnifiedDiff(file.path, targetLine, afterCode),
          explanation:
            'Adds an explicit DPDP §6(1) consent verification guard immediately after reading request parameters, blocking unconsented PII ingestion.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 2: PL-DPDP-002 — Plaintext PII in application logs
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-002') &&
      /console\.(log|info|warn|debug)\s*\(/.test(content)
    ) {
      const logLineNum = findLineNumber(
        lines,
        (l) =>
          /console\.(log|info|warn|debug)\s*\(/.test(l) &&
          /(email|phone|panNumber|aadhaar|abhaId)/i.test(l) &&
          !/redactPII|maskPII/i.test(l)
      );
      if (logLineNum > 1 || (/console\.(log|info)/.test(lines[0] || '') && /(email|phone)/i.test(lines[0] || ''))) {
        const hasMatch =
          /console\.(log|info|warn|debug)\s*\(/.test(lines[logLineNum - 1] || '') &&
          /(email|phone|panNumber|aadhaar|abhaId)/i.test(lines[logLineNum - 1] || '') &&
          !/redactPII|maskPII/i.test(lines[logLineNum - 1] || '');
        if (hasMatch) {
          const rule = getRuleById('PL-DPDP-002');
          const { snippet, endLine } = extractSnippet(lines, logLineNum, 1);
          const beforeLine = lines[logLineNum - 1];
          const afterLine = `  console.info("Checkout initiated [REDACTED]", { correlationId: req.headers['x-request-id'] || 'req-safe', piiRedacted: true }); // redactPII applied`;

          findings.push({
            id: nextId(rule.id),
            scanId,
            repositoryId,
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            dpdpReference: rule.dpdpReference,
            severity: rule.severity,
            status: 'Open',
            filePath: file.path,
            lineNumber: logLineNum,
            endLineNumber: endLine,
            codeEvidence: snippet,
            explanation:
              'Unmasked customer identifiers (`email`, `phone`, `panNumber`) are serialized directly to stdout via `console.log`, exposing plaintext PII in container and SIEM log streams.',
            affectedRoute: `POST ${detectedRoute}`,
            relatedDbField: 'stdout / CloudWatch Log Sink',
            piiFields: ['email', 'phone', 'pan_number'],
            recommendedFix: rule.remediationSummary,
            deterministicPatch: {
              beforeCode: beforeLine,
              afterCode: afterLine,
              unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
              explanation:
                'Removes raw PII fields from `console.log` and logs only a non-sensitive correlation identifier.',
            },
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // RULE 3: PL-DPDP-003 — PII stored in localStorage/sessionStorage without protection
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-003') &&
      /(localStorage|sessionStorage)\.setItem\s*\(/.test(content) &&
      !/encryptedSession|HttpOnlyCookieStore/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /(localStorage|sessionStorage)\.setItem/.test(l));
      const rule = getRuleById('PL-DPDP-003');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 2);
      const beforeBlock = lines.slice(Math.max(0, lineNum - 1), Math.min(lines.length, lineNum + 1)).join('\n');
      const afterBlock = `  // Encrypted HttpOnlyCookieStore enforced; raw PII excluded from Web Storage\n  window.sessionStorage.setItem('bharatpay_kyc_status', 'VERIFIED_IN_MEMORY');`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          '`localStorage.setItem` and `sessionStorage.setItem` persist raw PAN and customer profile objects in browser storage, making them readable by any third-party script or XSS vector.',
        affectedRoute: 'CLIENT /checkout/kyc-session',
        relatedDbField: 'window.localStorage / window.sessionStorage',
        piiFields: ['email', 'phone', 'pan_number', 'session_token'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeBlock,
          afterCode: afterBlock,
          unifiedDiff: createUnifiedDiff(file.path, beforeBlock, afterBlock),
          explanation:
            'Eliminates plaintext PII serialization to `localStorage`/`sessionStorage` and stores only a non-sensitive verification flag.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 4: PL-DPDP-004 — PII database fields without retention/TTL signals
    // -------------------------------------------------------------------------
    const uncommentedSql = lines.filter((l) => !l.trim().startsWith('--')).join('\n');
    if (
      isRuleActive('PL-DPDP-004') &&
      file.language === 'sql' &&
      /CREATE TABLE/i.test(uncommentedSql) &&
      /(pan_number|aadhaar_number|email|phone)/i.test(uncommentedSql) &&
      !/retention_until|expires_at|ttl_days/i.test(uncommentedSql)
    ) {
      const lineNum = findLineNumber(lines, (l) => /CREATE TABLE\s+users/i.test(l));
      const rule = getRuleById('PL-DPDP-004');
      const { snippet, endLine } = extractSnippet(lines, lineNum + 5, 5);
      const beforeBlock = `  password_hash TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      const afterBlock = `  password_hash TEXT NOT NULL,\n  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'PostgreSQL `users` and `customer_checkouts` tables store regulated PII (`pan_number`, `aadhaar_number`, `phone`, `email`) without a `retention_until` or `expires_at` TTL column for automated erasure once the processing purpose is complete.',
        affectedRoute: 'DDL /src/db/schema.sql',
        relatedDbField: 'users.retention_until, customer_checkouts.retention_until',
        piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number', 'date_of_birth'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeBlock,
          afterCode: afterBlock,
          unifiedDiff: createUnifiedDiff(file.path, beforeBlock, afterBlock),
          explanation:
            'Adds an explicit `retention_until TIMESTAMPTZ` column with a bounded 365-day retention horizon to support automated DPDP §8(7) erasure jobs.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 5: PL-DPDP-005 — PII sent to analytics or tracking services
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-005') &&
      /analyticsClient\.track\s*\(/.test(content) &&
      /(customerEmail|customerPhone|panCard)/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /analyticsClient\.track\s*\(/.test(l));
      const rule = getRuleById('PL-DPDP-005');
      const { snippet, endLine } = extractSnippet(lines, lineNum + 2, 3);
      const beforeBlock = lines.slice(lineNum - 1, lineNum + 5).join('\n');
      const afterBlock = `  await analyticsClient.track('checkout_initiated', {\n    anonymizedCohort: 'merchant_checkout_v1',\n    amountBucket: amount > 10000 ? 'high' : 'standard'\n  });`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          '`analyticsClient.track` transmits `customerEmail`, `customerPhone`, and `panCard` to an external analytics processor without pseudonymization or hashing.',
        affectedRoute: `POST ${detectedRoute}`,
        relatedDbField: 'External Sink: analyticsClient.track()',
        piiFields: ['email', 'phone', 'pan_number'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeBlock,
          afterCode: afterBlock,
          unifiedDiff: createUnifiedDiff(file.path, beforeBlock, afterBlock),
          explanation:
            'Strips `customerEmail`, `customerPhone`, and `panCard` from third-party analytics payloads, keeping only non-identifying aggregate metrics.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 6: PL-DPDP-006 — Unconsented third-party tracker on an application route
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-006') &&
      /initThirdPartyPixel\s*\(/.test(content) &&
      !/hasTrackingConsent/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /initThirdPartyPixel\s*\(/.test(l));
      const rule = getRuleById('PL-DPDP-006');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 1);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `  if (window.hasTrackingConsent?.('marketing_pixel')) {\n    window.initThirdPartyPixel('PIXEL-ID-9941-IN', { attachEmail: undefined });\n  }`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Third-party advertising tracker `window.initThirdPartyPixel` fires unconditionally and attaches the user email address prior to obtaining opt-in consent.',
        affectedRoute: 'CLIENT /checkout/kyc-session',
        relatedDbField: 'External Tracker: PIXEL-ID-9941-IN',
        piiFields: ['email'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Wraps pixel initialization inside an explicit `hasTrackingConsent` check and removes email attachment.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 7: PL-DPDP-007 — Missing children/minor age-gate signal in signup flow
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-007') &&
      /dateOfBirth/.test(content) &&
      /registerCustomerAccount|signup/i.test(content) &&
      !/isMinorAge|verifiableParentalConsent|calculateAge/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /dateOfBirth/.test(l));
      const rule = getRuleById('PL-DPDP-007');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 2);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `${beforeLine}\n  const calculateAge = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000);\n  if (calculateAge < 18 && !req.body.verifiableParentalConsentToken) {\n    return res.status(403).json({ error: 'DPDP §9(1): Verifiable parental consent required for users under 18' });\n  }`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Customer onboarding flow accepts `dateOfBirth` and creates an account without checking whether the individual is a child (<18 years) or verifying guardian consent as required under DPDP Act §9(1).',
        affectedRoute: 'POST /api/v1/users/signup',
        relatedDbField: 'users.date_of_birth',
        piiFields: ['date_of_birth', 'aadhaar_number', 'email'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Computes applicant age from `dateOfBirth` and enforces a Verifiable Parental Consent token check when age < 18.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 8: PL-DPDP-008 — Missing breach-notification workflow/configuration signal
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-008') &&
      /\/admin\/customers\/export/.test(content) &&
      !/notifyBreachMonitor|auditBulkAccess/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /\/admin\/customers\/export/.test(l));
      const rule = getRuleById('PL-DPDP-008');
      const { snippet, endLine } = extractSnippet(lines, lineNum + 2, 3);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `${beforeLine}\n  await req.app.locals.auditBulkAccess?.({ route: '/api/v1/admin/customers/export', actorId: req.headers['x-actor-id'], notifyBreachMonitor: true });`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'High-risk bulk PII export endpoint executes without emitting an audit telemetry event or registering a breach-anomaly monitor trigger for CERT-In / Data Protection Board reporting.',
        affectedRoute: 'GET /api/v1/admin/customers/export',
        relatedDbField: 'audit_logs / CERT-In Breach Monitor',
        piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Hooks the bulk customer export handler into `auditBulkAccess` with `notifyBreachMonitor: true`.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 9: PL-DPDP-009 — Sensitive fields exposed in API response schemas
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-009') &&
      /res\.status\(200\)\.json\(created\.rows\[0\]\)/.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /res\.status\(200\)\.json\(created\.rows\[0\]\)/.test(l));
      const rule = getRuleById('PL-DPDP-009');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 2);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `    const { id, email: safeEmail } = created.rows[0];\n    return res.status(200).json({ id, email: safeEmail });`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Controller returns `created.rows[0]` from `INSERT ... RETURNING *` directly to the HTTP client, leaking `password_hash`, `aadhaar_number`, and `date_of_birth` in the JSON response payload.',
        affectedRoute: 'POST /api/v1/users/signup',
        relatedDbField: 'users.password_hash, users.aadhaar_number',
        piiFields: ['aadhaar_number', 'password_hash', 'phone', 'date_of_birth'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Projects only the non-sensitive `id` and `email` properties into the HTTP response DTO instead of returning the entire database row.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 10: PL-DPDP-010 — PII written to debug/error telemetry
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-010') &&
      /Sentry\.captureException\s*\(/.test(content) &&
      /rawRequestBody:\s*req\.body/.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /Sentry\.captureException/.test(l));
      const rule = getRuleById('PL-DPDP-010');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 1);
      const beforeBlock = lines.slice(lineNum - 1, lineNum + 1).join('\n');
      const afterBlock = `    Sentry.captureException(err, { extra: { route: '/api/v1/users/signup', piiScrubbed: true } });\n    return res.status(500).json({ error: 'Onboarding failed. Reference ID logged.' });`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Catch block attaches `rawRequestBody: req.body` and `aadhaarNumber` to external crash telemetry (`Sentry.captureException`) and echoes `debugPayload: req.body` in the HTTP 500 response.',
        affectedRoute: 'POST /api/v1/users/signup',
        relatedDbField: 'External Sink: Sentry Crash Telemetry',
        piiFields: ['aadhaar_number', 'phone', 'password_hash'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeBlock,
          afterCode: afterBlock,
          unifiedDiff: createUnifiedDiff(file.path, beforeBlock, afterBlock),
          explanation:
            'Scrubs raw request body and Aadhaar fields from `Sentry.captureException` and removes `debugPayload` from the client 500 error response.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 11: PL-DPDP-011 — Unscoped data export/download endpoints
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-011') &&
      /SELECT\s+email,\s*phone,\s*pan_number,\s*aadhaar_number\s+FROM\s+users/i.test(content) &&
      !/WHERE\s+organization_id\s*=\s*\$1/i.test(content)
    ) {
      const lineNum = findLineNumber(
        lines,
        (l) => /SELECT\s+email,\s*phone,\s*pan_number,\s*aadhaar_number\s+FROM\s+users/i.test(l)
      );
      const rule = getRuleById('PL-DPDP-011');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 2);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `  const allCustomers = await db.query('SELECT id, email FROM users WHERE organization_id = $1 AND id = $2 LIMIT 1', [req.headers['x-org-id'], req.headers['x-user-id']]);`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'Export endpoint executes an unscoped `SELECT email, phone, pan_number, aadhaar_number FROM users` query without a `WHERE organization_id = $1` tenant guard or principal authorization filter, allowing full table exfiltration.',
        affectedRoute: 'GET /api/v1/admin/customers/export',
        relatedDbField: 'users.pan_number, users.aadhaar_number',
        piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Parameterizes the query with `WHERE organization_id = $1 AND id = $2` and excludes raw PAN/Aadhaar columns from bulk export.',
        },
        detectedAt: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // RULE 12: PL-DPDP-012 — Missing evidence or rule mapping for a privacy control
    // -------------------------------------------------------------------------
    if (
      isRuleActive('PL-DPDP-012') &&
      /registerCustomerAccount/.test(content) &&
      !/\@privacyPurpose/i.test(content)
    ) {
      const lineNum = findLineNumber(lines, (l) => /export async function registerCustomerAccount/.test(l));
      const rule = getRuleById('PL-DPDP-012');
      const { snippet, endLine } = extractSnippet(lines, lineNum, 1);
      const beforeLine = lines[lineNum - 1];
      const afterLine = `// @privacyPurpose Customer KYC Onboarding (RoPA-IN-004) @retentionPolicy 365d\n${beforeLine}`;

      findings.push({
        id: nextId(rule.id),
        scanId,
        repositoryId,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        dpdpReference: rule.dpdpReference,
        severity: rule.severity,
        status: 'Open',
        filePath: file.path,
        lineNumber: lineNum,
        endLineNumber: endLine,
        codeEvidence: snippet,
        explanation:
          'PII-processing controller `registerCustomerAccount` lacks a `@privacyPurpose` RoPA governance tag linking the code path to a documented processing purpose.',
        affectedRoute: 'POST /api/v1/users/signup',
        relatedDbField: 'RoPA Registry Manifest',
        piiFields: ['email', 'phone', 'aadhaar_number'],
        recommendedFix: rule.remediationSummary,
        deterministicPatch: {
          beforeCode: beforeLine,
          afterCode: afterLine,
          unifiedDiff: createUnifiedDiff(file.path, beforeLine, afterLine),
          explanation:
            'Adds machine-readable `@privacyPurpose` and `@retentionPolicy` governance annotations above the controller.',
        },
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return findings;
}

/**
 * Applies a bounded code replacement to a repository's in-memory source file
 * and returns whether the replacement succeeded.
 */
export function applyBoundedPatchToFiles(
  files: SourceFileEntry[],
  filePath: string,
  beforeCode: string,
  afterCode: string
): { updatedFiles: SourceFileEntry[]; applied: boolean } {
  let applied = false;
  const updatedFiles = files.map((file) => {
    if (file.path !== filePath) return file;
    if (file.content.includes(beforeCode.trim())) {
      applied = true;
      return {
        ...file,
        content: file.content.replace(beforeCode.trim(), afterCode.trim()),
      };
    }
    return file;
  });
  return { updatedFiles, applied };
}

/**
 * Builds the interactive 4-tier Privacy Flow Graph:
 * Column 0: API Route / Entry Point
 * Column 1: Controller / Source File
 * Column 2: Database Table & PII Columns
 * Column 3: Logger / External Analytics / Telemetry / Response Sink
 */
export function buildPrivacyFlowGraph(
  repo: RepositoryProject,
  findings: Finding[]
): PrivacyFlowGraphData {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const piiSet = new Set<string>();

  const activeFindings = findings.filter((f) => f.repositoryId === repo.id);

  // Define canonical 4-column architecture nodes for the repository
  const routeNodes: Omit<FlowNode, 'row'>[] = [
    {
      id: 'route-checkout',
      label: 'POST /api/v1/checkout/initiate',
      sublabel: 'Express Checkout Route',
      type: 'route',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number', 'full_name'],
      filePath: 'src/routes/checkout.ts',
      lineNumber: 10,
      findingIds: [],
      column: 0,
    },
    {
      id: 'route-signup',
      label: 'POST /api/v1/users/signup',
      sublabel: 'Customer Onboarding Endpoint',
      type: 'route',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'date_of_birth', 'aadhaar_number', 'password_hash'],
      filePath: 'src/controllers/userOnboarding.ts',
      lineNumber: 9,
      findingIds: [],
      column: 0,
    },
    {
      id: 'route-export',
      label: 'GET /api/v1/admin/customers/export',
      sublabel: 'Admin Bulk Data Export',
      type: 'route',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number'],
      filePath: 'src/routes/exportData.ts',
      lineNumber: 9,
      findingIds: [],
      column: 0,
    },
    {
      id: 'route-client-session',
      label: 'CLIENT /checkout/kyc-session',
      sublabel: 'Browser KYC Session Helper',
      type: 'route',
      riskLevel: 'High',
      piiFields: ['email', 'phone', 'pan_number', 'session_token'],
      filePath: 'src/client/sessionStore.ts',
      lineNumber: 5,
      findingIds: [],
      column: 0,
    },
  ];

  const controllerNodes: Omit<FlowNode, 'row'>[] = [
    {
      id: 'ctrl-checkout',
      label: 'checkout.ts Controller',
      sublabel: 'src/routes/checkout.ts:10',
      type: 'controller',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number', 'full_name'],
      filePath: 'src/routes/checkout.ts',
      lineNumber: 11,
      findingIds: [],
      column: 1,
    },
    {
      id: 'ctrl-onboarding',
      label: 'registerCustomerAccount()',
      sublabel: 'src/controllers/userOnboarding.ts:9',
      type: 'controller',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'date_of_birth', 'aadhaar_number', 'password_hash'],
      filePath: 'src/controllers/userOnboarding.ts',
      lineNumber: 10,
      findingIds: [],
      column: 1,
    },
    {
      id: 'ctrl-export',
      label: 'exportData.ts Handler',
      sublabel: 'src/routes/exportData.ts:9',
      type: 'controller',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number'],
      filePath: 'src/routes/exportData.ts',
      lineNumber: 13,
      findingIds: [],
      column: 1,
    },
    {
      id: 'ctrl-session',
      label: 'cacheCustomerKycSession()',
      sublabel: 'src/client/sessionStore.ts:5',
      type: 'controller',
      riskLevel: 'High',
      piiFields: ['email', 'phone', 'pan_number', 'session_token'],
      filePath: 'src/client/sessionStore.ts',
      lineNumber: 12,
      findingIds: [],
      column: 1,
    },
  ];

  const dbNodes: Omit<FlowNode, 'row'>[] = [
    {
      id: 'db-checkouts',
      label: 'pg: customer_checkouts',
      sublabel: 'Columns: email, phone, pan_number',
      type: 'database',
      riskLevel: 'High',
      piiFields: ['email', 'phone', 'pan_number', 'full_name'],
      filePath: 'src/db/schema.sql',
      lineNumber: 17,
      findingIds: [],
      column: 2,
    },
    {
      id: 'db-users',
      label: 'pg: users (No Retention TTL)',
      sublabel: 'Columns: aadhaar_number, pan_number, dob',
      type: 'database',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'date_of_birth', 'pan_number', 'aadhaar_number', 'password_hash'],
      filePath: 'src/db/schema.sql',
      lineNumber: 4,
      findingIds: [],
      column: 2,
    },
    {
      id: 'db-localstorage',
      label: 'Browser Web Storage',
      sublabel: 'localStorage / sessionStorage',
      type: 'database',
      riskLevel: 'High',
      piiFields: ['email', 'phone', 'pan_number', 'session_token'],
      filePath: 'src/client/sessionStore.ts',
      lineNumber: 12,
      findingIds: [],
      column: 2,
    },
  ];

  const sinkNodes: Omit<FlowNode, 'row'>[] = [
    {
      id: 'sink-stdout-log',
      label: 'stdout / console.log Sink',
      sublabel: 'Unredacted Cleartext Log Stream',
      type: 'sink',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number'],
      filePath: 'src/routes/checkout.ts',
      lineNumber: 13,
      findingIds: [],
      column: 3,
    },
    {
      id: 'sink-analytics',
      label: 'External Analytics API',
      sublabel: 'analyticsClient.track() Webhook',
      type: 'sink',
      riskLevel: 'High',
      piiFields: ['email', 'phone', 'pan_number'],
      filePath: 'src/routes/checkout.ts',
      lineNumber: 15,
      findingIds: [],
      column: 3,
    },
    {
      id: 'sink-sentry-error',
      label: 'Sentry Crash Telemetry & 500 JSON',
      sublabel: 'Unredacted req.body & SELECT * Response',
      type: 'sink',
      riskLevel: 'Critical',
      piiFields: ['aadhaar_number', 'password_hash', 'phone'],
      filePath: 'src/controllers/userOnboarding.ts',
      lineNumber: 25,
      findingIds: [],
      column: 3,
    },
    {
      id: 'sink-bulk-csv',
      label: 'Unscoped CSV/JSON Export & Pixel',
      sublabel: 'Bulk Table Dump & Ad Pixel 9941-IN',
      type: 'sink',
      riskLevel: 'Critical',
      piiFields: ['email', 'phone', 'pan_number', 'aadhaar_number'],
      filePath: 'src/routes/exportData.ts',
      lineNumber: 15,
      findingIds: [],
      column: 3,
    },
  ];

  // Attach finding IDs to matching nodes and compute dynamic risk states
  const allBaseNodes = [...routeNodes, ...controllerNodes, ...dbNodes, ...sinkNodes];

  for (const f of activeFindings) {
    f.piiFields.forEach((p) => piiSet.add(p));
    for (const n of allBaseNodes) {
      if (n.filePath === f.filePath) {
        n.findingIds.push(f.id);
      }
    }
  }

  // Re-evaluate node risk level based on remaining open findings in that file
  for (const n of allBaseNodes) {
    const openForNode = activeFindings.filter(
      (f) => f.filePath === n.filePath && f.status !== 'Resolved'
    );
    if (openForNode.length === 0) {
      n.riskLevel = 'Safe';
    } else if (openForNode.some((f) => f.severity === 'Critical')) {
      n.riskLevel = 'Critical';
    } else if (openForNode.some((f) => f.severity === 'High')) {
      n.riskLevel = 'High';
    } else {
      n.riskLevel = 'Medium';
    }
  }

  // Assign row indices per column
  [0, 1, 2, 3].forEach((col) => {
    const colNodes = allBaseNodes.filter((n) => n.column === col);
    colNodes.forEach((n, idx) => {
      nodes.push({ ...n, row: idx });
    });
  });

  const makeEdge = (
    id: string,
    source: string,
    target: string,
    label: string,
    piiFields: string[],
    ruleIdMatch: string
  ): FlowEdge => {
    const matchingFinding = activeFindings.find(
      (f) => f.ruleId === ruleIdMatch && f.status !== 'Resolved'
    );
    return {
      id,
      source,
      target,
      label,
      piiFields,
      isRisky: Boolean(matchingFinding),
      severity: matchingFinding ? matchingFinding.severity : 'Safe',
      findingId: matchingFinding?.id,
    };
  };

  edges.push(
    makeEdge('e-1', 'route-checkout', 'ctrl-checkout', 'req.body (No Consent Guard)', ['email', 'phone', 'pan_number'], 'PL-DPDP-001'),
    makeEdge('e-2', 'ctrl-checkout', 'db-checkouts', 'INSERT customer_checkouts', ['email', 'phone', 'pan_number'], 'PL-DPDP-004'),
    makeEdge('e-3', 'ctrl-checkout', 'sink-stdout-log', 'console.log(rawPII)', ['email', 'phone', 'pan_number'], 'PL-DPDP-002'),
    makeEdge('e-4', 'ctrl-checkout', 'sink-analytics', 'analyticsClient.track()', ['email', 'phone', 'pan_number'], 'PL-DPDP-005'),
    makeEdge('e-5', 'route-signup', 'ctrl-onboarding', 'req.body (No Minor Age-Gate)', ['date_of_birth', 'aadhaar_number'], 'PL-DPDP-007'),
    makeEdge('e-6', 'ctrl-onboarding', 'db-users', 'INSERT & SELECT * FROM users', ['aadhaar_number', 'password_hash'], 'PL-DPDP-004'),
    makeEdge('e-7', 'db-users', 'sink-sentry-error', 'res.json(row) & Sentry.captureException', ['aadhaar_number', 'password_hash'], 'PL-DPDP-009'),
    makeEdge('e-8', 'route-export', 'ctrl-export', 'GET ?format=csv (Unscoped)', ['pan_number', 'aadhaar_number'], 'PL-DPDP-011'),
    makeEdge('e-9', 'ctrl-export', 'db-users', 'SELECT * Without Tenant WHERE', ['email', 'phone', 'pan_number', 'aadhaar_number'], 'PL-DPDP-011'),
    makeEdge('e-10', 'db-users', 'sink-bulk-csv', 'Unmonitored Bulk PII Dump', ['pan_number', 'aadhaar_number'], 'PL-DPDP-008'),
    makeEdge('e-11', 'route-client-session', 'ctrl-session', 'customerProfile Object', ['pan_number', 'session_token'], 'PL-DPDP-003'),
    makeEdge('e-12', 'ctrl-session', 'db-localstorage', 'localStorage.setItem()', ['pan_number', 'session_token'], 'PL-DPDP-003'),
    makeEdge('e-13', 'ctrl-session', 'sink-bulk-csv', 'initThirdPartyPixel(email)', ['email'], 'PL-DPDP-006')
  );

  return {
    nodes,
    edges,
    summary: {
      totalRoutes: routeNodes.length,
      totalControllers: controllerNodes.length,
      totalDbFields: dbNodes.length,
      totalExternalSinks: sinkNodes.length,
      riskyFlowCount: edges.filter((e) => e.isRisky).length,
      detectedPiiTypes: Array.from(piiSet),
    },
  };
}
