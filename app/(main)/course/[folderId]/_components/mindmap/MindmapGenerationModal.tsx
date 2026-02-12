"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderFile } from "@/app/(main)/chat/_lib/types";
import { FileSelector } from "@/components/course/FileSelector";

interface MindmapGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: FolderFile[];
    onGenerate: (selectedFileIds: string[]) => void;
    isGenerating: boolean;
    mode: "generate" | "regenerate";
}

export function MindmapGenerationModal({
    isOpen,
    onClose,
    files,
    onGenerate,
    isGenerating,
    mode
}: MindmapGenerationModalProps) {
    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Initialize with all files selected by default
    useEffect(() => {
        if (isOpen && files.length > 0) {
            setSelectedIds(new Set(files.map(f => f.id)));
        }
    }, [isOpen, files]);

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleToggleAll = () => {
        if (selectedIds.size === files.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(files.map(f => f.id)));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <BrainCircuit size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground leading-tight">
                                        {mode === "generate" ? "Generate Mindmap" : "Regenerate Mindmap"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium">Select content to include</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isGenerating}
                                className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <FileSelector
                                files={files}
                                selectedIds={selectedIds}
                                onToggle={handleToggle}
                                onToggleAll={handleToggleAll}
                            />

                            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary leading-relaxed">
                                <span className="font-semibold block mb-1">💡 Tip:</span>
                                Selecting fewer, specific files can result in a more focused and detailed mindmap.
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onGenerate(Array.from(selectedIds))}
                                disabled={isGenerating || selectedIds.size === 0}
                                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        {mode === "generate" ? "Generate Map" : "Regenerate"}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
