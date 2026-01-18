'use client';

import { AlertCircle, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  conversationTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  conversationTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl bg-card border border-border theme-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 id="dialog-title" className="text-lg font-semibold text-foreground">
                  Delete Conversation?
                </h2>
                <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-sm text-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground break-words">
                "{conversationTitle}"
              </span>
              ? This will permanently remove the conversation and all its messages.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 border-t border-border/50 bg-muted/30">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200",
                isDeleting
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2",
                isDeleting
                  ? "bg-red-600/50 text-red-600/70 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white theme-shadow"
              )}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
