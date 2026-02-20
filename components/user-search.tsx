"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";


import { searchUsers } from "@/app/(main)/messaging/_lib/api";
import { SearchUser } from "@/app/(main)/messaging/_lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link"; // For navigation or just useRouter

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                setIsLoading(true);
                try {
                    const data = await searchUsers(query);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (userId: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(`/profile/${userId}`);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md hidden sm:block">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/50 border border-transparent focus:bg-background focus:border-border/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm placeholder:text-muted-foreground/70"
                    onFocus={() => {
                        if (query.trim()) setIsOpen(true);
                    }}
                />
                {isLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : query ? (
                    <button
                        onClick={() => {
                            setQuery("");
                            setIsOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            <AnimatePresence>
                {isOpen && (results.length > 0 || query.trim()) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-popover/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                    >
                        {results.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    People
                                </div>
                                {results.map((user) => (
                                    <button
                                        key={user.user_id}
                                        onClick={() => handleSelect(user.user_id)}
                                        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-accent/80 transition-colors text-left group"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-medium text-foreground truncate">{user.username}</span>
                                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            !isLoading && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No users found for "{query}"
                                </div>
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
