'use client';

import { useRef, useEffect, useState, use } from 'react';
import { Sparkles, Plus, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { useChat } from '@/app/(main)/chat/_lib';
import { ChatMessage, ChatInput, PdfViewerPanel, DeleteConfirmationDialog, ToastContainer } from '@/app/(main)/chat/_components';
import { showErrorToast, showSuccessToast } from '@/app/(main)/chat/_lib/toast';
import { cn } from '@/lib/utils';

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
    deleteConversationHandler,
  } = useChat();

  const resolvedParams = use(params);
  const conversationIdParam = resolvedParams.conversationId?.[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    conversationTitle: string;
  }>({
    isOpen: false,
    conversationId: null,
    conversationTitle: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (conversationId === currentConversationId) return;
    
    setSelectedPdf(null);
    loadMessages(conversationId);
    window.history.pushState(null, '', `/chat/${conversationId}`); // Update URL
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      conversationId,
      conversationTitle: title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.conversationId) return;

    setIsDeleting(true);
    try {
      const result = await deleteConversationHandler(deleteConfirmation.conversationId);
      if (result.success) {
        showSuccessToast(`Conversation "${deleteConfirmation.conversationTitle}" deleted`);
        setDeleteConfirmation({ isOpen: false, conversationId: null, conversationTitle: '' });
      } else {
        showErrorToast(`Failed to delete conversation: ${result.error}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, conversationId: null, conversationTitle: '' });
  };

  return (
    <div className="absolute inset-0 flex w-full overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={cn(
        "h-full border-r border-border bg-card flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-0 border-r-0"
      )}>
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
                  <div
                    key={conversation.id}
                    className="group relative"
                  >
                    <button
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
                    
                    {/* Delete Button - Appears on hover */}
                    <button
                      onClick={(e) => handleDeleteClick(e, conversation.id, conversation.title)}
                      disabled={isLoading || isDeleting}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200",
                        isActive
                          ? "hover:bg-white/20 text-primary-foreground"
                          : "hover:bg-red-500/10 text-red-600"
                      )}
                      title="Delete conversation"
                      aria-label={`Delete conversation "${conversation.title}"`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
        
        {/* Floating Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-20 p-2 rounded-lg bg-background border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 theme-shadow"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>

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
                            conversationId={currentConversationId || undefined}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        conversationTitle={deleteConfirmation.conversationTitle}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
