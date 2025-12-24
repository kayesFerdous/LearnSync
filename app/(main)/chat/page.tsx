'use client';

import { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useChat } from './_lib';
import { ChatMessage, ChatInput } from './_components';

export default function ChatPage() {
  const { messages, sendMessage, approveRoutine, rejectRoutine } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto relative">
      {/* Header */}
      <div className="shrink-0 py-4 text-center opacity-80 hover:opacity-100 transition-opacity">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground border border-border shadow-sm">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI Assistant</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-32 scroll-smooth scrollbar-hide">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onApproveRoutine={approveRoutine}
            onRejectRoutine={rejectRoutine}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
