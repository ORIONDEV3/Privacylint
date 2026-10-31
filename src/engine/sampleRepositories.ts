import { RepositoryProject } from './types';

export const INITIAL_REPOSITORIES: RepositoryProject[] = [
  {
    id: 'repo-bharatpay-checkout',
    name: 'bharatpay-checkout-api',
    fullName: 'bharatpay-eng/bharatpay-checkout-api',
    description: 'Node.js/Express + PostgreSQL merchant checkout & KYC onboarding microservice handling UPI, PAN, Aadhaar last-4, and customer profiles.',
    provider: 'sample_sandbox',
    branch: 'main',
    commitSha: 'a84f92c',
    framework: 'Node.js / Express + PostgreSQL',
    lastScanAt: '2026-10-30T17:45:00Z',
    riskScore: 86,
    files: [
      {
        path: 'src/routes/checkout.ts',
        language: 'typescript',
        content: `import express from 'express';
import { db } from '../db/pool';
import { analyticsClient } from '../services/telemetry';

const router = express.Router();

// POST /api/v1/checkout/initiate
// Flaw 1: Missing consent verification check on PII-touching route (PL-DPDP-001)
// Flaw 2: Plaintext PII written to application logs (PL-DPDP-002)
// Flaw 5: Unmasked PII forwarded to third-party analytics (PL-DPDP-005)
router.post('/api/v1/checkout/initiate', async (req, res) => {
  const { email, phone, panNumber, fullName, amount } = req.body;

  console.log("Checkout initiated for customer PII:", { email, phone, panNumber, fullName });

  await analyticsClient.track('checkout_initiated', {
    customerEmail: email,
    customerPhone: phone,
    panCard: panNumber,
    amount
  });

  const result = await db.query(
    'INSERT INTO customer_checkouts (email, phone, pan_number, full_name, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [email, phone, panNumber, fullName, amount]
  );

  return res.status(201).json({ status: 'initiated', checkoutId: result.rows[0].id });
});

export default router;
`
      },
      {
        path: 'src/controllers/userOnboarding.ts',
        language: 'typescript',
        content: `import { Request, Response } from 'express';
import { db } from '../db/pool';
import * as Sentry from '../services/telemetry';

// POST /api/v1/users/signup
// Flaw 7: Missing age-gate / verifiable parental consent signal in signup flow (PL-DPDP-007)
// Flaw 9: Sensitive PII & credential fields exposed in API response (PL-DPDP-009)
// Flaw 10: PII written to unredacted error / crash telemetry (PL-DPDP-010)
// Flaw 12: Unmapped privacy control evidence in processing registry (PL-DPDP-012)
export async function registerCustomerAccount(req: Request, res: Response) {
  const { email, phone, dateOfBirth, aadhaarNumber, passwordHash } = req.body;

  try {
    // Directly inserts user without checking if dateOfBirth indicates a minor (<18 years)
    const userRow = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const created = await db.query(
      'INSERT INTO users (email, phone, date_of_birth, aadhaar_number, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, phone, dateOfBirth, aadhaarNumber, passwordHash]
    );

    // Exposes SELECT * / full row including password_hash & aadhaar_number directly in response
    return res.status(200).json(created.rows[0]);
  } catch (err) {
    Sentry.captureException(err, { extra: { rawRequestBody: req.body, aadhaarNumber, phone } });
    return res.status(500).json({ error: 'Onboarding failed', debugPayload: req.body });
  }
}
`
      },
      {
        path: 'src/routes/exportData.ts',
        language: 'typescript',
        content: `import express from 'express';
import { db } from '../db/pool';

const router = express.Router();

// GET /api/v1/admin/customers/export
// Flaw 8: Missing breach-notification incident hook on bulk PII store access (PL-DPDP-008)
// Flaw 11: Unscoped bulk data export endpoint without tenant/owner guard (PL-DPDP-011)
router.get('/api/v1/admin/customers/export', async (req, res) => {
  const format = req.query.format || 'csv';

  // Unscoped query dumping all customer PII records without tenant/user guard or breach alert hook
  const allCustomers = await db.query('SELECT email, phone, pan_number, aadhaar_number FROM users');

  return res.status(200).send({
    format,
    recordCount: allCustomers.rows.length,
    records: allCustomers.rows
  });
});

export default router;
`
      },
      {
        path: 'src/client/sessionStore.ts',
        language: 'typescript',
        content: `// Client-side checkout state helper
// Flaw 3: Unprotected PII stored in browser localStorage/sessionStorage (PL-DPDP-003)
// Flaw 6: Unconsented third-party tracker loaded on application route (PL-DPDP-006)

export function cacheCustomerKycSession(customerProfile: {
  email: string;
  phone: string;
  panNumber: string;
  sessionToken: string;
}) {
  // Storing sensitive PII and session token in cleartext localStorage
  window.localStorage.setItem('bharatpay_kyc_profile', JSON.stringify(customerProfile));
  window.sessionStorage.setItem('bharatpay_raw_pan', customerProfile.panNumber);

  // Loading third-party ad pixel unconditionally without checking user tracking consent
  window.initThirdPartyPixel('PIXEL-ID-9941-IN', { attachEmail: customerProfile.email });
}
`
      },
      {
        path: 'src/db/schema.sql',
        language: 'sql',
        content: `-- PostgreSQL schema for BharatPay Checkout Service
-- Flaw 4: PII database table without retention or TTL policy signal (PL-DPDP-004)

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  pan_number VARCHAR(16) NOT NULL,
  aadhaar_number VARCHAR(16) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Missing retention_until / expires_at / TTL policy column for DPDP §8(7) erasure compliance
);

CREATE TABLE customer_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  pan_number VARCHAR(16) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`
      }
    ]
  },
  {
    id: 'repo-medicare-telehealth',
    name: 'arogya-telehealth-core',
    fullName: 'arogya-health/arogya-telehealth-core',
    description: 'Patient appointment booking and e-prescription API handling ABHA health IDs, phone numbers, and diagnostic notes.',
    provider: 'github',
    branch: 'release/v2.4',
    commitSha: '7d19e04',
    framework: 'Node.js / Express + PostgreSQL',
    lastScanAt: '2026-10-29T14:20:00Z',
    riskScore: 42,
    files: [
      {
        path: 'src/routes/appointments.ts',
        language: 'typescript',
        content: `import express from 'express';
import { db } from '../db/pool';

const router = express.Router();

// @privacyPurpose Patient teleconsultation scheduling
router.post('/api/v1/appointments/book', async (req, res) => {
  const { patientEmail, patientPhone, abhaId, consentVerified } = req.body;
  if (!consentVerified) {
    return res.status(403).json({ error: 'Explicit patient DPDP consent required' });
  }
  console.log("Booking appointment for patient:", { patientPhone, abhaId });
  const row = await db.query(
    'INSERT INTO appointments (patient_email, patient_phone, abha_id, retention_until) VALUES ($1, $2, $3, NOW() + INTERVAL \\'365 days\\') RETURNING id',
    [patientEmail, patientPhone, abhaId]
  );
  return res.status(201).json({ appointmentId: row.rows[0].id });
});

export default router;
`
      }
    ]
  }
];
