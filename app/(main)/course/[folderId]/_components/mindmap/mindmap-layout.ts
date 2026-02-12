// ──────────────────────────────────────────────────────
// mindmap-layout.ts — Flatten recursive tree → React Flow nodes/edges
// Uses dagre for automatic collision-free positioning
// ──────────────────────────────────────────────────────

import dagre from "dagre";
import type {
  MindmapNodeResponse,
  MindmapFlowNode,
  MindmapFlowEdge,
  MindmapNodeData,
  LayoutDirection,
} from "./types";

/* ---------- Constants ---------- */

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;
const RANK_SEP = 100; // vertical gap between levels
const NODE_SEP = 40; // horizontal gap between siblings

/* ---------- Depth-based colour palette ---------- */

const DEPTH_COLORS: string[] = [
  "var(--primary)",       // depth 0 — root
  "var(--ring)",          // depth 1
  "var(--accent)",        // depth 2
  "var(--secondary)",     // depth 3
  "var(--muted)",         // depth 4+
];

export function getDepthColor(depth: number): string {
  return DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
}

/* ---------- Recursive tree → flat arrays ---------- */

interface FlattenResult {
  nodes: MindmapFlowNode[];
  edges: MindmapFlowEdge[];
}

function flattenTree(
  node: MindmapNodeResponse,
  parentId: string | null,
  depth: number,
  pathPrefix: string
): FlattenResult {
  const id = pathPrefix;

  const data: MindmapNodeData = {
    label: node.title,
    description: node.description,
    depth,
    docType: node.metadata?.doc_type,
    fileId: node.metadata?.file_id,
    fileCount: node.metadata?.file_count as number | undefined,
    childCount: node.children.length,
    isLeaf: node.children.length === 0,
  };

  const flowNode: MindmapFlowNode = {
    id,
    type: "mindmap",
    data,
    position: { x: 0, y: 0 }, // dagre will overwrite
  };

  const nodes: MindmapFlowNode[] = [flowNode];
  const edges: MindmapFlowEdge[] = [];

  if (parentId) {
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: "smoothstep",
      animated: depth <= 1,
      style: {
        stroke: "var(--border)",
        strokeWidth: Math.max(2.5 - depth * 0.5, 1),
      },
    });
  }

  node.children.forEach((child, index) => {
    const childResult = flattenTree(
      child,
      id,
      depth + 1,
      `${pathPrefix}-${index}`
    );
    nodes.push(...childResult.nodes);
    edges.push(...childResult.edges);
  });

  return { nodes, edges };
}

/* ---------- dagre layout pass ---------- */

function applyDagreLayout(
  nodes: MindmapFlowNode[],
  edges: MindmapFlowEdge[],
  direction: LayoutDirection
): MindmapFlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction,
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

/* ---------- Public API ---------- */

export interface LayoutResult {
  nodes: MindmapFlowNode[];
  edges: MindmapFlowEdge[];
}

/**
 * Converts a recursive `MindmapNodeResponse` tree into flat arrays
 * of positioned React Flow nodes & edges.
 */
export function layoutElements(
  root: MindmapNodeResponse,
  direction: LayoutDirection = "TB"
): LayoutResult {
  const { nodes, edges } = flattenTree(root, null, 0, "root");
  const positionedNodes = applyDagreLayout(nodes, edges, direction);
  return { nodes: positionedNodes, edges };
}

export { NODE_WIDTH, NODE_HEIGHT };
