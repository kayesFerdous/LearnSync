# Persistent Thread-Based Chat Refactoring - Implementation Summary

## Overview
Successfully refactored the chat interface to implement Persistent Thread-Based Chat using the new Backend API. The implementation includes full conversation management, lazy conversation creation, and SSE stream handling with conversation metadata parsing.

## Changes Made

### 1. Type System Updates ([types.ts](app/(main)/chat/_lib/types.ts))
Added new interfaces for conversation management:
- **`Conversation` interface**: Represents a chat thread
  - `id: string` - UUID for the conversation
  - `title: string` - Display title (defaults to "New Conversation")
  - `created_at: string` - ISO timestamp
  - `updated_at: string | null` - ISO timestamp or null if not yet updated

- **`BackendStreamEvent` type extension**: Added support for `conversation_id` metadata event
  - `{ type: 'conversation_id'; payload: string }` - Sent by backend when creating new conversation

### 2. API Implementation ([api.ts](app/(main)/chat/_lib/api.ts))

#### New Endpoints
- **`fetchConversations()`**: GET `/conversation/`
  - Fetches all conversation threads for the sidebar
  - Returns sorted array (by updated_at descending, fallback to created_at)

- **`fetchMessages(conversationId)`**: GET `/conversation/{conversationId}/messages`
  - Loads chat history for a specific conversation
  - Returns array of Message objects with `type: "human" | "ai"`

#### Stream Handler Enhancement
Updated `StreamHandlers` interface to support conversation creation:
- Added optional `onConversationId` callback
- Handles the critical first SSE event containing conversation metadata
- Discriminates between conversation_id setup packet and regular content chunks

Updated `processStream()` to handle the new `conversation_id` event type in the SSE parser.

### 3. State Management Refactor ([use-chat.ts](app/(main)/chat/_lib/use-chat.ts))

#### New State Variables
```typescript
conversations: Conversation[]         // List of all chat threads
currentConversationId: string | null  // Active thread ID (null = "New Chat" screen)
messages: Message[]                   // Messages in current view
isLoading: boolean                    // UI feedback state
```

#### New Functions

1. **`loadConversations()`**
   - Fetches all conversations on component mount
   - Sorts by `updated_at` (descending), fallback to `created_at`
   - Updates conversations state

2. **`loadMessages(conversationId)`**
   - Fetches message history for a conversation
   - Clears old messages before fetching (prevents showing stale data)
   - Sets `currentConversationId` and updates UI

3. **`startNewChat()`**
   - Sets `currentConversationId` to null
   - Clears messages array
   - Returns to "New Chat" screen

#### Enhanced `sendMessage()` Function

**Lazy Creation Logic** (Two Scenarios):

**Scenario 1: New Chat** (`currentConversationId === null`)
- Endpoint: `POST /conversation/`
- Backend auto-creates conversation and sends first SSE event:
  ```
  data: { "type": "conversation_id", "payload": "NEW-UUID-FROM-DB" }
  ```
- Implementation:
  1. Parse and extract UUID from first SSE event
  2. Set `currentConversationId = payload`
  3. Optimistically add new item to conversations sidebar (title: first 30 chars of message)
  4. Continue processing remaining stream chunks (AI response)

**Scenario 2: Existing Chat** (`currentConversationId !== null`)
- Endpoint: `POST /conversation/{currentConversationId}`
- Backend processes message normally
- No conversation_id event in this mode

#### UI Behavior Features
- **Optimistic UI**: User message added immediately before request (right-aligned)
- **Active State**: Sidebar item highlights when matching `currentConversationId`
- **Loading Feedback**: Shows "Loading conversation..." while fetching message history

### 4. Chat Page Component ([page.tsx](app/(main)/chat/page.tsx))

#### New UI Structure
- **Left Sidebar** (260px width):
  - "New Chat" button (top, full width)
  - Scrollable conversations list
  - Active state highlighting
  - Fallback message when no conversations exist

- **Main Chat Area**:
  - AI Assistant header
  - Message list with loading state
  - Floating input at bottom
  - Auto-scroll to newest messages

- **PDF Viewer** (50% width when visible):
  - Slides in from right on PDF selection
  - Responsive layout

#### New Event Handlers
- `handleNewChat()`: Clears state, focuses input
- `handleConversationClick()`: Loads selected conversation's messages
- `handlePdfSelect()`: Opens/closes PDF viewer

#### State Management Flow
```
User clicks conversation
    ↓
handleConversationClick(id)
    ↓
loadMessages(id) in hook
    ↓
Fetch messages from backend
    ↓
Update messages + currentConversationId
    ↓
UI highlights active conversation
```

## Key Implementation Details

### Conversation ID Metadata Parsing
The SSE stream parser correctly handles the first event from new conversation creation:
1. Checks for `type: 'conversation_id'` before other event types
2. Calls `onConversationId()` callback with the UUID payload
3. Continues processing rest of stream normally

### Sort Logic
Conversations sorted by `updated_at DESC`, with fallback to `created_at` if `updated_at` is null:
```typescript
const sorted = data.sort((a, b) => {
  const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
  const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
  return timeB - timeA;  // Descending order
});
```

### Message Type Mapping
- Backend type `"human"` → Display as user message (right-aligned, primary color)
- Backend type `"ai"` → Display as assistant message (left-aligned, with avatar)

### URL Construction
- New chat endpoint: `POST /conversation/`
- Existing chat endpoint: `POST /conversation/{conversationId}`
- Message history endpoint: `GET /conversation/{conversationId}/messages`

## Testing Checklist

- [ ] New conversation creation works with SSE metadata parsing
- [ ] Conversation ID correctly extracted from first SSE event
- [ ] New conversation appears in sidebar with correct title (first 30 chars)
- [ ] Clicking sidebar item loads conversation messages
- [ ] "New Chat" button clears state and returns to blank chat
- [ ] Active conversation highlighted in sidebar
- [ ] Conversations sorted by updated_at (descending)
- [ ] Sending message to existing conversation uses POST /conversation/{id}
- [ ] Loading state displays while fetching messages
- [ ] PDF upload still works with message sending
- [ ] Routine approval/rejection flows work with persistent conversations
- [ ] Old messages cleared before loading new conversation (no stale data)

## API Contract Summary

### GET /conversation/
```json
Response: Conversation[]
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "My first conversation",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T12:30:00Z"
  }
]
```

### GET /conversation/{conversationId}/messages
```json
Response: Message[]
[
  {
    "type": "human",
    "content": "Hello, assistant!"
  },
  {
    "type": "ai",
    "content": "Hi! How can I help you?"
  }
]
```

### POST /conversation/ (New Chat)
```json
Request: {
  "message": "User input text",
  "image": null,
  "user_input": null,
  "tag": "general"
}

Response Stream (First Event):
data: { "type": "conversation_id", "payload": "NEW-UUID" }

Response Stream (Subsequent):
data: { "type": "chunk", "content": "..." }
data: { "type": "done" }
```

### POST /conversation/{conversationId} (Continue Chat)
```json
Request: {
  "message": "User input text",
  "image": null,
  "user_input": null,
  "tag": "general"
}

Response Stream:
data: { "type": "chunk", "content": "..." }
data: { "type": "done" }
```

## Files Modified

1. **[app/(main)/chat/_lib/types.ts](app/(main)/chat/_lib/types.ts)**
   - Added `Conversation` interface
   - Extended `BackendStreamEvent` type with `conversation_id` event

2. **[app/(main)/chat/_lib/api.ts](app/(main)/chat/_lib/api.ts)**
   - Added `fetchConversations()` function
   - Added `fetchMessages()` function
   - Enhanced `StreamHandlers` interface with `onConversationId` callback
   - Updated `processStream()` to parse `conversation_id` events

3. **[app/(main)/chat/_lib/use-chat.ts](app/(main)/chat/_lib/use-chat.ts)**
   - Added conversation state management
   - Added `loadConversations()`, `loadMessages()`, `startNewChat()` functions
   - Refactored `sendMessage()` with lazy creation logic
   - Added SSE conversation_id event handling

4. **[app/(main)/chat/page.tsx](app/(main)/chat/page.tsx)**
   - Added left sidebar with conversations list
   - Added "New Chat" button
   - Added conversation click handlers
   - Integrated loading state UI
   - Added active state highlighting

## Future Enhancements

- [ ] Search/filter conversations in sidebar
- [ ] Rename conversations via UI
- [ ] Delete conversations
- [ ] Pin/favorite conversations
- [ ] Conversation preview on hover
- [ ] Keyboard shortcuts (Cmd+K for new chat, etc.)
- [ ] Keyboard navigation for conversations list
- [ ] Conversation export/import
- [ ] Draft messages (localStorage)
- [ ] Conversation sharing (if backend supports)
