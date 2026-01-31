"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcessingStatus, FileStatusResponse, UploadedFile } from './types';
import { fetchFileStatus } from './api';

// Default polling interval (3 seconds for responsive feedback)
const DEFAULT_POLL_INTERVAL = 3000;

export interface UseFilePollingOptions {
  /**
   * Polling interval in milliseconds (default: 3000ms for more responsive updates)
   */
  pollInterval?: number;
  /**
   * Callback when status changes to 'completed'
   */
  onCompleted?: (file: FileStatusResponse) => void;
  /**
   * Callback when status changes to 'failed'
   */
  onFailed?: (file: FileStatusResponse) => void;
  /**
   * Callback when status changes to 'cancelled'
   */
  onCancelled?: (file: FileStatusResponse) => void;
  /**
   * Callback on any status change
   */
  onStatusChange?: (file: FileStatusResponse) => void;
  /**
   * Whether to start polling immediately (default: true)
   */
  autoStart?: boolean;
}

export interface UseFilePollingResult {
  /**
   * Current file status
   */
  status: ProcessingStatus | null;
  /**
   * Error message from the backend (if failed)
   */
  errorMessage: string | null;
  /**
   * Filename
   */
  filename: string | null;
  /**
   * Whether currently polling
   */
  isPolling: boolean;
  /**
   * Any fetch error that occurred
   */
  fetchError: string | null;
  /**
   * Start polling manually
   */
  startPolling: () => void;
  /**
   * Stop polling manually
   */
  stopPolling: () => void;
}

/**
 * Hook to poll the file status endpoint until processing is complete or failed
 * @param fileId - The file ID to poll for status
 * @param options - Polling options
 */
export function useFilePolling(
  fileId: string | null,
  options: UseFilePollingOptions = {}
): UseFilePollingResult {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    onCompleted,
    onFailed,
    onCancelled,
    onStatusChange,
    autoStart = true
  } = options;

  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Use refs to track latest callbacks without triggering re-renders
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const onCancelledRef = useRef(onCancelled);
  const onStatusChangeRef = useRef(onStatusChange);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
    onCancelledRef.current = onCancelled;
    onStatusChangeRef.current = onStatusChange;
  }, [onCompleted, onFailed, onCancelled, onStatusChange]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!fileId) return;

    try {
      const response = await fetchFileStatus(fileId);
      
      setStatus(response.status);
      setErrorMessage(response.error_message);
      setFilename(response.filename);
      setFetchError(null);
      
      // Call status change callback
      onStatusChangeRef.current?.(response);

      // Handle terminal states - ONLY stop polling on these states
      if (response.status === 'completed') {
        stopPolling();
        onCompletedRef.current?.(response);
      } else if (response.status === 'failed') {
        stopPolling();
        onFailedRef.current?.(response);
      } else if (response.status === 'cancelled') {
        stopPolling();
        onCancelledRef.current?.(response);
      }
      // For 'pending' and 'processing', continue polling - do NOT stop
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch file status';
      setFetchError(message);
      // Don't stop polling on transient errors, but log them
      console.error('File polling error:', message);
    }
  }, [fileId, stopPolling]);

  const startPolling = useCallback(() => {
    if (!fileId || isPolling) return;
    
    setIsPolling(true);
    setFetchError(null);
    
    // Poll immediately
    poll();
    
    // Set up interval for subsequent polls
    intervalRef.current = setInterval(poll, pollInterval);
  }, [fileId, isPolling, poll, pollInterval]);

  // Auto-start polling when fileId changes
  useEffect(() => {
    if (fileId && autoStart) {
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [fileId, autoStart, startPolling, stopPolling]);

  return {
    status,
    errorMessage,
    filename,
    isPolling,
    fetchError,
    startPolling,
    stopPolling
  };
}

// ============================================
// Multi-file Polling Hook
// ============================================

export interface PollingFile {
  id: string;
  filename: string;
  status: ProcessingStatus;
  error_message?: string;
}

export interface UseMultiFilePollingOptions {
  /**
   * Polling interval in milliseconds (default: 4000ms)
   */
  pollInterval?: number;
  /**
   * Callback when all files are done (completed or failed)
   */
  onAllComplete?: (files: PollingFile[]) => void;
  /**
   * Callback when a single file completes
   */
  onFileComplete?: (file: PollingFile) => void;
  /**
   * Callback when a single file fails
   */
  onFileFailed?: (file: PollingFile) => void;
}

export interface UseMultiFilePollingResult {
  /**
   * All files being tracked
   */
  files: PollingFile[];
  /**
   * Whether any file is still being polled
   */
  isPolling: boolean;
  /**
   * Add a new file to poll
   */
  addFile: (file: PollingFile) => void;
  /**
   * Remove a file from polling
   */
  removeFile: (fileId: string) => void;
  /**
   * Clear all files
   */
  clearFiles: () => void;
}

/**
 * Hook to manage polling for multiple files simultaneously
 */
export function useMultiFilePolling(
  options: UseMultiFilePollingOptions = {}
): UseMultiFilePollingResult {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    onAllComplete,
    onFileComplete,
    onFileFailed
  } = options;

  const [files, setFiles] = useState<PollingFile[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for callbacks
  const onAllCompleteRef = useRef(onAllComplete);
  const onFileCompleteRef = useRef(onFileComplete);
  const onFileFailedRef = useRef(onFileFailed);

  useEffect(() => {
    onAllCompleteRef.current = onAllComplete;
    onFileCompleteRef.current = onFileComplete;
    onFileFailedRef.current = onFileFailed;
  }, [onAllComplete, onFileComplete, onFileFailed]);

  // Only poll files that are still in progress (not completed, failed, or cancelled)
  const isPolling = files.some(f => f.status === 'pending' || f.status === 'processing');

  const poll = useCallback(async () => {
    // Only poll files in non-terminal states
    const activeFiles = files.filter(f => 
      f.status === 'pending' || f.status === 'processing'
    );
    
    if (activeFiles.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll all active files in parallel
    const updates = await Promise.allSettled(
      activeFiles.map(async (file) => {
        const response = await fetchFileStatus(file.id);
        return {
          ...file,
          status: response.status,
          error_message: response.error_message || undefined
        };
      })
    );

    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      updates.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const updatedFile = result.value;
          const fileIndex = newFiles.findIndex(f => f.id === updatedFile.id);
          if (fileIndex !== -1) {
            const oldStatus = newFiles[fileIndex].status;
            newFiles[fileIndex] = updatedFile;
            
            // Fire callbacks for status changes
            if (oldStatus !== updatedFile.status) {
              if (updatedFile.status === 'completed') {
                onFileCompleteRef.current?.(updatedFile);
              } else if (updatedFile.status === 'failed') {
                onFileFailedRef.current?.(updatedFile);
              }
            }
          }
        }
      });

      // Check if all files are done (completed, failed, or cancelled)
      const allDone = newFiles.every(f => 
        f.status === 'completed' || f.status === 'failed' || f.status === 'cancelled'
      );
      if (allDone && newFiles.length > 0) {
        onAllCompleteRef.current?.(newFiles);
      }

      return newFiles;
    });
  }, [files]);

  // Start/stop polling based on active files
  useEffect(() => {
    const hasActiveFiles = files.some(f => f.status === 'pending' || f.status === 'processing');
    
    if (hasActiveFiles && !intervalRef.current) {
      // Poll immediately
      poll();
      // Set up interval
      intervalRef.current = setInterval(poll, pollInterval);
    } else if (!hasActiveFiles && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [files, poll, pollInterval]);

  const addFile = useCallback((file: PollingFile) => {
    setFiles(prev => {
      // Don't add duplicates
      if (prev.some(f => f.id === file.id)) {
        return prev;
      }
      return [...prev, file];
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isPolling,
    addFile,
    removeFile,
    clearFiles
  };
}
