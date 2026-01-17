'use client';

import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import RoutineApprovalWidget from '@/components/routine-approval-widget';
import type { Message, RoutineData } from '../_lib/types';

interface ChatMessageProps {
  message: Message;
  conversationId?: string;
  onApproveRoutine: (messageId: string, editedData: RoutineData, conversationId?: string) => void;
  onRejectRoutine: (messageId: string, conversationId?: string) => void;
}

export function ChatMessage({ message: msg, conversationId, onApproveRoutine, onRejectRoutine }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        msg.role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      {msg.role === 'ai' && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-border theme-shadow flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      <div className={cn(
        "max-w-[85%] md:max-w-[80%] relative group text-sm leading-relaxed",
        msg.role === 'user'
          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-4 theme-shadow"
          : msg.interrupt 
            ? "" // No background for interrupt messages - widget has its own styling
            : "text-foreground px-1 py-1"
      )}>
        {/* Thinking indicator */}
        {msg.role === 'ai' && msg.isStreaming && msg.content.trim() === '' && !msg.interrupt ? (
          <ThinkingIndicator status={msg.thinking?.status} />
        ) : null}

        {/* Render interrupt widget if present */}
        {msg.interrupt && msg.interrupt.payload.type === 'routine_approval_required' && (
          <RoutineApprovalWidget
            data={msg.interrupt.payload.extracted_data}
            onApprove={(editedData) => onApproveRoutine(msg.id, editedData, conversationId)}
            onReject={() => onRejectRoutine(msg.id, conversationId)}
            isLocked={msg.interrupt.status !== 'pending'}
            status={msg.interrupt.status}
          />
        )}

        {/* Only render markdown content if there's no interrupt or if there is additional content */}
        {(!msg.interrupt || msg.content.trim()) && (
          <MarkdownContent content={String(msg.content)} />
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator({ status }: { status?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
      </div>
      <span className="leading-relaxed">{status ?? 'Thinking...'}</span>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
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
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          ) : (
            <div className="relative my-3 rounded-xl overflow-hidden bg-muted border border-border theme-shadow text-foreground last:mb-0">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/80 text-xs text-muted-foreground border-b border-border">
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
      {content}
    </ReactMarkdown>
  );
}
