"use client";

// ──────────────────────────────────────────────────────
// ContextualDock — Bottom-center floating action menu
// Replaces the large quick-action cards with a sleek dock
// ──────────────────────────────────────────────────────

import React from "react";
import { motion } from "framer-motion";
import {
    Upload,
    MessageSquare,
    Maximize,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DockAction {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    shortcut?: string;
}

interface ContextualDockProps {
    onAddSource: () => void;
    onGlobalChat: () => void;
    onFitView: () => void;
    onSettings: () => void;
}

export function ContextualDock({
    onAddSource,
    onGlobalChat,
    onFitView,
    onSettings,
}: ContextualDockProps) {
    const actions: DockAction[] = [
        { icon: Upload, label: "Add Source", onClick: onAddSource, shortcut: "⌘U" },
        { icon: MessageSquare, label: "Global Chat", onClick: onGlobalChat, shortcut: "⌘G" },
        { icon: Maximize, label: "Fit View", onClick: onFitView, shortcut: "⌘F" },
        { icon: Settings, label: "Settings", onClick: onSettings, shortcut: "⌘," },
    ];

    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3,
            }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
            <div className="flex items-center gap-1 px-2 py-2 rounded-2xl glass-panel shadow-2xl">
                {actions.map((action, index) => (
                    <React.Fragment key={action.label}>
                        {index > 0 && (
                            <div className="w-px h-6 bg-[color:var(--border)]/30" />
                        )}
                        <button
                            onClick={action.onClick}
                            className={cn(
                                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-[color:var(--muted-foreground)]",
                                "hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60",
                                "active:scale-95",
                                "transition-all duration-200"
                            )}
                            title={action.label}
                        >
                            <action.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                            <span className="text-sm font-medium hidden md:inline">
                                {action.label}
                            </span>
                            {/* Tooltip with shortcut */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[color:var(--card)]/95 backdrop-blur-xl border border-[color:var(--border)]/50 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                <span className="text-xs font-medium text-[color:var(--foreground)]">
                                    {action.label}
                                </span>
                                {action.shortcut && (
                                    <span className="text-[10px] text-[color:var(--muted-foreground)] ml-2">
                                        {action.shortcut}
                                    </span>
                                )}
                            </div>
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    );
}
