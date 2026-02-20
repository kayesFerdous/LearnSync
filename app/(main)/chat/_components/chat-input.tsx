'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X, File as FileIcon, ImageIcon, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile, validatePdfFile } from '../_lib/api';
import { CHAT_TAGS, isImageOnlyTag } from '../_lib/constants';

interface ScopedFile {
  id: string;
  filename: string;
}

interface ChatInputProps {
  onSend: (message: string, tag: string | null, file: File | null, fileIds: string[]) => void;
  onPdfSelect: (file: File | null) => void;
  selectedPdf: File | null;
  onOpenBatchModal: () => void;
}

export function ChatInput({ onSend, onPdfSelect, selectedPdf, onOpenBatchModal }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);
  const [scopedFiles, setScopedFiles] = useState<ScopedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageOnlyMode = isImageOnlyTag(selectedTag);

  // Global keydown listener for auto-focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
      textareaRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    if (value.startsWith('@') && !selectedTag) {
      setShowTags(true);
      setFocusedTagIndex(0);
    } else {
      setShowTags(false);
    }
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTag(tagId);
    setInput('');
    setShowTags(false);
    setImageError(null);
    if (tagId !== 'routine_generator') textareaRef.current?.focus();
  };

  const addScopedFile = (file: ScopedFile) => {
    setScopedFiles(prev => prev.find(f => f.id === file.id) ? prev : [...prev, file]);
  };

  const removeScopedFile = (id: string) => {
    setScopedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-file-scope')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/x-file-scope');
    if (!raw) return;
    try {
      addScopedFile(JSON.parse(raw) as ScopedFile);
      textareaRef.current?.focus();
    } catch { /* ignore */ }
  };

  const handleSend = () => {
    if (isImageOnlyMode) {
      if (!selectedFile) { setImageError('Please select an image to upload'); return; }
      const err = validateImageFile(selectedFile);
      if (err) { setImageError(err); return; }
    } else {
      if (!input.trim() && !selectedFile && !selectedPdf && scopedFiles.length === 0) return;
    }

    setImageError(null);
    onSend(input.trim(), selectedTag, selectedFile || selectedPdf, scopedFiles.map(f => f.id));

    setInput('');
    setSelectedTag(null);
    setSelectedFile(null);
    setScopedFiles([]);
    if (selectedPdf) onPdfSelect(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showTags) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedTagIndex(p => (p + 1) % CHAT_TAGS.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedTagIndex(p => (p - 1 + CHAT_TAGS.length) % CHAT_TAGS.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); handleTagSelect(CHAT_TAGS[focusedTagIndex].id); return; }
      if (e.key === 'Escape') { e.preventDefault(); setShowTags(false); return; }
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && input === '' && selectedTag) { setSelectedTag(null); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="w-full relative z-10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Tags Dropdown */}
      {showTags && (
        <div className="absolute bottom-full mb-4 left-0 bg-card border border-border theme-shadow-lg rounded-xl p-2 min-w-[240px] animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Suggested Actions</span>
            <span className="text-[10px] font-normal opacity-50">Use ↑↓ to navigate</span>
          </div>
          {CHAT_TAGS.map((tag, index) => (
            <button
              key={tag.id}
              onClick={() => handleTagSelect(tag.id)}
              onMouseEnter={() => setFocusedTagIndex(index)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3",
                index === focusedTagIndex ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", index === focusedTagIndex ? "bg-primary" : "bg-muted-foreground/50")} />
              {tag.label}
              {index === focusedTagIndex && <span className="ml-auto text-[10px] opacity-70">Enter</span>}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {imageError && (
        <div className="mb-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{imageError}</span>
          <button onClick={() => setImageError(null)} className="ml-auto hover:opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Input Container */}
      <div className={cn(
        "bg-card rounded-4xl p-2 flex items-end gap-2 border transition-all theme-shadow-lg",
        isDragOver
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : isImageOnlyMode ? "border-primary" : "border-border"
      )}>
        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={isImageOnlyMode ? "image/jpeg,image/png,image/gif,image/webp" : undefined}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.type === 'application/pdf') {
                const error = validatePdfFile(file);
                if (error) { setImageError(error); } else { onPdfSelect(file); setImageError(null); }
              } else {
                setSelectedFile(file); setImageError(null);
              }
            }
            e.target.value = '';
          }}
        />

        {/* Attach Button */}
        <button
          onClick={() => isImageOnlyMode ? fileInputRef.current?.click() : onOpenBatchModal()}
          className={cn(
            "p-3 rounded-full transition-colors shrink-0",
            isImageOnlyMode || selectedPdf
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
          title={isImageOnlyMode ? "Upload image (required)" : "Attach files"}
        >
          {isImageOnlyMode ? <ImageIcon className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </button>

        {/* Input Area */}
        <div className="flex-1 py-2 min-h-[auto] max-h-[12rem] overflow-y-auto flex flex-col justify-center">
          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-1 empty:hidden">
            {selectedTag && (
              <span className={cn("inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border",
                isImageOnlyMode ? "bg-primary/15 text-primary border-primary/25" : "bg-primary/10 text-primary border-primary/20")}>
                @{CHAT_TAGS.find(t => t.id === selectedTag)?.label}
                <button onClick={() => { setSelectedTag(null); setSelectedFile(null); setImageError(null); }} className="hover:text-primary/70 ml-1">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedFile && (
              <span className={cn("inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border",
                isImageOnlyMode ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-secondary text-foreground border-border")}>
                {isImageOnlyMode ? <ImageIcon className="h-3 w-3 mr-1" /> : <FileIcon className="h-3 w-3 mr-1" />}
                <span className="max-w-[100px] truncate">{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); setImageError(null); }} className="hover:opacity-70 ml-1"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedPdf && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <FileText className="h-3 w-3 mr-1" />
                <span className="max-w-[100px] truncate">{selectedPdf.name}</span>
                <button onClick={() => onPdfSelect(null)} className="hover:opacity-70 ml-1"><X className="h-3 w-3" /></button>
              </span>
            )}
            {/* Scoped file chips (drag & drop from file dropdown) */}
            {scopedFiles.map(f => (
              <span key={f.id}
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25"
                title={`Scoped to: ${f.filename}`}
              >
                <FileIcon className="h-3 w-3 mr-1 shrink-0" />
                <span className="max-w-[120px] truncate">{f.filename}</span>
                <button onClick={() => removeScopedFile(f.id)} className="hover:opacity-70 ml-1 shrink-0"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>

          {/* Text Input / Image Prompt */}
          {isImageOnlyMode ? (
            <div onClick={() => fileInputRef.current?.click()}
              className={cn("flex items-center gap-2 text-sm cursor-pointer py-1",
                selectedFile ? "text-muted-foreground" : "text-muted-foreground/60")}>
              {selectedFile
                ? <span>Image ready to send</span>
                : <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Click to upload an image for routine generation...</span>}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isDragOver ? "Drop file here to scope context..."
                  : scopedFiles.length > 0 ? `Ask about ${scopedFiles.length} file${scopedFiles.length > 1 ? 's' : ''}...`
                    : selectedTag ? "Type your message..."
                      : "Type a message or @ for tags..."
              }
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 resize-none h-6 max-h-[10rem] py-0"
              rows={1}
            />
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isImageOnlyMode ? !selectedFile : (!input.trim() && !selectedFile && scopedFiles.length === 0)}
          className={cn(
            "p-3 rounded-full transition-all shrink-0 mb-0.5",
            (isImageOnlyMode ? selectedFile : (input.trim() || selectedFile || scopedFiles.length > 0))
              ? "bg-primary text-primary-foreground hover:opacity-90 theme-shadow"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Drop hint overlay */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center rounded-4xl border-2 border-dashed border-primary/50">
          <span className="text-sm font-medium text-primary bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
            Drop to scope context
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center mt-2 mb-2">
        <p className="text-[10px] text-muted-foreground/60">AI can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
