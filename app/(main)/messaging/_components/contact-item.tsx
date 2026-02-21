'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Contact } from '../_lib/types';

function formatLastSeen(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface ContactItemProps {
  contact: Contact;
  isActive: boolean;
  onClick: () => void;
}

export function ContactItem({ contact, isActive, onClick }: ContactItemProps) {
  const initials = getInitials(contact.username);
  const lastTime = contact.last_message?.created_at
    ? formatLastSeen(contact.last_message.created_at)
    : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent/80 text-foreground',
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          {contact.profile_picture && (
            <AvatarImage src={contact.profile_picture} alt={contact.username} />
          )}
          <AvatarFallback
            className={cn(
              'text-sm font-semibold',
              isActive
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-accent text-foreground',
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator placeholder — can be wired up later */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{contact.username}</span>
          {lastTime && (
            <span
              className={cn(
                'text-[10px] shrink-0',
                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground',
              )}
            >
              {lastTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-xs truncate leading-snug',
              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
            )}
          >
            {contact.last_message?.content ?? 'No messages yet'}
          </p>
          {contact.unread_count > 0 && !isActive && (
            <span className="shrink-0 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {contact.unread_count > 99 ? '99+' : contact.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
