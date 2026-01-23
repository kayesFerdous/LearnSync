import { useState, useEffect, useCallback } from 'react';

export type ViewerType = 'pdf' | 'schedule' | null;

export interface ViewerContent {
  type: ViewerType;
  data: any; // PDF file object, schedule data, etc.
}

interface UseViewerStateReturn {
  viewerContent: ViewerContent | null;
  splitRatio: number;
  isViewerActive: boolean;
  openViewer: (type: ViewerType, data: any) => void;
  closeViewer: () => void;
  setSplitRatio: (ratio: number) => void;
}

const STORAGE_KEY = 'chat-split-ratio';
const DEFAULT_SPLIT_RATIO = 0.4; // Chat takes 40% when viewer is active
const MIN_SPLIT_RATIO = 0.3;
const MAX_SPLIT_RATIO = 0.7;

export function useViewerState(): UseViewerStateReturn {
  const [viewerContent, setViewerContent] = useState<ViewerContent | null>(null);
  const [splitRatio, setSplitRatioState] = useState<number>(DEFAULT_SPLIT_RATIO);

  // Load split ratio from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ratio = parseFloat(stored);
        if (ratio >= MIN_SPLIT_RATIO && ratio <= MAX_SPLIT_RATIO) {
          setSplitRatioState(ratio);
        }
      }
    } catch (error) {
      console.error('Failed to load split ratio:', error);
    }
  }, []);

  const openViewer = useCallback((type: ViewerType, data: any) => {
    setViewerContent({ type, data });
  }, []);

  const closeViewer = useCallback(() => {
    setViewerContent(null);
  }, []);

  const setSplitRatio = useCallback((ratio: number) => {
    // Constrain ratio to valid range
    const constrainedRatio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, ratio));
    setSplitRatioState(constrainedRatio);
    
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, constrainedRatio.toString());
    } catch (error) {
      console.error('Failed to save split ratio:', error);
    }
  }, []);

  return {
    viewerContent,
    splitRatio,
    isViewerActive: viewerContent !== null,
    openViewer,
    closeViewer,
    setSplitRatio,
  };
}
