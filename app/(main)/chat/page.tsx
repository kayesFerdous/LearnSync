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
    <div className="absolute inset-0 flex w-full overflow-hidden">
      {/* Chat Wrapper */}
      <div className={`h-full min-w-0 relative transition-all duration-300 ${
        selectedPdf 
          ? 'flex-1' 
          : 'w-full'
      }`}>
        
        {/* Scrollable Area - Full Height with Overlay Support */}
        <div className="absolute inset-0 overflow-y-auto scroll-smooth scrollbar-custom">
            <div className="w-full max-w-4xl mx-auto p-2 md:p-4">
                {/* Header */}
                <div className="shrink-0 py-2 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border theme-shadow hover:theme-shadow-md transition-all duration-200">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>AI Assistant</span>
                    </div>
                </div>

                {/* Messages */}
                <div className="py-2 space-y-4 px-1">
                    {messages.map((msg) => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        onApproveRoutine={approveRoutine}
                        onRejectRoutine={rejectRoutine}
                    />
                    ))}
                    {/* Add spacer to prevent last message from being hidden by floating input */}
                    <div className="h-4 md:h-8" aria-hidden="true" />
                    <div ref={messagesEndRef} />
                    <div className="h-10 md:h-12" aria-hidden="true" /> {/* Calculated spacer for input area */}
                </div>
            </div>
        </div>

        {/* Input Area - Floating at bottom */}
        <div className="absolute bottom-0 left-0 w-full z-10 bg-background pt-2">
            <div className="w-full max-w-4xl mx-auto px-4 pb-2">
                <ChatInput 
                    onSend={sendMessage} 
                    onPdfSelect={handlePdfSelect}
                    selectedPdf={selectedPdf}
                />
            </div>
        </div>
      </div>

      {/* PDF Viewer Panel */}
      {selectedPdf && (
        <div className="w-[50%] h-full shrink-0 border-l border-border bg-background animate-in slide-in-from-right duration-300">
          <PdfViewerPanel 
            file={selectedPdf} 
            onClose={() => setSelectedPdf(null)} 
          />
        </div>
      )}
    </div>
  );
}
