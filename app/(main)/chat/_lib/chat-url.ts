/**
 * Build a chat URL based on folder and conversation context.
 *
 * URL Structure:
 * - /chat                                          → New standalone chat
 * - /chat/{conversationId}                         → Existing standalone conversation
 * - /folder/{folderId}/chat                        → New chat in folder
 * - /folder/{folderId}/chat/{conversationId}       → Existing conversation in folder
 */
export function chatUrl(conversationId?: string | null, folderId?: string | null): string {
  if (folderId) {
    return conversationId
      ? `/folder/${folderId}/chat/${conversationId}`
      : `/folder/${folderId}/chat`;
  }
  return conversationId ? `/chat/${conversationId}` : '/chat';
}
