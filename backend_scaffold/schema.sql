-- =============================================================================
-- PRIVACYLINT — POSTGRESQL / SUPABASE RELATIONAL SCHEMA
-- Version: 1.2.0
-- Enforces parameterized queries, RBAC isolation, and full audit lineage
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    dpdp_fiduciary_tier VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD' | 'SIGNIFICANT_DATA_FIDUCIARY'
    dpo_contact_email VARCHAR(255),
    retention_default_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Roles
CREATE TABLE roles (
    id VARCHAR(32) PRIMARY KEY, -- 'ADMIN', 'SECURITY_ANALYST', 'DEVELOPER'
    name VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO roles (id, name, description, permissions) VALUES
('ADMIN', 'Organization Admin', 'Full organization, team, RBAC, security center, and integration management.', '["org:manage", "users:manage", "repo:write", "scan:run", "finding:write", "remediation:approve", "security:audit"]'),
('SECURITY_ANALYST', 'Security & Privacy Analyst', 'Execute scans, triage findings, verify privacy flow graphs, and export compliance reports.', '["repo:read", "scan:run", "finding:write", "remediation:review", "report:export", "security:audit"]'),
('DEVELOPER', 'Application Developer', 'Connect repositories, inspect findings, generate bounded code patches, and review diffs.', '["repo:write", "scan:run", "finding:read", "remediation:generate"]');

-- 3. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id VARCHAR(32) NOT NULL REFERENCES roles(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(140) NOT NULL,
    password_hash TEXT NOT NULL, -- Argon2id / scrypt modular crypt format; never plaintext
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);

-- 4. Repositories
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    provider VARCHAR(32) NOT NULL DEFAULT 'github', -- 'github' | 'zip_upload' | 'sample_sandbox'
    default_branch VARCHAR(64) NOT NULL DEFAULT 'main',
    framework VARCHAR(64) NOT NULL DEFAULT 'Node.js / Express + PostgreSQL',
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    last_scan_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repositories_org ON repositories(organization_id);

-- 5. Rules (Versioned Catalog)
CREATE TABLE rules (
    id VARCHAR(32) PRIMARY KEY, -- e.g. 'PL-DPDP-001'
    version VARCHAR(16) NOT NULL DEFAULT '1.2.0',
    name VARCHAR(200) NOT NULL,
    category VARCHAR(80) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    dpdp_reference VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    detection_logic TEXT NOT NULL,
    remediation_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Scans
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('Queued', 'Running', 'Completed', 'Failed')),
    branch VARCHAR(64) NOT NULL DEFAULT 'main',
    commit_sha VARCHAR(40) NOT NULL,
    files_scanned INTEGER NOT NULL DEFAULT 0,
    total_findings INTEGER NOT NULL DEFAULT 0,
    critical_count INTEGER NOT NULL DEFAULT 0,
    high_count INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    risk_score INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_scans_repo ON scans(repository_id, started_at DESC);

-- 7. Findings
CREATE TABLE findings (
    id VARCHAR(48) PRIMARY KEY,
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    rule_id VARCHAR(32) NOT NULL REFERENCES rules(id),
    title VARCHAR(240) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(24) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    file_path VARCHAR(512) NOT NULL,
    line_number INTEGER NOT NULL,
    end_line_number INTEGER NOT NULL,
    code_evidence TEXT NOT NULL,
    explanation TEXT NOT NULL,
    affected_route VARCHAR(180),
    related_db_field VARCHAR(180),
    pii_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_fix TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_repo_status ON findings(repository_id, status, severity);

-- 8. Remediations
CREATE TABLE remediations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id VARCHAR(48) NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    generation_source VARCHAR(32) NOT NULL CHECK (generation_source IN ('GEMINI_BOUNDED_PATCH', 'DETERMINISTIC_TEMPLATE')),
    explanation TEXT NOT NULL,
    before_code TEXT NOT NULL,
    after_code TEXT NOT NULL,
    unified_diff TEXT NOT NULL,
    applied_in_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_rescan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Logs (With Explicit Retention Policy per PL-DPDP-004)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(120) NOT NULL,
    target_resource VARCHAR(160) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_hash VARCHAR(64) NOT NULL, -- Pseudonymized SHA-256 IP hash (never raw PII in logs)
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '180 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
