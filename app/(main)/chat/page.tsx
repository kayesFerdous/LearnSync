'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Bot, X, File as FileIcon, ImageIcon, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  thinking?: {
    status?: string;
  };
  isStreaming?: boolean;
}

type BackendStreamEvent =
  | { type: 'status'; message?: string }
  | { type: 'chunk'; content?: string }
  | { type: 'done' }
  | { type: 'error'; message?: string };

const BACKEND_URL = 'http://localhost:8000/chat_bot';

const parseSseBlock = (block: string): BackendStreamEvent | null => {
  const dataLines = block
    .split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trimStart());
  const jsonText = dataLines.join('\n').trim();
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText) as BackendStreamEvent;
  } catch {
    return null;
  }
};

const TAGS = [
  { id: 'schedular', label: 'Scheduler' },
  { id: 'routine_generator', label: 'Routine Generator' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hello! I am your personal assistant. How can I help you organize your day?' }
  ]);
  const [input, setInput] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [focusedTagIndex, setFocusedTagIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingChunkRef = useRef('');
  const flushRafRef = useRef<number | null>(null);

  const isImageOnlyMode = selectedTag === 'routine_generator';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Global keydown listener for auto-focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is already on an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore modifier keys and non-character keys (roughly)
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) {
        return;
      }

      // Focus textarea
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
      setFocusedTagIndex(0); // Reset focus to first item
    } else {
      setShowTags(false);
    }
  };

  const handleTagSelect = (tagId: string) => {
    setSelectedTag(tagId);
    setInput('');
    setShowTags(false);
    setImageError(null);
    // Don't auto-focus textarea for image-only mode
    if (tagId !== 'routine_generator') {
      textareaRef.current?.focus();
    }
  };

  const updateMessage = (messageId: string, updater: (m: Message) => Message) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updater(prev[idx]);
      return next;
    });
  };

  const setThinkingStatus = (assistantId: string, status?: string) => {
    updateMessage(assistantId, m => ({
      ...m,
      thinking: { status },
    }));
  };

  const appendAssistantContent = (assistantId: string, chunk: string) => {
    if (!chunk) return;
    updateMessage(assistantId, m => ({ ...m, content: m.content + chunk }));
  };

  const setAssistantStreaming = (assistantId: string, isStreaming: boolean) => {
    updateMessage(assistantId, m => ({ ...m, isStreaming }));
  };

  const enqueueAssistantChunk = (assistantId: string, chunk: string) => {
    if (!chunk) return;
    pendingChunkRef.current += chunk;
    if (flushRafRef.current != null) return;
    flushRafRef.current = window.requestAnimationFrame(() => {
      const toFlush = pendingChunkRef.current;
      pendingChunkRef.current = '';
      flushRafRef.current = null;
      appendAssistantContent(assistantId, toFlush);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Keep the full data URL (e.g., "data:image/png;base64,...")
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const validateImageFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Image size must be less than 10MB';
    }
    return null;
  };

  const handleSend = async () => {
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
      if (!input.trim() && !selectedFile) return;
    }

    setImageError(null);

    const userMessage = input.trim();
    const tag = selectedTag;
    const tagForRequest = tag ?? 'chatter';
    const fileToSend = selectedFile;

    const now = Date.now();
    const userMessageId = `${now}`;
    const assistantId = `${now}-ai`;

    // Build user message content for display
    const displayContent = isImageOnlyMode
      ? `📷 Image uploaded${fileToSend ? `: ${fileToSend.name}` : ''}`
      : userMessage || (fileToSend ? `📎 ${fileToSend.name}` : '');

    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: displayContent,
      },
      {
        id: assistantId,
        role: 'ai',
        content: '',
        thinking: { status: undefined },
        isStreaming: true,
      },
    ]);

    setInput('');
    setSelectedTag(null);
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build payload with optional fields
      const payload: { message?: string; tag: string; image?: string } = {
        tag: tagForRequest,
      };

      if (userMessage) {
        payload.message = userMessage;
      }

      // Convert image to base64 if present
      if (fileToSend) {
        try {
          payload.image = await fileToBase64(fileToSend);
        } catch {
          throw new Error('Failed to process the image. Please try again.');
        }
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      console.log(response)

      if (!response.ok) {
        throw new Error(`Backend error (${response.status})`);
      }
      if (!response.body) {
        throw new Error('Backend did not provide a streaming response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          const event = parseSseBlock(block);
          if (!event) continue;

          if (event.type === 'status') {
            // Replace any existing indicator
            setThinkingStatus(assistantId, event.message ?? 'Thinking...');
          } else if (event.type === 'chunk') {
            // Once text starts streaming, hide the thinking indicator.
            setThinkingStatus(assistantId, undefined);
            enqueueAssistantChunk(assistantId, event.content ?? '');
          } else if (event.type === 'error') {
            setThinkingStatus(assistantId, undefined);
            appendAssistantContent(assistantId, `\n\n${event.message ?? 'Error'}`);
            finished = true;
          } else if (event.type === 'done') {
            setThinkingStatus(assistantId, undefined);
            finished = true;
          }

          if (finished) {
            try { await reader.cancel(); } catch { /* ignore */ }
            break;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Chat backend error:', error);
      setThinkingStatus(assistantId, undefined);
      appendAssistantContent(assistantId, `\n\nSorry, there was an error connecting to the server. (${message})`);
    } finally {
      if (flushRafRef.current != null) {
        window.cancelAnimationFrame(flushRafRef.current);
        flushRafRef.current = null;
      }
      if (pendingChunkRef.current) {
        appendAssistantContent(assistantId, pendingChunkRef.current);
        pendingChunkRef.current = '';
      }
      setAssistantStreaming(assistantId, false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showTags) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedTagIndex(prev => (prev + 1) % TAGS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedTagIndex(prev => (prev - 1 + TAGS.length) % TAGS.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTagSelect(TAGS[focusedTagIndex].id);
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
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto relative">
      {/* Header Area - Optional for context */}
      <div className="shrink-0 py-4 text-center opacity-80 hover:opacity-100 transition-opacity">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground border border-border shadow-sm">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI Assistant</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-32 scroll-smooth scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === 'ai' && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}

            <div className={cn(
              "max-w-[78%] md:max-w-[62%] p-4 relative group text-sm leading-relaxed",
              msg.role === 'user'
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                : "bg-muted text-foreground rounded-2xl rounded-tl-sm"
            )}>
              {msg.role === 'ai' && msg.isStreaming && msg.content.trim() === '' ? (
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-pulse [animation-delay:300ms]" />
                  </div>
                  <span className="leading-relaxed">{msg.thinking?.status ?? 'Thinking...'} </span>
                </div>
              ) : null}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary underline underline-offset-2 font-medium hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-2 last:mb-0 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-2 last:mb-0 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 last:mb-0 text-foreground" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3 mt-4 first:mt-0 last:mb-0 text-foreground" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 last:mb-0 text-foreground" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic mb-2 last:mb-0 opacity-80" {...props} />,
                  code: ({ node, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    return isInline ? (
                      <code className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-3 rounded-lg overflow-hidden bg-muted border border-border text-foreground last:mb-0">
                        <div className="flex items-center justify-between px-4 py-1.5 bg-muted-foreground/10 text-xs text-muted-foreground border-b border-border">
                          <span>{match?.[1] || 'code'}</span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                          <code className={cn("text-sm font-mono", className)} {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>

              {/* Timestamp or Status (Hidden by default, shown on hover) */}
              <div className={cn(
                "absolute -bottom-5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                msg.role === 'user' ? "right-2" : "left-2"
              )}>
                Just now
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="hidden">
                {/* User avatar hidden for cleaner look as per request? Or keep it? User said "User Bubble: Dark gray background... white text". Didn't specify avatar. I'll hide it to be cleaner. */}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 left-4 right-4 md:left-10 md:right-10 z-10">
        {showTags && (
          <div className="absolute bottom-full mb-4 left-0 bg-card shadow-xl rounded-xl border border-border p-2 min-w-[240px] animate-in fade-in slide-in-from-bottom-2 overflow-hidden">
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Suggested Actions</span>
              <span className="text-[10px] font-normal opacity-50">Use ↑↓ to navigate</span>
            </div>
            {TAGS.map((tag, index) => (
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

        <div className={cn(
          "bg-card shadow-2xl rounded-[2rem] p-2 flex items-end gap-2 border transition-all",
          isImageOnlyMode ? "border-primary/30" : "border-border"
        )}>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={isImageOnlyMode ? "image/jpeg,image/png,image/gif,image/webp" : undefined}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                setImageError(null);
              }
              // Reset input so same file can be selected again
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "p-3 rounded-full transition-colors shrink-0",
              isImageOnlyMode
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
            title={isImageOnlyMode ? "Upload image (required)" : "Attach file"}
          >
            {isImageOnlyMode ? <ImageIcon className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
          </button>

          <div className="flex-1 py-3 min-h-[3rem] max-h-[12rem] overflow-y-auto flex flex-col justify-center">
            <div className="flex flex-wrap gap-2 mb-1 empty:hidden">
              {selectedTag && (
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium animate-in zoom-in duration-200 border",
                  isImageOnlyMode
                    ? "bg-primary/15 text-primary border-primary/25"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  @{TAGS.find(t => t.id === selectedTag)?.label}
                  <button onClick={() => { setSelectedTag(null); setSelectedFile(null); setImageError(null); }} className="hover:text-primary/70 ml-1"><X className="h-3 w-3" /></button>
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
                  <button onClick={() => { setSelectedFile(null); setImageError(null); }} className="hover:opacity-70 ml-1"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
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
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 resize-none h-6 max-h-[10rem] py-0 font-sans"
                rows={1}
              />
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={isImageOnlyMode ? !selectedFile : (!input.trim() && !selectedFile)}
            className={cn(
              "p-3 rounded-full transition-all shadow-md shrink-0 mb-0.5",
              (isImageOnlyMode ? selectedFile : (input.trim() || selectedFile))
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mt-3">
          <p className="text-[10px] text-muted-foreground/40">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}

