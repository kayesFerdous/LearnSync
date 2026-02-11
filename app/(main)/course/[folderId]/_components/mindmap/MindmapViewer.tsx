"use client";

// ──────────────────────────────────────────────────────
// MindmapViewer — Smart wrapper that handles
//   Empty → Loading → Graph states via useMindmap hook.
// ──────────────────────────────────────────────────────

import React, { useCallback, useState, useEffect, useMemo } from "react";
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
  LayoutDashboard,
  ArrowLeftRight,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  Network,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { MindmapNode } from "./MindmapNode";
import { layoutElements } from "./mindmap-layout";
import { useMindmap } from "./use-mindmap";
import type {
  MindmapViewerProps,
  MindmapFlowNode,
  MindmapFlowEdge,
  LayoutDirection,
} from "./types";

/* ────────────────── Node type registry ────────────────── */

const nodeTypes: NodeTypes = {
  mindmap: MindmapNode as unknown as NodeTypes["mindmap"],
};

/* ────────────────── Skeleton Loader ────────────────── */

function SkeletonNode({
  x,
  y,
  width,
  delay,
}: {
  x: number;
  y: number;
  width: number;
  delay: number;
}) {
  return (
    <div
      className="absolute rounded-xl bg-[color:var(--muted)]/60 animate-pulse"
      style={{
        left: x,
        top: y,
        width,
        height: 80,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function CanvasSkeleton({ label }: { label: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Placeholder nodes */}
      <SkeletonNode x={280} y={40} width={220} delay={0} />
      <SkeletonNode x={100} y={180} width={200} delay={120} />
      <SkeletonNode x={380} y={180} width={200} delay={200} />
      <SkeletonNode x={40} y={320} width={180} delay={300} />
      <SkeletonNode x={260} y={320} width={180} delay={380} />
      <SkeletonNode x={480} y={320} width={180} delay={440} />

      {/* Placeholder edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {[
          { x1: 390, y1: 120, x2: 200, y2: 180 },
          { x1: 390, y1: 120, x2: 480, y2: 180 },
          { x1: 200, y1: 260, x2: 130, y2: 320 },
          { x1: 200, y1: 260, x2: 350, y2: 320 },
          { x1: 480, y1: 260, x2: 570, y2: 320 },
        ].map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--border)"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity={0.45}
          />
        ))}
      </svg>

      {/* Center pill */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-[color:var(--card)]/90 backdrop-blur-lg px-5 py-3 rounded-xl border border-[color:var(--border)] shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-[color:var(--primary)]" />
          <span className="text-sm font-medium text-[color:var(--foreground)]">
            {label}
          </span>
        </div>
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
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-[color:var(--primary)]/10 flex items-center justify-center">
          <Network className="w-10 h-10 text-[color:var(--primary)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[color:var(--ring)]/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[color:var(--ring)]" />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
          Course Mindmap
        </h3>
        <p className="text-sm text-[color:var(--muted-foreground)] leading-relaxed">
          Visualise the structure of your course materials as an interactive,
          zoomable mindmap.
        </p>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold",
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
          "hover:opacity-90 active:scale-[0.97] transition-all",
          "shadow-md theme-shadow",
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
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-[color:var(--destructive)]/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-[color:var(--destructive)]" />
      </div>
      <div className="space-y-1 max-w-xs">
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
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          "border border-[color:var(--border)] bg-[color:var(--card)]",
          "hover:bg-[color:var(--muted)] transition-colors"
        )}
      >
        Retry
      </button>
    </div>
  );
}

/* ────────────────── Inner Flow ────────────────── */

function MindmapFlowInner({ target, className }: MindmapViewerProps) {
  const router = useRouter();
  const { fitView } = useReactFlow();

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

  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);
  const [direction, setDirection] = useState<LayoutDirection>("TB");

  /* ── Lay out nodes whenever data or direction changes ── */
  useEffect(() => {
    if (!data?.root) return;

    const { nodes: n, edges: e } = layoutElements(data.root, direction);
    setNodes(n);
    setEdges(e);

    // give React Flow a tick to render, then fit
    requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 500 });
    });
  }, [data, direction, setNodes, setEdges, fitView]);

  /* ── Direction toggle ── */
  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "TB" ? "LR" : "TB"));
  }, []);

  /* ── Node click → navigate ── */
  const onNodeClick: NodeMouseHandler<MindmapFlowNode> = useCallback(
    (_event, node) => {
      const fileId = node.data.fileId;
      if (fileId) {
        router.push(`/chat/${fileId}`);
      }
    },
    [router]
  );

  /* ────── Wrapper class ────── */
  const wrapperCls = cn(
    "w-full h-[600px] rounded-2xl border border-[color:var(--border)] overflow-hidden",
    "bg-[color:var(--card)]/40 backdrop-blur-sm",
    className
  );

  /* ────── 1. Initial loading (GET) ────── */
  if (isLoading) {
    return (
      <div className={wrapperCls}>
        <CanvasSkeleton label="Loading mindmap…" />
      </div>
    );
  }

  /* ────── 2. Hard error on the GET (not 404) ────── */
  if (isError) {
    return (
      <div className={wrapperCls}>
        <ErrorState
          message={error?.message ?? "Could not load mindmap"}
          onRetry={generateMap}
        />
      </div>
    );
  }

  /* ────── 3. No map yet (404) — show empty + generate CTA ────── */
  if (is404 && !data) {
    // If the generation is in-flight, show skeleton instead of empty
    if (isGenerating) {
      return (
        <div className={wrapperCls}>
          <CanvasSkeleton label="Analyzing files…" />
        </div>
      );
    }

    return (
      <div className={wrapperCls}>
        {generateError ? (
          <ErrorState
            message={generateError.message}
            onRetry={generateMap}
          />
        ) : (
          <EmptyState onGenerate={generateMap} isGenerating={isGenerating} />
        )}
      </div>
    );
  }

  /* ────── 4. Graph is ready ────── */
  return (
    <div className={cn(wrapperCls, "relative")}>
      {/* Regeneration overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 z-20 bg-[color:var(--background)]/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex items-center gap-3 bg-[color:var(--card)]/90 backdrop-blur-lg px-5 py-3 rounded-xl border border-[color:var(--border)] shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-[color:var(--primary)]" />
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Regenerating mindmap…
            </span>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="var(--border)"
          style={{ opacity: 0.5 }}
        />
        <Controls
          showInteractive={false}
          className="!bg-[color:var(--card)]/90 !backdrop-blur-lg !border !border-[color:var(--border)] !rounded-xl !shadow-lg [&>button]:!border-[color:var(--border)] [&>button]:!bg-transparent [&>button]:hover:!bg-[color:var(--muted)] [&>button>svg]:!fill-[color:var(--foreground)]"
        />
        <MiniMap
          nodeColor={() => "var(--primary)"}
          maskColor="var(--background)"
          className="!bg-[color:var(--card)]/80 !backdrop-blur-lg !border !border-[color:var(--border)] !rounded-xl"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* ── Floating toolbar ── */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        {/* Context pill */}
        <div className="flex items-center gap-2 bg-[color:var(--card)]/90 backdrop-blur-lg px-3.5 py-2 rounded-xl border border-[color:var(--border)] shadow-sm">
          <LayoutDashboard className="w-4 h-4 text-[color:var(--primary)]" />
          <span className="text-xs font-medium text-[color:var(--foreground)] max-w-[200px] truncate">
            {data?.context ?? "Mindmap"}
          </span>
          {data?.total_files != null && (
            <span className="text-[10px] text-[color:var(--muted-foreground)] ml-1">
              {data.total_files} files
            </span>
          )}
        </div>

        {/* Direction toggle */}
        <button
          onClick={toggleDirection}
          title={
            direction === "TB"
              ? "Switch to left-to-right"
              : "Switch to top-to-bottom"
          }
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-xl",
            "bg-[color:var(--card)]/90 backdrop-blur-lg border border-[color:var(--border)]",
            "hover:bg-[color:var(--muted)] transition-colors shadow-sm"
          )}
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
          title="Regenerate mindmap (force rebuild)"
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium",
            "bg-[color:var(--card)]/90 backdrop-blur-lg border border-[color:var(--border)]",
            "hover:bg-[color:var(--muted)] transition-colors shadow-sm",
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
      </div>
    </div>
  );
}

/* ────────────────── Public Export ────────────────── */

export function MindmapViewer(props: MindmapViewerProps) {
  return (
    <ReactFlowProvider>
      <MindmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}
