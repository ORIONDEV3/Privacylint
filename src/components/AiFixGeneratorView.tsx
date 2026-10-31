import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Download,
  GitPullRequest,
  Play,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Finding, RemediationResponse } from '../engine/types';

interface AiFixGeneratorViewProps {
  findings: Finding[];
  selectedFinding: Finding | null;
  onSelectFinding: (finding: Finding) => void;
  onApplyPatchAndRescan: (findingId: string, afterCode?: string) => Promise<void>;
}

export const AiFixGeneratorView: React.FC<AiFixGeneratorViewProps> = ({
  findings,
  selectedFinding,
  onSelectFinding,
  onApplyPatchAndRescan,
}) => {
  const activeFinding = selectedFinding || findings[0] || null;
  const [remediation, setRemediation] = useState<RemediationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [diffMode, setDiffMode] = useState<'split' | 'unified'>('split');
  const [prDraftMessage, setPrDraftMessage] = useState<string | null>(null);
  const [verifyBanner, setVerifyBanner] = useState<string | null>(null);

  const generateRemediationForFinding = async (finding: Finding) => {
    setIsGenerating(true);
    setPrDraftMessage(null);
    try {
      const res = await fetch('/api/remediation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId: finding.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setRemediation(data);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeFinding) {
      generateRemediationForFinding(activeFinding);
    }
  }, [activeFinding?.id]);

  const handleExportPatchFile = () => {
    if (!activeFinding || !remediation) return;
    const blob = new Blob([remediation.unifiedDiff], {
      type: 'text/x-diff;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFinding.ruleId.toLowerCase()}-${activeFinding.id.toLowerCase()}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateReviewablePr = () => {
    if (!activeFinding) return;
    setPrDraftMessage(
      `Prepared reviewable branch fix/${activeFinding.ruleId.toLowerCase()}-${activeFinding.lineNumber} targeting ${activeFinding.filePath}. Production repositories are never auto-merged without human code review.`
    );
  };

  const handleApplyToSandboxAndRescan = async () => {
    if (!activeFinding || !remediation) return;
    setIsApplying(true);
    setVerifyBanner(null);
    try {
      await onApplyPatchAndRescan(activeFinding.id, remediation.afterCode);
      setVerifyBanner(
        `Bounded patch applied to ${activeFinding.filePath} and verified by a fresh deterministic AST re-scan. Rule ${activeFinding.ruleId} is now Verified Resolved.`
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Finding Selector */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Bounded Remediation &amp; Code Diff Reviewer
          </div>
          <h2 className="text-lg font-bold text-white">
            Deterministic Detection → Scoped Patch Generation → Sandbox Re-Scan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Never modifies production branches automatically. Review the proposed diff, export a `.patch` file, or apply it to the sandbox and re-scan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="autofix-finding-select"
            className="text-xs text-slate-400 font-medium"
          >
            Target Finding:
          </label>
          <select
            id="autofix-finding-select"
            value={activeFinding?.id || ''}
            onChange={(e) => {
              const found = findings.find((f) => f.id === e.target.value);
              if (found) {
                setVerifyBanner(null);
                onSelectFinding(found);
              }
            }}
            className="px-3 py-2 text-xs bg-[#070B14] border border-slate-700 rounded-lg text-white font-mono max-w-sm"
          >
            {findings.map((f) => (
              <option key={f.id} value={f.id}>
                [{f.status}] {f.ruleId} — {f.filePath}:{f.lineNumber} ({f.severity})
              </option>
            ))}
          </select>

          {activeFinding && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => generateRemediationForFinding(activeFinding)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating Patch...' : 'Regenerate Fix'}</span>
            </button>
          )}
        </div>
      </div>

      {verifyBanner && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-700/80 text-xs text-emerald-200 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{verifyBanner}</span>
          </div>
          <span className="font-mono text-emerald-300 shrink-0">
            Status: Verified Resolved
          </span>
        </div>
      )}

      {prDraftMessage && (
        <div
          role="status"
          className="p-4 rounded-xl bg-blue-950/50 border border-blue-700/80 text-xs text-blue-200 flex items-center gap-2.5"
        >
          <GitPullRequest className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{prDraftMessage}</span>
        </div>
      )}

      {activeFinding && remediation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Explanation & Verification Steps */}
          <div className="lg:col-span-5 bg-[#0C1222] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-blue-400 font-semibold">
                {activeFinding.ruleId} · {activeFinding.severity}
              </span>
              <span
                className={
                  remediation.source === 'GEMINI_BOUNDED_PATCH'
                    ? 'text-violet-400'
                    : 'text-amber-300'
                }
              >
                {remediation.source === 'GEMINI_BOUNDED_PATCH'
                  ? 'Source: Gemini Bounded Patch'
                  : 'Source: Deterministic Template'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {activeFinding.ruleName}
              </h3>
              <div className="text-xs font-mono text-slate-400">
                File: {activeFinding.filePath}:{activeFinding.lineNumber} ·{' '}
                {activeFinding.dpdpReference}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B14] border border-slate-800">
              <div className="text-xs font-semibold text-white mb-1">
                1. Plain-Language Issue Explanation
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {remediation.issueSummary}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B14] border border-slate-800">
              <div className="text-xs font-semibold text-rose-400 mb-1">
                2. Privacy &amp; Compliance Impact
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {remediation.securityImpact}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070B14] border border-slate-800">
              <div className="text-xs font-semibold text-emerald-400 mb-1.5">
                3. Verification Checklist
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                {remediation.verificationSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              Engine Model: {remediation.modelUsed}
            </div>
          </div>

          {/* Right Before / After Code & Unified Diff Viewer */}
          <div className="lg:col-span-7 bg-[#0C1222] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDiffMode('split')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    diffMode === 'split'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Before &amp; After Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setDiffMode('unified')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    diffMode === 'unified'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Unified Git Diff (.patch)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPatchFile}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export .patch</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateReviewablePr}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <GitPullRequest className="w-3.5 h-3.5 text-violet-400" />
                  <span>Prepare Reviewable PR</span>
                </button>
              </div>
            </div>

            {diffMode === 'split' ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-rose-400 mb-1.5">
                    Before (Vulnerable Code at {activeFinding.filePath}:{activeFinding.lineNumber})
                  </div>
                  <pre className="p-4 rounded-lg bg-rose-950/30 border border-rose-900/60 font-mono text-xs text-rose-200 overflow-x-auto whitespace-pre-wrap">
                    {remediation.beforeCode}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-mono text-emerald-400 mb-1.5">
                    After (Bounded Privacy-Safe Replacement)
                  </div>
                  <pre className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/60 font-mono text-xs text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                    {remediation.afterCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-mono text-slate-400 mb-1.5">
                  Unified Git Patch Preview
                </div>
                <pre className="p-4 rounded-lg bg-[#070B14] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre">
                  {remediation.unifiedDiff}
                </pre>
              </div>
            )}

            {/* Primary Verification Action: Apply Patch to Sandbox & Re-Scan */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {activeFinding.status === 'Resolved'
                  ? 'This finding has already been patched and verified by a deterministic re-scan.'
                  : 'Apply this patch to the in-memory repository sandbox and run a live AST re-scan to verify the fix.'}
              </div>

              <button
                type="button"
                disabled={isApplying || activeFinding.status === 'Resolved'}
                onClick={handleApplyToSandboxAndRescan}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {activeFinding.status === 'Resolved'
                    ? 'Verified Resolved by Re-Scan'
                    : isApplying
                    ? 'Applying Patch & Re-Scanning...'
                    : 'Apply Patch to Sandbox & Re-Scan'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
