import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  GitBranch,
  Lock,
  Network,
  Shield,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { RuleDefinition } from '../engine/types';

interface LandingPageProps {
  rules: RuleDefinition[];
  onGetStarted: () => void;
  onViewDemo: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  rules,
  onGetStarted,
  onViewDemo,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <Shield className="w-5 h-5 text-blue-500" />
          <span>PrivacyLint</span>
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300"
        >
          <a
            href="#capabilities"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <a
            href="#rule-engine"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Rule Catalog
          </a>
          <a
            href="#architecture"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Architecture
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onViewDemo}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            View Live Demo
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main id="top" className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-20 lg:pt-24 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="text-xs font-mono text-blue-400 mb-4 flex items-center gap-2">
                <span>Find Privacy Risks Before They Become Breaches.</span>
                <span aria-hidden="true">·</span>
                <span>Code. Compliance. Confidence.</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.1] mb-6"
                style={{ textWrap: 'balance' }}
              >
                Make Your Code Privacy-Ready.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                PrivacyLint scans Node.js, TypeScript, and PostgreSQL repositories using
                deterministic AST rules to detect personal data leaks, map end-to-end PII
                flows across routes and sinks, align engineering triage with India&apos;s
                DPDP Act 2023, and generate bounded, reviewable code patches.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-10">
                <button
                  type="button"
                  onClick={onViewDemo}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
                >
                  <span>Launch Interactive Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
                <div>
                  <div className="text-2xl font-bold text-white font-mono tabular-nums">
                    12 MVP Rules
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Deterministic AST &amp; SQL DDL checks
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono tabular-nums">
                    100% Evidence
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Exact file, line &amp; sink traceability
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono tabular-nums">
                    DPDP 2023
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Versioned engineering triage mappings
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Architecture Preview Card */}
            <div className="lg:col-span-5 flex">
              <div className="w-full bg-[#0C1222] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-mono text-slate-400">
                        bharatpay-checkout-api · main
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        Deterministic Detection Pipeline
                      </div>
                    </div>
                    <span className="text-xs font-mono text-rose-400">
                      4 Critical · 86/100 Risk
                    </span>
                  </div>

                  {/* Sample Code Evidence */}
                  <div className="bg-[#070B14] border border-slate-800/90 rounded-lg p-3.5 font-mono text-xs mb-4">
                    <div className="text-slate-400 mb-2 flex items-center justify-between">
                      <span>src/routes/checkout.ts:13</span>
                      <span className="text-rose-400">PL-DPDP-002 (Critical)</span>
                    </div>
                    <div className="text-slate-500">
                      11 | const &#123; email, phone, panNumber &#125; = req.body;
                    </div>
                    <div className="bg-rose-950/40 text-rose-200 px-1.5 py-0.5 rounded my-1">
                      13 | console.log(&quot;Checkout PII:&quot;, &#123; email, phone, panNumber &#125;);
                    </div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded">
                      +  | console.info(&quot;Checkout [REDACTED]&quot;, &#123; piiRedacted: true &#125;);
                    </div>
                  </div>

                  {/* Mini Data Flow Chain */}
                  <div className="space-y-2.5 text-xs">
                    <div className="text-slate-400 font-medium">
                      Live Personal Data Lineage:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800">
                        <div className="text-slate-400">01. API Route</div>
                        <div className="font-mono text-slate-200 mt-0.5 truncate">
                          POST /api/v1/checkout
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800">
                        <div className="text-slate-400">02. Controller</div>
                        <div className="font-mono text-slate-200 mt-0.5 truncate">
                          checkout.ts:10
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800">
                        <div className="text-slate-400">03. Database Field</div>
                        <div className="font-mono text-amber-300 mt-0.5 truncate">
                          customer_checkouts.pan
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#070B14] border border-rose-900/60">
                        <div className="text-rose-400">04. Unredacted Sink</div>
                        <div className="font-mono text-rose-200 mt-0.5 truncate">
                          stdout · analytics.track
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Zero AI Hallucinations · Evidence-First</span>
                  <button
                    type="button"
                    onClick={onViewDemo}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <span>Inspect Full Scan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — 3-Stage Core Principle */}
        <section
          id="how-it-works"
          className="border-y border-slate-800/80 bg-[#0A0F1D] py-16 px-6 lg:px-12"
        >
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono text-blue-400 mb-2">
                Core Architectural Principle
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Deterministic Detection → Rule Engine → Bounded AI Remediation
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                AI never guesses whether a vulnerability exists. Every finding requires
                verifiable AST, SQL schema, or data-flow evidence before optional AI
                remediation is invoked.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#070B14] border border-slate-800 rounded-xl p-6">
                <div className="text-xs font-mono text-blue-400 mb-2">
                  01. AST &amp; Schema Parsing
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Evidence-Based Detection
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Parses Express route handlers, controller parameters, PostgreSQL DDL
                  tables, and browser storage calls to pinpoint exact file paths and line
                  numbers where regulated PII is ingested.
                </p>
                <div className="text-xs font-mono text-slate-400">
                  Inputs: TypeScript · JavaScript · PostgreSQL DDL
                </div>
              </div>

              <div className="bg-[#070B14] border border-slate-800 rounded-xl p-6">
                <div className="text-xs font-mono text-violet-400 mb-2">
                  02. Versioned Rule Engine &amp; Graph
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  PII Lineage &amp; DPDP Triage
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Evaluates code against 12 versioned privacy rules (`rules.json`) and
                  constructs an interactive directed graph from API Route to Controller,
                  Database Column, and External Logger/Analytics Sinks.
                </p>
                <div className="text-xs font-mono text-slate-400">
                  Output: Finding ID · Sink Path · Risk Score
                </div>
              </div>

              <div className="bg-[#070B14] border border-slate-800 rounded-xl p-6">
                <div className="text-xs font-mono text-emerald-400 mb-2">
                  03. Bounded Remediation &amp; Re-Scan
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Reviewable Diffs &amp; Verification
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Generates a scoped code patch via Gemini API (with deterministic
                  offline-safe templates). Developers review the side-by-side diff, apply
                  it in the sandbox, and re-scan to prove the risk is resolved.
                </p>
                <div className="text-xs font-mono text-slate-400">
                  Guardrail: Never auto-merges to production
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Bento Grid */}
        <section id="capabilities" className="max-w-7xl mx-auto py-16 px-6 lg:px-12">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono text-blue-400 mb-2">
              Enterprise Platform Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built for Indian Engineering &amp; AppSec Teams
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0C1222] border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
                <Network className="w-4 h-4" />
                <span>Interactive Data-Flow Graph</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Trace Aadhaar, PAN, Phone &amp; Email Across Every Service Boundary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Visualize how personal identifiers enter through Express API endpoints,
                pass through controllers, persist in PostgreSQL tables, and leak into
                unredacted stdout logs, Sentry crash payloads, or third-party marketing
                pixels.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block">Entry Nodes</span>
                  <span className="text-white">REST Routes &amp; Client</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Processing</span>
                  <span className="text-white">Express Controllers</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Persistence</span>
                  <span className="text-white">PostgreSQL &amp; Storage</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Exfiltration Sinks</span>
                  <span className="text-rose-400">Logs · Sentry · Pixels</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-violet-400 mb-2">
                <Code2 className="w-4 h-4" />
                <span>Bounded Code Diffs</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Side-by-Side Patch Verification
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Inspect exact before-and-after code replacements, download standard Git
                `.patch` files, or apply patches directly to the sandbox repository and
                re-run the scanner to verify risk reduction.
              </p>
              <div className="text-xs font-mono text-slate-400 pt-4 border-t border-slate-800">
                Supports Gemini 3.8 Flash + Deterministic Templates
              </div>
            </div>

            <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
                <Lock className="w-4 h-4" />
                <span>Self-Auditing Security Center</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                10 Live-Verified Security Controls
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Monitors PrivacyLint&apos;s own defense-in-depth posture: scrypt KDF
                password hashing, Zod schema validation, RBAC enforcement, rate limiting,
                HttpOnly signed sessions, and security headers.
              </p>
            </div>

            <div className="lg:col-span-2 bg-[#0C1222] border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
                <FileCode2 className="w-4 h-4" />
                <span>ZIP Archive &amp; Preloaded Sandbox</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Test Immediately With Preloaded BharatPay Checkout API or Upload Any ZIP
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Includes a realistic multi-file Node.js/Express + PostgreSQL repository
                containing 12 seeded privacy flaws so judges and security engineers can
                verify detection, data-flow graphs, patching, and re-scanning in seconds.
              </p>
            </div>
          </div>
        </section>

        {/* Versioned 12 Rules Catalog Preview */}
        <section
          id="rule-engine"
          className="border-t border-slate-800/80 bg-[#0A0F1D] py-16 px-6 lg:px-12"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="text-xs font-mono text-blue-400 mb-2">
                  Versioned Catalog (rules.json v1.2.0)
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  12 Deterministic Privacy &amp; Security Rules
                </h2>
              </div>
              <div className="text-xs text-slate-400 max-w-md">
                Note: Findings provide engineering triage mapped to DPDP Act 2023
                safeguards and do not constitute formal legal compliance certification.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-[#070B14] border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-blue-400 font-semibold">{rule.id}</span>
                      <span
                        className={
                          rule.severity === 'Critical'
                            ? 'text-rose-400'
                            : rule.severity === 'High'
                            ? 'text-amber-400'
                            : rule.severity === 'Medium'
                            ? 'text-yellow-300'
                            : 'text-slate-400'
                        }
                      >
                        {rule.severity} Severity
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">
                      {rule.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {rule.description}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{rule.dpdpReference.split('—')[0].trim()}</span>
                    <span>·</span>
                    <span className="truncate max-w-[140px]">{rule.affectedSinkType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture & Tech Stack */}
        <section
          id="architecture"
          className="max-w-7xl mx-auto py-16 px-6 lg:px-12 border-t border-slate-800/80"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <div className="text-xs font-mono text-blue-400 mb-2">
                Defense-in-Depth Stack
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Privacy-First Full-Stack Architecture
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Designed with strict separation between the deterministic AST rule engine,
                directed graph builder, relational persistence schema, and optional
                server-side Gemini remediation proxy.
              </p>
              <button
                type="button"
                onClick={onViewDemo}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Open Workspace Console
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#0C1222] border border-slate-800 rounded-lg p-4">
                <div className="text-xs font-mono text-blue-400 mb-1">Frontend Layer</div>
                <div className="text-sm font-semibold text-white mb-1">
                  React 19 · Tailwind CSS · Recharts · Interactive Flow DAG
                </div>
                <div className="text-xs text-slate-400">
                  High-density enterprise telemetry, side-by-side diff viewer, and
                  interactive 4-tier PII lineage graph.
                </div>
              </div>
              <div className="bg-[#0C1222] border border-slate-800 rounded-lg p-4">
                <div className="text-xs font-mono text-violet-400 mb-1">
                  Analysis &amp; API Layer
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  AST Rule Scanner · Express API · Python FastAPI Scaffold
                </div>
                <div className="text-xs text-slate-400">
                  Deterministic source inspection (`src/engine/scanner.ts`) + reference
                  Tree-sitter/NetworkX scaffold (`backend_scaffold/main.py`).
                </div>
              </div>
              <div className="bg-[#0C1222] border border-slate-800 rounded-lg p-4">
                <div className="text-xs font-mono text-emerald-400 mb-1">
                  Security &amp; RBAC Layer
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  scrypt/Argon2 KDF · Zod Validation · Signed HttpOnly Sessions
                </div>
                <div className="text-xs text-slate-400">
                  Enforces Admin, Security Analyst, and Developer permissions on backend
                  routes with pseudonymized audit logs.
                </div>
              </div>
              <div className="bg-[#0C1222] border border-slate-800 rounded-lg p-4">
                <div className="text-xs font-mono text-amber-400 mb-1">
                  Database &amp; AI Remediation
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  PostgreSQL Schema (`schema.sql`) · Gemini 3.8 Flash Proxy
                </div>
                <div className="text-xs text-slate-400">
                  Server-side `@google/genai` integration with structured JSON schemas and
                  offline-safe deterministic remediation templates.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-200">PrivacyLint</span>
            <span>·</span>
            <span>Find Privacy Risks Before They Become Breaches.</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onViewDemo}
              className="hover:text-white transition-colors"
            >
              Interactive Demo
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="hover:text-white transition-colors"
            >
              Sign In
            </button>
            <span>Engineering Triage Prototype · DPDP Act 2023</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
