'use client';

import { useRef, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useChat } from './_lib';
import { ChatMessage, ChatInput, PdfViewerPanel } from './_components';

export default function ChatPage() {
  const { messages, sendMessage, approveRoutine, rejectRoutine } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePdfSelect = (file: File | null) => {
    setSelectedPdf(file);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Chat Area */}
      <div className={`flex flex-col min-w-0 relative transition-all duration-300 ${
        selectedPdf 
          ? 'flex-1' 
          : 'w-full max-w-4xl mx-auto'
      }`}>
        <div className={`flex flex-col h-full ${!selectedPdf ? 'p-2 md:p-4' : 'p-2'}`}>
          {/* Header */}
          <div className="shrink-0 py-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border theme-shadow hover:theme-shadow-md transition-all duration-200">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Assistant</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4 pb-24 scroll-smooth scrollbar-hide px-5 pr-6">
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
          <ChatInput 
            onSend={sendMessage} 
            onPdfSelect={handlePdfSelect}
            selectedPdf={selectedPdf}
          />
        </div>
      </div>

      {/* PDF Viewer Panel */}
      {selectedPdf && (
        <div className="w-[50%] shrink-0 border-l border-border bg-background animate-in slide-in-from-right duration-300">
          <PdfViewerPanel 
            file={selectedPdf} 
            onClose={() => setSelectedPdf(null)} 
          />
        </div>
      )}
    </div>
  );
}
