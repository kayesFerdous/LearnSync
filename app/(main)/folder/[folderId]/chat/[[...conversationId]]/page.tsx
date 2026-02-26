'use client';

import { use } from 'react';
import { ChatPageContent } from '@/app/(main)/chat/_components/chat-page-content';

export default function FolderChatPage({ params }: { params: Promise<{ folderId: string; conversationId?: string[] }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId?.[0];

  return <ChatPageContent conversationId={conversationId} folderId={resolvedParams.folderId} />;
}
