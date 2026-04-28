# Folder-Based Conversation Creation - Implementation

## Summary of Changes

Updated the frontend chat creation logic to support creating conversations directly inside specific folders via query parameters.

## Changes Made

### File: `app/(main)/chat/_lib/use-chat.ts`

#### 1. Updated Payload Type (Line 176)
**Before:**
```typescript
const payload: { message?: string; tag: string; image?: string; file_upload?: { object_key: string; original_filename: string }; folder_id?: string } = { tag: tagForRequest };
```

**After:**
```typescript
const payload: { message?: string; tag: string; image?: string; file_upload?: { object_key: string; original_filename: string } } = { tag: tagForRequest };
```

**Reason:** `folder_id` is now passed as a query parameter instead of in the request body.

#### 2. Updated Endpoint URL Construction (Lines 209-216)
**Before:**
```typescript
const endpoint = currentConversationId 
  ? `${BACKEND_URL.replace('/chat_bot', '')}/conversation/${currentConversationId}`
  : `${BACKEND_URL.replace('/chat_bot', '')}/conversation/`;

// Add folder_id to payload if creating conversation in a folder
if (!currentConversationId && activeFolderId) {
  payload.folder_id = activeFolderId;
}
```

**After:**
```typescript
let endpoint = currentConversationId 
  ? `${BACKEND_URL.replace('/chat_bot', '')}/conversation/${currentConversationId}`
  : `${BACKEND_URL.replace('/chat_bot', '')}/conversation/`;

// Append folder_id as query parameter when creating a new conversation in a folder
if (!currentConversationId && activeFolderId) {
  const separator = endpoint.includes('?') ? '&' : '?';
  endpoint += `${separator}folder_id=${encodeURIComponent(activeFolderId)}`;
}
```

**Reason:** 
- Changed `endpoint` from `const` to `let` to allow URL modification
- `folder_id` is now appended as a query parameter instead of being added to the payload
- Uses proper URL encoding for the folder ID value
- Handles proper separator logic (uses `&` if query string already exists, `?` otherwise)

## API Contract Implementation

The implementation now correctly handles all three scenarios:

### Scenario A: Root Chat
- **User Action:** Clicks "New Chat" from the main dashboard
- **URL:** `POST /conversation/`
- **Body:** `{ "message": "Hello", "tag": "..." }`
- **Result:** Creates conversation with `folder_id = null`

### Scenario B: Folder Chat
- **User Action:** Clicks "New Chat" while viewing Folder `123-abc`
- **URL:** `POST /conversation/?folder_id=123-abc`
- **Body:** `{ "message": "Hello", "tag": "..." }`
- **Result:** Creates conversation linked to Folder `123-abc`

### Scenario C: Replying to Existing Chat
- **User Action:** Sends a message in existing thread
- **URL:** `POST /conversation/{conversation_id}`
- **Body:** `{ "message": "Hello", "tag": "..." }`
- **Note:** No `folder_id` parameter (backend resolves from conversation ID)

## State Flow

1. User clicks "New Course" or "+ New Chat in Folder"
2. `activeFolderId` is set via `handleNewChatInFolder(folderId)` or `openCourseSetup()`
3. User types and sends first message
4. `sendMessage()` detects `!currentConversationId && activeFolderId`
5. `folder_id=...` is appended to the URL as a query parameter
6. Backend receives the request and creates the conversation in the specified folder
7. Once conversation is created, `activeFolderId` is cleared via `setActiveFolderId(null)`

## Testing Checklist

- [ ] Create a new chat from root (no folder_id in URL)
- [ ] Create a new chat from inside a folder (folder_id appended to URL)
- [ ] Reply to an existing chat (no folder_id parameter)
- [ ] Verify URL parameters in network tab
- [ ] Verify conversations are created in correct folders
