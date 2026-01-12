'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, X, File as FileIcon, ImageIcon, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile, validatePdfFile } from '../_lib/api';
import { CHAT_TAGS, isImageOnlyTag } from '../_lib/constants';

interface ChatInputProps {
  onSend: (message: string, tag: string | null, file: File | null) => void;
  onPdfSelect: (file: File | null) => void;
  selectedPdf: File | null;
}

export function ChatInput({ onSend, onPdfSelect, selectedPdf }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageOnlyMode = isImageOnlyTag(selectedTag);

  // Global keydown listener for auto-focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) {
        return;
      }
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
    if (tagId !== 'routine_generator') {
      textareaRef.current?.focus();
    }
  };

  const handleSend = () => {
    // Validation based on mode
    if (isImageOnlyMode) {
      if (!selectedFile) {
        setImageError('Please select an image to upload');
        return;
      }
      const validationError = validateImageFile(selectedFile);
      if (validationError) {
        setImageError(validationError);
        return;
      }
    } else {
      if (!input.trim() && !selectedFile && !selectedPdf) return;
    }

    setImageError(null);
    onSend(input.trim(), selectedTag, selectedFile || selectedPdf);
    
    // Reset state
    setInput('');
    setSelectedTag(null);
    setSelectedFile(null);
    if (selectedPdf) {
      onPdfSelect(null);
    }
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showTags) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedTagIndex(prev => (prev + 1) % CHAT_TAGS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedTagIndex(prev => (prev - 1 + CHAT_TAGS.length) % CHAT_TAGS.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTagSelect(CHAT_TAGS[focusedTagIndex].id);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowTags(false);
        return;
      }
    }

    if ((e.key === 'Backspace' || e.key === 'Delete') && input === '' && selectedTag) {
      setSelectedTag(null);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-2 left-4 right-4 md:left-8 md:right-8 z-10">
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
                index === focusedTagIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                index === focusedTagIndex ? "bg-primary" : "bg-muted-foreground/50"
              )}></div>
              {tag.label}
              {index === focusedTagIndex && (
                <span className="ml-auto text-[10px] opacity-70">Enter</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {imageError && (
        <div className="mb-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{imageError}</span>
          <button onClick={() => setImageError(null)} className="ml-auto hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Container */}
      <div className={cn(
        "bg-card rounded-4xl p-2 flex items-end gap-2 border transition-all theme-shadow-lg",
        isImageOnlyMode ? "border-primary" : "border-border"
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
              // Check if it's a PDF file
              if (file.type === 'application/pdf') {
                const error = validatePdfFile(file);
                if (error) {
                  setImageError(error);
                } else {
                  onPdfSelect(file);
                  setImageError(null);
                }
              } else {
                setSelectedFile(file);
                setImageError(null);
              }
            }
            e.target.value = '';
          }}
        />

        {/* Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-3 rounded-full transition-colors shrink-0",
            isImageOnlyMode
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : selectedPdf
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
          title={isImageOnlyMode ? "Upload image (required)" : "Attach file (PDF max 5MB)"}
        >
          {isImageOnlyMode ? <ImageIcon className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </button>

        {/* Input Area */}
        <div className="flex-1 py-3 min-h-[3rem] max-h-[12rem] overflow-y-auto flex flex-col justify-center">
          {/* Selected Tags/Files */}
          <div className="flex flex-wrap gap-2 mb-1 empty:hidden">
            {selectedTag && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border",
                isImageOnlyMode
                  ? "bg-primary/15 text-primary border-primary/25"
                  : "bg-primary/10 text-primary border-primary/20"
              )}>
                @{CHAT_TAGS.find(t => t.id === selectedTag)?.label}
                <button 
                  onClick={() => { setSelectedTag(null); setSelectedFile(null); setImageError(null); }} 
                  className="hover:text-primary/70 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedFile && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border",
                isImageOnlyMode
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                  : "bg-secondary text-foreground border-border"
              )}>
                {isImageOnlyMode ? <ImageIcon className="h-3 w-3 mr-1" /> : <FileIcon className="h-3 w-3 mr-1" />}
                <span className="max-w-[100px] truncate">{selectedFile.name}</span>
                <button 
                  onClick={() => { setSelectedFile(null); setImageError(null); }} 
                  className="hover:opacity-70 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedPdf && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <FileText className="h-3 w-3 mr-1" />
                <span className="max-w-[100px] truncate">{selectedPdf.name}</span>
                <button 
                  onClick={() => onPdfSelect(null)} 
                  className="hover:opacity-70 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {/* Text Input or Image Upload Prompt */}
          {isImageOnlyMode ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center gap-2 text-sm cursor-pointer py-1",
                selectedFile ? "text-muted-foreground" : "text-muted-foreground/60"
              )}
            >
              {selectedFile ? (
                <span>Image ready to send</span>
              ) : (
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Click to upload an image for routine generation...
                </span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedTag ? "Type your message..." : "Type a message or @ for tags..."}
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 resize-none h-6 max-h-[10rem] py-0"
              rows={1}
            />
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isImageOnlyMode ? !selectedFile : (!input.trim() && !selectedFile)}
          className={cn(
            "p-3 rounded-full transition-all shrink-0 mb-0.5",
            (isImageOnlyMode ? selectedFile : (input.trim() || selectedFile))
              ? "bg-primary text-primary-foreground hover:opacity-90 theme-shadow"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center mt-2">
        <p className="text-[10px] text-muted-foreground/60">AI can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
