"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store";
import { useQuizStore } from "@/stores/use-quiz-store";
import { updateFolder, fetchFolderFiles } from "@/app/(main)/chat/_lib/api";
import type { CourseFolder } from "./course-dashboard";
import { CourseInfoCard } from "@/components/course/CourseInfoCard";
import { MapPreview } from "@/components/course/MapPreview";
import { ActionHub } from "@/components/course/ActionHub";
import { QuickActions } from "@/components/course/QuickActions";
import { BatchUploadModal } from "./batch-upload-modal";
import QuizConfigModal from "@/components/quiz/QuizConfigModal";
import QuizOverlay from "@/components/quiz/QuizOverlay";
import { FolderFile } from "@/app/(main)/chat/_lib/types";

interface CourseDashboardProps {
    folder: CourseFolder;
}

export function CourseDashboard({ folder }: CourseDashboardProps) {
    const router = useRouter();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [files, setFiles] = useState<FolderFile[]>([]);

    // Initial folder state
    const [folderName, setFolderName] = useState(folder.name);
    const [folderIcon, setFolderIcon] = useState<string | undefined>(folder.icon);
    const [folderTheme, setFolderTheme] = useState<string | undefined>(folder.theme);

    const themeColor = folderTheme || folder.color || "#3b82f6";

    // Quiz Store
    const { status: quizStatus, exitQuiz } = useQuizStore();

    // Set breadcrumb override
    const { setBreadcrumbOverride } = useUiStore();
    useEffect(() => {
        setBreadcrumbOverride(folder.id, folderName);
    }, [folder.id, folderName, setBreadcrumbOverride]);

    // Fetch files count
    useEffect(() => {
        fetchFolderFiles(folder.id)
            .then((res) => setFiles(res.files))
            .catch(console.error);
    }, [folder.id]);

    const handleUploadSuccess = useCallback(
        (conversationId: string) => {
            router.push(`/chat/${conversationId}`);
        },
        [router]
    );

    const handleChatNavigation = useCallback(() => {
        // Navigate to chat associated with this folder, or new chat
        router.push(`/chat?folderId=${folder.id}`);
    }, [folder.id, router]);

    return (
        <div className="min-h-full bg-slate-50 p-6 md:p-8 pb-10 font-sans text-slate-900">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-6rem)] min-h-[600px]">

                {/* ── Left Column: Course Identity + Quick Actions (3 cols) ── */}
                <div className="lg:col-span-3 h-full flex flex-col gap-6">
                    {/* Top Portion (4/7) */}
                    <div className="flex-[4] min-h-0">
                        <CourseInfoCard
                            title={folderName}
                            icon={folderIcon}
                            progress={0}
                            themeColor={themeColor}
                            totalFiles={files.length}
                        />
                    </div>
                    {/* Bottom Portion (3/7) */}
                    <div className="flex-[3] min-h-0 hidden lg:block">
                        <QuickActions
                            onGenerateQuiz={() => setIsQuizModalOpen(true)}
                            onUploadFile={() => setIsUploadModalOpen(true)}
                            onChat={handleChatNavigation}
                        />
                    </div>
                    {/* Mobile Only: Show Quick Actions below */}
                    <div className="block lg:hidden">
                        <QuickActions
                            onGenerateQuiz={() => setIsQuizModalOpen(true)}
                            onUploadFile={() => setIsUploadModalOpen(true)}
                            onChat={handleChatNavigation}
                        />
                    </div>
                </div>

                {/* ── Center Stage: Map Preview (6 cols) ── */}
                <div className="lg:col-span-6 h-full flex flex-col">
                    <MapPreview folderId={folder.id} />
                </div>

                {/* ── Right Column: Recent Activity (3 cols) ── */}
                <div className="lg:col-span-3 h-full">
                    <ActionHub />
                </div>
            </div>

            {/* ── Modals ── */}
            <BatchUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
                folderId={folder.id}
                themeColor={themeColor}
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
        </div>
    );
}
