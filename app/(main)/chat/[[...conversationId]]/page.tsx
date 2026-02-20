'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useEffect, useState, use } from 'react';
import { Sparkles, Plus, PanelLeftClose, PanelLeftOpen, Trash2, ChevronDown, ChevronRight, FolderPlus, Pencil, MoreHorizontal, Palette, Check, X } from 'lucide-react';
import { useUiStore } from '@/lib/store';
import { useChat } from '@/app/(main)/chat/_lib';
import { useViewerState } from '@/app/(main)/chat/_lib/use-viewer-state';
import { ChatMessage, ChatInput, PdfViewerPanel, DeleteConfirmationDialog, ToastContainer, ViewerContainer, CourseSetup, BatchUploadModal, ConversationFileDropdown } from '@/app/(main)/chat/_components';
import { showErrorToast, showSuccessToast } from '@/app/(main)/chat/_lib/toast';
import { cn } from '@/lib/utils';

export default function ChatPage({ params }: { params: Promise<{ conversationId?: string[] }> }) {
  const {
    conversations,
    folders,
    currentConversationId,
    activeFolderId,
    viewState,
    isLoading,
    messages,
    sendMessage,
    approveRoutine,
    rejectRoutine,
    startNewChat,
    openCourseSetup,
    loadMessages,
    deleteConversationHandler,
    createFolderHandler,
    updateConversationTitleHandler,
    updateFolderHandler,
    deleteFolderHandler,
  } = useChat();

  const router = useRouter();
  const searchParams = useSearchParams();
  const folderIdParam = searchParams.get('folderId');

  const resolvedParams = use(params);
  const conversationIdParam = resolvedParams.conversationId?.[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    conversationId: string | null;
    conversationTitle: string;
    type: 'conversation' | 'course';
  }>({
    isOpen: false,
    conversationId: null,
    conversationTitle: '',
    type: 'conversation',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing state
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Folder editing state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null);

  // Conversation editing state
  const [conversationMenuOpenId, setConversationMenuOpenId] = useState<string | null>(null);

  const [folderEditName, setFolderEditName] = useState('');

  const { setBreadcrumbOverride } = useUiStore();

  const startEditingConversation = (id: string, title: string) => {
    setEditingConversationId(id);
    setEditingTitle(title);
    setConversationMenuOpenId(null);
  };


  const saveConversationTitle = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingConversationId || !editingTitle.trim()) return;

    await updateConversationTitleHandler(editingConversationId, editingTitle);
    setEditingConversationId(null);
  };

  const cancelEditingConversation = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const toggleFolderMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderMenuOpenId(prev => prev === folderId ? null : folderId);
    setConversationMenuOpenId(null);
  };

  const toggleConversationMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationMenuOpenId(prev => prev === conversationId ? null : conversationId);
    setFolderMenuOpenId(null);
  };

  const startEditingFolder = (folder: any) => {
    setEditingFolderId(folder.id);
    setFolderEditName(folder.name);
    setFolderMenuOpenId(null);
  };

  const saveFolderEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingFolderId || !folderEditName.trim()) return;
    await updateFolderHandler(editingFolderId, { name: folderEditName });
    setEditingFolderId(null);
  };

  const handleFolderDelete = (folderId: string, folderName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      conversationId: folderId, // Overloaded field, serving as ID
      conversationTitle: folderName, // Overloaded field, serving as Name
      type: 'course',
    });
    setFolderMenuOpenId(null);
  };



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
    } else if (folderIdParam && !conversationIdParam) {
      // If folderId is present but no conversationId, initialize a new chat in that folder (no backend call yet)
      startNewChat(folderIdParam);
    }
  }, [conversationIdParam, folderIdParam, loadMessages, startNewChat]);

  // Update breadcrumb title when conversation changes
  useEffect(() => {
    if (viewState === 'course-setup') {
      setBreadcrumbOverride('new-course', 'New Course Setup');
    } else if (currentConversationId) {
      const title = conversations.find(c => c.id === currentConversationId)?.title;
      if (title) {
        setBreadcrumbOverride(currentConversationId, title);
      }
    }
  }, [currentConversationId, conversations, setBreadcrumbOverride, viewState]);

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
    startNewChat(null);
    closeViewer();
    window.history.pushState(null, '', '/chat');
  };

  const handleNewChatInFolder = (folderId: string) => {
    startNewChat(folderId);
    closeViewer();
    window.history.pushState(null, '', '/chat');
  };

  const handleConversationClick = (conversationId: string) => {
    if (conversationId === currentConversationId) return;

    closeViewer();
    loadMessages(conversationId);
    window.history.pushState(null, '', `/chat/${conversationId}`);
  };

  const handleDeleteClick = (conversationId: string, title: string) => {
    setDeleteConfirmation({
      isOpen: true,
      conversationId,
      conversationTitle: title,
      type: 'conversation',
    });
    setConversationMenuOpenId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.conversationId) return;

    setIsDeleting(true);
    try {
      if (deleteConfirmation.type === 'course') {
        const result = await deleteFolderHandler(deleteConfirmation.conversationId);
        if (result.success) {
          showSuccessToast(`Course "${deleteConfirmation.conversationTitle}" deleted`);
          setDeleteConfirmation({ isOpen: false, conversationId: null, conversationTitle: '', type: 'conversation' });
        } else {
          showErrorToast(`Failed to delete course: ${result.error}`);
        }
      } else {
        const result = await deleteConversationHandler(deleteConfirmation.conversationId);
        if (result.success) {
          showSuccessToast(`Conversation "${deleteConfirmation.conversationTitle}" deleted`);
          setDeleteConfirmation({ isOpen: false, conversationId: null, conversationTitle: '', type: 'conversation' });
        } else {
          showErrorToast(`Failed to delete conversation: ${result.error}`);
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, conversationId: null, conversationTitle: '', type: 'conversation' });
  };

  const handleCreateCourseComplete = (folderId: string) => {
    // Start a new chat inside the created course folder
    handleNewChatInFolder(folderId);
    showSuccessToast('Course created successfully');
  };

  const handleBatchUploadSuccess = (conversationId: string) => {
    setIsBatchModalOpen(false);
    if (conversationId !== currentConversationId) {
      handleConversationClick(conversationId);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Removed old handleCreateFolder function and state
  // as logic moved to CourseSetup component

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

  const getComputedFolderId = () => {
    if (activeFolderId) return activeFolderId;
    if (currentConversationId) {
      const folder = folders.find(f => f.conversations.some(c => c.id === currentConversationId));
      return folder?.id || null;
    }
    return null;
  };

  const computedFolderId = getComputedFolderId();

  return (
    <div className="absolute inset-0 flex w-full overflow-hidden">
      {/* Conversations Sidebar */}
      <div className={cn(
        "h-full border-r border-border/50 bg-gradient-to-b from-card to-card/80 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative",
        sidebarOpen ? "w-72" : "w-0 border-r-0"
      )}>
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative p-4 border-b border-border/30 shrink-0 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full group flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <div className="p-1 rounded-lg bg-primary-foreground/20">
              <Plus className="h-4 w-4" />
            </div>
            <span>New Chat</span>
          </button>
          <button
            onClick={openCourseSetup}
            className="w-full group flex items-center justify-center gap-2.5 h-11 px-4 rounded-xl bg-accent/80 text-foreground font-medium border border-border/50 hover:bg-accent hover:border-primary/30 hover:shadow-md active:scale-[0.98] transition-all duration-200"
          >
            <div className="p-1 rounded-lg bg-primary/10">
              <FolderPlus className="h-4 w-4 text-primary" />
            </div>
            <span>New Course</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3 space-y-1">
            {/* Section Label for Chats */}
            {conversations.length > 0 && (
              <div className="px-3 pt-2 pb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent Chats
                </span>
              </div>
            )}

            {/* Root-level conversations (no folder) */}
            {conversations.length > 0 && (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const isActive = currentConversationId === conversation.id;
                  const isEditing = editingConversationId === conversation.id;

                  if (isEditing) {
                    return (
                      <div key={conversation.id} className="px-2 py-1">
                        <form onSubmit={saveConversationTitle} className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 min-w-0 bg-background border-2 border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onBlur={() => saveConversationTitle()}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') cancelEditingConversation();
                            }}
                          />
                        </form>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group relative",
                        conversationMenuOpenId === conversation.id ? "z-20" : "z-auto"
                      )}
                    >
                      <button
                        onClick={() => handleConversationClick(conversation.id)}
                        disabled={isLoading}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 truncate',
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20'
                            : 'text-foreground hover:bg-accent/80',
                          'disabled:opacity-50'
                        )}
                        title={conversation.title}
                      >
                        {conversation.title}
                      </button>

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <button
                          onClick={(e) => toggleConversationMenu(e, conversation.id)}
                          className={cn(
                            "p-1.5 rounded-lg text-muted-foreground transition-all duration-200",
                            conversationMenuOpenId === conversation.id
                              ? "opacity-100 bg-accent text-foreground"
                              : isActive
                                ? "opacity-100 text-primary-foreground hover:bg-primary-foreground/20"
                                : "opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {conversationMenuOpenId === conversation.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setConversationMenuOpenId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl overflow-hidden z-50 flex flex-col py-1.5">
                              <button
                                className="text-left px-3 py-2 text-sm hover:bg-accent rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                onClick={(e) => { e.preventDefault(); startEditingConversation(conversation.id, conversation.title); }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Rename
                              </button>
                              <button
                                className="text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                onClick={(e) => { e.preventDefault(); handleDeleteClick(conversation.id, conversation.title); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Folders with conversations */}
            {folders.length > 0 && (
              <div className="px-3 pt-4 pb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Courses
                </span>
              </div>
            )}

            {folders.map((folder) => {
              const isExpanded = expandedFolders.has(folder.id);
              const isEditingVal = editingFolderId === folder.id;

              return (
                <div key={folder.id} className="space-y-1">
                  {/* Folder Header */}
                  {isEditingVal ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <form onSubmit={saveFolderEdit} className="flex-1">
                        <input
                          autoFocus
                          value={folderEditName}
                          onChange={e => setFolderEditName(e.target.value)}
                          className="w-full bg-background border-2 border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onBlur={(e) => saveFolderEdit(e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                        />
                      </form>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group flex items-center gap-1 relative rounded-xl transition-colors hover:bg-accent/50",
                        folderMenuOpenId === folder.id ? "z-20 bg-accent/50" : "z-auto"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFolder(folder.id);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className={cn(
                          "transition-transform duration-200",
                          isExpanded ? "rotate-0" : "-rotate-90"
                        )}>
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        </div>
                      </button>

                      <Link
                        href={`/course/${folder.id}`}
                        className="flex-1 flex items-center gap-3 py-2.5 pr-2 text-sm font-medium text-foreground rounded-lg transition-colors duration-150 truncate"
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                          <FolderPlus className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="truncate flex-1">{folder.name}</span>
                        <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground flex items-center justify-center">
                          {folder.conversations.length}
                        </span>
                      </Link>

                      <div className="relative pr-1">
                        <button
                          onClick={(e) => toggleFolderMenu(e, folder.id)}
                          className={cn(
                            "p-1.5 rounded-lg text-muted-foreground transition-all duration-200",
                            folderMenuOpenId === folder.id ? "opacity-100 bg-accent text-foreground" : "opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {folderMenuOpenId === folder.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setFolderMenuOpenId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl overflow-hidden z-50 flex flex-col py-1.5">
                              <button
                                className="text-left px-3 py-2 text-sm hover:bg-accent rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                onClick={(e) => { e.preventDefault(); startEditingFolder(folder); }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Rename
                              </button>
                              <button
                                className="text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                onClick={(e) => { e.preventDefault(); handleFolderDelete(folder.id, folder.name); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Folder Conversations */}
                  {isExpanded && (
                    <div className="ml-3 pl-3 border-l-2 border-border/50 space-y-1">
                      {folder.conversations.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-muted-foreground italic flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                          No conversations yet
                        </div>
                      ) : (
                        folder.conversations.map((conversation) => {
                          const isActive = currentConversationId === conversation.id;
                          const isEditing = editingConversationId === conversation.id;

                          if (isEditing) {
                            return (
                              <div key={conversation.id} className="px-2 py-1">
                                <form onSubmit={saveConversationTitle} className="flex items-center gap-1">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1 min-w-0 bg-background border-2 border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    onBlur={() => saveConversationTitle()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') cancelEditingConversation();
                                    }}
                                  />
                                </form>
                              </div>
                            );
                          }

                          return (
                            <div key={conversation.id} className={cn(
                              "group relative",
                              conversationMenuOpenId === conversation.id ? "z-20" : "z-auto"
                            )}>
                              <button
                                onClick={() => handleConversationClick(conversation.id)}
                                disabled={isLoading}
                                className={cn(
                                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 truncate',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20'
                                    : 'text-foreground hover:bg-accent/80',
                                  'disabled:opacity-50'
                                )}
                                title={conversation.title}
                              >
                                {conversation.title}
                              </button>

                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                <button
                                  onClick={(e) => toggleConversationMenu(e, conversation.id)}
                                  className={cn(
                                    "p-1.5 rounded-lg text-muted-foreground transition-all duration-200",
                                    conversationMenuOpenId === conversation.id
                                      ? "opacity-100 bg-accent text-foreground"
                                      : isActive
                                        ? "opacity-100 text-primary-foreground hover:bg-primary-foreground/20"
                                        : "opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
                                  )}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {conversationMenuOpenId === conversation.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setConversationMenuOpenId(null)} />
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl overflow-hidden z-50 flex flex-col py-1.5">
                                      <button
                                        className="text-left px-3 py-2 text-sm hover:bg-accent rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                        onClick={(e) => { e.preventDefault(); startEditingConversation(conversation.id, conversation.title); }}
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Rename
                                      </button>
                                      <button
                                        className="text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg mx-1.5 flex items-center gap-2.5 transition-colors"
                                        onClick={(e) => { e.preventDefault(); handleDeleteClick(conversation.id, conversation.title); }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {conversations.length === 0 && folders.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                <p className="text-xs text-muted-foreground">Start with a new chat to get going!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div ref={containerRef} className="flex-1 h-full flex relative overflow-hidden">

        {/* LEFT PANE - Chat or Course Setup */}
        <div
          className={`h-full flex flex-col bg-background relative ${isDragging ? '' : 'transition-all duration-300 ease-in-out'}`}
          style={{ width: leftWidth }}
        >
          {/* Top Left Controls */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-background border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 theme-shadow"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            {viewState !== 'course-setup' && currentConversationId && (
              <div className="theme-shadow rounded-xl bg-background border border-border">
                <ConversationFileDropdown
                  conversationId={currentConversationId}
                  folderId={computedFolderId}
                />
              </div>
            )}
          </div>

          {viewState === 'course-setup' ? (
            <CourseSetup
              onCancel={() => startNewChat()}
              onComplete={handleCreateCourseComplete}
              onCreateCourse={createFolderHandler}
            />
          ) : (
            <>
              {/* Messages Area - Scrollable (full height) */}
              <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-custom">
                <div className="w-full max-w-4xl mx-auto px-2 md:px-4">
                  {/* Header */}
                  <div className="relative shrink-0 py-2 text-center pt-2 md:pt-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium border border-border theme-shadow hover:theme-shadow-md transition-all duration-200">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>AI Assistant</span>
                      {computedFolderId && (
                        <>
                          <span className="text-muted-foreground">in</span>
                          <span className="font-semibold">{folders.find(f => f.id === computedFolderId)?.name}</span>
                        </>
                      )}
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
                    onOpenBatchModal={() => setIsBatchModalOpen(true)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* DIVIDER - Drag to resize (Only visible in chat mode and when viewer is active) */}
        {viewState === 'chat' && isViewerActive && (
          <div
            ref={dividerRef}
            onMouseDown={handleDividerMouseDown}
            className={`flex-shrink-0 w-1 h-full bg-border hover:bg-primary cursor-col-resize transition-colors duration-150 ${isDragging ? 'bg-primary' : ''}`}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panes"
          />
        )}

        {/* RIGHT PANE - Viewer (Only visible in chat mode) */}
        <div
          className={`h-full flex flex-col overflow-hidden ${isDragging ? '' : 'transition-all duration-300 ease-in-out'} ${viewState === 'chat' && isViewerActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ width: rightWidth }}
        >
          {viewState === 'chat' && isViewerActive && viewerContent && (
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
        type={deleteConfirmation.type}
      />

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={handleBatchUploadSuccess}
        folderId={null} // Explicitly null for chat context
        conversationId={currentConversationId}
        folderContext={false} // Force navigation on new conversation creation
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
