'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { ViewerType } from '../_lib/use-viewer-state';

interface ViewerContainerProps {
  viewerType: ViewerType;
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function ViewerContainer({
  viewerType,
  children,
  onClose,
  title,
}: ViewerContainerProps) {
  const getTitle = () => {
    if (title) return title;
    switch (viewerType) {
      case 'pdf':
        return 'PDF Viewer';
      case 'schedule':
        return 'Schedule Viewer';
      default:
        return 'Viewer';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <h2 className="text-sm font-semibold text-foreground">{getTitle()}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Close viewer"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
