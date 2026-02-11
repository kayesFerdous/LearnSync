"use client";

// ──────────────────────────────────────────────────────
// InspectorDrawer — Right slide-over panel
// Shows node details and chat interface when a node is clicked
// ──────────────────────────────────────────────────────

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    MessageSquare,
    ExternalLink,
    FileText,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { MindmapFlowNode } from "./mindmap/types";

interface InspectorDrawerProps {
    nodes: MindmapFlowNode[];
}

export function InspectorDrawer({ nodes }: InspectorDrawerProps) {
    const router = useRouter();
    const { inspectorOpen, selectedNodeId, deselectNode } = useWorkspaceStore();

    // Find the selected node data
    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes.find((n) => n.id === selectedNodeId) ?? null;
    }, [selectedNodeId, nodes]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && inspectorOpen) {
                deselectNode();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [inspectorOpen, deselectNode]);

    return (
        <AnimatePresence>
            {inspectorOpen && selectedNode && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
                        onClick={deselectNode}
                    />

                    {/* Drawer panel */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0.8 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0.8 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md"
                    >
                        <div className="h-full m-4 ml-0 rounded-2xl glass-panel shadow-2xl flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[color:var(--primary)]/10 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-[color:var(--primary)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                                            Inspector
                                        </h2>
                                        <span className="text-[10px] text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                            Node Details
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={deselectNode}
                                    className="p-2 rounded-xl text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                                {/* Node Title */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-[color:var(--foreground)] leading-tight">
                                        {selectedNode.data.label}
                                    </h3>
                                    {selectedNode.data.docType && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)] text-xs font-semibold">
                                            <FileText className="w-3 h-3" />
                                            {selectedNode.data.docType}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {selectedNode.data.description && (
                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                                            Summary
                                        </h4>
                                        <p className="text-sm text-[color:var(--foreground)] leading-relaxed">
                                            {selectedNode.data.description}
                                        </p>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                                        Details
                                    </h4>
                                    <div className="space-y-2">
                                        <DetailRow label="Depth" value={`Level ${selectedNode.data.depth}`} />
                                        <DetailRow
                                            label="Children"
                                            value={`${selectedNode.data.childCount} ${selectedNode.data.childCount === 1 ? "child" : "children"}`}
                                        />
                                        <DetailRow
                                            label="Type"
                                            value={selectedNode.data.isLeaf ? "Leaf node" : "Branch node"}
                                        />
                                        {selectedNode.data.fileCount != null && (
                                            <DetailRow
                                                label="Files"
                                                value={`${selectedNode.data.fileCount} files`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[color:var(--border)]/30" />

                                {/* Actions */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                                        Actions
                                    </h4>

                                    {selectedNode.data.fileId && (
                                        <>
                                            <ActionButton
                                                icon={MessageSquare}
                                                label="Open Chat"
                                                description="Start a conversation about this topic"
                                                onClick={() => router.push(`/chat/${selectedNode.data.fileId}`)}
                                            />
                                            <ActionButton
                                                icon={ExternalLink}
                                                label="Open in New Tab"
                                                description="View in a separate window"
                                                onClick={() => window.open(`/chat/${selectedNode.data.fileId}`, "_blank")}
                                            />
                                        </>
                                    )}

                                    {!selectedNode.data.fileId && (
                                        <div className="text-sm text-[color:var(--muted-foreground)] italic p-4 text-center rounded-xl bg-[color:var(--muted)]/30">
                                            This is a structural node — no file linked.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/* ---------- Helper components ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[color:var(--muted)]/30">
            <span className="text-xs text-[color:var(--muted-foreground)]">{label}</span>
            <span className="text-xs font-medium text-[color:var(--foreground)]">{value}</span>
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    description,
    onClick,
}: {
    icon: React.ElementType;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3.5 rounded-xl text-left",
                "border border-[color:var(--border)]/30",
                "hover:bg-[color:var(--muted)]/40 hover:border-[color:var(--ring)]/30",
                "transition-all duration-200 group"
            )}
        >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[color:var(--primary)]/10 flex items-center justify-center group-hover:bg-[color:var(--primary)]/15 transition-colors">
                <Icon className="w-4 h-4 text-[color:var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[color:var(--foreground)] block">
                    {label}
                </span>
                <span className="text-[11px] text-[color:var(--muted-foreground)]">
                    {description}
                </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)] transition-colors" />
        </button>
    );
}
