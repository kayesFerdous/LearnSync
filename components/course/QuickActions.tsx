"use client";

import React from "react";
import {
    FileUp,
    Sparkles,
    MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        </div>
    );
}

function ActionButton({ icon: Icon, label, desc, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full p-4 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 group text-left h-full"
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
