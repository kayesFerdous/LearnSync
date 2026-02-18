'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useMessaging } from './_lib/use-messaging';
import { ContactsSidebar } from './_components/contacts-sidebar';
import { ChatWindow } from './_components/chat-window';
import { NewMessageDialog } from './_components/new-message-dialog';

export default function MessagingPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const handledUserIdRef = useRef<string | null>(null);
  const initialMobileView = searchParams.get('userId') ? 'chat' : 'contacts';

  const {
    contacts,
    contactsLoading,
    pendingContact,
    activeContactId,
    selectContact,
    messages,
    messagesLoading,
    hasMore,
    loadOlderMessages,
    isSending,
    sendMessage,
    newMsgOpen,
    setNewMsgOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    startNewConversation,
  } = useMessaging();

  // Mobile: either show contacts or chat window
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>(initialMobileView);

  const handleSelectContact = (id: string) => {
    selectContact(id);
    setMobileView('chat');
  };

  // Handle ?userId= redirect from profile / admin pages.
  // Also reads ?username= and ?email= so we can show the chat header
  // even before a message is sent (contact not yet in contacts list).
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) return;
    if (handledUserIdRef.current === targetUserId) return;

    handledUserIdRef.current = targetUserId;
    const username = searchParams.get('username') ?? '';
    const email = searchParams.get('email') ?? '';
    const picture = searchParams.get('picture') ?? null;

    void startNewConversation(
      targetUserId,
      username ? { username, email, picture } : undefined,
    );
    setMobileView('chat');
  }, [searchParams, startNewConversation]);

  // Prefer a real contact from the list; fall back to pendingContact
  // for brand-new conversations before the first message is sent.
  const activeContact =
    contacts.find((c) => c.user_id === activeContactId) ??
    (pendingContact?.user_id === activeContactId ? pendingContact : undefined);

  return (
    <div className="h-full min-h-0 w-full flex overflow-hidden bg-background p-2 md:p-4 gap-2 md:gap-3">
      {/* ── Contacts Sidebar ───────────────────────────── */}
      <div
        className={cn(
          'w-full md:w-80 xl:w-96 shrink-0 min-h-0 md:rounded-2xl md:border md:border-border/60 md:bg-card/80 md:backdrop-blur overflow-hidden',
          'transition-transform duration-300 ease-out',
          // Mobile: hide when chat is open
          mobileView === 'chat' ? '-translate-x-full md:translate-x-0 hidden md:flex md:flex-col min-h-0' : 'flex flex-col min-h-0',
        )}
      >
        <ContactsSidebar
          contacts={contacts}
          loading={contactsLoading}
          activeContactId={activeContactId}
          onSelect={handleSelectContact}
          onNewMessage={() => setNewMsgOpen(true)}
        />
      </div>

      {/* ── Chat Window ─────────────────────────────────── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 min-h-0 md:rounded-2xl md:border md:border-border/60 overflow-hidden',
          // Mobile: hide when contacts are visible
          mobileView === 'contacts'
            ? 'hidden md:flex'
            : 'flex',
        )}
      >
        <ChatWindow
          activeContact={activeContact}
          messages={messages}
          messagesLoading={messagesLoading}
          hasMore={hasMore}
          isSending={isSending}
          currentUserId={user?.user_id}
          onSend={sendMessage}
          onLoadMore={loadOlderMessages}
          onBack={() => setMobileView('contacts')}
        />
      </div>

      {/* ── New Message Dialog ───────────────────────────── */}
      <NewMessageDialog
        open={newMsgOpen}
        onClose={() => {
          setNewMsgOpen(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSelect={(userId, userInfo) => {
          void startNewConversation(userId, userInfo).then(() =>
            setMobileView('chat'),
          );
        }}
      />
    </div>
  );
}
