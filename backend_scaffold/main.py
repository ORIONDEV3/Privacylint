"""
PrivacyLint — Python FastAPI + Tree-sitter + NetworkX Reference Backend Scaffold
================================================================================
Architecture Principle:
Deterministic Detection (Tree-sitter AST) -> Rule Engine (rules.json) -> NetworkX Data Flow Graph -> Bounded AI Explanation
"""

import os
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import networkx as nx

app = FastAPI(
    title="PrivacyLint Core Analysis Engine API",
    version="1.2.0",
    description="Deterministic AST privacy analysis, NetworkX data-flow graph builder, and bounded remediation service."
)

ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-PrivacyLint-Role"],
)


class ScanRequestPayload(BaseModel):
    repository_id: str = Field(..., min_length=3, max_length=64)
    branch: str = Field(default="main", max_length=64)
    enabled_rule_ids: Optional[List[str]] = None


class FlowNode(BaseModel):
    id: str
    label: str
    node_type: str  # 'route' | 'controller' | 'database' | 'sink'
    pii_fields: List[str]
    risk_level: str


def build_privacy_flow_digraph(findings: List[dict]) -> dict:
    """
    Constructs a directed data-flow graph (API Route -> Controller -> Database Field -> Logger / External Sink)
    using NetworkX and computes high-risk PII exfiltration paths.
    """
    graph = nx.DiGraph()
    for f in findings:
        route_node = f.get("affectedRoute") or "POST /api/v1/checkout"
        ctrl_node = f["filePath"]
        db_node = f.get("relatedDbField") or "users.pii_record"
        sink_node = f["ruleId"]

        graph.add_node(route_node, kind="route")
        graph.add_node(ctrl_node, kind="controller")
        graph.add_node(db_node, kind="database")
        graph.add_node(sink_node, kind="sink", severity=f["severity"])

        graph.add_edge(route_node, ctrl_node, pii=f.get("piiFields", []))
        graph.add_edge(ctrl_node, db_node, pii=f.get("piiFields", []))
        graph.add_edge(ctrl_node, sink_node, pii=f.get("piiFields", []), risky=True)

    return {
        "node_count": graph.number_of_nodes(),
        "edge_count": graph.number_of_edges(),
        "is_dag": nx.is_directed_acyclic_graph(graph),
    }
