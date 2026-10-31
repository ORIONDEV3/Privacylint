export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type FindingStatus = 'Open' | 'In Progress' | 'Resolved';

export type RoleId = 'ADMIN' | 'SECURITY_ANALYST' | 'DEVELOPER';

export interface RuleDefinition {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  dpdpReference: string;
  description: string;
  detectionLogic: string;
  affectedSinkType: string;
  remediationSummary: string;
}

export interface SourceFileEntry {
  path: string;
  language: 'typescript' | 'javascript' | 'sql' | 'json';
  content: string;
}

export interface Finding {
  id: string;
  scanId: string;
  repositoryId: string;
  ruleId: string;
  ruleName: string;
  category: string;
  dpdpReference: string;
  severity: Severity;
  status: FindingStatus;
  filePath: string;
  lineNumber: number;
  endLineNumber: number;
  codeEvidence: string;
  explanation: string;
  affectedRoute: string;
  relatedDbField: string;
  piiFields: string[];
  recommendedFix: string;
  deterministicPatch: {
    beforeCode: string;
    afterCode: string;
    unifiedDiff: string;
    explanation: string;
  };
  detectedAt: string;
}

export interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  type: 'route' | 'controller' | 'database' | 'sink';
  riskLevel: Severity | 'Safe';
  piiFields: string[];
  filePath?: string;
  lineNumber?: number;
  findingIds: string[];
  column: number; // 0 = Route, 1 = Controller, 2 = Database, 3 = Logger/External Sink
  row: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  piiFields: string[];
  isRisky: boolean;
  severity: Severity | 'Safe';
  findingId?: string;
}

export interface PrivacyFlowGraphData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  summary: {
    totalRoutes: number;
    totalControllers: number;
    totalDbFields: number;
    totalExternalSinks: number;
    riskyFlowCount: number;
    detectedPiiTypes: string[];
  };
}

export interface ScanRecord {
  id: string;
  repositoryId: string;
  repositoryName: string;
  branch: string;
  commitSha: string;
  triggeredBy: string;
  status: 'Completed' | 'Running' | 'Failed';
  filesScanned: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  resolvedCount: number;
  riskScore: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface RepositoryProject {
  id: string;
  name: string;
  fullName: string;
  description: string;
  provider: 'sample_sandbox' | 'github' | 'zip_upload';
  branch: string;
  commitSha: string;
  framework: string;
  lastScanAt: string;
  riskScore: number;
  files: SourceFileEntry[];
}

export interface RemediationResponse {
  findingId: string;
  source: 'GEMINI_BOUNDED_PATCH' | 'DETERMINISTIC_TEMPLATE';
  modelUsed: string;
  issueSummary: string;
  securityImpact: string;
  beforeCode: string;
  afterCode: string;
  unifiedDiff: string;
  verificationSteps: string[];
  generatedAt: string;
}

export interface SecurityControlItem {
  id: string;
  number: number;
  name: string;
  category: string;
  status: 'Implemented' | 'Needs Configuration' | 'Not Implemented' | 'Not Verified';
  riskLevel: 'Low' | 'Medium' | 'High';
  description: string;
  verificationEvidence: string;
  codeLocation: string;
  recommendedAction: string;
  liveVerified: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: RoleId;
  roleLabel: string;
  organizationName: string;
  organizationSlug: string;
  permissions: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: RoleId;
  action: string;
  targetResource: string;
  ipHash: string;
  status: 'SUCCESS' | 'DENIED';
}
