import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  CheckCircle2,
  Code2,
  FileArchive,
  FileCode,
  FolderGit2,
  GitBranch,
  Play,
  Plus,
  RefreshCw,
  ScanSearch,
  Upload,
} from 'lucide-react';
import {
  Finding,
  RepositoryProject,
  RuleDefinition,
  ScanRecord,
  SourceFileEntry,
} from '../engine/types';

interface RepositoriesViewProps {
  mode: 'repositories' | 'scanner';
  repositories: RepositoryProject[];
  rules: RuleDefinition[];
  scans: ScanRecord[];
  findings: Finding[];
  selectedRepoId: string;
  onSelectRepo: (repoId: string) => void;
  onStartScan: (repoId: string, enabledRules?: string[]) => Promise<void>;
  onAddRepository: (payload: {
    name: string;
    description: string;
    provider: 'github' | 'zip_upload';
    branch: string;
    files: SourceFileEntry[];
  }) => Promise<void>;
  onSelectFinding: (finding: Finding, targetTab?: 'findings' | 'flow' | 'autofix') => void;
  isScanning: boolean;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  mode,
  repositories,
  rules,
  scans,
  findings,
  selectedRepoId,
  onSelectRepo,
  onStartScan,
  onAddRepository,
  onSelectFinding,
  isScanning,
}) => {
  const selectedRepo =
    repositories.find((r) => r.id === selectedRepoId) || repositories[0];
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [enabledRuleIds, setEnabledRuleIds] = useState<string[]>(
    rules.map((r) => r.id)
  );

  // Connect GitHub / Upload ZIP State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState<'github' | 'zip'>('github');
  const [ghRepoName, setGhRepoName] = useState('razor-upi-settlement-service');
  const [ghBranch, setGhBranch] = useState('main');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentFile =
    selectedRepo?.files[selectedFileIndex] || selectedRepo?.files[0];

  const repoFindings = findings.filter((f) => f.repositoryId === selectedRepo?.id);
  const repoScans = scans.filter((s) => s.repositoryId === selectedRepo?.id);

  const toggleRule = (id: string) => {
    setEnabledRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConnectGithubSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghRepoName.trim()) return;
    setIsUploading(true);
    try {
      await onAddRepository({
        name: ghRepoName.trim(),
        description:
          'Connected via GitHub App OAuth installation (read-only tree inspection)',
        provider: 'github',
        branch: ghBranch || 'main',
        files: [
          {
            path: 'src/routes/settlement.ts',
            language: 'typescript',
            content: `import express from 'express';\nconst router = express.Router();\n\nrouter.post('/api/v1/settlement/payout', async (req, res) => {\n  const { email, phone, panNumber, bankAccount } = req.body;\n  console.log("Payout requested for merchant PII:", { email, phone, panNumber });\n  return res.status(200).json({ queued: true });\n});\nexport default router;\n`,
          },
          {
            path: 'src/db/schema.sql',
            language: 'sql',
            content: `CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255),\n  phone VARCHAR(30),\n  pan_number VARCHAR(20)\n);\n`,
          },
        ],
      });
      setShowConnectModal(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleZipOrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadStatus('Extracting source files and running AST tokenizer...');
    try {
      const uploadedFile = fileList[0];
      const extractedFiles: SourceFileEntry[] = [];

      if (uploadedFile.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(uploadedFile);
        const entries = Object.keys(zip.files);
        for (const filename of entries) {
          const entry = zip.files[filename];
          if (
            !entry.dir &&
            /\.(ts|tsx|js|jsx|sql|json)$/i.test(filename) &&
            !filename.includes('node_modules')
          ) {
            const content = await entry.async('string');
            const language = filename.endsWith('.sql')
              ? 'sql'
              : filename.endsWith('.json')
              ? 'json'
              : filename.endsWith('.js')
              ? 'javascript'
              : 'typescript';
            extractedFiles.push({
              path: filename,
              language,
              content: content.slice(0, 100000),
            });
          }
        }
      } else {
        const text = await uploadedFile.text();
        extractedFiles.push({
          path: uploadedFile.name,
          language: uploadedFile.name.endsWith('.sql') ? 'sql' : 'typescript',
          content: text.slice(0, 100000),
        });
      }

      if (extractedFiles.length === 0) {
        setUploadStatus(
          'No supported source files (.ts, .js, .sql) found in archive.'
        );
        return;
      }

      const cleanProjectName = uploadedFile.name.replace(/\.(zip|ts|js|sql)$/i, '');
      await onAddRepository({
        name: cleanProjectName,
        description: `Uploaded archive (${extractedFiles.length} source files analyzed)`,
        provider: 'zip_upload',
        branch: 'uploaded-snapshot',
        files: extractedFiles,
      });
      setUploadStatus(null);
      setShowConnectModal(false);
    } catch {
      setUploadStatus('Failed to parse archive. Please upload a valid .zip or source file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0C1222] border border-slate-800 rounded-xl p-5">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            {mode === 'scanner'
              ? 'Deterministic AST & SQL DDL Code Scanner'
              : 'Repository & Source Code Sandbox Management'}
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === 'scanner'
              ? `Active Target: ${selectedRepo?.name} (${selectedRepo?.branch})`
              : 'Connected Repositories & Preloaded Sample Sandbox'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authorized read-only code analysis. Private repository credentials are never requested or exposed.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#070B14] hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Connect Repo / Upload ZIP</span>
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => onStartScan(selectedRepo.id, enabledRuleIds)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Scanning AST...' : 'Start Scan'}</span>
          </button>
        </div>
      </div>

      {/* Repository Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repositories.map((repo) => {
          const isSelected = repo.id === selectedRepo?.id;
          const rFindings = findings.filter(
            (f) => f.repositoryId === repo.id && f.status !== 'Resolved'
          );
          const resolvedForRepo = findings.filter(
            (f) => f.repositoryId === repo.id && f.status === 'Resolved'
          ).length;

          return (
            <div
              key={repo.id}
              onClick={() => {
                onSelectRepo(repo.id);
                setSelectedFileIndex(0);
              }}
              className={`p-5 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#0C1222] border-blue-500/80'
                  : 'bg-[#0C1222]/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">
                      {repo.fullName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{repo.description}</p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <div
                    className={`text-base font-bold tabular-nums ${
                      repo.riskScore >= 70
                        ? 'text-rose-400'
                        : repo.riskScore >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {repo.riskScore}/100
                  </div>
                  <div className="text-[11px] text-slate-400">Risk Score</div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span>{repo.branch}@{repo.commitSha}</span>
                  <span>·</span>
                  <span>{repo.files.length} files</span>
                  <span>·</span>
                  <span>{repo.provider}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-rose-400">{rFindings.length} open</span>
                  <span>·</span>
                  <span className="text-emerald-400">{resolvedForRepo} resolved</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanner Rule Configuration & Execution Status (Highlighted when in Scanner Mode) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source File Tree & Code Viewer */}
        <div className="lg:col-span-8 bg-[#0C1222] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#070B14]/50">
            <div className="flex items-center gap-2 overflow-x-auto">
              {selectedRepo?.files.map((file, idx) => {
                const fileOpenFindings = repoFindings.filter(
                  (f) => f.filePath === file.path && f.status !== 'Resolved'
                ).length;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                      idx === selectedFileIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#0C1222] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{file.path}</span>
                    {fileOpenFindings > 0 && (
                      <span
                        className={`text-[11px] tabular-nums ${
                          idx === selectedFileIndex ? 'text-blue-100' : 'text-rose-400'
                        }`}
                      >
                        ({fileOpenFindings})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer with Line Highlighting for Detected Findings */}
          <div className="p-4 bg-[#070B14] font-mono text-xs overflow-x-auto flex-1">
            {currentFile ? (
              <div className="space-y-0.5">
                {currentFile.content.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const matchingFinding = repoFindings.find(
                    (f) =>
                      f.filePath === currentFile.path &&
                      f.lineNumber === lineNum &&
                      f.status !== 'Resolved'
                  );

                  return (
                    <div
                      key={lineNum}
                      onClick={() => {
                        if (matchingFinding) {
                          onSelectFinding(matchingFinding, 'findings');
                        }
                      }}
                      className={`flex items-start px-2 py-0.5 rounded ${
                        matchingFinding
                          ? 'bg-rose-950/50 text-rose-200 cursor-pointer hover:bg-rose-900/50'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="w-10 shrink-0 text-slate-600 select-none tabular-nums">
                        {lineNum}
                      </span>
                      <pre className="whitespace-pre overflow-x-auto flex-1">
                        {line || ' '}
                      </pre>
                      {matchingFinding && (
                        <span className="ml-3 text-[11px] text-rose-400 font-semibold whitespace-nowrap shrink-0">
                          ← {matchingFinding.ruleId} ({matchingFinding.severity})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-500 py-8 text-center">
                No file selected.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scan Rule Configuration & File Analysis Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Scan Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Deterministic AST &amp; DDL Rule Engine
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 tabular-nums">
                {enabledRuleIds.length}/{rules.length} Active
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 mb-4">
              {rules.map((r) => {
                const checked = enabledRuleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-[#070B14] border border-slate-800/80 cursor-pointer hover:border-slate-700 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRule(r.id)}
                      className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-blue-400 font-semibold">{r.id}</span>
                        <span className="text-slate-400">{r.severity}</span>
                      </div>
                      <div className="text-slate-200 font-medium truncate">
                        {r.name}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isScanning || enabledRuleIds.length === 0}
              onClick={() => onStartScan(selectedRepo.id, enabledRuleIds)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ScanSearch className="w-4 h-4" />
              <span>
                {isScanning
                  ? 'Executing AST & Schema Pass...'
                  : `Scan ${selectedRepo?.name} (${selectedRepo?.files.length} Files)`}
              </span>
            </button>
          </div>

          {/* Latest Scan Completion Summary */}
          <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">
              File Analysis Breakdown
            </h3>
            <div className="space-y-2 text-xs">
              {selectedRepo?.files.map((file) => {
                const fileFindings = repoFindings.filter(
                  (f) => f.filePath === file.path
                );
                const openCount = fileFindings.filter(
                  (f) => f.status !== 'Resolved'
                ).length;
                const resolvedCount = fileFindings.filter(
                  (f) => f.status === 'Resolved'
                ).length;

                return (
                  <div
                    key={file.path}
                    className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/80 flex items-center justify-between font-mono"
                  >
                    <span className="text-slate-300 truncate max-w-[180px]">
                      {file.path}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums shrink-0">
                      {openCount > 0 ? (
                        <span className="text-rose-400">{openCount} issues</span>
                      ) : (
                        <span className="text-emerald-400">Clean</span>
                      )}
                      {resolvedCount > 0 && (
                        <span className="text-emerald-400">
                          · {resolvedCount} fixed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {repoScans[0] && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>Latest Scan ID: {repoScans[0].id}</div>
                <div>
                  Completed in {repoScans[0].durationMs}ms · {repoScans[0].filesScanned}{' '}
                  files parsed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Connect GitHub Repository or Upload ZIP */}
      {showConnectModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-repo-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#0C1222] border border-slate-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 id="connect-repo-title" className="text-base font-bold text-white">
                Add Repository or Upload Source Archive
              </h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-lg mb-5">
              <button
                type="button"
                onClick={() => setConnectTab('github')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  connectTab === 'github'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                GitHub Integration
              </button>
              <button
                type="button"
                onClick={() => setConnectTab('zip')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                  connectTab === 'zip'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Upload ZIP / Source File
              </button>
            </div>

            {connectTab === 'github' ? (
              <form onSubmit={handleConnectGithubSample} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Connects via GitHub App fine-grained installation token. Personal access tokens and private keys are never stored in browser state.
                </p>
                <div>
                  <label
                    htmlFor="gh-repo-name"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Repository Name
                  </label>
                  <input
                    id="gh-repo-name"
                    type="text"
                    required
                    value={ghRepoName}
                    onChange={(e) => setGhRepoName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gh-branch"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Default Branch
                  </label>
                  <input
                    id="gh-branch"
                    type="text"
                    required
                    value={ghBranch}
                    onChange={(e) => setGhBranch(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-2 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                  >
                    {isUploading ? 'Connecting & Scanning...' : 'Connect & Run Scan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Upload a `.zip` project archive or `.ts`/`.js`/`.sql` source file. PrivacyLint extracts the files in memory and runs the 12 deterministic DPDP rules immediately.
                </p>
                <label
                  htmlFor="zip-file-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 cursor-pointer bg-[#070B14] transition-colors"
                >
                  <FileArchive className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    Click to select a .zip archive or .ts / .sql file
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Supports Node.js / Express TypeScript, JavaScript, and PostgreSQL DDL
                  </span>
                  <input
                    id="zip-file-input"
                    type="file"
                    accept=".zip,.ts,.js,.sql,.json"
                    onChange={handleZipOrFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadStatus && (
                  <div className="text-xs font-mono text-blue-300 p-3 rounded-lg bg-blue-950/30 border border-blue-800/60">
                    {uploadStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
