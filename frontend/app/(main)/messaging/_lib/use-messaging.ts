'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getContacts,
  getChatHistory,
  sendMessageApi,
  markAsRead,
  searchUsers,
} from './api';
import type { Contact, Message, SearchUser, WsNewMessageEvent } from './types';
import { useMessagingWebSocket } from './use-websocket';

export function useMessaging() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // New message dialog
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Pending contact — synthetic entry for brand-new conversations not yet in contacts list
  const [pendingContact, setPendingContactState] = useState<Contact | null>(null);
  const pendingContactRef = useRef<Contact | null>(null);
  const setPendingContact = (c: Contact | null) => {
    pendingContactRef.current = c;
    setPendingContactState(c);
  };

  // Sending state
  const [isSending, setIsSending] = useState(false);

  const activeContactRef = useRef(activeContactId);
  activeContactRef.current = activeContactId;

  // ─── Load Contacts ────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      const data = await getContacts();
      setContacts(data);
    } catch {
      // silently ignore
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // ─── Load Chat History ────────────────────────────────────────────────────

  const loadHistory = useCallback(async (userId: string, append = false) => {
    setMessagesLoading(true);
    try {
      const offset = append ? messages.length : 0;
      const data = await getChatHistory(userId, 50, offset);
      // API returns messages ordered oldest-first; reverse to newest-first
      // then combine with existing if appending (pagination - load older)
      const incoming = [...data.messages].reverse();
      if (append) {
        setMessages((prev) => [...prev, ...incoming]);
      } else {
        setMessages(incoming);
      }
      setTotalCount(data.total_count);
      const loaded = append ? messages.length + data.messages.length : data.messages.length;
      setHasMore(loaded < data.total_count);
    } catch {
      // silently ignore
    } finally {
      setMessagesLoading(false);
    }
  }, [messages.length]);

  // ─── Select Contact ───────────────────────────────────────────────────────

  const selectContact = useCallback(
    async (contactId: string) => {
      setActiveContactId(contactId);
      setMessages([]);
      setHasMore(false);
      await loadHistory(contactId);
      // Mark as read
      try {
        await markAsRead(contactId);
        setContacts((prev) =>
          prev.map((c) =>
            c.user_id === contactId ? { ...c, unread_count: 0 } : c,
          ),
        );
      } catch {
        // ignore
      }
    },
    [loadHistory],
  );

  // ─── Load Older Messages (pagination) ────────────────────────────────────

  const loadOlderMessages = useCallback(async () => {
    if (!activeContactId || !hasMore || messagesLoading) return;
    await loadHistory(activeContactId, true);
  }, [activeContactId, hasMore, messagesLoading, loadHistory]);

  // ─── Send Message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeContactId || !content.trim() || isSending) return;
      setIsSending(true);

      // Optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id: optimisticId,
        sender_id: 'me',
        receiver_id: activeContactId,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [optimistic, ...prev]);

      try {
        const real = await sendMessageApi(activeContactId, content);
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? real : m)),
        );
        // Update contact last_message
        setContacts((prev) =>
          prev.map((c) =>
            c.user_id === activeContactId
              ? {
                  ...c,
                  last_message: {
                    id: real.id,
                    content: real.content,
                    created_at: real.created_at,
                  },
                }
              : c,
          ),
        );
        // If this was a brand-new conversation (pending contact), refresh contacts list
        if (pendingContactRef.current?.user_id === activeContactId) {
          setPendingContact(null);
          loadContacts().catch(() => {});
        }
      } catch {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setIsSending(false);
      }
    },
    [activeContactId, isSending, loadContacts],
  );

  // ─── WebSocket incoming message ───────────────────────────────────────────

  const handleWsMessage = useCallback((event: WsNewMessageEvent) => {
    const currentContact = activeContactRef.current;

    if (event.sender_id === currentContact || event.receiver_id === currentContact) {
      // Active conversation — append incoming real-time message (deduplicate by id)
      const msg: Message = {
        id: event.id,
        sender_id: event.sender_id,
        receiver_id: event.receiver_id,
        content: event.content,
        created_at: event.created_at,
        read_at: event.read_at,
      };
      setMessages((prev) => {
        // Skip if this message is already present (REST response already added it,
        // or optimistic placeholder with the same real id was swapped in)
        if (prev.some((m) => m.id === event.id)) return prev;
        return [msg, ...prev];
      });
      // Mark it as read since the user is looking at it (only for messages from the other person)
      if (event.sender_id === currentContact) {
        markAsRead(event.sender_id).catch(() => {});
      }
    } else {
      // Different conversation — bump unread count
      setContacts((prev) => {
        const exists = prev.some((c) => c.user_id === event.sender_id);
        if (exists) {
          return prev.map((c) =>
            c.user_id === event.sender_id
              ? {
                  ...c,
                  unread_count: c.unread_count + 1,
                  last_message: {
                    id: event.id,
                    content: event.content,
                    created_at: event.created_at,
                  },
                }
              : c,
          );
        }
        // New contact we haven't seen — reload contacts list
        getContacts()
          .then(setContacts)
          .catch(() => {});
        return prev;
      });
    }
  }, []);

  useMessagingWebSocket(handleWsMessage);

  // ─── User Search ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const startNewConversation = useCallback(
    async (
      userId: string,
      userInfo?: { username: string; email: string; picture?: string | null },
    ) => {
      setNewMsgOpen(false);
      setSearchQuery('');
      setSearchResults([]);

      // If the user isn't in contacts yet, create a synthetic pending contact
      // so the ChatWindow can render with a header + input immediately.
      const alreadyInContacts = contacts.some((c) => c.user_id === userId);
      if (!alreadyInContacts) {
        if (userInfo) {
          setPendingContact({
            user_id: userId,
            username: userInfo.username,
            email: userInfo.email,
            profile_picture: userInfo.picture ?? null,
            last_message: null,
            unread_count: 0,
          });
        }
      } else {
        setPendingContact(null);
      }

      selectContact(userId);
    },
    [contacts, selectContact],
  );

  // Total unread count for sidebar badge
  const totalUnread = contacts.reduce((sum, c) => sum + c.unread_count, 0);

  return {
    // Contacts
    contacts,
    contactsLoading,
    totalUnread,
    loadContacts,
    pendingContact,

    // Active conversation
    activeContactId,
    selectContact,
    messages,
    messagesLoading,
    hasMore,
    loadOlderMessages,

    // Send
    isSending,
    sendMessage,

    // New message dialog
    newMsgOpen,
    setNewMsgOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    startNewConversation,
  };
}
