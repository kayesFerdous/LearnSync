"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import {
    FileText,
    FileImage,
    FileAudio,
    FileSpreadsheet,
    Presentation,
    Globe,
    Code,
    File,
    FileUp,
    CheckCircle2,
    Clock,
    MessageSquare,
    BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderFile, Conversation, FolderFileType } from "@/app/(main)/chat/_lib/types";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/stores/use-quiz-store";

interface ResourcesHubProps {
    files: FolderFile[];
    conversations: Conversation[];
    quizzes?: any[]; // Placeholder for now
}

// Reuse file icon logic from CourseDashboard but keep it local or import if we refactor
const getFileIcon = (type: FolderFileType) => {
    switch (type) {
        case 'pdf': return FileText;
        case 'docx': return FileText;
        case 'pptx': return Presentation;
        case 'xlsx': return FileSpreadsheet;
        case 'html': return Code;
        case 'markdown': return FileText;
        case 'png': return FileImage;
        case 'jpeg': return FileImage;
        case 'mp3': return FileAudio;
        case 'url': return Globe;
        default: return File;
    }
};

export function ResourcesHub({ files = [], conversations = [], quizzes = [] }: ResourcesHubProps) {
    const router = useRouter();
    const { loadQuiz } = useQuizStore();
    // Mock Quizzes for visual parity with request
    return (
        <div className="h-full flex flex-col gap-4">

            {/* 1. Recent Chats Section (1/3) */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Recent Chats
                    </h3>
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {conversations.length > 0 ? (
                        conversations.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => router.push(`/chat/${chat.id}`)}
                                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                                    {chat.title || 'Untitled Chat'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <MessageSquare className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No chats yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Quizzes Section (1/3) */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Quizzes
                    </h3>
                    <BrainCircuit className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {quizzes.length > 0 ? (
                        quizzes.map(quiz => (
                            <div key={quiz.id} onClick={() => loadQuiz(quiz.id)} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">

                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-700 truncate group-hover:text-slate-900">{quiz.title}</div>
                                    {quiz.difficulty && (
                                        <span className={cn(
                                            "inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide",
                                            quiz.difficulty.toLowerCase() === 'easy' && "bg-emerald-100 text-emerald-700",
                                            quiz.difficulty.toLowerCase() === 'medium' && "bg-amber-100 text-amber-700",
                                            quiz.difficulty.toLowerCase() === 'hard' && "bg-rose-100 text-rose-700",
                                            !['easy', 'medium', 'hard'].includes(quiz.difficulty.toLowerCase()) && "bg-slate-100 text-slate-500"
                                        )}>
                                            {quiz.difficulty}
                                        </span>
                                    )}
                                </div>
                                {quiz.score !== null && quiz.score !== undefined ? (
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{quiz.score}%</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Pending</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <BrainCircuit className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No quizzes yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Uploaded Files Section (1/3) */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Uploaded Files
                    </h3>
                    <FileUp className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {files.length > 0 ? (
                        files.map(file => {
                            const Icon = getFileIcon(file.file_type);
                            return (
                                <div key={file.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                                        {file.filename}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <FileUp className="w-8 h-8 opacity-20" />
                            <span className="text-xs">No files yet</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
