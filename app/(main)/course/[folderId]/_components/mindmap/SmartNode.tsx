"use client";

// ──────────────────────────────────────────────────────
// SmartNode — High-end Notion-style React Flow node
// with hover toolbar (Chat, Expand, Delete)
// ──────────────────────────────────────────────────────

import React, { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
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
    File,
    MessageSquare,
    Maximize2,
    Trash2,
} from "lucide-react";
import type { MindmapNodeData, MindmapFlowNode } from "./types";
import { cn } from "@/lib/utils";
import { NODE_WIDTH } from "./mindmap-layout";
import { useWorkspaceStore } from "@/lib/store";

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

function getIcon(docType?: string): React.ElementType {
    if (!docType) return Sparkles;
    const key = Object.keys(DOC_TYPE_ICONS).find(
        (k) => docType.toLowerCase().includes(k.toLowerCase())
    );
    return key ? DOC_TYPE_ICONS[key] : File;
}

/* ---------- Depth-based visual tiers ---------- */

interface DepthStyle {
    ring: string;
    bg: string;
    glow: string;
    iconBg: string;
    iconFg: string;
    badge: string;
    accentLine: string;
}

function depthStyle(depth: number): DepthStyle {
    const tiers: DepthStyle[] = [
        // Root — bold primary accent
        {
            ring: "ring-[color:var(--primary)]/40",
            bg: "bg-[color:var(--card)]/90",
            glow: "shadow-[0_0_40px_-8px_var(--primary)]",
            iconBg: "bg-[color:var(--primary)]",
            iconFg: "text-[color:var(--primary-foreground)]",
            badge: "bg-[color:var(--primary)]/10 text-[color:var(--primary)]",
            accentLine: "bg-[color:var(--primary)]",
        },
        // Level 1 — ring accent
        {
            ring: "ring-[color:var(--ring)]/30",
            bg: "bg-[color:var(--card)]/85",
            glow: "shadow-[0_0_28px_-8px_var(--ring)]",
            iconBg: "bg-[color:var(--ring)]/15",
            iconFg: "text-[color:var(--ring)]",
            badge: "bg-[color:var(--ring)]/10 text-[color:var(--ring)]",
            accentLine: "bg-[color:var(--ring)]",
        },
        // Level 2 — accent tone
        {
            ring: "ring-[color:var(--accent)]/25",
            bg: "bg-[color:var(--card)]/80",
            glow: "",
            iconBg: "bg-[color:var(--accent)]/20",
            iconFg: "text-[color:var(--accent-foreground)]",
            badge: "bg-[color:var(--accent)]/15 text-[color:var(--accent-foreground)]",
            accentLine: "bg-[color:var(--accent)]",
        },
        // Level 3+ — muted
        {
            ring: "ring-[color:var(--border)]",
            bg: "bg-[color:var(--card)]/75",
            glow: "",
            iconBg: "bg-[color:var(--muted)]",
            iconFg: "text-[color:var(--muted-foreground)]",
            badge: "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]",
            accentLine: "bg-[color:var(--border)]",
        },
    ];

    return tiers[Math.min(depth, tiers.length - 1)];
}

/* ---------- Toolbar Action ---------- */

interface ToolbarAction {
    icon: React.ElementType;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    variant?: "default" | "danger";
}

function HoverToolbar({ actions }: { actions: ToolbarAction[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-50"
        >
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[color:var(--card)]/95 backdrop-blur-xl border border-[color:var(--border)]/60 shadow-xl">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        title={action.label}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                            action.variant === "danger"
                                ? "text-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/10"
                                : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                        )}
                    >
                        <action.icon size={13} strokeWidth={2} />
                        <span className="hidden sm:inline">{action.label}</span>
                    </button>
                ))}
            </div>
            {/* Arrow pointing down */}
            <div className="flex justify-center">
                <div className="w-2.5 h-2.5 bg-[color:var(--card)]/95 border-b border-r border-[color:var(--border)]/60 rotate-45 -mt-[5px]" />
            </div>
        </motion.div>
    );
}

/* ---------- Component ---------- */

function SmartNodeInner({ data, selected, id }: NodeProps<MindmapFlowNode>) {
    const { label, description, depth, docType, fileId, childCount, isLeaf } = data;
    const Icon = getIcon(docType);
    const style = depthStyle(depth);
    const [isHovered, setIsHovered] = useState(false);
    const { selectNode } = useWorkspaceStore();

    const truncatedDesc =
        description && description.length > 90
            ? `${description.slice(0, 87)}…`
            : description;

    const toolbarActions: ToolbarAction[] = [
        {
            icon: MessageSquare,
            label: "Chat",
            onClick: (e) => {
                e.stopPropagation();
                selectNode(id);
            },
        },
        {
            icon: Maximize2,
            label: "Expand",
            onClick: (e) => {
                e.stopPropagation();
                if (fileId) {
                    window.open(`/chat/${fileId}`, "_blank");
                }
            },
        },
        {
            icon: Trash2,
            label: "Delete",
            onClick: (e) => {
                e.stopPropagation();
                // Future: implement node deletion
            },
            variant: "danger" as const,
        },
    ];

    return (
        <>
            {/* Incoming handle */}
            {depth > 0 && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-[color:var(--border)] !bg-[color:var(--card)]"
                />
            )}

            {/* Hover zone — slightly larger than the card for smooth interaction */}
            <div
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Hover toolbar */}
                <AnimatePresence>
                    {isHovered && (
                        <HoverToolbar actions={toolbarActions} />
                    )}
                </AnimatePresence>

                {/* Card */}
                <div
                    className={cn(
                        // Glassmorphism base
                        "relative rounded-2xl backdrop-blur-xl",
                        "border border-[color:var(--border)]/50",
                        style.bg,
                        "transition-all duration-200 ease-out",
                        "ring-1 ring-inset",
                        style.ring,
                        // Hover
                        "hover:shadow-xl hover:border-[color:var(--ring)]/30",
                        "hover:scale-[1.02]",
                        // Selected
                        selected && "ring-2 ring-[color:var(--ring)] scale-[1.02] shadow-xl",
                        // Glow on root / L1
                        depth <= 1 && style.glow,
                    )}
                    style={{ width: NODE_WIDTH, minHeight: 92 }}
                >
                    {/* Left accent line */}
                    <div
                        className={cn(
                            "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
                            style.accentLine,
                            depth <= 1 ? "opacity-100" : "opacity-40"
                        )}
                    />

                    {/* Inner content */}
                    <div className="p-4 pl-5 flex flex-col gap-2.5">
                        {/* ── Header row ── */}
                        <div className="flex items-start gap-3">
                            {/* Icon badge */}
                            <div
                                className={cn(
                                    "shrink-0 flex items-center justify-center rounded-xl",
                                    "w-9 h-9",
                                    style.iconBg,
                                    style.iconFg,
                                    "transition-transform duration-200",
                                    isHovered && "scale-110"
                                )}
                            >
                                <Icon size={17} strokeWidth={2} />
                            </div>

                            {/* Title + metadata */}
                            <div className="flex-1 min-w-0">
                                <h3
                                    className={cn(
                                        "font-semibold text-sm leading-tight text-[color:var(--card-foreground)] truncate",
                                        depth === 0 && "text-[15px] font-bold"
                                    )}
                                >
                                    {label}
                                </h3>

                                {/* Badges */}
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    {docType && (
                                        <span
                                            className={cn(
                                                "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide",
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
                        </div>

                        {/* ── Description ── */}
                        {truncatedDesc && (
                            <p className="text-[11px] leading-relaxed text-[color:var(--muted-foreground)] line-clamp-2 pl-12">
                                {truncatedDesc}
                            </p>
                        )}
                    </div>

                    {/* Subtle gradient highlight for root */}
                    {depth === 0 && (
                        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[color:var(--primary)]/[0.06] to-transparent rotate-12" />
                        </div>
                    )}
                </div>
            </div>

            {/* Outgoing handle */}
            {!isLeaf && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-[color:var(--border)] !bg-[color:var(--card)]"
                />
            )}
        </>
    );
}

export const SmartNode = memo(SmartNodeInner);
