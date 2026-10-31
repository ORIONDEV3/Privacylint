import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  FileCode2,
  Globe,
  Network,
  Radio,
  Wrench,
} from 'lucide-react';
import {
  Finding,
  FlowEdge,
  FlowNode,
  PrivacyFlowGraphData,
  RepositoryProject,
} from '../engine/types';

interface PrivacyFlowGraphViewProps {
  repository: RepositoryProject;
  graph: PrivacyFlowGraphData;
  findings: Finding[];
  selectedFinding: Finding | null;
  onSelectFinding: (finding: Finding, targetTab?: 'findings' | 'flow' | 'autofix') => void;
}

const COLUMN_TITLES = [
  '01. API Route / Entry',
  '02. Controller / Handler',
  '03. Database / Storage',
  '04. Logger / External Sink',
];

export const PrivacyFlowGraphView: React.FC<PrivacyFlowGraphViewProps> = ({
  repository,
  graph,
  findings,
  selectedFinding,
  onSelectFinding,
}) => {
  const [onlyRiskyFlows, setOnlyRiskyFlows] = useState(false);
  const [selectedPiiFilter, setSelectedPiiFilter] = useState<string>('ALL');
  const [activeNodeId, setActiveNodeId] = useState<string>(
    selectedFinding
      ? graph.nodes.find((n) => n.filePath === selectedFinding.filePath)?.id ||
          graph.nodes[0]?.id
      : graph.nodes[0]?.id || 'route-checkout'
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const visibleEdges = useMemo(() => {
    return graph.edges.filter((edge) => {
      if (onlyRiskyFlows && !edge.isRisky) return false;
      if (
        selectedPiiFilter !== 'ALL' &&
        !edge.piiFields.includes(selectedPiiFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [graph.edges, onlyRiskyFlows, selectedPiiFilter]);

  const activeNode: FlowNode | undefined = useMemo(
    () =>
      graph.nodes.find((n) => n.id === (hoveredNodeId || activeNodeId)) ||
      graph.nodes[0],
    [graph.nodes, hoveredNodeId, activeNodeId]
  );

  const linkedFindings = useMemo(() => {
    if (!activeNode) return [];
    return findings.filter(
      (f) =>
        f.repositoryId === repository.id &&
        (activeNode.findingIds.includes(f.id) || f.filePath === activeNode.filePath)
    );
  }, [activeNode, findings, repository.id]);

  // Fixed coordinate layout for the 4-column interactive SVG canvas (920 x 420 viewBox)
  const getNodeCoords = (node: FlowNode) => {
    const x = 104 + node.column * 236;
    const y = 74 + node.row * 94;
    return { x, y };
  };

  const nodeMap = useMemo(() => {
    const m = new Map<string, FlowNode>();
    graph.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graph.nodes]);

  return (
    <div className="space-y-6">
      {/* Top Summary & Controls */}
      <div className="bg-[#0C1222] border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-1">
            Interactive Personal Data Lineage · {repository.fullName}
          </div>
          <h2 className="text-lg font-bold text-white">
            API Route → Controller → Database Field → Logger / External Service
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click or hover any node in the graph to inspect detected PII fields, source code lines, and linked privacy findings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="flow-pii-select"
            className="text-xs text-slate-400 font-medium"
          >
            Filter by PII Attribute:
          </label>
          <select
            id="flow-pii-select"
            value={selectedPiiFilter}
            onChange={(e) => setSelectedPiiFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#070B14] border border-slate-800 rounded-lg text-slate-200 font-mono"
          >
            <option value="ALL">All Detected PII Fields ({graph.summary.detectedPiiTypes.length})</option>
            {graph.summary.detectedPiiTypes.map((pii) => (
              <option key={pii} value={pii}>
                {pii}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyRiskyFlows((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              onlyRiskyFlows
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-[#070B14] border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {onlyRiskyFlows ? 'Showing Risky Flows Only' : 'Highlight Risky Flows'}
          </button>
        </div>
      </div>

      {/* Main Graph & Node Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Directed Graph Canvas */}
        <div className="lg:col-span-8 bg-[#0C1222] border border-slate-800 rounded-xl p-4">
          <div className="grid grid-cols-4 gap-2 pb-3 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
            {COLUMN_TITLES.map((title) => (
              <div key={title} className="text-center font-semibold text-slate-300 truncate px-1">
                {title}
              </div>
            ))}
          </div>

          <svg
            viewBox="0 0 920 420"
            className="w-full h-[420px] bg-[#070B14] rounded-lg border border-slate-800/80 select-none"
            role="img"
            aria-label="Interactive Privacy Data Flow Graph from API routes to controllers, database fields, and external sinks"
          >
            <defs>
              <marker
                id="arrow-risky"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#F43F5E" />
              </marker>
              <marker
                id="arrow-safe"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#10B981" />
              </marker>
            </defs>

            {/* Directional Edges */}
            {visibleEdges.map((edge: FlowEdge) => {
              const src = nodeMap.get(edge.source);
              const dst = nodeMap.get(edge.target);
              if (!src || !dst) return null;

              const { x: x1, y: y1 } = getNodeCoords(src);
              const { x: x2, y: y2 } = getNodeCoords(dst);
              const startX = x1 + 88;
              const endX = x2 - 92;
              const midX = (startX + endX) / 2;
              const d = `M ${startX} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${endX} ${y2}`;

              const isHighlighted =
                activeNode?.id === edge.source || activeNode?.id === edge.target;

              return (
                <g key={edge.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={edge.isRisky ? '#F43F5E' : '#10B981'}
                    strokeWidth={isHighlighted ? 2.6 : 1.7}
                    strokeDasharray={edge.isRisky ? '5,3' : undefined}
                    markerEnd={
                      edge.isRisky ? 'url(#arrow-risky)' : 'url(#arrow-safe)'
                    }
                    opacity={isHighlighted ? 1 : 0.75}
                  />
                </g>
              );
            })}

            {/* Interactive Graph Nodes */}
            {graph.nodes.map((node) => {
              const { x, y } = getNodeCoords(node);
              const isSelected = activeNode?.id === node.id;

              const strokeColor =
                node.riskLevel === 'Critical'
                  ? '#F43F5E'
                  : node.riskLevel === 'High'
                  ? '#F59E0B'
                  : node.riskLevel === 'Safe'
                  ? '#10B981'
                  : '#3B82F6';

              return (
                <g
                  key={node.id}
                  transform={`translate(${x - 88}, ${y - 31})`}
                  onClick={() => setActiveNodeId(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer"
                >
                  <rect
                    width="176"
                    height="62"
                    rx="8"
                    fill={isSelected ? '#131E38' : '#0C1222'}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 2.2 : 1.2}
                  />
                  <text
                    x="10"
                    y="20"
                    fill="#94A3B8"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.type.toUpperCase()} · {node.riskLevel.toUpperCase()}
                  </text>
                  <text
                    x="10"
                    y="37"
                    fill="#F8FAFC"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {node.label.length > 24
                      ? `${node.label.slice(0, 23)}…`
                      : node.label}
                  </text>
                  <text
                    x="10"
                    y="53"
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    PII: {node.piiFields.slice(0, 2).join(', ')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-6">
              <span>--- Dashed Crimson Edge: Unprotected / Unconsented PII Sink</span>
              <span>─── Solid Emerald Edge: Verified Safe / Redacted Flow</span>
            </div>
            <span>
              {graph.summary.riskyFlowCount} Risky Edges ·{' '}
              {graph.summary.detectedPiiTypes.length} PII Attributes
            </span>
          </div>
        </div>

        {/* Right Node Details & Linked Findings Inspector */}
        <div className="lg:col-span-4 bg-[#0C1222] border border-slate-800 rounded-xl p-5 space-y-5">
          {activeNode && (
            <>
              <div className="pb-4 border-b border-slate-800">
                <div className="text-xs font-mono text-blue-400 mb-1">
                  Selected Node · {activeNode.type.toUpperCase()}
                </div>
                <h3 className="text-base font-bold text-white">
                  {activeNode.label}
                </h3>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {activeNode.sublabel}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1.5">
                  Personal Data Fields Flowing Through Node:
                </div>
                <div className="font-mono text-xs text-amber-300 bg-[#070B14] border border-slate-800 rounded-lg p-3">
                  {activeNode.piiFields.join(' · ')}
                </div>
              </div>

              {activeNode.filePath && (
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 text-xs font-mono">
                  <div className="text-slate-400">Source Location:</div>
                  <div className="text-slate-200 mt-0.5 tabular-nums">
                    {activeNode.filePath}:{activeNode.lineNumber}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold text-white mb-2">
                  Linked Privacy &amp; Security Findings ({linkedFindings.length})
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {linkedFindings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg bg-[#070B14] border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-blue-400 font-semibold">
                          {f.ruleId}
                        </span>
                        <span
                          className={
                            f.status === 'Resolved'
                              ? 'text-emerald-400'
                              : f.severity === 'Critical'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }
                        >
                          {f.severity} · {f.status}
                        </span>
                      </div>
                      <div className="font-medium text-white">{f.ruleName}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => onSelectFinding(f, 'findings')}
                          className="text-slate-400 hover:text-white text-[11px]"
                        >
                          Inspect Evidence
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectFinding(f, 'autofix')}
                          className="text-blue-400 hover:text-blue-300 font-medium text-[11px] flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Generate Fix</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
