'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ZoomIn, ZoomOut, RotateCw, Loader2, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface PdfViewerPanelProps {
  file: File;
  onClose: () => void;
}

export function PdfViewerPanel({ file, onClose }: PdfViewerPanelProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pdfJsReady, setPdfJsReady] = useState(false);

  // Set up PDF.js worker on client side only
  useEffect(() => {
    import('react-pdf').then((pdfModule) => {
      pdfModule.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfModule.pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfJsReady(true);
    });
  }, []);

  // Create object URL when file changes
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setIsLoading(true);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
  }, []);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (!fileUrl || !pdfJsReady) {
    return (
      <div className="flex flex-col h-full bg-card border-l border-border">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground truncate" title={file.name}>
            {file.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Close PDF viewer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background shrink-0">
        {/* Page Info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              scale <= 0.5
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-foreground hover:bg-accent"
            )}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              scale >= 2.5
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-foreground hover:bg-accent"
            )}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <button
            onClick={rotate}
            className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors"
            aria-label="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Document - All pages with vertical scroll */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="flex flex-col items-center gap-4 p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center gap-4"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div key={`page_${index + 1}`} className="relative">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg rounded-sm"
                  loading={
                    <div className="flex items-center justify-center py-10 w-full">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  }
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                  {index + 1} / {numPages}
                </div>
              </div>
            ))}
          </Document>
        </div>
      </div>

      {/* Selection Hint */}
      <div className="px-3 py-2 border-t border-border bg-muted/50 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Select and copy text directly from the PDF
        </p>
      </div>
    </div>
  );
}
