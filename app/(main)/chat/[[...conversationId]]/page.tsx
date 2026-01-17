'use client';

import { useRef, useEffect, useState, use } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { useChat } from '@/app/(main)/chat/_lib';
import { ChatMessage, ChatInput, PdfViewerPanel } from '@/app/(main)/chat/_components';

export default function ChatPage({ params }: { params: Promise<{ conversationId?: string[] }> }) {
  const { 
    conversations, 
    currentConversationId, 
    isLoading,
    messages, 
    sendMessage, 
    approveRoutine, 
    rejectRoutine,
    startNewChat,
    loadMessages,
  } = useChat();

  const resolvedParams = use(params);
  const conversationIdParam = resolvedParams.conversationId?.[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const { setBreadcrumbOverride } = useUiStore();

  // Initial load from URL params (Deep Linking)
  useEffect(() => {
    if (conversationIdParam && conversationIdParam !== currentConversationId) {
      loadMessages(conversationIdParam);
    }
  }, [conversationIdParam, loadMessages]); // Allow loadMessages to be dependency

  // Update breadcrumb title when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const title = conversations.find(c => c.id === currentConversationId)?.title;
      if (title) {
        setBreadcrumbOverride(currentConversationId, title);
      }
    }
  }, [currentConversationId, conversations, setBreadcrumbOverride]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePdfSelect = (file: File | null) => {
    setSelectedPdf(file);
  };

  const handleNewChat = () => {
    startNewChat();
    setSelectedPdf(null);
    window.history.pushState(null, '', '/chat'); // Reset URL
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedPdf(null);
    loadMessages(conversationId);
    window.history.pushState(null, '', `/chat/${conversationId}`); // Update URL
  };

  return (
    <div className="absolute inset-0 flex w-full overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-64 h-full border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-custom">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                No conversations yet. Start with a new chat!
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = currentConversationId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation.id)}
                    disabled={isLoading}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 truncate ${ 
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent'
                    } disabled:opacity-50`}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat Wrapper */}
      <div className={`h-full min-w-0 relative transition-all duration-300 flex-1 ${
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
                    {isLoading ? (
                      <div className="text-center text-muted-foreground py-8">
                        Loading conversation...
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            onApproveRoutine={approveRoutine}
                            onRejectRoutine={rejectRoutine}
                        />
                      ))
                    )}
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
