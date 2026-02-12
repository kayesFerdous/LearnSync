"use client";

// ──────────────────────────────────────────────────────
// MindmapView — Full-screen infinite canvas with dot-grid
// background, smart nodes, and double-click quick notes
// ──────────────────────────────────────────────────────

import React, { useCallback, useState, useEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    type NodeTypes,
    type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Sparkles,
    Loader2,
    AlertTriangle,
    Network,
    ArrowLeftRight,
    ArrowUpDown,
    RefreshCw,
    LayoutDashboard,
    ChevronDown,
    FileText,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store";
import type { QuickNote } from "@/lib/store";

import { SmartNode } from "./SmartNode";
import { layoutElements } from "./mindmap-layout";
import { useMindmap } from "./use-mindmap";
import type {
    MindmapViewerProps,
    MindmapFlowNode,
    MindmapFlowEdge,
    LayoutDirection,
} from "./types";

/* ────────────────── Node type registry (after QuickNoteNode) ────────────────── */

/* ────────────────── Quick Note Node ────────────────── */

function QuickNoteNode({ data, id }: { data: { text: string }; id: string }) {
    const { updateQuickNote, removeQuickNote } = useWorkspaceStore();
    const [editing, setEditing] = useState(!data.text);
    const [text, setText] = useState(data.text || "");

    return (
        <div className="relative group">
            <div
                className={cn(
                    "w-52 min-h-[80px] p-3 rounded-xl",
                    "bg-[color:var(--card)]/90 backdrop-blur-xl",
                    "border border-[color:var(--border)]/50",
                    "shadow-lg",
                    "transition-all duration-200",
                    "hover:shadow-xl hover:border-[color:var(--ring)]/30"
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                        Quick Note
                    </span>
                    <button
                        onClick={() => removeQuickNote(id)}
                        className="opacity-0 group-hover:opacity-100 text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)] transition-all text-xs p-1 rounded"
                    >
                        ✕
                    </button>
                </div>
                {editing ? (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onBlur={() => {
                            setEditing(false);
                            updateQuickNote(id, text);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                setEditing(false);
                                updateQuickNote(id, text);
                            }
                        }}
                        autoFocus
                        placeholder="Type a note..."
                        className="w-full bg-transparent text-xs text-[color:var(--foreground)] resize-none outline-none leading-relaxed placeholder:text-[color:var(--muted-foreground)]/50"
                        rows={3}
                    />
                ) : (
                    <p
                        onClick={() => setEditing(true)}
                        className="text-xs text-[color:var(--foreground)] leading-relaxed cursor-text min-h-[40px]"
                    >
                        {text || "Click to edit..."}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ────────────────── Node type registry ────────────────── */

const nodeTypes: NodeTypes = {
    mindmap: SmartNode as unknown as NodeTypes["mindmap"],
    quickNote: QuickNoteNode as unknown as NodeTypes["quickNote"],
};

/* ────────────────── Loading Skeleton ────────────────── */

function CanvasSkeleton({ label }: { label: string }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-3 bg-[color:var(--card)]/90 backdrop-blur-xl px-6 py-4 rounded-2xl border border-[color:var(--border)]/50 shadow-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-[color:var(--primary)]" />
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                    {label}
                </span>
            </div>
        </div>
    );
}

/* ────────────────── Empty State ────────────────── */

function EmptyState({
    onGenerate,
    isGenerating,
}: {
    onGenerate: () => void;
    isGenerating: boolean;
}) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-6 text-center px-6 bg-[color:var(--card)]/80 backdrop-blur-xl p-10 rounded-3xl border border-[color:var(--border)]/50 shadow-2xl max-w-sm">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-[color:var(--primary)]/10 flex items-center justify-center">
                        <Network className="w-10 h-10 text-[color:var(--primary)]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[color:var(--ring)]/15 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[color:var(--ring)]" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                        Course Workspace
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)] leading-relaxed">
                        Generate an interactive mindmap from your course materials to explore the spatial workspace.
                    </p>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className={cn(
                        "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold",
                        "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
                        "hover:opacity-90 active:scale-[0.97] transition-all",
                        "shadow-lg",
                        "disabled:opacity-60 disabled:pointer-events-none"
                    )}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing files…
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Mindmap
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ────────────────── Error State ────────────────── */

function ErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4 text-center px-6 bg-[color:var(--card)]/80 backdrop-blur-xl p-8 rounded-3xl border border-[color:var(--border)]/50 shadow-2xl max-w-xs">
                <div className="w-14 h-14 rounded-2xl bg-[color:var(--destructive)]/10 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-[color:var(--destructive)]" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[color:var(--foreground)]">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onRetry}
                    className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                        "border border-[color:var(--border)] bg-[color:var(--card)]",
                        "hover:bg-[color:var(--muted)] transition-colors"
                    )}
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

/* ────────────────── Inner Flow ────────────────── */

function MindmapViewInner({ target, isInteractive: _isInteractive, files, onDataLoaded }: MindmapViewerProps) {
    const { fitView, screenToFlowPosition } = useReactFlow();
    const { addQuickNote, quickNotes, selectNode, inspectorOpen, rightPanelOpen } = useWorkspaceStore();
    const [showFileList, setShowFileList] = useState(false);

    /* ── Listen for dock "Fit View" event ── */
    useEffect(() => {
        const handler = () => fitView({ padding: 0.25, duration: 500 });
        window.addEventListener("workspace:fitView", handler);
        return () => window.removeEventListener("workspace:fitView", handler);
    }, [fitView]);

    const {
        data,
        isLoading,
        isGenerating,
        isRegenerating,
        isError,
        is404,
        error,
        generateError,
        generateMap,
        regenerateMap,
    } = useMindmap(target);

    // Notify parent about data state
    useEffect(() => {
        onDataLoaded?.(!!data);
    }, [data, onDataLoaded]);

    const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);
    const [direction, setDirection] = useState<LayoutDirection>("TB");

    /* ── Lay out nodes whenever data or direction changes ── */
    useEffect(() => {
        if (!data?.root) return;

        const { nodes: n, edges: e } = layoutElements(data.root, direction);

        // Merge in quick note nodes
        const noteNodes = quickNotes.map((note) => ({
            id: note.id,
            type: "quickNote" as const,
            data: { text: note.text },
            position: { x: note.x, y: note.y },
            draggable: true,
        }));

        setNodes([...n, ...noteNodes] as any);
        setEdges(e);

        requestAnimationFrame(() => {
            fitView({ padding: 0.25, duration: 500 });
        });
    }, [data, direction, quickNotes, setNodes, setEdges, fitView]);

    /* ── Direction toggle ── */
    const toggleDirection = useCallback(() => {
        setDirection((d) => (d === "TB" ? "LR" : "TB"));
    }, []);

    /* ── Node click → open inspector ── */
    const onNodeClick: NodeMouseHandler<MindmapFlowNode> = useCallback(
        (_event, node) => {
            if ((node.type as string) === "quickNote") return;
            selectNode(node.id);
        },
        [selectNode]
    );

    /* ── Double click on pane → create quick note ── */
    const onDoubleClickPane = useCallback(
        (event: React.MouseEvent) => {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNote: QuickNote = {
                id: `note-${Date.now()}`,
                text: "",
                x: position.x,
                y: position.y,
            };

            addQuickNote(newNote);
        },
        [screenToFlowPosition, addQuickNote]
    );

    /* ── Determine what to show ── */
    const showLoading = isLoading;
    const showEmpty = (is404 && !data && !isGenerating) || false;
    const showGenerating = is404 && !data && isGenerating;
    const showError = isError || !!(generateError && is404 && !data);
    const showCanvas = !!data?.root;

    // specific interactive mode check props
    const isInteractive = _isInteractive !== false; // Default to true if undefined

    return (
        <div className="w-full h-full relative">
            {/* React Flow Canvas — always rendered for the background */}
            <ReactFlow
                nodes={showCanvas ? nodes : []}
                edges={showCanvas ? edges : []}
                onNodesChange={isInteractive ? onNodesChange : undefined}
                onEdgesChange={isInteractive ? onEdgesChange : undefined}
                onNodeClick={isInteractive ? onNodeClick : undefined}
                onDoubleClick={isInteractive ? onDoubleClickPane : undefined}
                nodeTypes={nodeTypes}
                fitView
                minZoom={isInteractive ? 0.1 : 0.5}
                maxZoom={isInteractive ? 2.5 : 0.5}
                nodesDraggable={isInteractive}
                nodesConnectable={isInteractive}
                elementsSelectable={isInteractive}
                zoomOnScroll={isInteractive}
                panOnScroll={false}
                zoomOnDoubleClick={isInteractive}
                panOnDrag={isInteractive}
                proOptions={{ hideAttribution: true }}
                className="!bg-transparent"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="var(--border)"
                    style={{ opacity: 0.4 }}
                />
                {showCanvas && isInteractive && (
                    <>
                        <Controls
                            showInteractive={false}
                            className="!bg-[color:var(--card)]/90 !backdrop-blur-xl !border !border-[color:var(--border)]/50 !rounded-2xl !shadow-xl [&>button]:!border-[color:var(--border)]/30 [&>button]:!bg-transparent [&>button]:hover:!bg-[color:var(--muted)] [&>button>svg]:!fill-[color:var(--foreground)]"
                        />
                        <MiniMap
                            nodeColor={() => "var(--primary)"}
                            maskColor="var(--background)"
                            className="!bg-[color:var(--card)]/80 !backdrop-blur-xl !border !border-[color:var(--border)]/50 !rounded-2xl !transition-all !duration-300"
                            pannable
                            zoomable
                            style={{ right: inspectorOpen ? 336 : 20 }}
                        />
                    </>
                )}
            </ReactFlow>

            {/* Overlay states */}
            {showLoading && <CanvasSkeleton label="Loading mindmap…" />}
            {showGenerating && <CanvasSkeleton label="Analyzing files…" />}
            {showEmpty && !showError && (
                <EmptyState onGenerate={generateMap} isGenerating={isGenerating} />
            )}
            {showError && (
                <ErrorState
                    message={
                        generateError?.message ??
                        error?.message ??
                        "Could not load mindmap"
                    }
                    onRetry={generateMap}
                />
            )}

            {/* Regeneration overlay */}
            {isRegenerating && (
                <div className="absolute inset-0 z-30 bg-[color:var(--background)]/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-[color:var(--card)]/90 backdrop-blur-xl px-6 py-4 rounded-2xl border border-[color:var(--border)]/50 shadow-2xl">
                        <Loader2 className="w-5 h-5 animate-spin text-[color:var(--primary)]" />
                        <span className="text-sm font-medium text-[color:var(--foreground)]">
                            Regenerating mindmap…
                        </span>
                    </div>
                </div>
            )}

            {/* Floating top-left toolbar */}
            {showCanvas && isInteractive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    {/* Context pill */}
                    <div
                        className={cn(
                            "flex items-center gap-2 glass-panel px-3.5 py-2 rounded-xl transition-colors relative",
                            (data?.total_files ?? 0) > 1 && "cursor-pointer hover:bg-[color:var(--muted)]"
                        )}
                        onClick={(e) => {
                            if ((data?.total_files ?? 0) > 1) {
                                e.stopPropagation();
                                setShowFileList(!showFileList);
                            }
                        }}
                    >
                        <LayoutDashboard className="w-4 h-4 text-[color:var(--primary)]" />
                        <span
                            className="text-xs font-medium text-[color:var(--foreground)] max-w-[500px] truncate"
                            title={data?.context ?? "Mindmap"}
                        >
                            {data?.context ?? "Mindmap"}
                        </span>
                        {data?.total_files != null && (
                            <>
                                <span className="text-[10px] text-[color:var(--muted-foreground)] ml-1">
                                    {data.total_files} files
                                </span>
                                {(data.total_files > 1) && (
                                    <ChevronDown className={cn(
                                        "w-3 h-3 text-[color:var(--muted-foreground)] ml-0.5 transition-transform duration-200",
                                        showFileList && "rotate-180"
                                    )} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Knowledge Map Badge (New 2nd Position) */}
                    <div className="flex items-center gap-2 glass-panel px-3.5 py-2 rounded-xl bg-blue-50/50 border-blue-100">
                        <div className="p-1 bg-blue-100 text-blue-600 rounded-lg">
                            <Network className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 leading-none">Knowledge Map</span>
                        </div>
                    </div>

                    {/* Direction toggle */}
                    <button
                        onClick={toggleDirection}
                        title={
                            direction === "TB"
                                ? "Switch to left-to-right"
                                : "Switch to top-to-bottom"
                        }
                        className="flex items-center justify-center w-9 h-9 rounded-xl glass-panel hover:bg-[color:var(--muted)] transition-colors"
                    >
                        {direction === "TB" ? (
                            <ArrowLeftRight className="w-4 h-4 text-[color:var(--foreground)]" />
                        ) : (
                            <ArrowUpDown className="w-4 h-4 text-[color:var(--foreground)]" />
                        )}
                    </button>

                    {/* Regenerate */}
                    <button
                        onClick={regenerateMap}
                        disabled={isRegenerating}
                        title="Regenerate mindmap"
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium glass-panel",
                            "hover:bg-[color:var(--muted)] transition-colors",
                            "disabled:opacity-50 disabled:pointer-events-none"
                        )}
                    >
                        <RefreshCw
                            className={cn(
                                "w-3.5 h-3.5 text-[color:var(--primary)]",
                                isRegenerating && "animate-spin"
                            )}
                        />
                        <span className="hidden sm:inline">Regenerate</span>
                    </button>

                    {/* File List Popover */}
                    {showFileList && (
                        <div className="absolute top-full left-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-xl rounded-xl p-3 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    Source Files
                                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                        {files?.length ?? 0}
                                    </span>
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowFileList(false); }}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                {files && files.length > 0 ? (
                                    files.map((f) => (
                                        <div key={f.id} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg group/file cursor-default transition-colors border border-transparent hover:border-slate-100">
                                            <div className="w-6 h-6 rounded bg-blue-50/50 flex items-center justify-center flex-shrink-0 text-blue-600 border border-blue-100/50">
                                                <FileText className="w-3 h-3" />
                                            </div>
                                            <span className="flex-1 text-xs text-slate-600 truncate group-hover/file:text-slate-900 font-medium" title={f.filename}>{f.filename}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center text-xs text-slate-400 italic">
                                        No files available
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ────────────────── Public Export ────────────────── */

export function MindmapView(props: MindmapViewerProps) {
    // Inject isInteractive into the target object for internal consumption if needed,
    // though passing it directly to MindmapViewInner is cleaner.
    // Actually, MindmapViewInner takes MindmapViewerProps, so we just pass props through.
    return (
        <ReactFlowProvider>
            <MindmapViewInner {...props} />
        </ReactFlowProvider>
    );
}
