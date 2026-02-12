"use client";

import {
    FileUp,
    Sparkles,
    MessageSquare,
} from "lucide-react";

interface QuickActionsProps {
    onGenerateQuiz: () => void;
    onUploadFile: () => void;
    onChat: () => void;
}

export function QuickActions({ onGenerateQuiz, onUploadFile, onChat }: QuickActionsProps) {
    return (
        <div className="h-full flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 px-1">
                Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 flex-1">
                <ActionButton
                    icon={MessageSquare}
                    label="Chat with Tutor"
                    desc="Ask questions"
                    onClick={onChat}
                />
                <ActionButton
                    icon={FileUp}
                    label="Upload Materials"
                    desc="Add PDFs, Docs, URLs"
                    onClick={onUploadFile}
                />
                <ActionButton
                    icon={Sparkles}
                    label="Generate Quiz"
                    desc="Test your knowledge"
                    onClick={onGenerateQuiz}
                />
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, label, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full p-3 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 group text-left h-full"
        >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700 transition-colors">
                <Icon className="w-5 h-5" />
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
