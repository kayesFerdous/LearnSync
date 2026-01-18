# Persistent Thread-Based Chat - Quick Reference Guide

## State Exported from `useChat()`

```typescript
const {
  // Conversation Management State
  conversations: Conversation[]              // All chat threads
  currentConversationId: string | null       // Active thread ID (null = new chat)
  isLoading: boolean                         // Loading state
  
  // Chat State
  messages: Message[]                        // Current view messages
  
  // Conversation Functions
  loadConversations: () => Promise<void>     // Fetch all conversations
  loadMessages: (id: string) => Promise<void> // Load conversation history
  startNewChat: () => void                   // Return to "New Chat" screen
  
  // Chat Functions
  sendMessage: (msg, tag, file) => Promise<void>
  approveRoutine: (msgId, data) => Promise<void>
  rejectRoutine: (msgId) => Promise<void>
} = useChat();
```

## API Endpoints

### List Conversations
```
GET /conversation/
Response: Conversation[]
```

### Load Message History
```
GET /conversation/{conversationId}/messages
Response: Message[]  (type: "human" | "ai")
```

### Send Message (New Chat)
```
POST /conversation/
Payload: { message?, image?, user_input?, tag }
Stream: { type: "conversation_id", payload: "UUID" } (FIRST EVENT!)
        { type: "chunk", content: "..." }
        { type: "done" }
```

### Send Message (Existing Chat)
```
POST /conversation/{conversationId}
Payload: { message?, image?, user_input?, tag }
Stream: { type: "chunk", content: "..." }
        { type: "done" }
```

## Critical SSE Event Handling

### New Chat Flow
1. User sends message with `currentConversationId === null`
2. Frontend POST to `/conversation/` (no ID in URL)
3. **First SSE event** contains metadata:
   ```json
   { "type": "conversation_id", "payload": "UUID-FROM-DB" }
   ```
4. Frontend MUST:
   - Extract UUID immediately
   - Set `currentConversationId = UUID`
   - Add to conversations sidebar (title: first 30 chars)
   - Continue processing rest of stream

### Existing Chat Flow
1. User sends message with `currentConversationId !== null`
2. Frontend POST to `/conversation/{currentConversationId}`
3. Backend processes normally
4. No `conversation_id` event in stream

## UI Components & Behavior

### Sidebar Conversations List
- Located left of chat area (260px width)
- Sorted by `updated_at DESC` (null fallback to `created_at`)
- Active item highlighted (primary color)
- Click to load conversation
- Scrollable if many conversations

### New Chat Button
- Top of sidebar (primary button)
- Clears all state
- Sets `currentConversationId = null`
- Focuses input

### Loading State
- Shows "Loading conversation..." in message area
- Disables conversation clicks
- Clears old messages before fetching

### Message Alignment
- User messages: right-aligned, primary color
- AI messages: left-aligned, with bot avatar
- Matches backend type: "human" vs "ai"

## Common Integration Points

### Starting a Fresh Session
```typescript
// User clicks "New Chat"
startNewChat();
// This: clears messages, sets currentConversationId = null, resets UI
```

### Loading a Saved Conversation
```typescript
// User clicks conversation in sidebar
loadMessages(conversationId);
// This: fetches messages, updates currentConversationId, shows history
```

### Sending a Message
```typescript
// Auto-detects scenario based on currentConversationId
sendMessage(userText, tag, file);
// If null: creates conversation (lazy creation)
// If set: continues existing conversation
```

## Error Handling

All functions handle errors gracefully:
- Network errors logged to console
- UI shows error messages in chat
- Retry buttons for failed operations
- Loading state cleared on error

## Performance Optimizations

1. **Batched Chunk Updates**: Uses RAF to batch SSE chunks
2. **Auto-scroll**: Smooth scroll to bottom on new messages
3. **Message Clearing**: Clears old messages before loading new conversation
4. **Lazy Loading**: Conversations fetched on mount, messages on demand

## Debugging Tips

### Check Active Conversation
```typescript
console.log('Current ID:', currentConversationId);
console.log('Conversations:', conversations);
```

### Monitor SSE Events
Browser DevTools → Network → find `/conversation/` or `/conversation/{id}` request → Preview tab shows SSE events

### Verify Message Format
Each message should have:
- `id: string` (unique)
- `role: "user" | "ai"`
- `content: string`
- `isStreaming?: boolean`

### Test Conversation Creation
1. Send message in new chat
2. Look for `conversation_id` event in SSE stream
3. Check if sidebar updates with new conversation
4. Verify `currentConversationId` is set

## Message Type Mapping

| Backend Type | Display Role | Alignment | Avatar |
|---|---|---|---|
| `"human"` | User | Right | ❌ |
| `"ai"` | Assistant | Left | 🤖 |

## Troubleshooting

| Issue | Solution |
|---|---|
| Sidebar not showing conversations | Check if `loadConversations()` was called on mount |
| Messages not loading | Verify `currentConversationId` is set before clicking |
| "New Chat" button not working | Check that `startNewChat()` clears state |
| Conversation ID not saved | Check SSE stream for `conversation_id` event |
| Stale messages showing | Ensure `loadMessages()` clears before fetching |
| Active highlight not working | Check `currentConversationId === conversation.id` |
