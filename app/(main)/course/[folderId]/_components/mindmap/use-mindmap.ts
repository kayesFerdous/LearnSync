"use client";

// ──────────────────────────────────────────────────────
// useMindmap — Smart data-fetching hook
//
//   1. GET  → try to load a cached/saved mindmap
//   2. POST → generate a new one (if 404 or user clicks)
//   3. POST ?force_regenerate=true → rebuild from scratch
// ──────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MindmapResponse, MindmapTarget } from "./types";

/* ────────────── API plumbing ────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Build the correct URL depending on folder vs conversation target */
function baseUrl(target: MindmapTarget): string {
  return target.type === "folder"
    ? `${API_BASE}/conversation/folder/${target.id}/mindmap`
    : `${API_BASE}/conversation/${target.id}/mindmap`;
}

/** GET — fetch an existing (cached) mindmap. Returns `null` on 404. */
async function getMindmap(
  target: MindmapTarget
): Promise<MindmapResponse | null> {
  const res = await fetch(baseUrl(target), {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 404) return null; // no saved map yet
  if (!res.ok) throw new Error(`Failed to fetch mindmap (${res.status})`);
  return res.json();
}

/** POST — generate (or regenerate) a mindmap. */
async function postMindmap(
  target: MindmapTarget,
  forceRegenerate = false,
  fileIds?: string[]
): Promise<MindmapResponse> {
  const url = forceRegenerate
    ? `${baseUrl(target)}?force_regenerate=true`
    : baseUrl(target);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds }),
    credentials: "include",
  });

  if (!res.ok) throw new Error(`Mindmap generation failed (${res.status})`);
  return res.json();
}

/* ────────────── Query key helper ────────────── */

function mindmapKey(target: MindmapTarget) {
  return ["mindmap", target.type, target.id] as const;
}

/* ────────────── Hook ────────────── */

export function useMindmap(target: MindmapTarget) {
  const qc = useQueryClient();
  const key = mindmapKey(target);

  // ── 1. GET existing mindmap ──
  const query = useQuery({
    queryKey: key,
    queryFn: () => getMindmap(target),
    // Don't treat 404 (null) as an error — it's an expected state
    retry: (failureCount, error) => {
      // Don't retry on 404 — that's normal
      if (error instanceof Error && error.message.includes("404")) return false;
      return failureCount < 2;
    },
  });

  /** Whether the backend returned 404 (no map exists yet) */
  const is404 = query.isSuccess && query.data === null;

  // ── 2. POST generate ──
  const generateMutation = useMutation({
    mutationFn: () => postMindmap(target, false),
    onSuccess: (data) => {
      // Replace the GET cache so we don't refetch
      qc.setQueryData(key, data);
    },
  });

  // ── 3. POST force-regenerate ──
  const regenerateMutation = useMutation({
    mutationFn: () => postMindmap(target, true),
    onSuccess: (data) => {
      qc.setQueryData(key, data);
    },
  });

  return {
    // Data
    data: query.data ?? generateMutation.data ?? null,

    // Loading states
    isLoading: query.isLoading,
    isGenerating: generateMutation.isPending,
    isRegenerating: regenerateMutation.isPending,

    // Error states
    isError: query.isError,
    is404,
    error:
      query.error ??
      generateMutation.error ??
      regenerateMutation.error ??
      null,
    generateError: generateMutation.error ?? null,
    regenerateError: regenerateMutation.error ?? null,

    // Actions
    generateMap: () => generateMutation.mutate(),
    regenerateMap: () => regenerateMutation.mutate(),
  };
}
