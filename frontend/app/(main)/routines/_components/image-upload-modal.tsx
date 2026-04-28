'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, ImageIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  error?: string | null;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  error,
}: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return false;
    }
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleUploadClick = async () => {
    if (selectedFile) {
      await onUpload(selectedFile);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    clearSelection();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-y-auto py-8">
        <div
          className="pointer-events-auto w-full max-w-lg mx-4 rounded-2xl bg-card border border-border theme-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                  Upload Schedule Image
                </h2>
                <p className="text-xs text-muted-foreground">
                  AI will extract your class schedule automatically
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Drop Zone */}
            <div
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-all duration-200",
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : selectedFile
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />

              {previewUrl ? (
                <div className="p-4">
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-contain"
                    />
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearSelection();
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-3 truncate">
                    {selectedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="py-12 px-6 text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop your schedule image here
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PNG, JPG, JPEG, WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-2">
              <p className="text-xs font-medium text-foreground">Tips for best results:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use a clear, high-resolution image
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Ensure text is readable and not blurry
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Include day names and time information
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 border-t border-border/50 bg-muted/30">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadClick}
              disabled={!selectedFile || isUploading}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                !selectedFile || isUploading
                  ? "bg-primary/50 text-primary-foreground/70 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
