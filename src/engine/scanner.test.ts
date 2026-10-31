import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_REPOSITORIES } from './sampleRepositories';
import {
  applyBoundedPatchToFiles,
  buildPrivacyFlowGraph,
  calculateRiskScore,
  RULES,
  scanRepositoryFiles,
} from './scanner';

test('Rules catalog contains all 12 MVP DPDP privacy detection rules', () => {
  assert.equal(RULES.length, 12);
  const ruleIds = RULES.map((r) => r.id);
  for (let i = 1; i <= 12; i++) {
    const expectedId = `PL-DPDP-${String(i).padStart(3, '0')}`;
    assert.ok(ruleIds.includes(expectedId), `Missing expected rule ${expectedId}`);
  }
});

test('Deterministic scanner detects all 12 privacy findings in preloaded BharatPay sample repository', () => {
  const sampleRepo = INITIAL_REPOSITORIES[0];
  const findings = scanRepositoryFiles(sampleRepo.id, 'scan-unit-test-1', sampleRepo.files);

  assert.equal(findings.length, 12, 'Should detect all 12 seeded flaws across the 5 repository files');

  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  assert.equal(criticalCount, 4, 'Should identify 4 Critical findings (PL-DPDP-001, 002, 009, 011)');

  // Verify exact file and line references are populated
  for (const f of findings) {
    assert.ok(f.filePath.length > 0, `Finding ${f.id} missing filePath`);
    assert.ok(f.lineNumber >= 1, `Finding ${f.id} has invalid lineNumber ${f.lineNumber}`);
    assert.ok(f.codeEvidence.length > 0, `Finding ${f.id} missing codeEvidence`);
    assert.ok(f.deterministicPatch.beforeCode.length > 0, `Finding ${f.id} missing beforeCode`);
    assert.ok(f.deterministicPatch.afterCode.length > 0, `Finding ${f.id} missing afterCode`);
  }
});

test('Applying a bounded code patch and re-scanning deterministically eliminates the fixed vulnerability and lowers Risk Score', () => {
  const sampleRepo = INITIAL_REPOSITORIES[0];
  const initialFindings = scanRepositoryFiles(sampleRepo.id, 'scan-before', sampleRepo.files);
  const initialScore = calculateRiskScore(initialFindings);

  const logFinding = initialFindings.find((f) => f.ruleId === 'PL-DPDP-002');
  assert.ok(logFinding, 'PL-DPDP-002 finding should exist before patch');

  const { updatedFiles, applied } = applyBoundedPatchToFiles(
    sampleRepo.files,
    logFinding.filePath,
    logFinding.deterministicPatch.beforeCode,
    logFinding.deterministicPatch.afterCode
  );
  assert.equal(applied, true, 'Patch should cleanly apply to target file');

  const rescanFindings = scanRepositoryFiles(sampleRepo.id, 'scan-after', updatedFiles);
  assert.equal(rescanFindings.length, 11, 'Re-scan should have 1 fewer open finding after applying patch');
  assert.equal(
    rescanFindings.some((f) => f.ruleId === 'PL-DPDP-002'),
    false,
    'PL-DPDP-002 should no longer trigger after redaction patch is applied'
  );

  const updatedScore = calculateRiskScore(rescanFindings);
  assert.ok(updatedScore <= initialScore, 'Risk score should decrease or stay bounded after resolving finding');
});

test('Privacy Flow Graph builder constructs 4-column DAG with routes, controllers, databases, and sinks', () => {
  const sampleRepo = INITIAL_REPOSITORIES[0];
  const findings = scanRepositoryFiles(sampleRepo.id, 'scan-graph', sampleRepo.files);
  const graph = buildPrivacyFlowGraph(sampleRepo, findings);

  assert.equal(graph.summary.totalRoutes, 4);
  assert.equal(graph.summary.totalControllers, 4);
  assert.equal(graph.summary.totalDbFields, 3);
  assert.equal(graph.summary.totalExternalSinks, 4);
  assert.ok(graph.summary.riskyFlowCount > 0, 'Graph should highlight risky PII flows');
  assert.ok(graph.summary.detectedPiiTypes.includes('pan_number'));
  assert.ok(graph.summary.detectedPiiTypes.includes('aadhaar_number'));
});
