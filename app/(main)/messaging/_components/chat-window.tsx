'use client';

import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, CheckCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Chat } from '@/components/chat/chat';
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderButton,
  ChatHeaderMain,
} from '@/components/chat/chat-header';

import { ChatMessages } from '@/components/chat/chat-messages';
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventAvatar,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle,
} from '@/components/chat/chat-event';
import {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarButton,
  ChatToolbarTextarea,
} from '@/components/chat/chat-toolbar';
import { cn } from '@/lib/utils';
import type { Contact, Message } from '../_lib/types';
import { EmptyState } from './empty-state';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Group messages by date (day).
 * Returns an array of {date, messages} segments, newest day first,
 * matching the flex-col-reverse rendering order.
 */
function groupByDate(messages: Message[]): { dateKey: string; msgs: Message[] }[] {
  const groups: Map<string, Message[]> = new Map();
  for (const msg of messages) {
    const key = new Date(msg.created_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(msg);
  }
  // Convert to array — messages are newest-first, so groups should be too
  return Array.from(groups.entries()).map(([dateKey, msgs]) => ({ dateKey, msgs }));
}

interface ChatWindowProps {
  activeContact: Contact | undefined;
  messages: Message[];
  messagesLoading: boolean;
  hasMore: boolean;
  isSending: boolean;
  currentUserId: string | undefined;
  onSend: (content: string) => void;
  onLoadMore: () => void;
  onBack?: () => void;
}

export function ChatWindow({
  activeContact,
  messages,
  messagesLoading,
  hasMore,
  isSending,
  currentUserId,
  onSend,
  onLoadMore,
  onBack,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive (messages[0] is newest)
  const prevFirstId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (messages.length === 0) return;
    if (messages[0]?.id !== prevFirstId.current) {
      prevFirstId.current = messages[0]?.id;
      // ChatMessages uses flex-col-reverse — scroll to top == newest
      messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [messages]);

  // Infinite scroll: detect when user scrolls to bottom
  // (in flex-col-reverse "bottom" is actually scrollTop near scrollHeight)
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el || !hasMore || messagesLoading) return;
    // flex-col-reverse: scrollTop approaching max means scrolled to oldest
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      onLoadMore();
    }
  }, [hasMore, messagesLoading, onLoadMore]);

  const handleSubmit = useCallback(() => {
    if (!draft.trim() || isSending) return;
    onSend(draft.trim());
    setDraft('');
  }, [draft, isSending, onSend]);

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col">
        <EmptyState />
      </div>
    );
  }

  const initials = getInitials(activeContact.username);
  const groups = groupByDate(messages);

  return (
    <Chat className="flex-1 h-full">
      {/* ── Header ── */}
      <ChatHeader className="border-b border-border/50">
        {/* Back button (mobile) */}
        {onBack && (
          <ChatHeaderAddon>
            <ChatHeaderButton onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </ChatHeaderButton>
          </ChatHeaderAddon>
        )}

        {/* Avatar */}
        <ChatHeaderAddon>
          <Avatar className="h-9 w-9">
            {activeContact.profile_picture && (
              <AvatarImage
                src={activeContact.profile_picture}
                alt={activeContact.username}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </ChatHeaderAddon>

        {/* Name / email */}
        <ChatHeaderMain>
          <span className="font-semibold text-sm">{activeContact.username}</span>
          <span className="flex-1 grid">
            <span className="text-xs text-muted-foreground truncate">
              {activeContact.email}
            </span>
          </span>
        </ChatHeaderMain>

        {/* Actions */}
        <ChatHeaderAddon>
          {messagesLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-1" />
          )}
          <ChatHeaderButton title="Mark all as read" className="text-muted-foreground">
            <CheckCheck className="h-5 w-5" />
          </ChatHeaderButton>
        </ChatHeaderAddon>
      </ChatHeader>

      {/* ── Messages ── */}
      <ChatMessages
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="scrollbar-thin"
      >
        {/* Load more indicator (shown at bottom of reversed list = oldest end) */}
        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              disabled={messagesLoading}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {messagesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Load older messages'
              )}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {/* Message groups */}
        {groups.map(({ dateKey, msgs }, groupIdx) => (
          <Fragment key={dateKey}>
            {/* Messages in this day group */}
            {msgs.map((msg, msgIdx) => {
              const isMe = msg.sender_id === currentUserId;
              // Check if same sender as the next message in this group
              const nextMsg = msgs[msgIdx + 1];
              const isContinuation =
                nextMsg && nextMsg.sender_id === msg.sender_id;

              const ts = new Date(msg.created_at).getTime();

              if (isContinuation) {
                // Additional (follow-up) message — no avatar, hover timestamp
                return (
                  <ChatEvent
                    key={msg.id}
                    className={cn(
                      'hover:bg-accent/40 group',
                      isMe && 'flex-row-reverse',
                    )}
                  >
                    <ChatEventAddon className={cn(isMe && 'items-end')}>
                      <ChatEventTime
                        timestamp={ts}
                        format="time"
                        className="text-right text-[10px] group-hover:visible invisible text-muted-foreground"
                      />
                    </ChatEventAddon>
                    <ChatEventBody
                      className={cn(isMe && 'items-end')}
                    >
                      <ChatEventContent
                        className={cn(
                          'text-sm',
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 w-fit max-w-[75%]'
                            : '',
                        )}
                      >
                        {msg.content}
                      </ChatEventContent>
                    </ChatEventBody>
                  </ChatEvent>
                );
              }

              // Primary message — show avatar
              return (
                <ChatEvent
                  key={msg.id}
                  className={cn(
                    'hover:bg-accent/40 mt-3',
                    isMe && 'flex-row-reverse',
                  )}
                >
                  <ChatEventAddon className={cn(isMe && 'items-end')}>
                    {isMe ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                          Me
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <ChatEventAvatar
                        src={activeContact.profile_picture ?? undefined}
                        fallback={initials}
                        className="h-8 w-8"
                      />
                    )}
                  </ChatEventAddon>
                  <ChatEventBody
                    className={cn(isMe && 'items-end')}
                  >
                    <ChatEventTitle
                      className={cn(isMe && 'flex-row-reverse')}
                    >
                      <span className="text-sm font-semibold">
                        {isMe ? 'You' : activeContact.username}
                      </span>
                      <ChatEventTime
                        timestamp={ts}
                        format="dateTime"
                        className="text-[11px] text-muted-foreground"
                      />
                    </ChatEventTitle>
                    <ChatEventContent
                      className={cn(
                        'text-sm',
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 w-fit max-w-[75%]'
                          : '',
                      )}
                    >
                      {msg.content}
                    </ChatEventContent>
                  </ChatEventBody>
                </ChatEvent>
              );
            })}

            {/* Date separator */}
            <ChatEvent className="items-center gap-1 my-3">
              <Separator className="flex-1 bg-border/60" />
              <ChatEventTime
                timestamp={new Date(msgs[0].created_at).getTime()}
                format="longDate"
                className="text-xs font-semibold text-muted-foreground min-w-max px-2"
              />
              <Separator className="flex-1 bg-border/60" />
            </ChatEvent>
          </Fragment>
        ))}
      </ChatMessages>

      {/* ── Toolbar ── */}
      <ChatToolbar>
        <ChatToolbarTextarea
          placeholder={`Message ${activeContact.username}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onSubmit={handleSubmit}
          className="text-sm"
        />
        <ChatToolbarAddon align="inline-end">
          <ChatToolbarButton
            onClick={handleSubmit}
            disabled={!draft.trim() || isSending}
            title="Send"
            className="text-primary disabled:opacity-40"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
            )}
          </ChatToolbarButton>
        </ChatToolbarAddon>
      </ChatToolbar>
    </Chat>
  );
}
