"use client";

import { useState, useRef, useEffect } from 'react';
import {
    Paperclip,
    FileText,
    FileImage,
    FileSpreadsheet,
    FileCode,
    Globe,
    File as FileIcon,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { fetchConversationFiles } from '@/app/(main)/chat/_lib/api';
import type { FolderFile, ProcessingStatus } from '@/app/(main)/chat/_lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationFileDropdownProps {
    conversationId: string;
}

export function ConversationFileDropdown({ conversationId }: ConversationFileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<FolderFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset state when conversation changes
    useEffect(() => {
        setHasFetched(false);
        setFiles([]);
        setIsOpen(false);
        setError(null);
    }, [conversationId]);

    const handleToggle = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        // Only fetch on open if we haven't already
        if (nextState && !hasFetched && conversationId) {
            void fetchFiles();
        }
    };

    const fetchFiles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const resp = await fetchConversationFiles(conversationId);
            setFiles(resp.files || []);
            setHasFetched(true);
        } catch (err: any) {
            setError(err.message || 'Failed to load files');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to determine icon based on file_type extension or "url" string
    const getFileIcon = (fileType?: string, filename?: string) => {
        const type = fileType?.toLowerCase() || '';
        const name = filename?.toLowerCase() || '';

        if (type === 'url') {
            return <Globe className="w-4 h-4 text-blue-400" />;
        }

        // Check type or extension
        if (type === 'pdf' || name.endsWith('.pdf')) {
            return <FileText className="w-4 h-4 text-red-500" />;
        }
        if (['png', 'jpeg', 'jpg', 'gif', 'svg'].includes(type) || name.match(/\.(png|jpe?g|gif|svg)$/)) {
            return <FileImage className="w-4 h-4 text-pink-500" />;
        }
        if (['xlsx', 'xls', 'csv'].includes(type) || name.match(/\.(xlsx?|csv)$/)) {
            return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
        }
        if (['docx', 'doc'].includes(type) || name.match(/\.(docx?)$/)) {
            return <FileText className="w-4 h-4 text-blue-600" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'py'].includes(type) || name.match(/\.(jsx?|tsx?|py)$/)) {
            return <FileCode className="w-4 h-4 text-yellow-500" />;
        }

        return <FileIcon className="w-4 h-4 text-muted-foreground" />;
    };

    // Status mapping
    const getStatusText = (status: ProcessingStatus) => {
        switch (status) {
            case 'completed': return 'Ready';
            case 'processing': return 'Processing';
            case 'pending': return 'Queued';
            case 'failed': return 'Failed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusColor = (status: ProcessingStatus) => {
        switch (status) {
            case 'completed': return 'text-green-500';
            case 'failed': return 'text-red-500';
            case 'processing':
            case 'pending': return 'text-yellow-500';
            case 'cancelled': return 'text-muted-foreground';
            default: return 'text-muted-foreground';
        }
    };

    const fileCount = hasFetched ? files.length : null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors duration-200 border",
                    isOpen
                        ? "bg-accent border-border text-foreground"
                        : "bg-background border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
            >
                <Paperclip className="w-4 h-4" />
                <span>Files</span>
                {fileCount !== null && fileCount > 0 && (
                    <span className="flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 ml-0.5">
                        {fileCount}
                    </span>
                )}
                <ChevronDown className={cn("w-3 h-3 ml-0.5 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Conversation Files
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchFiles(); }}
                            className="text-xs text-primary hover:underline hover:text-primary/80"
                            disabled={isLoading}
                        >
                            Refresh
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-64 overflow-y-auto w-full p-2 space-y-1 scrollbar-custom">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-xs">Loading files...</span>
                            </div>
                        ) : error ? (
                            <div className="py-4 px-3 text-center text-sm text-destructive bg-destructive/10 rounded-lg">
                                {error}
                            </div>
                        ) : files.length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <FileIcon className="w-6 h-6 opacity-20" />
                                <span className="text-sm">No files uploaded yet</span>
                            </div>
                        ) : (
                            files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                                >
                                    <div className="mt-0.5 shrink-0 bg-background p-1.5 rounded-md border border-border/50">
                                        {getFileIcon(file.file_type, file.filename)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors" title={file.filename}>
                                            {file.filename}
                                        </p>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-[10px] text-muted-foreground">
                                                {file.created_at ? formatDistanceToNow(new Date(file.created_at), { addSuffix: true }) : ''}
                                            </span>
                                            <span className={cn("text-[10px] font-medium", getStatusColor(file.status))}>
                                                {getStatusText(file.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
