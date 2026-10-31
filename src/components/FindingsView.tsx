import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Code2,
  FileCode2,
  Network,
  Search,
  Wrench,
} from 'lucide-react';
import {
  Finding,
  FindingStatus,
  RepositoryProject,
  Severity,
  UserProfile,
} from '../engine/types';

interface FindingsViewProps {
  findings: Finding[];
  repositories: RepositoryProject[];
  selectedFinding: Finding | null;
  currentUser: UserProfile;
  onSelectFinding: (finding: Finding, targetTab?: 'findings' | 'flow' | 'autofix') => void;
  onUpdateStatus: (findingId: string, status: FindingStatus) => Promise<string | null>;
}

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const FindingsView: React.FC<FindingsViewProps> = ({
  findings,
  repositories,
  selectedFinding,
  currentUser,
  onSelectFinding,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repoFilter, setRepoFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FindingStatus>('ALL');
  const [sortBy, setSortBy] = useState<'severity' | 'line' | 'rule'>('severity');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = findings.filter((f) => {
      if (repoFilter !== 'ALL' && f.repositoryId !== repoFilter) return false;
      if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (!q) return true;
      return (
        f.id.toLowerCase().includes(q) ||
        f.ruleId.toLowerCase().includes(q) ||
        f.ruleName.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q) ||
        f.affectedRoute.toLowerCase().includes(q) ||
        f.piiFields.some((p) => p.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      if (sortBy === 'severity') {
        return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      }
      if (sortBy === 'line') {
        return a.lineNumber - b.lineNumber;
      }
      return a.ruleId.localeCompare(b.ruleId);
    });
  }, [findings, searchQuery, repoFilter, severityFilter, statusFilter, sortBy]);

  const activeFinding =
    selectedFinding && filteredFindings.some((f) => f.id === selectedFinding.id)
      ? findings.find((f) => f.id === selectedFinding.id)!
      : filteredFindings[0] || null;

  const handleStatusChange = async (newStatus: FindingStatus) => {
    if (!activeFinding) return;
    setStatusFeedback(null);
    const err = await onUpdateStatus(activeFinding.id, newStatus);
    if (err) {
      setStatusFeedback(err);
    } else {
      setStatusFeedback(`Updated ${activeFinding.id} status to ${newStatus}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="search"
            aria-label="Search findings by rule, file, route, or PII field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Rule ID, file path, route, or PII field (e.g. pan_number)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter findings by repository"
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#070B14] border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="ALL">All Repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div
            role="group"
            aria-label="Filter by severity"
            className="flex items-center gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-lg"
          >
            {(['ALL', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev === 'ALL' ? 'All' : sev}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter findings by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | FindingStatus)}
            className="px-3 py-1.5 text-xs bg-[#070B14] border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            aria-label="Sort findings"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'severity' | 'line' | 'rule')}
            className="px-3 py-1.5 text-xs bg-[#070B14] border border-slate-800 rounded-lg text-slate-200"
          >
            <option value="severity">Sort: Severity</option>
            <option value="rule">Sort: Rule ID</option>
            <option value="line">Sort: Line Number</option>
          </select>
        </div>
      </div>

      {/* Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Findings */}
        <div className="lg:col-span-5 bg-[#0C1222] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-white">
              Detected Findings ({filteredFindings.length})
            </span>
            <span className="font-mono text-slate-400">
              Click to inspect evidence
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 max-h-[680px] overflow-y-auto">
            {filteredFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No findings match the current filter criteria.
              </div>
            ) : (
              filteredFindings.map((f) => {
                const isSelected = activeFinding?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFinding(f)}
                    className={`w-full text-left p-4 transition-colors block ${
                      isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">
                        {f.id} · {f.ruleId}
                      </span>
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
                        {f.severity} · {f.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mb-1">
                      {f.ruleName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between tabular-nums">
                      <span className="truncate">{f.filePath}:{f.lineNumber}</span>
                      <span className="text-slate-500">{f.piiFields.slice(0, 2).join(', ')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detailed Evidence & Remediation Inspector */}
        <div className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-xl p-6">
          {activeFinding ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-blue-400 mb-1">
                    {activeFinding.id} · {activeFinding.ruleId} · {activeFinding.dpdpReference}
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {activeFinding.ruleName}
                  </h2>
                  <div className="text-xs font-mono text-slate-400 mt-1 tabular-nums">
                    Severity:{' '}
                    <span
                      className={
                        activeFinding.severity === 'Critical'
                          ? 'text-rose-400 font-semibold'
                          : activeFinding.severity === 'High'
                          ? 'text-amber-400 font-semibold'
                          : 'text-yellow-300'
                      }
                    >
                      {activeFinding.severity}
                    </span>{' '}
                    · File: <span className="text-slate-200">{activeFinding.filePath}</span> · Line:{' '}
                    <span className="text-slate-200">{activeFinding.lineNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectFinding(activeFinding, 'flow')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Network className="w-3.5 h-3.5 text-violet-400" />
                    <span>View in Flow Graph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectFinding(activeFinding, 'autofix')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Generate Fix</span>
                  </button>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80">
                  <div className="text-slate-400 mb-0.5">Affected API Route</div>
                  <div className="font-mono text-slate-200">
                    {activeFinding.affectedRoute}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80">
                  <div className="text-slate-400 mb-0.5">
                    Related Database Field / Sink
                  </div>
                  <div className="font-mono text-amber-300">
                    {activeFinding.relatedDbField}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80">
                  <div className="text-slate-400 mb-0.5">Exposed PII Attributes</div>
                  <div className="font-mono text-rose-300">
                    {activeFinding.piiFields.join(' · ')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80">
                  <div className="text-slate-400 mb-0.5">
                    Applicable Rule Reference
                  </div>
                  <div className="font-mono text-slate-200">
                    {activeFinding.ruleId} ({activeFinding.category})
                  </div>
                </div>
              </div>

              {/* Detection Evidence */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">
                    Deterministic Detection Evidence ({activeFinding.filePath}:{activeFinding.lineNumber})
                  </span>
                  <span className="font-mono text-slate-400">AST / Pattern Match</span>
                </div>
                <pre className="p-4 rounded-lg bg-[#070B14] border border-slate-800 font-mono text-xs text-rose-200 overflow-x-auto">
                  {activeFinding.codeEvidence}
                </pre>
              </div>

              {/* Engineering Explanation */}
              <div>
                <h3 className="text-xs font-semibold text-white mb-1">
                  Vulnerability &amp; Privacy Triage Explanation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeFinding.explanation}
                </p>
              </div>

              {/* Recommended Fix */}
              <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800">
                <h3 className="text-xs font-semibold text-emerald-400 mb-1">
                  Recommended Engineering Remediation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeFinding.recommendedFix}
                </p>
              </div>

              {/* Status Control (RBAC Enforced) */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span>Triage Status: </span>
                  <span className="font-mono text-white font-semibold">
                    {activeFinding.status}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    Active Role: {currentUser.roleLabel} (Manual status override requires Admin or Security Analyst; Developers resolve via code patch + re-scan)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Open', 'In Progress', 'Resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        activeFinding.status === st
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#070B14] border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {statusFeedback && (
                <div className="text-xs font-mono text-blue-300 p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/60">
                  {statusFeedback}
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              Select a finding from the list to view its evidence and remediation details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
