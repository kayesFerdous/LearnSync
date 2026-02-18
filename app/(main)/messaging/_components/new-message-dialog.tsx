'use client';

import { useEffect, useRef } from 'react';
import { X, Search, Loader2, MessageCirclePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { SearchUser } from '../_lib/types';

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  searchResults: SearchUser[];
  searchLoading: boolean;
  onSelect: (userId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function NewMessageDialog({
  open,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onSelect,
}: NewMessageDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCirclePlus className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">New Message</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-accent/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring/50 transition-all"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {!searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
                <Search className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">
                  Search for a user to start a conversation.
                </p>
              </div>
            )}

            {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">No users found.</p>
              </div>
            )}

            {searchResults.map((user) => (
              <button
                key={user.user_id}
                onClick={() => onSelect(user.user_id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left',
                  'hover:bg-accent/70 transition-colors',
                )}
              >
                <Avatar className="h-9 w-9">
                  {user.picture && (
                    <AvatarImage src={user.picture} alt={user.username} />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
