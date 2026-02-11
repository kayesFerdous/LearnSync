"use client";

// ──────────────────────────────────────────────────────
// ContextualDock — Bottom-center floating action menu
// macOS-style dock with workspace actions
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
}

interface ContextualDockProps {
    onAddSource: () => void;
    onNewChat: () => void;
    onFitView: () => void;
    onSettings: () => void;
}

export function ContextualDock({
    onAddSource,
    onNewChat,
    onFitView,
    onSettings,
}: ContextualDockProps) {
    const actions: DockAction[] = [
        { icon: MessageSquare, label: "New Chat", onClick: onNewChat },
        { icon: Upload, label: "Upload File", onClick: onAddSource },
        { icon: Maximize, label: "Fit View", onClick: onFitView },
        { icon: Settings, label: "Settings", onClick: onSettings },
    ];

    return (
        <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.3,
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
        >
            <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl glass-panel shadow-2xl">
                {actions.map((action, index) => (
                    <React.Fragment key={action.label}>
                        {index > 0 && (
                            <div className="w-px h-5 bg-[color:var(--border)]/20 mx-0.5" />
                        )}
                        <button
                            onClick={action.onClick}
                            className={cn(
                                "group relative flex items-center gap-2 px-3.5 py-2 rounded-xl",
                                "text-[color:var(--muted-foreground)]",
                                "hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60",
                                "active:scale-95",
                                "transition-all duration-200"
                            )}
                            title={action.label}
                        >
                            <action.icon className="h-4 w-4" strokeWidth={2} />
                            <span className="text-xs font-medium hidden md:inline">
                                {action.label}
                            </span>
                        </button>
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    );
}
