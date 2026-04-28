"use client";

import { useMemo } from "react";
import { Brain, Code, FileText, Sparkles, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseInfoCardProps {
    title: string;
    icon?: string;
    themeColor?: string;
    createdAt?: string;
    totalFiles?: number;
    onEdit?: () => void;
}

export function CourseInfoCard({
    title,
    icon,
    themeColor = "#3b82f6",
    totalFiles = 0,
    onEdit
}: CourseInfoCardProps) {

    // Resolve icon component
    const IconComponent = useMemo(() => {
        // Map of common emoji/strings to Lucide icons could go here
        // For now, default to BookOpen if no icon provided
        return BookOpen;
    }, [icon]);

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col relative overflow-hidden group">
            {/* Background decoration */}
            <div
                className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--theme-color)]/5 to-transparent rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110"
                style={{ "--theme-color": themeColor } as React.CSSProperties}
            />

            {/* Settings Button */}
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="absolute top-6 right-6 z-20 p-2 rounded-xl bg-white/40 hover:bg-white/90 backdrop-blur-sm border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-700 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Course Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            )}

            {/* Header / Icon */}
            <div className="relative z-10 mb-auto">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 bg-slate-50 text-4xl"
                >
                    {icon || <IconComponent className="w-8 h-8 text-slate-600" />}
                </div>

                <h1 className="text-4xl font-serif font-medium text-slate-900 leading-tight tracking-tight mb-2">
                    {title}
                </h1>

                <p className="text-slate-500 font-medium">
                    {totalFiles} {totalFiles === 1 ? 'Source File' : 'Source Files'}
                </p>
            </div>

            {/* Bottom Section: Removed Progress */}
            <div className="relative z-10 mt-auto">
                {/* Empty for now, or could add something else */}
            </div>
        </div>
    );
}
