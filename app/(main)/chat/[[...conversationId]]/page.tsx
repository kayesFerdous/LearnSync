'use client';

import { useRef, useEffect, useState, use } from 'react';
import { Sparkles, Plus, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { useChat } from '@/app/(main)/chat/_lib';
import { useViewerState } from '@/app/(main)/chat/_lib/use-viewer-state';
import { ChatMessage, ChatInput, PdfViewerPanel, DeleteConfirmationDialog, ToastContainer, ViewerContainer } from '@/app/(main)/chat/_components';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
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
  
  // Viewer state management
  const { viewerContent, splitRatio, isViewerActive, openViewer, closeViewer, setSplitRatio } = useViewerState();
  
  // Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [localSplitRatio, setLocalSplitRatio] = useState(splitRatio);
  const dragStartX = useRef(0);
  const dragStartRatio = useRef(splitRatio);
  const rafRef = useRef<number | null>(null);

  // Initial load from URL params (Deep Linking)
  useEffect(() => {
    if (conversationIdParam && conversationIdParam !== currentConversationId) {
      loadMessages(conversationIdParam);
    }
  }, [conversationIdParam, loadMessages]);

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
    if (file) {
      openViewer('pdf', file);
    } else {
      closeViewer();
    }
  };

  const handleNewChat = () => {
    startNewChat();
    closeViewer();
    window.history.pushState(null, '', '/chat');
  };

  const handleConversationClick = (conversationId: string) => {
    if (conversationId === currentConversationId) return;

    closeViewer();
    loadMessages(conversationId);
    window.history.pushState(null, '', `/chat/${conversationId}`);
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

  // Drag to resize handler
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRatio.current = localSplitRatio;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const deltaX = e.clientX - dragStartX.current;
        const deltaRatio = deltaX / containerWidth;
        const newRatio = dragStartRatio.current + deltaRatio;
        const constrainedRatio = Math.max(0.3, Math.min(0.7, newRatio));
        
        setLocalSplitRatio(constrainedRatio);
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }
        setSplitRatio(localSplitRatio);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, localSplitRatio, setSplitRatio]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const currentRatio = isDragging ? localSplitRatio : splitRatio;
  const leftWidth = isViewerActive ? `${currentRatio * 100}%` : '100%';
  const rightWidth = isViewerActive ? `${(1 - currentRatio) * 100}%` : '0%';

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
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 truncate ${isActive
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

      {/* Main Content Container */}
      <div ref={containerRef} className="flex-1 h-full flex relative overflow-hidden">
        
        {/* LEFT PANE - Chat */}
        <div
          className={`h-full flex flex-col bg-background relative ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}`}
          style={{ width: leftWidth }}
        >
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-20 p-2 rounded-lg bg-background border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 theme-shadow"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>

          {/* Messages Area - Scrollable (full height) */}
          <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-custom">
            <div className="w-full max-w-4xl mx-auto px-2 md:px-4">
              {/* Header */}
              <div className="shrink-0 py-2 text-center pt-2 md:pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border theme-shadow hover:theme-shadow-md transition-all duration-200">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI Assistant</span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 pb-32">
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
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area - Absolute at bottom */}
          <div className="absolute bottom-0 inset-x-0 px-2 md:px-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-4xl bg-background rounded-lg pointer-events-auto">
              <ChatInput
                onSend={sendMessage}
                onPdfSelect={handlePdfSelect}
                selectedPdf={viewerContent?.type === 'pdf' ? viewerContent.data : null}
              />
            </div>
          </div>
        </div>

        {/* DIVIDER - Drag to resize */}
        {isViewerActive && (
          <div
            ref={dividerRef}
            onMouseDown={handleDividerMouseDown}
            className={`flex-shrink-0 w-1 h-full bg-border hover:bg-primary cursor-col-resize transition-colors duration-150 ${isDragging ? 'bg-primary' : ''}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panes"
          />
        )}

        {/* RIGHT PANE - Viewer */}
        <div
          className={`h-full flex flex-col overflow-hidden ${isDragging ? '' : 'transition-all duration-300 ease-in-out'} ${isViewerActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ width: rightWidth }}
        >
          {isViewerActive && viewerContent && (
            <ViewerContainer
              viewerType={viewerContent.type}
              onClose={closeViewer}
              title={viewerContent.type === 'pdf' ? viewerContent.data.name : undefined}
            >
              {viewerContent.type === 'pdf' && (
                <PdfViewerPanel file={viewerContent.data} />
              )}
              {viewerContent.type === 'schedule' && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Schedule viewer coming soon...
                </div>
              )}
            </ViewerContainer>
          )}
        </div>
      </div>

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
