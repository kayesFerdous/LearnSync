"use client";

// ──────────────────────────────────────────────────────
// FloatingSidebar — Detached glass pill sidebar
// Collapses to icons only for maximum canvas space
// ──────────────────────────────────────────────────────

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    MessageSquare,
    Calendar,
    Settings,
    Sparkles,
    FileText,
    Shield,
    User,
    Clock,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/editor", label: "Editor", icon: FileText },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/routines", label: "Schedule", icon: Clock },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/admin", label: "Admin", icon: Shield },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function FloatingSidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleWorkspaceSidebar } = useWorkspaceStore();

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                "fixed left-4 top-4 bottom-4 z-40 flex flex-col",
                "glass-panel rounded-2xl shadow-2xl",
                "transition-all duration-300 ease-out",
                sidebarCollapsed ? "w-16" : "w-56"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-3.5 py-4 border-b border-[color:var(--border)]/30">
                <div className="shrink-0 h-9 w-9 flex items-center justify-center bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--primary)]/80 rounded-xl text-[color:var(--primary-foreground)] shadow-md">
                    <Sparkles className="h-4.5 w-4.5" />
                </div>
                <AnimatePresence>
                    {!sidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <span className="text-sm font-bold text-[color:var(--foreground)]">
                                LearnSync
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-2.5 rounded-xl transition-all duration-200",
                                sidebarCollapsed
                                    ? "p-2.5 justify-center"
                                    : "px-3 py-2.5",
                                isActive
                                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-md shadow-[color:var(--primary)]/20"
                                    : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60"
                            )}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className="shrink-0 h-[18px] w-[18px]" strokeWidth={2} />
                            <AnimatePresence>
                                {!sidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="text-sm font-medium truncate overflow-hidden whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {/* Tooltip for collapsed mode */}
                            {sidebarCollapsed && (
                                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[color:var(--card)]/95 backdrop-blur-xl border border-[color:var(--border)]/50 shadow-lg text-xs font-medium text-[color:var(--foreground)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="px-2 py-3 border-t border-[color:var(--border)]/30">
                <button
                    onClick={toggleWorkspaceSidebar}
                    className={cn(
                        "flex items-center gap-2 w-full rounded-xl transition-all duration-200",
                        "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/60",
                        sidebarCollapsed ? "p-2.5 justify-center" : "px-3 py-2.5"
                    )}
                    title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {sidebarCollapsed ? (
                        <ChevronsRight className="h-[18px] w-[18px]" />
                    ) : (
                        <>
                            <ChevronsLeft className="h-[18px] w-[18px]" />
                            <span className="text-sm font-medium">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </motion.aside>
    );
}
