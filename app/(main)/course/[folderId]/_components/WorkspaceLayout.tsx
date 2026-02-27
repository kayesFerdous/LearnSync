"use client";

// ──────────────────────────────────────────────────────
// WorkspaceLayout — Main spatial workspace wrapper
// Sits INSIDE the course layout.tsx
// ──────────────────────────────────────────────────────

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MindmapView } from "./mindmap/MindmapView";
import { ContextualDock } from "./ContextualDock";
import { RightPanel } from "./RightPanel";
import { BatchUploadModal } from "@/app/(main)/chat/_components";
import { CourseSettingsModal } from "./course-settings-modal";
import { FileDeleteDialog } from "./file-delete-dialog";
import QuizConfigModal from "@/components/quiz/QuizConfigModal";
import QuizOverlay from "@/components/quiz/QuizOverlay";
import { updateFolder, fetchFolderFiles } from "@/app/(main)/chat/_lib/api";
import { useUiStore } from "@/lib/store";
import { useQuizStore } from "@/stores/use-quiz-store";
import type { CourseFolder } from "./course-dashboard";
import type { MindmapFlowNode } from "./mindmap/types";
import type { FolderFile } from "@/app/(main)/chat/_lib/types";

interface WorkspaceLayoutProps {
    folder: CourseFolder;
}

export function WorkspaceLayout({ folder }: WorkspaceLayoutProps) {
    const router = useRouter();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FolderFile | null>(null);

    // Local folder customization state
    const [folderName, setFolderName] = useState(folder.name);
    const [folderIcon, setFolderIcon] = useState<string | undefined>(folder.icon);
    const [folderTheme, setFolderTheme] = useState<string | undefined>(folder.theme);

    const themeColor = folderTheme || folder.color || "#3b82f6";
    const displayIcon = folderIcon || "📚";

    // Quiz Store
    const { status: quizStatus, exitQuiz } = useQuizStore();

    // Track nodes for the right panel inspector
    const [canvasNodes, setCanvasNodes] = useState<MindmapFlowNode[]>([]);

    // Set breadcrumb override
    const { setBreadcrumbOverride } = useUiStore();
    useEffect(() => {
        setBreadcrumbOverride(folder.id, folderName);
    }, [folder.id, folderName, setBreadcrumbOverride]);

    const handleUploadSuccess = useCallback(
        (conversationId: string) => {
            router.push(`/folder/${folder.id}/chat/${conversationId}`);
        },
        [router, folder.id]
    );

    const handleFileDeleted = useCallback((fileId: string) => {
        setFileToDelete(null);
    }, []);

    const handleSettingsSave = useCallback(
        async (data: { name?: string; icon?: string; color?: string }) => {
            await updateFolder(folder.id, data);
            if (data.name) setFolderName(data.name);
            if (data.icon) setFolderIcon(data.icon);
            if (data.color) setFolderTheme(data.color);
            router.refresh();
        },
        [folder.id, router]
    );

    return (
        <div
            className="w-full h-full overflow-hidden relative"
            style={{ "--theme-color": themeColor } as React.CSSProperties}
        >
            {/* ── Canvas layer (z-0) ── */}
            <div className="absolute inset-0 z-0">
                <MindmapView target={{ type: "folder", id: folder.id }} />
            </div>

            {/* ── Right panel (z-20) ── */}
            <RightPanel
                folderId={folder.id}
                conversations={folder.conversations || []}
                nodes={canvasNodes}
                themeColor={themeColor}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                onFileDelete={(file) => setFileToDelete(file)}
            />

            {/* ── Bottom dock (z-30) ── */}
            <ContextualDock
                onAddSource={() => setIsUploadModalOpen(true)}
                onNewChat={() => router.push(`/folder/${folder.id}/chat`)}
                onFitView={() => {
                    window.dispatchEvent(new CustomEvent("workspace:fitView"));
                }}
                onSettings={() => setIsSettingsModalOpen(true)}
                onGenerateQuiz={() => setIsQuizModalOpen(true)}
            />

            {/* ── Modals ── */}
            <BatchUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
                folderId={folder.id}
                themeColor={themeColor}
            />
            <CourseSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSettingsSave}
                currentName={folderName}
                currentIcon={displayIcon}
                currentColor={themeColor}
            />
            <QuizConfigModal
                isOpen={isQuizModalOpen}
                onClose={() => setIsQuizModalOpen(false)}
                folderId={folder.id}
            />
            <QuizOverlay
                isOpen={quizStatus !== 'idle'}
                onClose={exitQuiz}
            />
            <FileDeleteDialog
                file={fileToDelete}
                isOpen={fileToDelete !== null}
                onClose={() => setFileToDelete(null)}
                onDeleted={handleFileDeleted}
            />
        </div>
    );
}
