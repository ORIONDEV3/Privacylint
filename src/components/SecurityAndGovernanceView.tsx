import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Printer,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AuditLogEntry,
  Finding,
  PrivacyFlowGraphData,
  RepositoryProject,
  RoleId,
  ScanRecord,
  SecurityControlItem,
  UserProfile,
} from '../engine/types';

interface SecurityCenterProps {
  controls: SecurityControlItem[];
  auditLogs: AuditLogEntry[];
  onRefreshState: () => Promise<void>;
}

export const SecurityCenterView: React.FC<SecurityCenterProps> = ({
  controls,
  auditLogs,
  onRefreshState,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [liveAuditResult, setLiveAuditResult] = useState<{
    verifiedAt: string;
    checks: Record<string, boolean>;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleRunLiveVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/security/verify-live');
      const data = await res.json();
      if (res.ok) {
        setLiveAuditResult({
          verifiedAt: data.verifiedAt,
          checks: data.checks,
        });
        await onRefreshState();
      }
    } finally {
      setVerifying(false);
    }
  };

  const filteredControls = controls.filter((c) =>
    statusFilter === 'ALL' ? true : c.status === statusFilter
  );

  const implementedCount = controls.filter((c) => c.status === 'Implemented').length;
  const needsConfigCount = controls.filter(
    (c) => c.status === 'Needs Configuration'
  ).length;
  const notVerifiedCount = controls.filter((c) => c.status === 'Not Verified').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Application Self-Protection &amp; Verification Telemetry
          </div>
          <h2 className="text-lg font-bold text-white">
            PrivacyLint Security Center — 10 Core Security Controls
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Honest, evidence-based verification. Controls are marked Implemented only when verified in the live server runtime.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={verifying}
            onClick={handleRunLiveVerification}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>
              {verifying
                ? 'Probing Crypto & Headers...'
                : 'Run Live Security Self-Audit'}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Security Controls</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {controls.length}
          </div>
        </div>
        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Verified Implemented</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {implementedCount}/10
          </div>
        </div>
        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Needs Prod Configuration</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {needsConfigCount}
          </div>
        </div>
        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Not Verified in Sandbox</div>
          <div className="text-2xl font-bold text-slate-300 font-mono tabular-nums mt-1">
            {notVerifiedCount}
          </div>
        </div>
      </div>

      {/* Live Probe Output */}
      {liveAuditResult && (
        <div
          role="status"
          className="bg-emerald-950/30 border border-emerald-800/80 rounded-xl p-4 text-xs"
        >
          <div className="font-mono text-emerald-300 font-semibold mb-2">
            Live Runtime Probe Completed at {new Date(liveAuditResult.verifiedAt).toLocaleTimeString()}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-[11px]">
            {Object.entries(liveAuditResult.checks).map(([key, passed]) => {
              const readableLabels: Record<string, string> = {
                scryptKdfAndTimingSafeEqual: 'scrypt KDF Hash',
                zodSchemaValidationActive: 'Zod Validation',
                hmacHttpOnlySessionSigning: 'Signed Session',
                securityHeadersPresent: 'Security Headers',
                rateLimiterActive: 'Rate Limiter',
                rbacEnforcementActive: 'RBAC Guard',
              };
              return (
                <div
                  key={key}
                  className="p-2 rounded bg-[#070B14] border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-slate-200">{readableLabels[key] || key}</span>
                  <span className={passed ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                    {passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0C1222] border border-slate-800 rounded-lg w-fit">
        {(['ALL', 'Implemented', 'Needs Configuration', 'Not Verified'] as const).map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All 10 Controls' : st}
            </button>
          )
        )}
      </div>

      {/* 10 Security Controls Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredControls.map((ctrl) => (
          <div
            key={ctrl.id}
            className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-blue-400 font-semibold">
                  {String(ctrl.number).padStart(2, '0')}. {ctrl.category}
                </span>
                <span
                  className={
                    ctrl.status === 'Implemented'
                      ? 'text-emerald-400 font-semibold'
                      : ctrl.status === 'Needs Configuration'
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-400'
                  }
                >
                  {ctrl.status} · {ctrl.riskLevel} Risk
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                {ctrl.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {ctrl.description}
              </p>

              <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/90 text-xs space-y-1.5 mb-3">
                <div>
                  <span className="text-slate-400 font-medium">
                    Verification Evidence:{' '}
                  </span>
                  <span className="text-slate-200">{ctrl.verificationEvidence}</span>
                </div>
                <div className="font-mono text-[11px] text-blue-300">
                  Location: {ctrl.codeLocation}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Recommended Action:{' '}
              </span>
              <span>{ctrl.recommendedAction}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Security &amp; RBAC Audit Log Stream (Pseudonymized IP Hashes)
            </h3>
            <p className="text-xs text-slate-400">
              Records authentication, scan triggers, patch verifications, and RBAC permission checks with 180-day TTL
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {auditLogs.length} Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#070B14]/60 font-mono text-[11px] text-slate-400">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor &amp; Role</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target Resource</th>
                <th className="py-2.5 px-4">IP Hash (SHA-256)</th>
                <th className="py-2.5 px-4 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 tabular-nums text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">
                    {log.actorEmail} ({log.actorRole})
                  </td>
                  <td className="py-2.5 px-4 text-blue-400">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-300">{log.targetResource}</td>
                  <td className="py-2.5 px-4 text-slate-500">{log.ipHash}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={
                        log.status === 'SUCCESS'
                          ? 'text-emerald-400'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REPORTS VIEW
// ============================================================================
interface ReportsViewProps {
  repositories: RepositoryProject[];
  scans: ScanRecord[];
  findings: Finding[];
  graphsByRepo: Record<string, PrivacyFlowGraphData>;
  selectedRepoId: string;
  onSelectRepo: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  repositories,
  scans,
  findings,
  graphsByRepo,
  selectedRepoId,
  onSelectRepo,
}) => {
  const repo =
    repositories.find((r) => r.id === selectedRepoId) || repositories[0];
  const repoFindings = findings.filter((f) => f.repositoryId === repo?.id);
  const openFindings = repoFindings.filter((f) => f.status !== 'Resolved');
  const resolvedFindings = repoFindings.filter((f) => f.status === 'Resolved');
  const graph = graphsByRepo[repo?.id] || {
    nodes: [],
    edges: [],
    summary: {
      totalRoutes: 0,
      totalControllers: 0,
      totalDbFields: 0,
      totalExternalSinks: 0,
      riskyFlowCount: 0,
      detectedPiiTypes: [],
    },
  };
  const latestScan = scans.find((s) => s.repositoryId === repo?.id);

  const handleDownloadJson = () => {
    const payload = {
      reportTitle: `PrivacyLint Engineering Triage Report — ${repo.fullName}`,
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Static AST and schema triage report mapped to DPDP Act 2023 engineering controls. Not formal legal advice.',
      repository: {
        name: repo.fullName,
        branch: repo.branch,
        commitSha: repo.commitSha,
        riskScore: repo.riskScore,
      },
      summary: {
        totalFindings: repoFindings.length,
        openFindings: openFindings.length,
        verifiedResolved: resolvedFindings.length,
        critical: openFindings.filter((f) => f.severity === 'Critical').length,
        high: openFindings.filter((f) => f.severity === 'High').length,
        medium: openFindings.filter((f) => f.severity === 'Medium').length,
        low: openFindings.filter((f) => f.severity === 'Low').length,
      },
      privacyFlowSummary: graph.summary,
      findings: repoFindings,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacylint-report-${repo.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const lines = [
      `# PrivacyLint Security & Privacy Triage Report`,
      `**Repository:** ${repo.fullName} (${repo.branch}@${repo.commitSha})`,
      `**Scan Date:** ${new Date(repo.lastScanAt).toUTCString()}`,
      `**Overall Risk Score:** ${repo.riskScore}/100`,
      `**Open Findings:** ${openFindings.length} | **Verified Resolved:** ${resolvedFindings.length}`,
      ``,
      `## Privacy Flow Summary`,
      `- API Routes Analyzed: ${graph.summary.totalRoutes}`,
      `- Controllers Analyzed: ${graph.summary.totalControllers}`,
      `- Database Stores: ${graph.summary.totalDbFields}`,
      `- External Sinks: ${graph.summary.totalExternalSinks}`,
      `- Detected PII Attributes: ${graph.summary.detectedPiiTypes.join(', ')}`,
      ``,
      `## Detailed Findings`,
      ...repoFindings.map(
        (f) =>
          `### [${f.status}] ${f.id} — ${f.ruleName} (${f.severity})\n- **Rule:** ${f.ruleId} (${f.dpdpReference})\n- **Location:** \`${f.filePath}:${f.lineNumber}\`\n- **Route:** \`${f.affectedRoute}\`\n- **Remediation:** ${f.recommendedFix}\n`
      ),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacylint-report-${repo.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Compliance &amp; Engineering Triage Report Generator
          </div>
          <h2 className="text-lg font-bold text-white">
            Executive Privacy &amp; Vulnerability Assessment Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Exportable in JSON, Markdown, or Print-to-PDF format for security review boards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select repository for report"
            value={repo.id}
            onChange={(e) => onSelectRepo(e.target.value)}
            className="px-3 py-2 text-xs bg-[#070B14] border border-slate-700 rounded-lg text-white"
          >
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-6 lg:p-8 space-y-6">
        <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-blue-400 mb-1">
              PRIVACYLINT ASSESSMENT REPORT · VERSION 1.2.0
            </div>
            <h3 className="text-xl font-bold text-white">{repo.fullName}</h3>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Branch: {repo.branch} · Commit: {repo.commitSha} · Scan Date:{' '}
              {new Date(repo.lastScanAt).toLocaleString()}
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <div
              className={`text-3xl font-bold tabular-nums ${
                repo.riskScore >= 70
                  ? 'text-rose-400'
                  : repo.riskScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {repo.riskScore}/100
            </div>
            <div className="text-xs text-slate-400">Overall Risk Score</div>
          </div>
        </div>

        {/* Severity & Privacy Flow Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800">
            <h4 className="text-xs font-semibold text-white mb-3">
              Severity Breakdown ({repoFindings.length} Total Findings)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
              <div className="flex justify-between p-2 rounded bg-[#0C1222]">
                <span className="text-rose-400">Critical Open:</span>
                <span className="text-white font-bold">
                  {openFindings.filter((f) => f.severity === 'Critical').length}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#0C1222]">
                <span className="text-amber-400">High Open:</span>
                <span className="text-white font-bold">
                  {openFindings.filter((f) => f.severity === 'High').length}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#0C1222]">
                <span className="text-yellow-300">Medium Open:</span>
                <span className="text-white font-bold">
                  {openFindings.filter((f) => f.severity === 'Medium').length}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#0C1222]">
                <span className="text-emerald-400">Verified Resolved:</span>
                <span className="text-white font-bold">
                  {resolvedFindings.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800">
            <h4 className="text-xs font-semibold text-white mb-3">
              Personal Data Flow Summary
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Monitored Entry Routes:</span>
                <span>{graph.summary.totalRoutes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Persistence Nodes:</span>
                <span>{graph.summary.totalDbFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risky Exfiltration Edges:</span>
                <span className="text-rose-400">{graph.summary.riskyFlowCount}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-300 truncate">
                PII: {graph.summary.detectedPiiTypes.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Issue List & Remediations */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">
            Detailed Issue Inventory &amp; Recommended Remediations
          </h4>
          <div className="space-y-3">
            {repoFindings.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl bg-[#070B14] border border-slate-800/90 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span className="text-blue-400 font-semibold">
                    {f.id} · {f.ruleId} · {f.dpdpReference}
                  </span>
                  <span
                    className={
                      f.status === 'Resolved'
                        ? 'text-emerald-400 font-semibold'
                        : f.severity === 'Critical'
                        ? 'text-rose-400 font-semibold'
                        : 'text-amber-400'
                    }
                  >
                    {f.severity} · {f.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {f.ruleName} —{' '}
                  <span className="font-mono text-xs text-slate-300">
                    {f.filePath}:{f.lineNumber}
                  </span>
                </div>
                <p className="text-slate-300">{f.explanation}</p>
                <div className="pt-2 border-t border-slate-800/80 text-emerald-300">
                  <span className="font-semibold">Recommended Remediation: </span>
                  {f.recommendedFix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SETTINGS VIEW
// ============================================================================
interface SettingsViewProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  aiConfigured: boolean;
  onSwitchRole: (role: RoleId) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  availableUsers,
  aiConfigured,
  onSwitchRole,
}) => {
  const [orgName, setOrgName] = useState(currentUser.organizationName);
  const [dpoEmail, setDpoEmail] = useState('dpo-office@bharatpay.in');
  const [retentionDays, setRetentionDays] = useState('365');
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifyCertIn, setNotifyCertIn] = useState(true);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(
      'Organization governance, retention policy, and notification settings updated.'
    );
  };

  return (
    <div className="space-y-6">
      {savedBanner && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700/80 text-xs text-emerald-200 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Profile & Organization Settings */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-xl p-6 space-y-5"
        >
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">
              User Profile &amp; Organization Governance
            </h2>
            <p className="text-xs text-slate-400">
              Manage Data Protection Officer (DPO) contact metadata and default retention horizons.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                htmlFor="set-user-name"
                className="block text-slate-400 mb-1"
              >
                Authenticated User
              </label>
              <input
                id="set-user-name"
                type="text"
                readOnly
                value={`${currentUser.fullName} (${currentUser.email})`}
                className="w-full px-3 py-2 bg-[#070B14] border border-slate-800 rounded-lg text-slate-300"
              />
            </div>

            <div>
              <label
                htmlFor="set-user-role"
                className="block text-slate-400 mb-1"
              >
                Active RBAC Role (Switch to Test Permissions)
              </label>
              <select
                id="set-user-role"
                value={currentUser.role}
                onChange={(e) => onSwitchRole(e.target.value as RoleId)}
                className="w-full px-3 py-2 bg-[#070B14] border border-slate-700 rounded-lg text-white font-mono"
              >
                <option value="ADMIN">ADMIN (Organization Admin)</option>
                <option value="SECURITY_ANALYST">
                  SECURITY_ANALYST (Security Analyst)
                </option>
                <option value="DEVELOPER">DEVELOPER (Application Developer)</option>
              </select>
            </div>

            <div>
              <label htmlFor="set-org-name" className="block text-slate-400 mb-1">
                Organization Name
              </label>
              <input
                id="set-org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-[#070B14] border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label htmlFor="set-dpo-email" className="block text-slate-400 mb-1">
                Data Protection Officer (DPO) Contact
              </label>
              <input
                id="set-dpo-email"
                type="email"
                value={dpoEmail}
                onChange={(e) => setDpoEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#070B14] border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-retention"
                className="block text-slate-400 mb-1"
              >
                Default PII Retention Threshold (Days)
              </label>
              <input
                id="set-retention"
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full px-3 py-2 bg-[#070B14] border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="font-semibold text-white">Notification Preferences</div>
            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCritical}
                onChange={(e) => setNotifyCritical(e.target.checked)}
              />
              <span>
                Alert Security Analyst team immediately when Critical PII leakage rules trigger
              </span>
            </label>
            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCertIn}
                onChange={(e) => setNotifyCertIn(e.target.checked)}
              />
              <span>
                Include CERT-In &amp; DPDP §8(6) breach-readiness checklist in weekly digests
              </span>
            </label>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Save Organization Settings
            </button>
          </div>
        </form>

        {/* Right: Team Management, RBAC Permissions & Backend Integration Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">
              Team Directory &amp; RBAC Matrix
            </h3>
            <div className="space-y-2.5 text-xs">
              {availableUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-lg bg-[#070B14] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{u.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {u.email}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-blue-400">{u.role}</div>
                    <div className="text-[10px] text-slate-500">
                      {u.permissions.length} scopes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">
              Integrations &amp; Server Proxy Status
            </h3>
            <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">
                  Server-Side Gemini Remediation Proxy
                </div>
                <div className="text-[11px] text-slate-400">
                  Managed via server environment variables (never exposed to client)
                </div>
              </div>
              <span className="font-mono text-emerald-400">
                {aiConfigured ? 'Connected' : 'Template Fallback'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">GitHub App Integration</div>
                <div className="text-[11px] text-slate-400">
                  Read-only tree scanner &amp; PR branch generator
                </div>
              </div>
              <span className="font-mono text-emerald-400">Authorized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
