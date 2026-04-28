"use client";

// ──────────────────────────────────────────────────────
// MindmapNode — Custom glassmorphic node for React Flow
// ──────────────────────────────────────────────────────

import React, { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  FileText,
  Video,
  Link2,
  Presentation,
  BookOpen,
  FolderOpen,
  Image,
  Music,
  Code,
  Globe,
  Sparkles,
  ChevronRight,
  File,
} from "lucide-react";
import type { MindmapNodeData, MindmapFlowNode } from "./types";
import { cn } from "@/lib/utils";
import { NODE_WIDTH } from "./mindmap-layout";

/* ---------- doc_type → icon ---------- */

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  "Lecture Slides": Presentation,
  "Lecture Notes": BookOpen,
  pdf: FileText,
  video: Video,
  link: Link2,
  image: Image,
  audio: Music,
  code: Code,
  html: Globe,
  markdown: FileText,
  folder: FolderOpen,
};

function getIconType(docType?: string): string {
  if (!docType) return "sparkles";
  const key = Object.keys(DOC_TYPE_ICONS).find(
    (k) => docType.toLowerCase().includes(k.toLowerCase())
  );
  return key || "file";
}

function renderIconByType(iconType: string, size: number, strokeWidth: number) {
  const iconProps = { size, strokeWidth };
  switch (iconType) {
    case "Lecture Slides": return <Presentation {...iconProps} />;
    case "Lecture Notes": return <BookOpen {...iconProps} />;
    case "pdf": return <FileText {...iconProps} />;
    case "video": return <Video {...iconProps} />;
    case "link": return <Link2 {...iconProps} />;
    case "image": return <Image {...iconProps} />;
    case "audio": return <Music {...iconProps} />;
    case "code": return <Code {...iconProps} />;
    case "html": return <Globe {...iconProps} />;
    case "markdown": return <FileText {...iconProps} />;
    case "folder": return <FolderOpen {...iconProps} />;
    case "sparkles": return <Sparkles {...iconProps} />;
    default: return <File {...iconProps} />;
  }
}

/* ---------- Depth-based visual tiers ---------- */

interface DepthStyle {
  ring: string;
  bg: string;
  glow: string;
  iconBg: string;
  iconFg: string;
  badge: string;
}

function depthStyle(depth: number): DepthStyle {
  const tiers: DepthStyle[] = [
    // Root — bold primary accent
    {
      ring: "ring-[color:var(--primary)]/60",
      bg: "bg-[color:var(--primary)]/[0.06]",
      glow: "shadow-[0_0_32px_-4px_var(--primary)]",
      iconBg: "bg-[color:var(--primary)]",
      iconFg: "text-[color:var(--primary-foreground)]",
      badge: "bg-[color:var(--primary)]/10 text-[color:var(--primary)]",
    },
    // Level 1 — ring accent
    {
      ring: "ring-[color:var(--ring)]/50",
      bg: "bg-[color:var(--ring)]/[0.05]",
      glow: "shadow-[0_0_24px_-6px_var(--ring)]",
      iconBg: "bg-[color:var(--ring)]/15",
      iconFg: "text-[color:var(--ring)]",
      badge: "bg-[color:var(--ring)]/10 text-[color:var(--ring)]",
    },
    // Level 2 — accent tone
    {
      ring: "ring-[color:var(--accent)]/40",
      bg: "bg-[color:var(--accent)]/[0.06]",
      glow: "shadow-[0_0_18px_-6px_var(--accent)]",
      iconBg: "bg-[color:var(--accent)]/20",
      iconFg: "text-[color:var(--accent-foreground)]",
      badge: "bg-[color:var(--accent)]/15 text-[color:var(--accent-foreground)]",
    },
    // Level 3+ — muted
    {
      ring: "ring-[color:var(--border)]",
      bg: "bg-[color:var(--muted)]/50",
      glow: "",
      iconBg: "bg-[color:var(--muted)]",
      iconFg: "text-[color:var(--muted-foreground)]",
      badge: "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]",
    },
  ];

  return tiers[Math.min(depth, tiers.length - 1)];
}

/* ---------- Component ---------- */

function MindmapNodeInner({ data, selected }: NodeProps<MindmapFlowNode>) {
  const { label, description, depth, docType, fileId, childCount, isLeaf } = data;
  const iconType = getIconType(docType);
  const style = depthStyle(depth);

  const isClickable = !!fileId;
  const truncatedDesc =
    description.length > 80 ? `${description.slice(0, 77)}…` : description;

  return (
    <>
      {/* Incoming handle */}
      {depth > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !rounded-full !border-2 !border-[color:var(--border)] !bg-[color:var(--card)]"
        />
      )}

      {/* Card */}
      <div
        className={cn(
          // Glassmorphism base
          "relative rounded-xl backdrop-blur-xl border border-[color:var(--border)]/60",
          "bg-[color:var(--card)]/80",
          "transition-all duration-200 ease-out",
          "ring-1 ring-inset",
          style.ring,
          style.bg,
          // Hover
          "hover:scale-[1.04] hover:shadow-lg hover:border-[color:var(--ring)]/40",
          // Selected
          selected && "ring-2 ring-[color:var(--ring)] scale-[1.03] shadow-lg",
          // Glow on root / L1
          depth <= 1 && style.glow,
          // Clickable cursor
          isClickable && "cursor-pointer"
        )}
        style={{ width: NODE_WIDTH, minHeight: 88 }}
      >
        {/* Inner padding */}
        <div className="p-3.5 flex flex-col gap-2">
          {/* ── Header row ── */}
          <div className="flex items-start gap-2.5">
            {/* Icon badge */}
            <div
              className={cn(
                "shrink-0 flex items-center justify-center rounded-lg",
                "w-8 h-8",
                style.iconBg,
                style.iconFg
              )}
            >
              {renderIconByType(iconType, 16, 2)}
            </div>

            {/* Title + metadata */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-sm leading-tight text-[color:var(--card-foreground)] truncate",
                  depth === 0 && "text-[15px]"
                )}
              >
                {label}
              </h3>

              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-1">
                {docType && (
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                      style.badge
                    )}
                  >
                    {docType}
                  </span>
                )}
                {childCount > 0 && (
                  <span className="inline-flex items-center text-[10px] text-[color:var(--muted-foreground)] font-medium">
                    {childCount} {childCount === 1 ? "child" : "children"}
                  </span>
                )}
              </div>
            </div>

            {/* Navigate arrow for clickable nodes */}
            {isClickable && (
              <div className="shrink-0 mt-0.5 text-[color:var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} />
              </div>
            )}
          </div>

          {/* ── Description ── */}
          {truncatedDesc && (
            <p className="text-[11px] leading-relaxed text-[color:var(--muted-foreground)] line-clamp-2 pl-[42px]">
              {truncatedDesc}
            </p>
          )}
        </div>

        {/* Subtle inner highlight for depth 0 */}
        {depth === 0 && (
          <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[color:var(--primary)]/[0.08] to-transparent rotate-12" />
          </div>
        )}
      </div>

      {/* Outgoing handle */}
      {!isLeaf && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2 !h-2 !rounded-full !border-2 !border-[color:var(--border)] !bg-[color:var(--card)]"
        />
      )}
    </>
  );
}

export const MindmapNode = memo(MindmapNodeInner);
