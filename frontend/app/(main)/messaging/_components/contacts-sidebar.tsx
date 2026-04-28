'use client';

import { useState, useMemo } from 'react';
import { Search, SquarePen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '../_lib/types';
import { ContactItem } from './contact-item';

interface ContactsSidebarProps {
  contacts: Contact[];
  loading: boolean;
  activeContactId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
}

export function ContactsSidebar({
  contacts,
  loading,
  activeContactId,
  onSelect,
  onNewMessage,
}: ContactsSidebarProps) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return contacts;
    const q = filter.toLowerCase();
    return contacts.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.last_message?.content.toLowerCase().includes(q),
    );
  }, [contacts, filter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <h2 className="text-lg font-bold">Messages</h2>
        <button
          onClick={onNewMessage}
          title="New message"
          className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a conversation..."
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm',
              'bg-accent/50 border border-border rounded-xl',
              'outline-none focus:ring-2 focus:ring-ring/50 transition-all',
            )}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
            <p className="text-sm text-muted-foreground">
              No conversations yet.
            </p>
            <button
              onClick={onNewMessage}
              className="text-sm text-primary hover:underline font-medium"
            >
              Start a new one →
            </button>
          </div>
        )}

        {!loading && contacts.length > 0 && filtered.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No matches found.</p>
          </div>
        )}

        <div className="space-y-0.5 pb-4">
          {filtered.map((contact) => (
            <ContactItem
              key={contact.user_id}
              contact={contact}
              isActive={contact.user_id === activeContactId}
              onClick={() => onSelect(contact.user_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
