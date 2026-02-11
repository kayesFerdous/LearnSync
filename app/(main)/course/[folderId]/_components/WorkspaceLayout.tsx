"use client";

// ──────────────────────────────────────────────────────
// WorkspaceLayout — Main spatial workspace wrapper
// Composes: MindmapView, FloatingSidebar, ContextualDock,
// InspectorDrawer, and existing modals
// ──────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { MindmapView } from "./mindmap/MindmapView";
import { FloatingSidebar } from "./FloatingSidebar";
import { ContextualDock } from "./ContextualDock";
import { InspectorDrawer } from "./InspectorDrawer";
import { BatchUploadModal } from "./batch-upload-modal";
import { CourseSettingsModal } from "./course-settings-modal";
import { FileDeleteDialog } from "./file-delete-dialog";
import { updateFolder } from "@/app/(main)/chat/_lib/api";
import { useUiStore } from "@/lib/store";
import type { CourseFolder } from "./course-dashboard";
import type { MindmapFlowNode } from "./mindmap/types";

interface WorkspaceLayoutProps {
    folder: CourseFolder;
}

export function WorkspaceLayout({ folder }: WorkspaceLayoutProps) {
    const router = useRouter();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Local folder customization state
    const [folderName, setFolderName] = useState(folder.name);
    const [folderIcon, setFolderIcon] = useState<string | undefined>(folder.icon);
    const [folderTheme, setFolderTheme] = useState<string | undefined>(folder.theme);

    // Theme color resolution (same logic as course-dashboard)
    const themeColor = folderTheme || folder.color || "#3b82f6";
    const displayIcon = folderIcon || "📚";

    // Track nodes for the inspector drawer
    const [canvasNodes, setCanvasNodes] = useState<MindmapFlowNode[]>([]);

    // Set breadcrumb override for this folder
    const { setBreadcrumbOverride } = useUiStore();
    useEffect(() => {
        setBreadcrumbOverride(folder.id, folderName);
    }, [folder.id, folderName, setBreadcrumbOverride]);

    const handleUploadSuccess = useCallback(
        (conversationId: string) => {
            router.push(`/chat/${conversationId}`);
        },
        [router]
    );

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
            className="w-screen h-screen overflow-hidden relative bg-background"
            style={{
                "--theme-color": themeColor,
            } as React.CSSProperties}
        >
            {/* Background canvas layer */}
            <div className="absolute inset-0">
                <MindmapView target={{ type: "folder", id: folder.id }} />
            </div>

            {/* Floating UI layers */}
            <FloatingSidebar />
            <ContextualDock
                onAddSource={() => setIsUploadModalOpen(true)}
                onGlobalChat={() => router.push(`/chat?folderId=${folder.id}`)}
                onFitView={() => {
                    // fitView is handled internally by MindmapView through keyboard shortcut
                    // We dispatch a custom event that MindmapView can listen for
                    window.dispatchEvent(new CustomEvent("workspace:fitView"));
                }}
                onSettings={() => setIsSettingsModalOpen(true)}
            />
            <InspectorDrawer nodes={canvasNodes} />

            {/* Modals */}
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
        </div>
    );
}
