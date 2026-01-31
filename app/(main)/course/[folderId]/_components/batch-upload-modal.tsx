"use client";

import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  File as FileIcon,
  Trash2,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  batchUploadFiles, 
  validateBatchFileSize, 
  calculateTotalSize,
  MAX_UPLOAD_SIZE,
  MAX_BATCH_SIZE,
  processUrl,
  fetchFileStatus,
  cancelFileProcessing
} from '@/app/(main)/chat/_lib/api';
import type { FileUploadProgress, ProcessingStatus, UploadedFile } from '@/app/(main)/chat/_lib/types';

// URL item being processed
interface UrlUploadItem {
  id: string;           // file_id from backend
  url: string;
  filename: string;
  status: ProcessingStatus;
  error_message?: string;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: string) => void;
  conversationId?: string | null;
  themeColor?: string;
}

export function BatchUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  conversationId = null,
  themeColor = '#3b82f6'
}: BatchUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // URL processing state
  const [urlInput, setUrlInput] = useState('');
  const [urlItems, setUrlItems] = useState<UrlUploadItem[]>([]);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const pollingIntervalRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Start polling for a specific file ID
  const startPolling = useCallback((fileId: string) => {
    // Don't duplicate polling
    if (pollingIntervalRef.current.has(fileId)) return;

    const poll = async () => {
      try {
        const response = await fetchFileStatus(fileId);
        
        setUrlItems(prev => prev.map(item => 
          item.id === fileId 
            ? { 
                ...item, 
                status: response.status, 
                error_message: response.error_message || undefined,
                filename: response.filename || item.filename
              }
            : item
        ));

        // Stop polling ONLY on terminal states (completed, failed, cancelled)
        // Keep polling for 'pending' and 'processing' - even if it takes 60+ seconds
        if (response.status === 'completed' || response.status === 'failed' || response.status === 'cancelled') {
          const intervalId = pollingIntervalRef.current.get(fileId);
          if (intervalId) {
            clearInterval(intervalId);
            pollingIntervalRef.current.delete(fileId);
          }
          
          // Auto-remove cancelled items from the list
          if (response.status === 'cancelled') {
            setUrlItems(prev => prev.filter(item => item.id !== fileId));
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Don't stop polling on transient errors - keep trying
      }
    };

    // Poll immediately, then every 3 seconds for responsive updates
    poll();
    const intervalId = setInterval(poll, 3000);
    pollingIntervalRef.current.set(fileId, intervalId);
  }, []);

  // Stop all polling on unmount or close
  const stopAllPolling = useCallback(() => {
    pollingIntervalRef.current.forEach(intervalId => clearInterval(intervalId));
    pollingIntervalRef.current.clear();
  }, []);

  // Add URL for processing
  const handleAddUrl = useCallback(async () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      new URL(url); // Validate URL format
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsProcessingUrl(true);
    setError(null);

    try {
      const response = await processUrl(url, conversationId);
      
      // Extract filename from URL for display
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || urlObj.hostname;
      
      // Add placeholder item with pending status
      const newItem: UrlUploadItem = {
        id: response.file_id,
        url: url,
        filename: filename,
        status: 'pending'
      };
      
      setUrlItems(prev => [...prev, newItem]);
      setUrlInput('');
      setShowUrlInput(false);
      
      // Start polling for this file
      startPolling(response.file_id);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process URL';
      setError(message);
    } finally {
      setIsProcessingUrl(false);
    }
  }, [urlInput, conversationId, startPolling]);

  // Remove a URL item
  const removeUrlItem = useCallback((fileId: string) => {
    // Stop polling for this file
    const intervalId = pollingIntervalRef.current.get(fileId);
    if (intervalId) {
      clearInterval(intervalId);
      pollingIntervalRef.current.delete(fileId);
    }
    setUrlItems(prev => prev.filter(item => item.id !== fileId));
  }, []);

  // Cancel a file that is currently processing
  const handleCancelFile = useCallback(async (fileId: string) => {
    try {
      // Call the cancel endpoint
      await cancelFileProcessing(fileId);
      
      // Stop polling for this file
      const intervalId = pollingIntervalRef.current.get(fileId);
      if (intervalId) {
        clearInterval(intervalId);
        pollingIntervalRef.current.delete(fileId);
      }
      
      // Remove from the UI immediately
      setUrlItems(prev => prev.filter(item => item.id !== fileId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel';
      console.error('Cancel error:', message);
      // Update the item to show the error
      setUrlItems(prev => prev.map(item => 
        item.id === fileId 
          ? { ...item, error_message: message }
          : item
      ));
    }
  }, []);

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate file sizes (per-file and total batch with existing files)
    const errors = validateBatchFileSize(fileArray, selectedFiles);
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }
    
    setError(null);
    setSelectedFiles(prev => {
      // Avoid duplicates by name
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = fileArray.filter(f => !existingNames.has(f.name));
      return [...prev, ...newFiles];
    });
  }, [selectedFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback((filename: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== filename));
    setUploadProgress(prev => prev.filter(p => p.filename !== filename));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await batchUploadFiles(
        selectedFiles,
        conversationId,
        setUploadProgress
      );

      // Success - notify parent
      if (onSuccess && result.conversation_id) {
        onSuccess(result.conversation_id);
      }

      // Reset state after short delay to show completion
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress([]);
        onClose();
      }, 1000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, conversationId, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isUploading && !isProcessingUrl) {
      stopAllPolling();
      setSelectedFiles([]);
      setUploadProgress([]);
      setUrlItems([]);
      setUrlInput('');
      setShowUrlInput(false);
      setError(null);
      onClose();
    }
  }, [isUploading, isProcessingUrl, stopAllPolling, onClose]);

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

  // Get status icon for URL items based on processing status
  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Get status label text
  const getStatusLabel = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending':
        return 'Queued...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const getProgressStatus = (filename: string): FileUploadProgress | undefined => {
    return uploadProgress.find(p => p.filename === filename);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: `${themeColor}30` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Upload Files</h2>
              <p className="text-sm text-muted-foreground">
                Max {MAX_UPLOAD_SIZE / (1024 * 1024)}MB per file • {MAX_BATCH_SIZE / (1024 * 1024)}MB total
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileSelect(e.target.files);
                }
                e.target.value = '';
              }}
            />
            <Upload 
              className="w-10 h-10 mx-auto mb-3 text-muted-foreground" 
              style={{ color: isDragging ? themeColor : undefined }}
            />
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, and other document types
            </p>
          </div>

          {/* Add from URL Section */}
          <div className="space-y-2">
            {showUrlInput ? (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrl();
                      } else if (e.key === 'Escape') {
                        setShowUrlInput(false);
                        setUrlInput('');
                      }
                    }}
                    placeholder="Enter URL (e.g., https://example.com/document.pdf)"
                    className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isProcessingUrl}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim() || isProcessingUrl}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-1.5",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  style={{ backgroundColor: themeColor }}
                >
                  {isProcessingUrl ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }}
                  disabled={isProcessingUrl}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm border border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="w-4 h-4" />
                Add from URL
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {/* URL Items List */}
          {urlItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                URLs ({urlItems.length})
              </p>
              {urlItems.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg group",
                    item.status === 'failed' ? "bg-destructive/10" : "bg-muted/50"
                  )}
                >
                  <div className="text-muted-foreground">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.filename}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.url}>
                        {item.url}
                      </p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className={cn(
                        "text-xs",
                        item.status === 'completed' && "text-green-600",
                        item.status === 'failed' && "text-destructive",
                        (item.status === 'pending' || item.status === 'processing') && "text-primary"
                      )}>
                        {getStatusLabel(item.status)}
                      </p>
                    </div>
                    {item.status === 'failed' && item.error_message && (
                      <p className="text-xs text-destructive mt-1 line-clamp-2" title={item.error_message}>
                        {item.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    {/* Cancel button for pending/processing items */}
                    {(item.status === 'pending' || item.status === 'processing') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelFile(item.id);
                        }}
                        className="p-1 hover:bg-destructive/10 rounded transition-all"
                        title="Cancel processing"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                    {/* Remove button for completed/failed items */}
                    {(item.status === 'completed' || item.status === 'failed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUrlItem(item.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <p className={cn(
                  "text-xs",
                  calculateTotalSize(selectedFiles) > MAX_BATCH_SIZE 
                    ? "text-destructive font-medium" 
                    : "text-muted-foreground"
                )}>
                  {formatFileSize(calculateTotalSize(selectedFiles))} / {formatFileSize(MAX_BATCH_SIZE)}
                </p>
              </div>
              {selectedFiles.map((file) => {
                const progress = getProgressStatus(file.name);
                return (
                  <div 
                    key={file.name}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                  >
                    <div className="text-muted-foreground">
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        {progress && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className={cn(
                              "text-xs",
                              progress.status === 'uploaded' && "text-green-600",
                              progress.status === 'failed' && "text-destructive",
                              progress.status === 'uploading' && "text-primary"
                            )}>
                              {progress.status === 'uploading' && `${progress.progress}%`}
                              {progress.status === 'uploaded' && 'Complete'}
                              {progress.status === 'failed' && progress.error}
                              {progress.status === 'pending' && 'Waiting...'}
                            </p>
                          </>
                        )}
                      </div>
                      {/* Progress bar */}
                      {progress?.status === 'uploading' && (
                        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress.progress || 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {progress?.status === 'uploaded' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {progress?.status === 'failed' && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      {progress?.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      )}
                      {!isUploading && !progress && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.name);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ backgroundColor: themeColor }}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
