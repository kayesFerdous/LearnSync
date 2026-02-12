"use client";

import React from "react";
import {
    FileUp,
    Sparkles,
    MessageSquare,
    Clock,
    ChevronRight,
    FileText,
    BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionHubProps {
    onGenerateQuiz: () => void;
    onUploadFile: () => void;
    onChat: () => void;
}

export function ActionHub({ onGenerateQuiz, onUploadFile, onChat }: ActionHubProps) {
    // Mock Data for Recent Activity
    const recentActivity = [
        { id: 1, type: "quiz", title: "Machine Learning Basics", time: "2h ago", score: "85%" },
        { id: 2, type: "file", title: "Lecture_04_Notes.pdf", time: "5h ago", size: "2.4 MB" },
        { id: 3, type: "chat", title: "Explained gradient descent", time: "1d ago" },
    ];

    return (
        <div className="space-y-6 h-full flex flex-col">

            {/* ── Quick Actions Grid ── */}
            <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 px-1">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <ActionButton
                        icon={Sparkles}
                        label="Generate Quiz"
                        desc="Test your knowledge"
                        color="bg-amber-50 text-amber-600 border-amber-100"
                        onClick={onGenerateQuiz}
                    />
                    <ActionButton
                        icon={FileUp}
                        label="Upload Materials"
                        desc="Add PDFs, Docs, URLs"
                        color="bg-blue-50 text-blue-600 border-blue-100"
                        onClick={onUploadFile}
                    />
                    <ActionButton
                        icon={MessageSquare}
                        label="Chat with Tutor"
                        desc="Ask questions"
                        color="bg-emerald-50 text-emerald-600 border-emerald-100"
                        onClick={onChat}
                    />
                </div>
            </section>

            {/* ── Recent Activity ── */}
            <section className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Recent Activity
                    </h3>
                    <button className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                        View All
                    </button>
                </div>

                <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-2 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        {recentActivity.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center border",
                                    item.type === 'quiz' && "bg-amber-50 border-amber-100 text-amber-600",
                                    item.type === 'file' && "bg-indigo-50 border-indigo-100 text-indigo-600",
                                    item.type === 'chat' && "bg-emerald-50 border-emerald-100 text-emerald-600",
                                )}>
                                    {item.type === 'quiz' && <BrainCircuit className="w-5 h-5" />}
                                    {item.type === 'file' && <FileText className="w-5 h-5" />}
                                    {item.type === 'chat' && <MessageSquare className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="w-3 h-3" /> {item.time}
                                        </span>
                                        {item.score && (
                                            <span className="bg-green-100 text-green-700 px-1.5 rounded-sm font-semibold">
                                                {item.score}
                                            </span>
                                        )}
                                        {item.size && <span>• {item.size}</span>}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-transform group-hover:translate-x-0.5" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}

function ActionButton({ icon: Icon, label, desc, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full p-4 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 group text-left"
        >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <span className="block text-sm font-bold text-slate-800 group-hover:text-slate-900">
                    {label}
                </span>
                <span className="block text-xs text-slate-500 group-hover:text-slate-600">
                    {desc}
                </span>
            </div>
        </button>
    )
}
