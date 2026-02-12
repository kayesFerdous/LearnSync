"use client";

import { useMemo } from "react";
import { Brain, Code, FileText, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseInfoCardProps {
    title: string;
    icon?: string;
    progress?: number;
    themeColor?: string;
    createdAt?: string;
    totalFiles?: number;
}

export function CourseInfoCard({
    title,
    icon,
    progress = 0,
    themeColor = "#3b82f6",
    totalFiles = 0
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

            {/* Bottom Section: Progress */}
            <div className="relative z-10 mt-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Mastery
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                        {progress}%
                    </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: themeColor
                        }}
                    />
                </div>

                {progress === 0 && (
                    <p className="text-xs text-slate-400 mt-3">
                        Start by exploring the map or taking a quiz.
                    </p>
                )}
            </div>
        </div>
    );
}
