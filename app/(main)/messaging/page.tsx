'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useMessaging } from './_lib/use-messaging';
import { ContactsSidebar } from './_components/contacts-sidebar';
import { ChatWindow } from './_components/chat-window';
import { NewMessageDialog } from './_components/new-message-dialog';

export default function MessagingPage() {
  const { user } = useAuthStore();

  const {
    contacts,
    contactsLoading,
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
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  const handleSelectContact = (id: string) => {
    selectContact(id);
    setMobileView('chat');
  };

  const activeContact = contacts.find((c) => c.user_id === activeContactId);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Contacts Sidebar ───────────────────────────── */}
      <div
        className={cn(
          'w-full md:w-80 xl:w-96 shrink-0 border-r border-border/50 bg-card',
          'transition-transform duration-300 ease-out',
          // Mobile: hide when chat is open
          mobileView === 'chat' ? '-translate-x-full md:translate-x-0 hidden md:flex md:flex-col' : 'flex flex-col',
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
          'flex-1 flex flex-col min-w-0 bg-background',
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
        onSelect={startNewConversation}
      />
    </div>
  );
}
