"use client";

// ──────────────────────────────────────────────────────
// MindmapCanvas — full mindmap wrapper with API fetch,
// controls, skeleton loader, and themed React Flow canvas
// ──────────────────────────────────────────────────────

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MindmapNode } from "./MindmapNode";
import { layoutElements } from "./mindmap-layout";
import type {
  MindmapCanvasProps,
  MindmapResponse,
  MindmapFlowNode,
  MindmapFlowEdge,
  LayoutDirection,
} from "./types";

/* ────────────────── API fetch helper ────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchMindmap(folderId: string): Promise<MindmapResponse> {
  const res = await fetch(
    `${API_BASE}/conversation/folder/${folderId}/mindmap`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  if (!res.ok) {
    throw new Error(`Mindmap fetch failed (${res.status})`);
  }
  return res.json();
}

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

function CanvasSkeleton() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Nodes */}
      <SkeletonNode x={280} y={40} width={220} delay={0} />
      <SkeletonNode x={100} y={180} width={200} delay={120} />
      <SkeletonNode x={380} y={180} width={200} delay={200} />
      <SkeletonNode x={40} y={320} width={180} delay={300} />
      <SkeletonNode x={260} y={320} width={180} delay={380} />
      <SkeletonNode x={480} y={320} width={180} delay={440} />

      {/* Fake edges */}
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

      {/* Loading label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-[color:var(--card)]/90 backdrop-blur-lg px-5 py-3 rounded-xl border border-[color:var(--border)] shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-[color:var(--primary)]" />
          <span className="text-sm font-medium text-[color:var(--foreground)]">
            Generating mindmap…
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── Empty / Error states ────────────────── */

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
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
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold",
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
          "hover:opacity-90 active:scale-[0.97] transition-all",
          "shadow-md theme-shadow"
        )}
      >
        <Sparkles className="w-4 h-4" />
        Generate Mindmap
      </button>
    </div>
  );
}

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
          Generation failed
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

/* ────────────────── Inner Flow (needs provider above) ────────────────── */

function MindmapFlowInner({ folderId, className }: MindmapCanvasProps) {
  const router = useRouter();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);

  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const [context, setContext] = useState("");
  const [totalFiles, setTotalFiles] = useState(0);

  // Cache raw API response so direction toggles re-layout without refetch
  const rawRef = useRef<MindmapResponse | null>(null);

  /* ── Fetch & layout ── */
  const generate = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await fetchMindmap(folderId);
      rawRef.current = data;
      const { nodes: n, edges: e } = layoutElements(data.root, direction);
      setNodes(n);
      setEdges(e);
      setContext(data.context);
      setTotalFiles(data.total_files);
      setStatus("ready");
      // allow React Flow to render before fitting
      requestAnimationFrame(() => {
        fitView({ padding: 0.25, duration: 500 });
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Unknown error occurred"
      );
      setStatus("error");
    }
  }, [folderId, direction, setNodes, setEdges, fitView]);

  /* ── Toggle layout direction ── */
  const toggleDirection = useCallback(() => {
    if (!rawRef.current) return;
    const next: LayoutDirection = direction === "TB" ? "LR" : "TB";
    setDirection(next);
    const { nodes: n, edges: e } = layoutElements(rawRef.current.root, next);
    setNodes(n);
    setEdges(e);
    requestAnimationFrame(() => {
      fitView({ padding: 0.25, duration: 400 });
    });
  }, [direction, setNodes, setEdges, fitView]);

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

  /* ── Fit on first mount after ready ── */
  useEffect(() => {
    if (status === "ready" && nodes.length > 0) {
      const t = setTimeout(() => fitView({ padding: 0.25, duration: 500 }), 120);
      return () => clearTimeout(t);
    }
  }, [status, nodes.length, fitView]);

  /* ── Render states ── */
  if (status === "idle") {
    return (
      <div
        className={cn(
          "w-full h-[600px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/60 backdrop-blur-sm overflow-hidden",
          className
        )}
      >
        <EmptyState onGenerate={generate} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "w-full h-[600px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/60 backdrop-blur-sm overflow-hidden",
          className
        )}
      >
        <ErrorState message={errorMsg} onRetry={generate} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-[600px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]/40 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Loading overlay */}
      {status === "loading" && <CanvasSkeleton />}

      {/* React Flow canvas */}
      {status === "ready" && (
        <>
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
            {/* Context label */}
            <div className="flex items-center gap-2 bg-[color:var(--card)]/90 backdrop-blur-lg px-3.5 py-2 rounded-xl border border-[color:var(--border)] shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-[color:var(--primary)]" />
              <span className="text-xs font-medium text-[color:var(--foreground)] max-w-[200px] truncate">
                {context || "Mindmap"}
              </span>
              <span className="text-[10px] text-[color:var(--muted-foreground)] ml-1">
                {totalFiles} files
              </span>
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
              onClick={generate}
              title="Regenerate mindmap"
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl",
                "bg-[color:var(--card)]/90 backdrop-blur-lg border border-[color:var(--border)]",
                "hover:bg-[color:var(--muted)] transition-colors shadow-sm"
              )}
            >
              <Sparkles className="w-4 h-4 text-[color:var(--primary)]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────── Public Export (wraps provider) ────────────────── */

export function MindmapCanvas(props: MindmapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}
