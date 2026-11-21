import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  Network,
  Play,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { Finding, RepositoryProject, ScanRecord, Severity } from '../engine/types';

interface DashboardViewProps {
  repositories: RepositoryProject[];
  scans: ScanRecord[];
  findings: Finding[];
  selectedRepoId: string;
  onSelectRepo: (repoId: string) => void;
  onStartScan: (repoId: string) => Promise<void>;
  onResetSandbox: () => Promise<void>;
  onSelectFinding: (finding: Finding, targetTab?: 'findings' | 'flow' | 'autofix') => void;
  onNavigateTab: (tab: string) => void;
  isScanning: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  repositories,
  scans,
  findings,
  selectedRepoId,
  onSelectRepo,
  onStartScan,
  onResetSandbox,
  onSelectFinding,
  onNavigateTab,
  isScanning,
}) => {
  const [repoFilter, setRepoFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');

  const scopedFindings = useMemo(() => {
    return findings.filter((f) => {
      if (repoFilter !== 'ALL' && f.repositoryId !== repoFilter) return false;
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      return true;
    });
  }, [findings, repoFilter, severityFilter]);

  const openFindings = useMemo(
    () => scopedFindings.filter((f) => f.status !== 'Resolved'),
    [scopedFindings]
  );

  const criticalCount = useMemo(
    () => openFindings.filter((f) => f.severity === 'Critical').length,
    [openFindings]
  );
  const highCount = useMemo(
    () => openFindings.filter((f) => f.severity === 'High').length,
    [openFindings]
  );
  const mediumCount = useMemo(
    () => openFindings.filter((f) => f.severity === 'Medium').length,
    [openFindings]
  );
  const lowCount = useMemo(
    () => openFindings.filter((f) => f.severity === 'Low').length,
    [openFindings]
  );
  const resolvedCount = useMemo(
    () => scopedFindings.filter((f) => f.status === 'Resolved').length,
    [scopedFindings]
  );

  const overallRiskScore = useMemo(() => {
    if (repoFilter !== 'ALL') {
      const r = repositories.find((repo) => repo.id === repoFilter);
      return r ? r.riskScore : 0;
    }
    if (repositories.length === 0) return 0;
    return Math.max(...repositories.map((r) => r.riskScore));
  }, [repositories, repoFilter]);

  // Chart 1: Scan History Trend
  const scanHistoryData = useMemo(() => {
    const filteredScans =
      repoFilter === 'ALL'
        ? scans
        : scans.filter((s) => s.repositoryId === repoFilter);
    return [...filteredScans]
      .slice(0, 7)
      .reverse()
      .map((s, idx) => ({
        name: `#${idx + 1} (${s.commitSha.slice(0, 5)})`,
        riskScore: s.riskScore,
        openIssues: s.totalFindings,
        resolved: s.resolvedCount,
      }));
  }, [scans, repoFilter]);

  // Chart 2: Severity Distribution
  const severityChartData = useMemo(
    () => [
      { severity: 'Critical', count: criticalCount, color: '#F43F5E' },
      { severity: 'High', count: highCount, color: '#F59E0B' },
      { severity: 'Medium', count: mediumCount, color: '#EAB308' },
      { severity: 'Low', count: lowCount, color: '#64748B' },
    ],
    [criticalCount, highCount, mediumCount, lowCount]
  );

  const topCriticalFinding =
    openFindings.find((f) => f.severity === 'Critical') || openFindings[0];

  return (
    <div className="space-y-6">
      {/* Guided Live Demo Workflow Bar */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Interactive Hackathon Walkthrough · BharatPay Checkout API
          </div>
          <h2 className="text-base font-semibold text-white">
            Deterministic Scan → Exact File &amp; Line → Privacy Flow Graph → Bounded Patch → Verified Re-Scan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Issues are never marked resolved automatically on patch generation. Apply a patch to the sandbox repository and re-scan to verify risk score improvement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isScanning}
            onClick={() => onStartScan(selectedRepoId)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Scanning AST...' : '1. Run Live Scan'}</span>
          </button>

          {topCriticalFinding && (
            <>
              <button
                type="button"
                onClick={() => onSelectFinding(topCriticalFinding, 'flow')}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Network className="w-3.5 h-3.5 text-violet-400" />
                <span>2. View Flow Graph</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectFinding(topCriticalFinding, 'autofix')}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Generate &amp; Verify Fix</span>
              </button>
            </>
          )}

          {resolvedCount > 0 && (
            <button
              type="button"
              onClick={onResetSandbox}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#070B14] border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Reset sandbox repository to unpatched state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sandbox</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="dash-repo-filter" className="text-xs text-slate-400 font-medium">
            Repository Scope:
          </label>
          <select
            id="dash-repo-filter"
            value={repoFilter}
            onChange={(e) => {
              setRepoFilter(e.target.value);
              if (e.target.value !== 'ALL') {
                onSelectRepo(e.target.value);
              }
            }}
            className="px-3 py-1.5 text-xs bg-[#0C1222] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Connected Repositories ({repositories.length})</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.branch})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Severity Filter Segmented Control */}
        <div
          role="group"
          aria-label="Filter dashboard by severity"
          className="flex items-center gap-1 p-1 bg-[#0C1222] border border-slate-800 rounded-lg"
        >
          {(['ALL', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Repositories</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {repositories.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Node.js · PostgreSQL
          </div>
        </div>

        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Total Scans</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
            {scans.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            AST + DDL Engine
          </div>
        </div>

        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Critical Vulnerabilities</div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {criticalCount}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1 font-mono">
            Immediate Triage
          </div>
        </div>

        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">High-Risk Findings</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {highCount}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1 font-mono">
            PII Storage &amp; Sinks
          </div>
        </div>

        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Verified Resolved</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
            Confirmed via Re-Scan
          </div>
        </div>

        <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Overall Risk Score</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              overallRiskScore >= 70
                ? 'text-rose-400'
                : overallRiskScore >= 40
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {overallRiskScore}/100
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {overallRiskScore >= 70
              ? 'High Exposure'
              : overallRiskScore >= 40
              ? 'Moderate Exposure'
              : 'Low Exposure'}
          </div>
        </div>
      </div>

      {/* Charts Row: Scan History & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Scan Risk Score &amp; Active Finding Trajectory
              </h3>
              <p className="text-xs text-slate-400">
                Tracks deterministic risk score reduction across repository commits and patch verifications
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Last {scanHistoryData.length} Scans
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanHistoryData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070B14',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0C1222] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Open Findings by Severity
              </h3>
              <p className="text-xs text-slate-400">
                Breakdown of active privacy and security weaknesses
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {openFindings.length} Open
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="severity"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070B14',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Bar dataKey="count" name="Open Findings" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {severityChartData.map((entry) => (
                    <Cell key={entry.severity} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Split: Recent Findings Table & Recent Scan Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#0C1222] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Priority Privacy &amp; Security Findings
              </h3>
              <p className="text-xs text-slate-400">
                Click any finding to inspect exact source code evidence, data-flow graph, or generate a bounded fix
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('findings')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>View All ({scopedFindings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-mono text-slate-400 bg-[#070B14]/60">
                  <th className="py-2.5 px-4">Rule / Issue</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">File &amp; Line</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {scopedFindings.slice(0, 7).map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => onSelectFinding(f, 'findings')}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{f.ruleName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {f.ruleId} · {f.dpdpReference.split('—')[0].trim()}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          f.severity === 'Critical'
                            ? 'text-rose-400 font-semibold'
                            : f.severity === 'High'
                            ? 'text-amber-400 font-semibold'
                            : f.severity === 'Medium'
                            ? 'text-yellow-300'
                            : 'text-slate-400'
                        }
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                      {f.filePath}:{f.lineNumber}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          f.status === 'Resolved'
                            ? 'text-emerald-400'
                            : f.status === 'In Progress'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                        }
                      >
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectFinding(f, 'autofix')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-600/20 rounded transition-colors whitespace-nowrap"
                      >
                        {f.status === 'Resolved' ? 'View Diff' : 'Generate Fix'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Scan Activity */}
        <div className="lg:col-span-4 bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Scan Activity</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('scanner')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Open Scanner
              </button>
            </div>

            <div className="space-y-3">
              {scans.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between font-medium text-white mb-1">
                    <span className="truncate">{s.repositoryName}</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {s.riskScore}/100 Risk
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>{s.branch}@{s.commitSha}</span>
                    <span>·</span>
                    <span>{s.filesScanned} files</span>
                    <span>·</span>
                    <span>{s.durationMs}ms</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-rose-400">{s.criticalCount} Crit</span>
                    <span className="text-amber-400">{s.highCount} High</span>
                    <span className="text-yellow-300">{s.mediumCount} Med</span>
                    <span className="text-emerald-400">{s.resolvedCount} Resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Engine: PrivacyLint AST v1.2.0</span>
            <span className="font-mono">12/12 Rules Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
