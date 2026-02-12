"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/store";
import { useQuizStore } from "@/stores/use-quiz-store";
import { updateFolder, fetchFolderFiles, fetchQuizzes } from "@/app/(main)/chat/_lib/api";
import type { CourseFolder } from "./course-dashboard";
import { CourseInfoCard } from "@/components/course/CourseInfoCard";
import { MapPreview } from "@/components/course/MapPreview";
import { ResourcesHub } from "@/components/course/ResourcesHub";
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
    const [quizzes, setQuizzes] = useState<any[]>([]);

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

    // Fetch files and quizzes
    useEffect(() => {
        fetchFolderFiles(folder.id)
            .then((res) => setFiles(res.files))
            .catch(console.error);

        fetchQuizzes(folder.id)
            .then(setQuizzes)
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
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">

                {/* ── Left Column: Course Identity + Quick Actions (3 cols) ── */}
                <div className="lg:col-span-3 h-full flex flex-col gap-6">
                    {/* Top Portion (4/7) */}
                    <div className="flex-[5] min-h-0">
                        <CourseInfoCard
                            title={folderName}
                            icon={folderIcon}
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

                {/* ── Right Column: Resources Hub (3 cols) ── */}
                <div className="lg:col-span-3 h-full">
                    <ResourcesHub
                        files={files}
                        conversations={folder.conversations || []}
                        quizzes={quizzes}
                    />
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
