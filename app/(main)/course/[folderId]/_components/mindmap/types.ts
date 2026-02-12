// ─────────────────────────────────────────────────────
// Mindmap Types — API response & internal graph types
// ─────────────────────────────────────────────────────

import type { Node, Edge } from "@xyflow/react";

/* ---------- API Response ---------- */

export type MindmapNodeResponse = {
  title: string;
  description: string;
  children: MindmapNodeResponse[];
  metadata: {
    file_id?: string;
    doc_type?: string;
    file_count?: number;
    [key: string]: unknown;
  };
};

export type MindmapResponse = {
  root: MindmapNodeResponse;
  total_files: number;
  generated_at?: string;
  context: string;
};

/* ---------- Internal Node Data ---------- */

export type MindmapNodeData = {
  label: string;
  description: string;
  depth: number;
  docType?: string;
  fileId?: string;
  fileCount?: number;
  childCount: number;
  isLeaf: boolean;
};

/* ---------- React Flow Typed Aliases ---------- */

export type MindmapFlowNode = Node<MindmapNodeData, "mindmap">;
export type MindmapFlowEdge = Edge;

/* ---------- Layout Direction ---------- */

export type LayoutDirection = "TB" | "LR";

/* ---------- Mindmap target (folder OR conversation) ---------- */

export type MindmapTarget =
  | { type: "folder"; id: string }
  | { type: "conversation"; id: string };

/* ---------- Component Props ---------- */

export interface MindmapViewerProps {
  /** Which entity to fetch/generate the mindmap for */
  target: MindmapTarget;
  /** Optional class name for the wrapper */
  className?: string;
  /** Whether the mindmap is interactive (zoom, pan, drag). Default: true */
  isInteractive?: boolean;
}

/* ---------- Legacy compat ---------- */

/** @deprecated Use MindmapViewerProps instead */
export interface MindmapCanvasProps {
  folderId: string;
  className?: string;
}
