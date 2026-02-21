'use client';

import { MessageCircle } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="h-20 w-20 rounded-2xl bg-accent/50 flex items-center justify-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">Your messages</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a conversation from the left or start a new one to begin messaging.
        </p>
      </div>
    </div>
  );
}
