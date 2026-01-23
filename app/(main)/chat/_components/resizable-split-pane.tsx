'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface ResizableSplitPaneProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  isActive: boolean;
  splitRatio: number; // 0.0 to 1.0, represents left pane percentage
  onSplitRatioChange: (ratio: number) => void;
  minRatio?: number;
  maxRatio?: number;
}

export function ResizableSplitPane({
  leftPane,
  rightPane,
  isActive,
  splitRatio,
  onSplitRatioChange,
  minRatio = 0.3,
  maxRatio = 0.7,
}: ResizableSplitPaneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempRatio, setTempRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartRatio = useRef<number>(splitRatio);
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRatio.current = splitRatio;
    setTempRatio(splitRatio);
  }, [splitRatio]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF to batch updates
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - dragStartX.current;
      const deltaRatio = deltaX / containerWidth;
      const newRatio = dragStartRatio.current + deltaRatio;

      // Constrain to min/max
      const constrainedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      
      // Update temp ratio for immediate visual feedback
      setTempRatio(constrainedRatio);
    });
  }, [isDragging, minRatio, maxRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Commit the final ratio
    if (tempRatio !== null) {
      onSplitRatioChange(tempRatio);
      setTempRatio(null);
    }
  }, [tempRatio, onSplitRatioChange]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartRatio.current = splitRatio;
    setTempRatio(splitRatio);
  }, [splitRatio]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF to batch updates
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.touches[0].clientX - dragStartX.current;
      const deltaRatio = deltaX / containerWidth;
      const newRatio = dragStartRatio.current + deltaRatio;

      const constrainedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      setTempRatio(constrainedRatio);
    });
  }, [isDragging, minRatio, maxRatio]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Commit the final ratio
    if (tempRatio !== null) {
      onSplitRatioChange(tempRatio);
      setTempRatio(null);
    }
  }, [tempRatio, onSplitRatioChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Use temp ratio during drag, otherwise use prop ratio
  const currentRatio = tempRatio !== null ? tempRatio : splitRatio;

  // Calculate widths
  const leftWidth = isActive ? `${currentRatio * 100}%` : '100%';
  const rightWidth = isActive ? `${(1 - currentRatio) * 100}%` : '0%';

  return (
    <div ref={containerRef} className="flex w-full h-full relative">
      {/* Left Pane (Chat) */}
      <div
        ref={leftPaneRef}
        className={`h-full overflow-hidden ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}`}
        style={{ width: leftWidth }}
      >
        {leftPane}
      </div>

      {/* Resizer */}
      {isActive && (
        <div
          className={`
            flex-shrink-0 w-1 h-full bg-border hover:bg-primary cursor-col-resize
            relative group transition-colors duration-150
            ${isDragging ? 'bg-primary' : ''}
          `}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize split pane"
        >
          {/* Wider hit area for easier grabbing */}
          <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          
          {/* Visual indicator on hover */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Right Pane (Viewer) */}
      <div
        ref={rightPaneRef}
        className={`
          h-full overflow-hidden
          ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}
          ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ width: rightWidth }}
      >
        {isActive && rightPane}
      </div>
    </div>
  );
}
