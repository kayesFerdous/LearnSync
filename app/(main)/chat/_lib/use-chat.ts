'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message, InterruptPayload, InterruptStatus, RoutineData, Conversation, Folder } from './types';
import { BACKEND_URL, fileToBase64, processStream, presignUpload, uploadToR2, confirmUpload, fetchConversations, fetchMessages, deleteConversation, normalizeRoutineData, createFolder, updateConversationTitle, updateFolder, deleteFolder } from './api';
import { INITIAL_MESSAGE } from './constants';

export function useChat() {
  // Conversation thread state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<'chat' | 'course-setup'>('chat'); // New view state
  
  // Chat message state
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  // Request abort and batching refs
  const abortRef = useRef<AbortController | null>(null);
  const pendingChunkRef = useRef('');
  const flushRafRef = useRef<number | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Message update helpers
  const updateMessage = useCallback((messageId: string, updater: (m: Message) => Message) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updater(prev[idx]);
      return next;
    });
  }, []);

  const setThinkingStatus = useCallback((assistantId: string, status?: string) => {
    updateMessage(assistantId, m => ({
      ...m,
      thinking: { status },
    }));
  }, [updateMessage]);

  const appendAssistantContent = useCallback((assistantId: string, chunk: string) => {
    if (!chunk) return;
    updateMessage(assistantId, m => ({ ...m, content: m.content + chunk }));
  }, [updateMessage]);

  const setAssistantStreaming = useCallback((assistantId: string, isStreaming: boolean) => {
    updateMessage(assistantId, m => ({ ...m, isStreaming }));
  }, [updateMessage]);

  const setInterruptStatus = useCallback((messageId: string, status: InterruptStatus) => {
    updateMessage(messageId, m => {
      if (!m.interrupt) return m;
      return { ...m, interrupt: { ...m.interrupt, status } };
    });
  }, [updateMessage]);

  const addInterruptToMessage = useCallback((messageId: string, payload: InterruptPayload) => {
    updateMessage(messageId, m => ({
      ...m,
      interrupt: { payload, status: 'pending' },
      isStreaming: false,
    }));
  }, [updateMessage]);

  // Batched chunk updates for performance
  const enqueueAssistantChunk = useCallback((assistantId: string, chunk: string) => {
    if (!chunk) return;
    pendingChunkRef.current += chunk;
    if (flushRafRef.current != null) return;
    flushRafRef.current = window.requestAnimationFrame(() => {
      const toFlush = pendingChunkRef.current;
      pendingChunkRef.current = '';
      flushRafRef.current = null;
      appendAssistantContent(assistantId, toFlush);
    });
  }, [appendAssistantContent]);

  const flushPendingChunks = useCallback((assistantId: string) => {
    if (flushRafRef.current != null) {
      window.cancelAnimationFrame(flushRafRef.current);
      flushRafRef.current = null;
    }
    if (pendingChunkRef.current) {
      appendAssistantContent(assistantId, pendingChunkRef.current);
      pendingChunkRef.current = '';
    }
  }, [appendAssistantContent]);

  // Conversation management functions
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      // Sort root conversations by updated_at (descending), fallback to created_at if updated_at is null
      const sortedConversations = data.conversations.sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });
      // Sort folders by created_at (descending)
      const sortedFolders = data.folders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setConversations(sortedConversations);
      setFolders(sortedFolders);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchMessages(conversationId);
      // Clear and set messages, stripping INITIAL_MESSAGE
      setMessages(data);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewChat = useCallback((folderId?: string | null) => {
    setCurrentConversationId(null);
    setViewState('chat');
    setActiveFolderId(folderId || null);
    setMessages([INITIAL_MESSAGE]);
  }, []);

  const openCourseSetup = useCallback(() => {
    setCurrentConversationId(null);
    setActiveFolderId(null);
    setViewState('course-setup');
    setMessages([INITIAL_MESSAGE]);
  }, []);

  // Send a chat message with lazy conversation creation logic
  const sendMessage = useCallback(async (
    userMessage: string,
    tag: string | null,
    file: File | null
  ) => {
    const tagForRequest = tag ?? 'chatter';
    const now = Date.now();
    const userMessageId = `${now}`;
    const assistantId = `${now}-ai`;

    // Build display content
    const isImageOnly = tag === 'routine_generator';
    const displayContent = isImageOnly
      ? `📷 Image uploaded${file ? `: ${file.name}` : ''}`
      : userMessage || (file ? `📎 ${file.name}` : '');

    // Add user message optimistically
    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: 'user', content: displayContent, created_at: new Date(now).toISOString() },
      { id: assistantId, role: 'ai', content: '', created_at: new Date(now).toISOString(), thinking: { status: undefined }, isStreaming: true },
    ]);

    // Abort any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build payload
      const payload: { message?: string; tag: string; image?: string; file_upload?: { object_key: string; original_filename: string } } = { tag: tagForRequest };
      if (userMessage) payload.message = userMessage;
      if (file) {
        if (file.type === 'application/pdf') {
          setThinkingStatus(assistantId, 'Uploading file...');
          const { upload_url, object_key } = await presignUpload(file.name, file.type);
          await uploadToR2(upload_url, file);
          const uploadResult = await confirmUpload(object_key, file.name);
          payload.file_upload = { object_key, original_filename: file.name };
          setThinkingStatus(assistantId, 'Thinking...');
          
          // CRITICAL: Smart Upload Redirection
          // If upload created/associated with a conversation and we're not in one, redirect
          if (uploadResult.conversation_id && !currentConversationId) {
            setCurrentConversationId(uploadResult.conversation_id);
            window.history.replaceState(null, '', `/chat/${uploadResult.conversation_id}`);
            
            // Load messages for that conversation
            try {
              const existingMessages = await fetchMessages(uploadResult.conversation_id);
              setMessages(existingMessages);
              // Refresh conversations list
              await loadConversations();
            } catch (err) {
              console.error('Failed to load conversation after upload:', err);
            }
            return; // Exit early, the conversation is already set up
          }
        } else {
          payload.image = await fileToBase64(file);
        }
      }

      // Determine endpoint: POST /conversation/ for new chat, POST /conversation/{id} for existing
      let endpoint = currentConversationId 
        ? `${BACKEND_URL.replace('/chat_bot', '')}/conversation/${currentConversationId}`
        : `${BACKEND_URL.replace('/chat_bot', '')}/conversation/`;

      // Append folder_id as query parameter when creating a new conversation in a folder
      if (!currentConversationId && activeFolderId) {
        const separator = endpoint.includes('?') ? '&' : '?';
        endpoint += `${separator}folder_id=${encodeURIComponent(activeFolderId)}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Backend error (${response.status})`);
      }

      // Track if we get conversation_id (only for new chats)
      let newConversationId: string | null = null;

      await processStream(response, {
        onStatus: (message) => setThinkingStatus(assistantId, message),
        onChunk: (content) => {
          setThinkingStatus(assistantId, undefined);
          enqueueAssistantChunk(assistantId, content);
        },
        onConversationId: (conversationId) => {
          // CRITICAL: Handle conversation creation
          newConversationId = conversationId;
          setCurrentConversationId(conversationId);
          // Don't clear activeFolderId yet, as we might want to keep context if needed, but usually once conversation exists, folder is part of it.
          // setActiveFolderId(null); 
          
          // Silent URL Switch: Update URL without reloading or triggering re-fetch
          // Using window.history.replaceState to change URL to /chat/{id}
          window.history.replaceState(null, '', `/chat/${conversationId}`);
          
          // Optimistically add to sidebar (title from first 30 chars of message)
          const title = userMessage.substring(0, 30) || (file ? `📎 ${file.name}` : 'New Conversation');
          
          // Only add to folder if we have it locally, otherwise we'll wait for re-fetch or assume backend handles it.
          // But for immediate UI update:
          const newConversation: Conversation = {
            id: conversationId,
            title,
            created_at: new Date().toISOString(),
            updated_at: null,
          };

          if (activeFolderId) {
             setFolders(prev => prev.map(f => {
               if (f.id === activeFolderId) {
                 return { ...f, conversations: [newConversation, ...f.conversations] };
               }
               return f;
             }));
          } else {
             setConversations(prev => [newConversation, ...prev]);
          }
        },
        onRoutineApproved: (payload) => {
          setThinkingStatus(assistantId, undefined);
          // Update the assistant message with routine_approved flag and data
          updateMessage(assistantId, m => ({
            ...m,
            content: 'The routine has been approved and saved.',
            additional_kwargs: {
              routine_approved: true,
              routine_data: normalizeRoutineData(payload.routine_data),
            },
            isStreaming: false,
          }));
        },
        onInterrupt: (event) => {
          setThinkingStatus(assistantId, undefined);
          addInterruptToMessage(assistantId, event.payload);
        },
        onError: (message) => {
          setThinkingStatus(assistantId, undefined);
          appendAssistantContent(assistantId, `\n\n${message}`);
        },
        onDone: () => setThinkingStatus(assistantId, undefined),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Chat backend error:', error);
      setThinkingStatus(assistantId, undefined);
      appendAssistantContent(assistantId, `\n\nSorry, there was an error connecting to the server. (${message})`);
    } finally {
      flushPendingChunks(assistantId);
      setAssistantStreaming(assistantId, false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [currentConversationId, activeFolderId, setThinkingStatus, enqueueAssistantChunk, addInterruptToMessage, appendAssistantContent, flushPendingChunks, setAssistantStreaming]);

  // Handle routine approval
  const approveRoutine = useCallback(async (messageId: string, editedData: RoutineData, conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId;

    const now = Date.now();
    const resumeAssistantId = `${now}-resume`;

    setMessages(prev => [
      ...prev,
      { id: resumeAssistantId, role: 'ai', content: '', thinking: { status: 'Saving your routine...' }, isStreaming: true },
    ]);

    try {
      // Use conversation endpoint with the target conversation ID
      const endpoint = targetConversationId 
        ? `${BACKEND_URL.replace('/chat_bot', '')}/conversation/${targetConversationId}`
        : BACKEND_URL;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          tag: 'routine_generator',
          user_input: { approved: true, data: editedData },
        }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Backend error (${response.status})`);

      await processStream(response, {
        onStatus: (message) => setThinkingStatus(resumeAssistantId, message),
        onChunk: (content) => {
          setThinkingStatus(resumeAssistantId, undefined);
          enqueueAssistantChunk(resumeAssistantId, content);
        },
        onRoutineApproved: (payload) => {
          setThinkingStatus(resumeAssistantId, undefined);
          // Update the resume message with routine_approved flag and data
          updateMessage(resumeAssistantId, m => ({
            ...m,
            content: 'The routine has been approved and saved.',
            additional_kwargs: {
              routine_approved: true,
              routine_data: normalizeRoutineData(payload.routine_data),
            },
            isStreaming: false,
          }));
        },
        onInterrupt: () => { },
        onError: (message) => {
          setThinkingStatus(resumeAssistantId, undefined);
          appendAssistantContent(resumeAssistantId, `\n\n${message}`);
        },
        onDone: () => setThinkingStatus(resumeAssistantId, undefined),
      });

      setInterruptStatus(messageId, 'approved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resume error:', error);
      setThinkingStatus(resumeAssistantId, undefined);
      appendAssistantContent(resumeAssistantId, `\n\nSorry, there was an error saving the routine. (${message})`);
      setInterruptStatus(messageId, 'pending');
    } finally {
      flushPendingChunks(resumeAssistantId);
      setAssistantStreaming(resumeAssistantId, false);
    }
  }, [setInterruptStatus, setThinkingStatus, enqueueAssistantChunk, appendAssistantContent, flushPendingChunks, setAssistantStreaming]);

  // Handle routine rejection
  const rejectRoutine = useCallback(async (messageId: string, conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId;

    const now = Date.now();
    const rejectAssistantId = `${now}-reject`;

    setMessages(prev => [
      ...prev,
      { id: rejectAssistantId, role: 'ai', content: '', thinking: { status: 'Discarding routine...' }, isStreaming: true },
    ]);

    try {
      // Use conversation endpoint with the target conversation ID
      const endpoint = targetConversationId 
        ? `${BACKEND_URL.replace('/chat_bot', '')}/conversation/${targetConversationId}`
        : BACKEND_URL;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          tag: 'routine_generator',
          user_input: 'CANCEL',
        }),
      });

      if (!response.ok) throw new Error(`Backend error (${response.status})`);

      await processStream(response, {
        onStatus: (message) => setThinkingStatus(rejectAssistantId, message),
        onChunk: (content) => {
          setThinkingStatus(rejectAssistantId, undefined);
          enqueueAssistantChunk(rejectAssistantId, content);
        },
        onRoutineApproved: (payload) => {
          setThinkingStatus(rejectAssistantId, undefined);
          // Update the reject message with routine_approved flag and data if returned
          updateMessage(rejectAssistantId, m => ({
            ...m,
            content: 'The routine has been approved and saved.',
            additional_kwargs: {
              routine_approved: true,
              routine_data: normalizeRoutineData(payload.routine_data),
            },
            isStreaming: false,
          }));
        },
        onInterrupt: () => { },
        onError: (message) => {
          setThinkingStatus(rejectAssistantId, undefined);
          appendAssistantContent(rejectAssistantId, `\n\n${message}`);
        },
        onDone: () => setThinkingStatus(rejectAssistantId, undefined),
      });

      setInterruptStatus(messageId, 'rejected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Reject error:', error);
      setThinkingStatus(rejectAssistantId, undefined);
      appendAssistantContent(rejectAssistantId, `\n\nSorry, there was an error. (${message})`);
      setInterruptStatus(messageId, 'pending');
    } finally {
      flushPendingChunks(rejectAssistantId);
      setAssistantStreaming(rejectAssistantId, false);
    }
  }, [setInterruptStatus, setThinkingStatus, enqueueAssistantChunk, appendAssistantContent, flushPendingChunks, setAssistantStreaming]);

  // Handle conversation deletion
  const deleteConversationHandler = useCallback(async (conversationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteConversation(conversationId);
      
      // Optimistically remove from sidebar
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If we were viewing the deleted conversation, navigate to new chat
      if (currentConversationId === conversationId) {
        startNewChat();
        window.history.pushState(null, '', '/chat');
      }
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Delete conversation error:', error);
      return { success: false, error: message };
    }
  }, [currentConversationId, startNewChat]);

  // Create a new folder
  const createFolderHandler = useCallback(async (name: string, icon?: string, theme?: string): Promise<{ success: boolean; folder?: Folder; error?: string }> => {
    try {
      const folder = await createFolder(name, icon, theme);
      
      // Update local state immediately to reflect changes in UI without waiting for re-fetch
      setFolders(prev => [{
        ...folder,
        conversations: folder.conversations || []
      }, ...prev]);

      // Reload conversations to sync accurately with backend
      // We don't await because we've already updated the UI optimistically
      loadConversations();
      
      return { success: true, folder };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Create folder error:', error);
      return { success: false, error: message };
    }
  }, [loadConversations]);

  // Update conversation title
  const updateConversationTitleHandler = useCallback(async (conversationId: string, title: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateConversationTitle(conversationId, title);
      
      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title } : c
      ));
      
      setFolders(prev => prev.map(f => ({
        ...f,
        conversations: f.conversations.map(c => 
          c.id === conversationId ? { ...c, title } : c
        )
      })));

      return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Update conversation title error:', error);
        return { success: false, error: message };
    }
  }, []);

  // Update folder
  const updateFolderHandler = useCallback(async (folderId: string, data: { name?: string, color?: string, icon?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateFolder(folderId, data);
      
      // Update local state manually since backend returns { status: "success" }
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, ...data } : f
      ));
      
      return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Update folder error:', error);
        return { success: false, error: message };
    }
  }, []);

  // Delete folder
  const deleteFolderHandler = useCallback(async (folderId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteFolder(folderId);
      
      // Optimistically remove from sidebar
      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // If we were in a conversation within this folder, what should happen?
      // Probably nothing immediate if the conversation itself wasn't deleted (backend logic depends),
      // but usually folder deletion cascades or un-folders conversations.
      // Assuming cascade delete for now, or just folder removal. 
      // Safest is to reset view if we were in that folder context specifically (e.g. course view)
      if (activeFolderId === folderId) {
          startNewChat();
      }

      return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Delete folder error:', error);
        return { success: false, error: message };
    }
  }, [activeFolderId, startNewChat]);

  return {
    // Conversation state
    conversations,
    folders,
    currentConversationId,
    activeFolderId,
    viewState, // Export new state
    isLoading,
    
    // Chat state
    messages,
    
    // Conversation functions
    loadConversations,
    loadMessages,
    startNewChat,
    openCourseSetup, // Export new function
    deleteConversationHandler,
    createFolderHandler,
    updateConversationTitleHandler,
    updateFolderHandler,
    deleteFolderHandler,
    
    // Chat functions
    sendMessage,
    approveRoutine,
    rejectRoutine,
  };
}
