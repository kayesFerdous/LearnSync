'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, FileText, FileImage, FileAudio, FileSpreadsheet, FileType, Globe, Code, File, Presentation, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderFile, FolderFileType } from '@/app/(main)/chat/_lib/types';
import { deleteFile } from '@/app/(main)/chat/_lib/api';

// Icons per file type
const fileTypeIcons: Record<FolderFileType, React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  html: Code,
  markdown: FileText,
  png: FileImage,
  jpeg: FileImage,
  tiff: FileImage,
  wav: FileAudio,
  mp3: FileAudio,
  vtt: FileText,
  url: Globe,
  unknown: File,
};

const fileTypeColors: Record<FolderFileType, string> = {
  pdf: '#ef4444',
  docx: '#2563eb',
  pptx: '#f97316',
  xlsx: '#22c55e',
  html: '#8b5cf6',
  markdown: '#6b7280',
  png: '#ec4899',
  jpeg: '#ec4899',
  tiff: '#ec4899',
  wav: '#06b6d4',
  mp3: '#06b6d4',
  vtt: '#14b8a6',
  url: '#3b82f6',
  unknown: '#9ca3af',
};

interface FileDeleteDialogProps {
  file: FolderFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (fileId: string) => void;
}

export function FileDeleteDialog({ file, isOpen, onClose, onDeleted }: FileDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitAnimation, setExitAnimation] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setError(null);
      setExitAnimation(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isDeleting]);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setExitAnimation(true);
    setTimeout(() => {
      setExitAnimation(false);
      onClose();
    }, 180);
  }, [isDeleting, onClose]);

  const handleDelete = async () => {
    if (!file || isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      await deleteFile(file.id);
      // Brief success flash before closing
      setTimeout(() => {
        onDeleted(file.id);
        setIsDeleting(false);
        onClose();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !file) return null;

  const Icon = fileTypeIcons[file.file_type] || fileTypeIcons.unknown;
  const color = fileTypeColors[file.file_type] || fileTypeColors.unknown;
  const fileExt = file.filename.split('.').pop()?.toUpperCase() || file.file_type.toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-md transition-opacity duration-200",
          exitAnimation ? "opacity-0" : "opacity-100 animate-in fade-in duration-200"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-[420px] rounded-2xl bg-card border border-border overflow-hidden transition-all duration-200",
            exitAnimation
              ? "opacity-0 scale-95 translate-y-2"
              : "animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-300"
          )}
          style={{
            boxShadow: `0 25px 50px -12px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.05), 0 0 60px -15px ${color}20`
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="file-delete-title"
        >
          {/* Decorative top accent */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${color}, #ef4444)` }}
          />

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* File preview card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/60">
              <div
                className="shrink-0 p-3 rounded-xl transition-transform"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-semibold text-sm text-foreground truncate"
                  title={file.filename}
                >
                  {file.filename}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {fileExt}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pb-2">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 id="file-delete-title" className="text-base font-semibold text-foreground">
                  Delete this file?
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  This will permanently remove the file from your knowledge base. Any conversations referencing this file may lose context.
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 pt-4">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                "bg-muted hover:bg-muted/70 text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDeleting && "opacity-50 cursor-not-allowed"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                isDeleting
                  ? "bg-red-600/60 text-red-100 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]"
              )}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete File
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
