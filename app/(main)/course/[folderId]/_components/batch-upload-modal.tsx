"use client";

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  File as FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Globe
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
  onFilesProcessed?: () => void; // Called when files finish processing (for folder context - no navigation)
  conversationId?: string | null;
  themeColor?: string;
  folderContext?: boolean; // If true, don't navigate on success - stay on folder page
}

export function BatchUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  onFilesProcessed,
  conversationId = null,
  themeColor = '#3b82f6',
  folderContext = true // Default to folder context (no navigation)
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
  
  // Track conversation ID for navigation after all files complete
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onFilesProcessedRef = useRef(onFilesProcessed);
  
  // Keep refs updated
  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
    onFilesProcessedRef.current = onFilesProcessed;
  }, [onSuccess, onFilesProcessed]);

  // Compute processing stats for the header
  const processingStats = useMemo(() => {
    const total = urlItems.length;
    const completed = urlItems.filter(i => i.status === 'completed').length;
    const failed = urlItems.filter(i => i.status === 'failed').length;
    const processing = urlItems.filter(i => i.status === 'pending' || i.status === 'processing').length;
    return { total, completed, failed, processing };
  }, [urlItems]);

  // Get appropriate file icon based on type
  const getSmartFileIcon = (filename: string, mimeType?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-pink-500" />;
    }
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-blue-500" />;
    }
    return <FileIcon className="w-5 h-5 text-muted-foreground" />;
  };

  // Start polling for a specific file ID
  const startPolling = useCallback((fileId: string) => {
    // Don't duplicate polling
    if (pollingIntervalRef.current.has(fileId)) return;

    const poll = async () => {
      try {
        const response = await fetchFileStatus(fileId);
        
        setUrlItems(prev => {
          const updated = prev.map(item => 
            item.id === fileId 
              ? { 
                  ...item, 
                  status: response.status, 
                  error_message: response.error_message || undefined,
                  filename: response.filename || item.filename
                }
              : item
          );
          
          // Check if all items are in terminal state
          const allDone = updated.every(item => 
            item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled'
          );
          const hasCompleted = updated.some(item => item.status === 'completed');
          
          // If all done and at least one completed
          if (allDone && hasCompleted && updated.length > 0) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              // In folder context, just notify that processing is complete (no navigation)
              if (folderContext) {
                onFilesProcessedRef.current?.();
                // Don't navigate - just keep the modal showing success
              } else {
                // In chat context, navigate to conversation
                setPendingConversationId(currentId => {
                  if (currentId && onSuccessRef.current) {
                    onSuccessRef.current(currentId);
                  }
                  return null;
                });
              }
            }, 500);
          }
          
          return updated;
        });

        // Stop polling ONLY on terminal states (completed, failed, cancelled)
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
  }, [folderContext]);

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

      // Store conversation ID for later navigation (after processing completes)
      if (result.conversation_id) {
        setPendingConversationId(result.conversation_id);
      }

      // Convert uploaded files to URL items for polling
      // The backend returns file_ids that we need to poll for processing status
      if (result.files && result.files.length > 0) {
        const newUrlItems: UrlUploadItem[] = result.files.map(file => ({
          id: file.file_id,
          url: '', // Not a URL upload, but reusing the same UI component
          filename: file.filename,
          status: 'pending' as ProcessingStatus
        }));
        
        setUrlItems(prev => [...prev, ...newUrlItems]);
        
        // Start polling for each file
        result.files.forEach(file => {
          startPolling(file.file_id);
        });
      } else {
        // No files to poll (legacy flow) - navigate immediately
        if (onSuccess && result.conversation_id) {
          onSuccess(result.conversation_id);
        }
      }

      // Clear selected files (they're now being tracked as urlItems)
      setSelectedFiles([]);
      setUploadProgress([]);
      // Don't close modal - keep it open to show processing status

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, conversationId, onSuccess, startPolling]);

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

  // Check if there are any active processing items (pending or processing)
  const hasActiveProcessing = urlItems.some(i => 
    i.status === 'pending' || i.status === 'processing'
  );
  const hasUrlItems = urlItems.length > 0;
  const allProcessingComplete = hasUrlItems && urlItems.every(i => 
    i.status === 'completed' || i.status === 'failed' || i.status === 'cancelled'
  );
  
  // Show upload components only when there's no completed processing yet
  const showUploadComponents = !allProcessingComplete;
  
  // Check if there's a valid URL in the input
  const hasUrlInput = urlInput.trim().length > 0;
  
  // Show footer when there are files to upload, URL items, or URL input has text
  const showFooter = selectedFiles.length > 0 || hasUrlItems || hasUrlInput;
  
  // Determine what to show in the header
  const getHeaderState = () => {
    if (hasActiveProcessing) return 'processing';
    if (allProcessingComplete && processingStats.completed > 0) return 'complete';
    return 'idle';
  };
  const headerState = getHeaderState();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-background rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 shadow-2xl border border-border/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Minimal */}
        <div className="relative px-6 pt-5 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {headerState === 'processing' ? 'Processing Files' : 
               headerState === 'complete' ? 'Upload Complete' : 
               'Add Sources'}
            </h2>
            {hasUrlItems && hasActiveProcessing && (
              <p className="text-sm text-muted-foreground mt-1">
                {processingStats.completed} of {processingStats.total} ready
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-5 space-y-4">
          {/* Only show upload components if no successful uploads yet */}
          {showUploadComponents && (
            <>
              {/* URL Input - Search style */}
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && urlInput.trim()) {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  placeholder="Paste a URL and press Enter..."
                  className="w-full pl-10 pr-10 py-3 text-sm border rounded-xl bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  disabled={isProcessingUrl}
                />
                {isProcessingUrl && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

          {/* Drop Zone - Clean */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-xl py-10 text-center cursor-pointer transition-all duration-200 border border-dashed",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-muted/20 hover:bg-muted/30",
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
            
            <p className="text-muted-foreground">
              {isDragging ? 'Drop files here' : 'or drop your files'}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Upload files
            </button>
          </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Sources List - Combined view for both URLs and Files */}
          {(urlItems.length > 0 || selectedFiles.length > 0) && (
            <div className="space-y-3 border-t pt-4">
              {/* Overall progress for processing items */}
              {hasActiveProcessing && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: themeColor }} />
                  <span>Processing {processingStats.processing} item{processingStats.processing > 1 ? 's' : ''}...</span>
                </div>
              )}
              
              {/* Progress bar */}
              {urlItems.length > 0 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${processingStats.total > 0 ? (processingStats.completed / processingStats.total) * 100 : 0}%`,
                      backgroundColor: themeColor,
                    }}
                  />
                </div>
              )}
              
              {/* Items list */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {/* URL Items */}
                {urlItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg group hover:bg-muted/50 transition-colors"
                  >
                    {/* Status indicator - simple dot or check */}
                    <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                      {item.status === 'completed' && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                      {item.status === 'failed' && (
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                      )}
                      {(item.status === 'pending' || item.status === 'processing') && (
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.filename}</p>
                      <p className={cn(
                        "text-xs",
                        item.status === 'completed' && "text-green-600",
                        item.status === 'failed' && "text-destructive",
                        (item.status === 'pending' || item.status === 'processing') && "text-muted-foreground"
                      )}>
                        {getStatusLabel(item.status)}
                        {item.status === 'failed' && item.error_message && ` - ${item.error_message}`}
                      </p>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.status === 'pending' || item.status === 'processing') {
                          handleCancelFile(item.id);
                        } else {
                          removeUrlItem(item.id);
                        }
                      }}
                      className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
                
                {/* File Items */}
                {selectedFiles.map((file) => {
                  const progress = getProgressStatus(file.name);
                  return (
                    <div 
                      key={file.name}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg group hover:bg-muted/50 transition-colors"
                    >
                      {/* File type icon or status */}
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {progress?.status === 'uploaded' && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        {progress?.status === 'failed' && (
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                        )}
                        {progress?.status === 'uploading' && (
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                        )}
                        {(!progress || progress.status === 'pending') && (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className={cn(
                          "text-xs",
                          progress?.status === 'uploaded' && "text-green-600",
                          progress?.status === 'failed' && "text-destructive",
                          (!progress || progress.status === 'pending' || progress.status === 'uploading') && "text-muted-foreground"
                        )}>
                          {formatFileSize(file.size)}
                          {progress?.status === 'uploading' && ` • ${progress.progress}%`}
                          {progress?.status === 'uploaded' && ' • Ready'}
                          {progress?.status === 'failed' && ` • ${progress.error || 'Failed'}`}
                        </p>
                        
                        {/* Progress bar for uploading */}
                        {progress?.status === 'uploading' && (
                          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-300 rounded-full"
                              style={{ 
                                width: `${progress.progress || 0}%`,
                                backgroundColor: themeColor,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Remove button (only when not uploading) */}
                      {!isUploading && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.name);
                          }}
                          className="shrink-0 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - show when there are files to upload OR URL items */}
        {showFooter && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
            {allProcessingComplete ? (
              // Show Done button when all processing is complete
              <button
                onClick={handleClose}
                className={cn(
                  "px-5 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-2"
                )}
                style={{ backgroundColor: themeColor }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </button>
            ) : (
              // Show Cancel and Upload buttons during upload/processing
              <>
                <button
                  onClick={handleClose}
                  disabled={isUploading || hasActiveProcessing}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {/* Show Upload button for files OR Process URL button for URL input */}
                {selectedFiles.length > 0 ? (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={cn(
                      "px-5 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-2",
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
                      `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                    )}
                  </button>
                ) : hasUrlInput ? (
                  <button
                    onClick={handleAddUrl}
                    disabled={isProcessingUrl}
                    className={cn(
                      "px-5 py-2 text-sm font-medium rounded-lg text-white transition-all flex items-center gap-2",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    style={{ backgroundColor: themeColor }}
                  >
                    {isProcessingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Process URL
                      </>
                    )}
                  </button>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
