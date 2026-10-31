# PrivacyLint — AI-Powered Privacy & Security Code Analysis Platform

**Find Privacy Risks Before They Become Breaches.** · *Code. Compliance. Confidence.*

PrivacyLint is a deterministic privacy and security code analysis platform designed for Indian developers and application security teams. It scans Node.js/Express + PostgreSQL repositories, maps personal data flows (`API Route -> Controller -> Database Field -> Logger / External Sink`), aligns engineering triage with India's Digital Personal Data Protection (DPDP) Act 2023, and generates bounded, reviewable code remediation patches.

---

## 1. Core Architectural Principle

**Deterministic Detection → Rule Engine → AI Explanation & Bounded Remediation**

- **Evidence-First**: AI never decides whether a vulnerability exists. All 12 MVP rules (`src/engine/rules.json`) execute deterministically against source code AST patterns and SQL DDL schemas (`src/engine/scanner.ts`).
- **Bounded Remediation**: Server-side Gemini API (`gemini-3.8-flash` via `@google/genai`) explains findings and formats bounded diffs, with offline-safe deterministic templates when no API key is configured.
- **Verified Resolution Only**: Generating a patch never marks an issue resolved. Applying the patch in the sandbox and running a fresh scan verifies the code change and recalculates the Risk Score.

---

## 2. Project Folder Structure

```text
/
├── .env.example                          # Environment variables template
├── server.ts                             # Full-stack Express + Vite server (RBAC, scrypt, Zod, Rate Limit, Gemini proxy)
├── backend_scaffold/
│   ├── main.py                           # Python FastAPI + Tree-sitter + NetworkX reference backend scaffold
│   └── schema.sql                        # PostgreSQL / Supabase relational DDL schema (9 tables)
└── src/
    ├── App.tsx                           # Application shell, navigation, and workspace state
    ├── engine/
    │   ├── rules.json                    # Versioned catalog of 12 MVP DPDP privacy rules
    │   ├── types.ts                      # Core TypeScript domain models
    │   ├── sampleRepositories.ts         # Preloaded flawed Node.js/Express + PostgreSQL repository
    │   ├── scanner.ts                    # Deterministic AST/pattern scanner & Privacy Flow Graph builder
    │   ├── scanner.test.ts               # Node built-in unit tests (node:test)
    │   └── securityControls.ts           # 10 Security Center controls with truthful verification status
    └── components/
        ├── LandingPage.tsx               # Marketing & architecture landing page
        ├── AuthView.tsx                  # Login, Registration, Password Reset & RBAC persona selector
        ├── DashboardView.tsx             # KPI metrics, Recharts history & severity charts, live filters
        ├── RepositoriesView.tsx          # GitHub connection, JSZip archive upload, code viewer & scanner
        ├── FindingsView.tsx              # Vulnerability management, search/sort/filter, evidence inspector
        ├── PrivacyFlowGraphView.tsx      # Interactive 4-column PII lineage DAG visualization
        ├── AiFixGeneratorView.tsx        # Bounded code patch generator, diff viewer & sandbox re-scanner
        └── SecurityAndGovernanceView.tsx # Security Center (10 controls), Reports export & Settings
```

---

## 3. Installation & Running Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic unit tests
npx --yes tsx --test src/engine/scanner.test.ts

# 3. Start full-stack server on port 3000
npm run dev
```

---

## 4. REST API Documentation

- `GET /api/state` — Returns workspace session, repositories, scans, findings, flow graphs, security controls, and audit logs.
- `POST /api/auth/login` / `POST /api/auth/register` / `POST /api/auth/switch-role` — Authenticates users with `scrypt` KDF and issues HMAC-SHA256 `HttpOnly` session cookies.
- `POST /api/repositories` — Connects a repository or uploads extracted `.zip` source files and runs an initial scan.
- `POST /api/scans/run` — Runs the 12 deterministic rules against the selected repository.
- `PATCH /api/findings/:id/status` — Updates finding triage status (RBAC restricted to `ADMIN` and `SECURITY_ANALYST`).
- `POST /api/remediation/generate` — Generates bounded code patch via server-side Gemini API or deterministic template.
- `POST /api/remediation/apply-and-rescan` — Applies bounded patch to sandbox file and executes a fresh scan to verify resolution.
- `GET /api/security/verify-live` — Executes live runtime verification of cryptographic hashing, Zod schemas, session signing, and security headers.
