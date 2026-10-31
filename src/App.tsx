/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  FolderGit2,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Network,
  Play,
  ScanSearch,
  Settings,
  Shield,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { RepositoriesView } from './components/RepositoriesView';
import { FindingsView } from './components/FindingsView';
import { PrivacyFlowGraphView } from './components/PrivacyFlowGraphView';
import { AiFixGeneratorView } from './components/AiFixGeneratorView';
import {
  ReportsView,
  SecurityCenterView,
  SettingsView,
} from './components/SecurityAndGovernanceView';
import {
  AuditLogEntry,
  Finding,
  FindingStatus,
  PrivacyFlowGraphData,
  RepositoryProject,
  RoleId,
  RuleDefinition,
  ScanRecord,
  SecurityControlItem,
  SourceFileEntry,
  UserProfile,
} from './engine/types';
import { INITIAL_REPOSITORIES } from './engine/sampleRepositories';
import {
  buildPrivacyFlowGraph,
  RULES,
  scanRepositoryFiles,
} from './engine/scanner';
import { SECURITY_CONTROLS_CATALOG } from './engine/securityControls';

type WorkspaceTab =
  | 'dashboard'
  | 'repositories'
  | 'scanner'
  | 'findings'
  | 'flow'
  | 'autofix'
  | 'security'
  | 'reports'
  | 'settings';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [screen, setScreen] = useState<'landing' | 'auth' | 'workspace'>(
    isAutostart ? 'workspace' : 'landing'
  );
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Core Application State
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr-admin-01',
    email: 'ananya.sharma@bharatpay.in',
    fullName: 'Ananya Sharma',
    role: 'ADMIN',
    roleLabel: 'Organization Admin',
    organizationName: 'BharatPay FinTech Pvt Ltd',
    organizationSlug: 'bharatpay-fintech',
    permissions: [
      'org:manage',
      'users:manage',
      'repo:write',
      'scan:run',
      'finding:write',
      'remediation:approve',
      'security:audit',
    ],
  });
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([currentUser]);
  const [rules, setRules] = useState<RuleDefinition[]>(RULES);
  const [repositories, setRepositories] =
    useState<RepositoryProject[]>(INITIAL_REPOSITORIES);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [findings, setFindings] = useState<Finding[]>(() =>
    scanRepositoryFiles(
      INITIAL_REPOSITORIES[0].id,
      'scan-init',
      INITIAL_REPOSITORIES[0].files
    )
  );
  const [graphsByRepo, setGraphsByRepo] = useState<
    Record<string, PrivacyFlowGraphData>
  >(() => {
    const initialFindings = scanRepositoryFiles(
      INITIAL_REPOSITORIES[0].id,
      'scan-init',
      INITIAL_REPOSITORIES[0].files
    );
    return {
      [INITIAL_REPOSITORIES[0].id]: buildPrivacyFlowGraph(
        INITIAL_REPOSITORIES[0],
        initialFindings
      ),
    };
  });
  const [securityControls, setSecurityControls] = useState<SecurityControlItem[]>(
    SECURITY_CONTROLS_CATALOG
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [aiConfigured, setAiConfigured] = useState<boolean>(false);

  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    INITIAL_REPOSITORIES[0].id
  );
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  const fetchServerState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUser(data.currentUser);
      setAvailableUsers(data.availableUsers);
      setRules(data.rules);
      setRepositories(data.repositories);
      setScans(data.scans);
      setFindings(data.findings);
      setGraphsByRepo(data.graphsByRepo);
      setSecurityControls(data.securityControls);
      setAuditLogs(data.auditLogs);
      setAiConfigured(Boolean(data.aiConfigured));
      if (!selectedFinding && data.findings?.length > 0) {
        setSelectedFinding(data.findings[0]);
      }
    } catch {
      // Keep deterministic local fallback if offline
    }
  }, [selectedFinding]);

  useEffect(() => {
    fetchServerState();
  }, [fetchServerState]);

  const handleStartScan = async (repoId: string, enabledRuleIds?: string[]) => {
    setIsScanning(true);
    setScanToast(null);
    try {
      const res = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId: repoId, enabledRuleIds }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchServerState();
        const repoObj = repositories.find((r) => r.id === repoId);
        setScanToast(
          `Completed deterministic AST & schema scan on ${repoObj?.name || 'repository'}: ${data.scan.totalFindings} open findings (${data.scan.criticalCount} Critical), ${data.scan.resolvedCount} verified resolved.`
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleResetSandbox = async () => {
    await fetch(`/api/repositories/${selectedRepoId}/reset`, {
      method: 'POST',
    });
    await fetchServerState();
    setScanToast('Reset sample repository files back to baseline flawed state.');
  };

  const handleAddRepository = async (payload: {
    name: string;
    description: string;
    provider: 'github' | 'zip_upload';
    branch: string;
    files: SourceFileEntry[];
  }) => {
    const res = await fetch('/api/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchServerState();
      setSelectedRepoId(data.repository.id);
      setScanToast(
        `Connected ${data.repository.name} and detected ${data.findings.length} privacy findings.`
      );
    }
  };

  const handleUpdateFindingStatus = async (
    findingId: string,
    status: FindingStatus
  ): Promise<string | null> => {
    const res = await fetch(`/api/findings/${findingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      await fetchServerState();
      return data.error || 'Permission denied.';
    }
    await fetchServerState();
    return null;
  };

  const handleApplyPatchAndRescan = async (
    findingId: string,
    afterCode?: string
  ) => {
    const res = await fetch('/api/remediation/apply-and-rescan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findingId, afterCode }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchServerState();
      const updatedFinding = data.findings.find((f: Finding) => f.id === findingId);
      if (updatedFinding) {
        setSelectedFinding(updatedFinding);
      }
    }
  };

  const handleSwitchRole = async (role: RoleId) => {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      await fetchServerState();
    }
  };

  const handleSelectFindingAndNavigate = (
    finding: Finding,
    targetTab?: 'findings' | 'flow' | 'autofix'
  ) => {
    setSelectedFinding(finding);
    setSelectedRepoId(finding.repositoryId);
    if (targetTab) {
      setActiveTab(targetTab);
    }
  };

  // Render Landing Page
  if (screen === 'landing') {
    return (
      <LandingPage
        rules={rules}
        onGetStarted={() => {
          setAuthMode('register');
          setScreen('auth');
        }}
        onViewDemo={() => {
          setScreen('workspace');
          setActiveTab('dashboard');
        }}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setScreen('auth');
        }}
      />
    );
  }

  // Render Auth Page
  if (screen === 'auth') {
    return (
      <AuthView
        initialMode={authMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setScreen('workspace');
          setActiveTab('dashboard');
          fetchServerState();
        }}
        onBackToLanding={() => setScreen('landing')}
      />
    );
  }

  const activeRepository =
    repositories.find((r) => r.id === selectedRepoId) || repositories[0];
  const activeGraph =
    graphsByRepo[activeRepository?.id] ||
    buildPrivacyFlowGraph(activeRepository, findings);

  const openCriticalTotal = findings.filter(
    (f) => f.severity === 'Critical' && f.status !== 'Resolved'
  ).length;

  const navItems: {
    id: WorkspaceTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'repositories',
      label: 'Repositories',
      icon: FolderGit2,
      count: repositories.length,
    },
    { id: 'scanner', label: 'Code Scanner', icon: ScanSearch },
    {
      id: 'findings',
      label: 'Findings',
      icon: ShieldAlert,
      count: findings.filter((f) => f.status !== 'Resolved').length,
    },
    { id: 'flow', label: 'Privacy Flow Graph', icon: Network },
    { id: 'autofix', label: 'AI Fix Generator', icon: Wrench },
    { id: 'security', label: 'Security Center', icon: Lock, count: 10 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabTitles: Record<WorkspaceTab, string> = {
    dashboard: 'Main Security & Privacy Dashboard',
    repositories: 'Repository Management',
    scanner: 'Deterministic Code Scanner',
    findings: 'Findings & Vulnerability Triage',
    flow: 'Interactive Privacy Flow Graph',
    autofix: 'AI Fix Generator & Diff Review',
    security: 'Application Security Center',
    reports: 'Compliance & Triage Reports',
    settings: 'Organization & RBAC Settings',
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      {/* Desktop Sidebar Navigation (260px) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#0A0F1D] border-r border-slate-800/80 flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setScreen('landing')}
              className="flex items-center gap-2.5 text-left"
            >
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-base font-bold tracking-tight text-white">
                PrivacyLint
              </span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">v1.2</span>
          </div>

          <nav aria-label="Workspace Sidebar" className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isActive ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Role Footer in Sidebar */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80 text-xs">
            <div className="font-semibold text-white truncate">
              {currentUser.fullName}
            </div>
            <div className="text-[11px] font-mono text-blue-400 mt-0.5">
              {currentUser.roleLabel}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setScreen('landing')}
                className="hover:text-white"
              >
                Landing Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setScreen('auth');
                }}
                className="hover:text-white flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract for Workspace */}
        <header className="sticky top-0 z-20 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden p-1.5 rounded-lg bg-[#0C1222] border border-slate-800 text-slate-300"
            >
              {mobileNavOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            <div className="text-xs font-mono text-slate-400 truncate">
              <span>Workspace</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="text-slate-200 font-semibold font-sans">
                {tabTitles[activeTab]}
              </span>
              <span className="hidden sm:inline mx-2 text-slate-600">/</span>
              <span className="hidden sm:inline text-blue-400">
                {activeRepository?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="top-role-switcher" className="sr-only">
              Active Role
            </label>
            <select
              id="top-role-switcher"
              value={currentUser.role}
              onChange={(e) => handleSwitchRole(e.target.value as RoleId)}
              className="hidden sm:block px-2.5 py-1.5 text-xs bg-[#0C1222] border border-slate-800 rounded-lg text-slate-300 font-mono"
              title="Switch RBAC role to test backend authorization"
            >
              <option value="ADMIN">Role: Admin</option>
              <option value="SECURITY_ANALYST">Role: Security Analyst</option>
              <option value="DEVELOPER">Role: Developer</option>
            </select>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => handleStartScan(selectedRepoId)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>
                {isScanning
                  ? 'Scanning...'
                  : `Scan ${activeRepository?.name} (${openCriticalTotal} Crit)`}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer Navigation */}
        {mobileNavOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="lg:hidden bg-[#0A0F1D] border-b border-slate-800 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#070B14] text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Scan Notification Banner */}
        {scanToast && (
          <div
            role="status"
            className="mx-6 mt-4 px-4 py-2.5 rounded-lg bg-blue-950/60 border border-blue-700/80 text-xs text-blue-200 flex items-center justify-between gap-4"
          >
            <span>{scanToast}</span>
            <button
              type="button"
              onClick={() => setScanToast(null)}
              className="text-blue-400 hover:text-white text-xs font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Workspace View */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              repositories={repositories}
              scans={scans}
              findings={findings}
              selectedRepoId={selectedRepoId}
              onSelectRepo={setSelectedRepoId}
              onStartScan={(id) => handleStartScan(id)}
              onResetSandbox={handleResetSandbox}
              onSelectFinding={handleSelectFindingAndNavigate}
              onNavigateTab={(t) => setActiveTab(t as WorkspaceTab)}
              isScanning={isScanning}
            />
          )}

          {(activeTab === 'repositories' || activeTab === 'scanner') && (
            <RepositoriesView
              mode={activeTab}
              repositories={repositories}
              rules={rules}
              scans={scans}
              findings={findings}
              selectedRepoId={selectedRepoId}
              onSelectRepo={setSelectedRepoId}
              onStartScan={handleStartScan}
              onAddRepository={handleAddRepository}
              onSelectFinding={handleSelectFindingAndNavigate}
              isScanning={isScanning}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsView
              findings={findings}
              repositories={repositories}
              selectedFinding={selectedFinding}
              currentUser={currentUser}
              onSelectFinding={handleSelectFindingAndNavigate}
              onUpdateStatus={handleUpdateFindingStatus}
            />
          )}

          {activeTab === 'flow' && (
            <PrivacyFlowGraphView
              repository={activeRepository}
              graph={activeGraph}
              findings={findings}
              selectedFinding={selectedFinding}
              onSelectFinding={handleSelectFindingAndNavigate}
            />
          )}

          {activeTab === 'autofix' && (
            <AiFixGeneratorView
              findings={findings.filter(
                (f) => f.repositoryId === activeRepository?.id
              )}
              selectedFinding={selectedFinding}
              onSelectFinding={(f) => setSelectedFinding(f)}
              onApplyPatchAndRescan={handleApplyPatchAndRescan}
            />
          )}

          {activeTab === 'security' && (
            <SecurityCenterView
              controls={securityControls}
              auditLogs={auditLogs}
              onRefreshState={fetchServerState}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              repositories={repositories}
              scans={scans}
              findings={findings}
              graphsByRepo={graphsByRepo}
              selectedRepoId={selectedRepoId}
              onSelectRepo={setSelectedRepoId}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              availableUsers={availableUsers}
              aiConfigured={aiConfigured}
              onSwitchRole={handleSwitchRole}
            />
          )}
        </main>
      </div>
    </div>
  );
}
