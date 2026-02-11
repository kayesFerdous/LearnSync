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

/* ---------- Component Props ---------- */

export interface MindmapCanvasProps {
  /** Unique course / folder ID used to fetch the mindmap */
  folderId: string;
  /** Optional class name for the wrapper */
  className?: string;
}
