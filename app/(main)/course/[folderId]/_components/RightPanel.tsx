"use client";

// ──────────────────────────────────────────────────────
// RightPanel — Collapsible glass drawer with 3 Tabs:
//   • Activity (Chat History)
//   • Files (Knowledge Base)
//   • Quizzes (Generated MCQs)
// ──────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    MessageSquare,
    FolderOpen,
    Gamepad2, // Quiz Icon
    FileText,
    FileImage,
    FileAudio,
    FileSpreadsheet,
    FileType as FileTypeIcon,
    Presentation,
    Globe,
    Code,
    File,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Upload,
    Trash2,
    Sparkles,
    ChevronRight,
    ExternalLink,
    PanelRightClose,
    PanelRightOpen,
    PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store";
import { fetchFolderFiles, fetchQuizzes } from "@/app/(main)/chat/_lib/api";
import type { Conversation, FolderFile, FolderFileType, ProcessingStatus } from "@/app/(main)/chat/_lib/types";
import type { MindmapFlowNode } from "./mindmap/types";
import { useFolderFiles } from "@/hooks/use-folder-files";
import { QuizSummary } from "@/types/quiz";
import { useQuizStore } from "@/stores/use-quiz-store";

/* ──────── File/Status config ──────── */

const fileTypeConfig: Record<FolderFileType, { icon: React.ElementType; color: string; label: string }> = {
    pdf: { icon: FileText, color: "#ef4444", label: "PDF" },
    docx: { icon: FileTypeIcon, color: "#2563eb", label: "Word" },
    pptx: { icon: Presentation, color: "#f97316", label: "PowerPoint" },
    xlsx: { icon: FileSpreadsheet, color: "#22c55e", label: "Excel" },
    html: { icon: Code, color: "#8b5cf6", label: "HTML" },
    markdown: { icon: FileText, color: "#6b7280", label: "Markdown" },
    png: { icon: FileImage, color: "#ec4899", label: "PNG" },
    jpeg: { icon: FileImage, color: "#ec4899", label: "JPEG" },
    tiff: { icon: FileImage, color: "#ec4899", label: "TIFF" },
    wav: { icon: FileAudio, color: "#06b6d4", label: "WAV" },
    mp3: { icon: FileAudio, color: "#06b6d4", label: "MP3" },
    vtt: { icon: FileText, color: "#14b8a6", label: "VTT" },
    url: { icon: Globe, color: "#3b82f6", label: "URL" },
    unknown: { icon: File, color: "#9ca3af", label: "File" },
};

const statusConfig: Record<ProcessingStatus, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
    pending: { icon: Clock, color: "#f59e0b", label: "Pending", bgColor: "bg-amber-500/10" },
    processing: { icon: Loader2, color: "#3b82f6", label: "Processing", bgColor: "bg-blue-500/10" },
    completed: { icon: CheckCircle2, color: "#22c55e", label: "Completed", bgColor: "bg-emerald-500/10" },
    failed: { icon: XCircle, color: "#ef4444", label: "Failed", bgColor: "bg-red-500/10" },
    cancelled: { icon: AlertCircle, color: "#6b7280", label: "Cancelled", bgColor: "bg-gray-500/10" },
};

/* ──────── Types ──────── */

type Tab = "activity" | "files" | "quizzes";
type PanelMode = "closed" | "hub" | "inspector";

interface RightPanelProps {
    folderId: string;
    conversations: Conversation[];
    nodes: MindmapFlowNode[];
    themeColor: string;
    onOpenUpload: () => void;
    onFileDelete: (file: FolderFile) => void;
}

/* ──────── Component ──────── */

export function RightPanel({
    folderId,
    conversations,
    nodes,
    themeColor,
    onOpenUpload,
    onFileDelete,
}: RightPanelProps) {
    const { inspectorOpen, selectedNodeId, deselectNode, rightPanelOpen, setRightPanelOpen } = useWorkspaceStore();

    const [activeTab, setActiveTab] = useState<Tab>("activity");
    const [files, setFiles] = useState<FolderFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(true);

    // Fetch files using shared hook
    const { data: fetchedFiles = [], isLoading: isFilesLoading } = useFolderFiles(folderId);

    useEffect(() => {
        if (fetchedFiles) {
            setFiles(fetchedFiles as FolderFile[]);
            setFilesLoading(isFilesLoading);
        }
    }, [fetchedFiles, isFilesLoading]);

    // Determine panel mode
    const mode: PanelMode = useMemo(() => {
        if (inspectorOpen && selectedNodeId) return "inspector";
        if (rightPanelOpen) return "hub";
        return "closed";
    }, [inspectorOpen, selectedNodeId, rightPanelOpen]);

    // Find selected node
    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes.find((n) => n.id === selectedNodeId) ?? null;
    }, [selectedNodeId, nodes]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (inspectorOpen) deselectNode();
                else if (rightPanelOpen) setRightPanelOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [inspectorOpen, rightPanelOpen, deselectNode, setRightPanelOpen]);

    const panelWidth = mode === "closed" ? "w-12" : "w-80";

    return (
        <div
            className={cn(
                "absolute right-0 top-0 bottom-0 z-20 flex",
                "transition-all duration-300 ease-out",
                panelWidth
            )}
        >
            {/* Toggle button (visible when closed) */}
            {mode === "closed" && (
                <button
                    onClick={() => setRightPanelOpen(true)}
                    className="absolute right-2 top-3 z-30 p-2 rounded-xl glass-panel hover:bg-[color:var(--muted)]/60 transition-colors"
                    title="Open panel"
                >
                    <PanelRightOpen className="w-4 h-4 text-[color:var(--foreground)]" />
                </button>
            )}

            {/* Panel body */}
            <AnimatePresence>
                {mode !== "closed" && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-0 bottom-0 w-80 flex flex-col bg-[color:var(--card)] border-l border-[color:var(--border)] shadow-2xl overflow-hidden"
                    >
                        {/* Header Tabs */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]/30">
                            {mode === "inspector" ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[color:var(--primary)]/10 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-[color:var(--primary)]" />
                                    </div>
                                    <span className="text-sm font-semibold text-[color:var(--foreground)]">Inspector</span>
                                </div>
                            ) : (
                                <div className="flex gap-1 bg-[color:var(--muted)]/40 rounded-lg p-0.5">
                                    <TabButton
                                        active={activeTab === "activity"}
                                        onClick={() => setActiveTab("activity")}
                                        icon={<MessageSquare className="w-3.5 h-3.5" />}
                                        label="Chat"
                                    />
                                    <TabButton
                                        active={activeTab === "files"}
                                        onClick={() => setActiveTab("files")}
                                        icon={<FolderOpen className="w-3.5 h-3.5" />}
                                        label="Files"
                                    />
                                    <TabButton
                                        active={activeTab === "quizzes"}
                                        onClick={() => setActiveTab("quizzes")}
                                        icon={<Gamepad2 className="w-3.5 h-3.5" />}
                                        label="Quiz"
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (mode === "inspector") deselectNode();
                                    else setRightPanelOpen(false);
                                }}
                                className="p-1.5 rounded-lg text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60 transition-colors"
                            >
                                {mode === "inspector" ? <X className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            {mode === "inspector" && selectedNode ? (
                                <InspectorContent node={selectedNode} />
                            ) : activeTab === "activity" ? (
                                <ActivityList conversations={conversations} themeColor={themeColor} />
                            ) : activeTab === "files" ? (
                                <FilesList
                                    files={files}
                                    loading={filesLoading}
                                    themeColor={themeColor}
                                    onOpenUpload={onOpenUpload}
                                    onDelete={onFileDelete}
                                />
                            ) : (
                                <QuizzesList folderId={folderId} themeColor={themeColor} />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────── Sub-components ──────── */

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                active
                    ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

/* ──────── Lists ──────── */

function ActivityList({ conversations, themeColor }: { conversations: Conversation[]; themeColor: string }) {
    const router = useRouter();
    if (!conversations || conversations.length === 0) {
        return <EmptyState icon={MessageSquare} label="No conversations yet" subLabel="Start a new chat to see activity here" />;
    }
    return (
        <div className="divide-y divide-[color:var(--border)]/20">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => router.push(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--muted)]/40 transition-colors text-left group"
                >
                    <div className="shrink-0 p-2 rounded-lg bg-[color:var(--muted)] text-[color:var(--muted-foreground)] group-hover:text-white transition-all">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[color:var(--foreground)] truncate group-hover:text-[color:var(--primary)] transition-colors">
                            {conv.title || "Untitled Chat"}
                        </h4>
                        <p className="text-[11px] text-[color:var(--muted-foreground)]">
                            {conv.updated_at ? format(new Date(conv.updated_at), "MMM d • h:mm a") : format(new Date(conv.created_at), "MMM d • h:mm a")}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}

function FilesList({ files, loading, themeColor, onOpenUpload, onDelete }: { files: FolderFile[]; loading: boolean; themeColor: string; onOpenUpload: () => void; onDelete: (file: FolderFile) => void; }) {
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[color:var(--primary)]" /></div>;
    if (files.length === 0) return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[color:var(--muted)]/50 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[color:var(--muted-foreground)]">No files uploaded</p>
            <button onClick={onOpenUpload} className="mt-3 px-4 py-2 text-xs font-medium rounded-lg text-white transition-all hover:opacity-90" style={{ backgroundColor: themeColor }}>
                Upload Files
            </button>
        </div>
    );

    return (
        <div className="p-2 space-y-1">
            {files.map((file) => {
                const tc = fileTypeConfig[file.file_type] || fileTypeConfig.unknown;
                const sc = statusConfig[file.status] || statusConfig.pending;
                const FileIcon = tc.icon;
                return (
                    <div key={file.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[color:var(--muted)]/40 transition-colors">
                        <div className="shrink-0 p-2 rounded-lg" style={{ backgroundColor: `${tc.color}15` }}>
                            <FileIcon className="w-4 h-4" style={{ color: tc.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[color:var(--foreground)] truncate">{file.filename}</p>
                            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tc.color}15`, color: tc.color }}>{tc.label}</span>
                        </div>
                        <button onClick={() => onDelete(file)} className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[color:var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function QuizzesList({ folderId, themeColor }: { folderId: string; themeColor: string }) {
    const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const { loadQuiz } = useQuizStore();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchQuizzes(folderId);
                setQuizzes(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [folderId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[color:var(--primary)]" /></div>;

    if (quizzes.length === 0) {
        return <EmptyState icon={Gamepad2} label="No quizzes taken" subLabel="Generate a quiz to start practicing" />;
    }

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case "Easy": return "bg-emerald-500";
            case "Medium": return "bg-amber-500";
            case "Hard": return "bg-rose-500";
            default: return "bg-slate-500";
        }
    };

    return (
        <div className="divide-y divide-[color:var(--border)]/20">
            {quizzes.map((quiz) => (
                <button
                    key={quiz.id}
                    onClick={() => loadQuiz(quiz.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[color:var(--muted)]/40 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", getDifficultyColor(quiz.difficulty))} title={quiz.difficulty} />
                        <div className="text-left">
                            <span className="block text-sm font-bold text-[color:var(--foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                                {quiz.title}
                            </span>
                            <span className="block text-[10px] text-[color:var(--muted-foreground)] uppercase tracking-wide">
                                {format(new Date(quiz.created_at), "MMM d")}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {quiz.score !== null ? (
                            <div className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-md",
                                quiz.score >= 80 ? "bg-emerald-500/10 text-emerald-500" :
                                    quiz.score >= 60 ? "bg-amber-500/10 text-amber-500" :
                                        "bg-rose-500/10 text-rose-500"
                            )}>
                                {quiz.score}%
                            </div>
                        ) : (
                            <PlayCircle className="w-4 h-4 text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] transition-colors" />
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}

function EmptyState({ icon: Icon, label, subLabel }: { icon: any; label: string; subLabel: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[color:var(--muted)]/50 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="text-sm text-[color:var(--muted-foreground)]">{label}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]/60 mt-1">{subLabel}</p>
        </div>
    );
}

function InspectorContent({ node }: { node: MindmapFlowNode }) {
    const router = useRouter();
    const { label, description, depth, docType, fileId, childCount, isLeaf } = node.data;

    return (
        <div className="p-4 space-y-5">
            <div className="space-y-2">
                <h3 className="text-lg font-bold text-[color:var(--foreground)] leading-tight">{label}</h3>
                {docType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color:var(--primary)]/10 text-[color:var(--primary)] text-xs font-semibold">
                        <FileText className="w-3 h-3" /> {docType}
                    </span>
                )}
            </div>
            {description && (
                <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Summary</h4>
                    <p className="text-sm text-[color:var(--foreground)] leading-relaxed">{description}</p>
                </div>
            )}
            <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Details</h4>
                <MetaRow label="Depth" value={`Level ${depth}`} />
                <MetaRow label="Children" value={`${childCount}`} />
                <MetaRow label="Type" value={isLeaf ? "Leaf" : "Branch"} />
            </div>
            {fileId && (
                <div className="space-y-2 pt-2 border-t border-[color:var(--border)]/30">
                    <button onClick={() => router.push(`/chat/${fileId}`)} className="w-full flex items-center gap-3 p-3 rounded-xl text-left border border-[color:var(--border)]/30 hover:bg-[color:var(--muted)]/40 hover:border-[color:var(--ring)]/30 transition-all duration-200 group">
                        <div className="w-8 h-8 rounded-lg bg-[color:var(--primary)]/10 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-[color:var(--primary)]" /></div>
                        <div className="flex-1"><span className="text-sm font-medium text-[color:var(--foreground)]">Open Chat</span><span className="text-[10px] text-[color:var(--muted-foreground)] block">Start a conversation</span></div>
                        <ChevronRight className="w-4 h-4 text-[color:var(--muted-foreground)]" />
                    </button>
                    <button onClick={() => window.open(`/chat/${fileId}`, "_blank")} className="w-full flex items-center gap-3 p-3 rounded-xl text-left border border-[color:var(--border)]/30 hover:bg-[color:var(--muted)]/40 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-[color:var(--muted)] flex items-center justify-center"><ExternalLink className="w-4 h-4 text-[color:var(--muted-foreground)]" /></div>
                        <span className="text-sm font-medium text-[color:var(--foreground)]">Open in New Tab</span>
                    </button>
                </div>
            )}
            {!fileId && <div className="text-sm text-[color:var(--muted-foreground)] italic p-4 text-center rounded-xl bg-[color:var(--muted)]/20">Structural node — no file linked</div>}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[color:var(--muted)]/20">
            <span className="text-[11px] text-[color:var(--muted-foreground)]">{label}</span>
            <span className="text-[11px] font-medium text-[color:var(--foreground)]">{value}</span>
        </div>
    );
}
