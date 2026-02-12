"use client";

import React, { useMemo } from "react";
import { Check, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FolderFile } from "@/app/(main)/chat/_lib/types";

interface FileSelectorProps {
    files: FolderFile[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    className?: string;
}

export function FileSelector({
    files,
    selectedIds,
    onToggle,
    onToggleAll,
    className
}: FileSelectorProps) {
    const isAllSelected = files.length > 0 && selectedIds.size === files.length;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} /> Source Material
                </h3>
                <button
                    onClick={onToggleAll}
                    className="text-xs font-medium text-primary hover:underline transition-all"
                >
                    {isAllSelected ? "Deselect All" : "Select All"}
                </button>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden bg-card min-h-[150px] max-h-[300px] overflow-y-auto scrollbar-thin">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                        No compatible documents found.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {files.map((file) => {
                            const isSelected = selectedIds.has(file.id);
                            return (
                                <div
                                    key={file.id}
                                    onClick={() => onToggle(file.id)}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 cursor-pointer transition-colors active:scale-[0.99]",
                                        isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                        isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-input group-hover:border-primary/50 bg-background"
                                    )}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium truncate transition-colors",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {file.filename}
                                        </p>
                                    </div>
                                    {file.file_type && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-muted rounded-md border border-border">
                                            {file.file_type}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="text-xs text-muted-foreground font-medium px-1">
                {selectedIds.size} of {files.length} files selected
            </div>
        </div>
    );
}
