# Folder Structure & Smart Upload Implementation

## Overview
This document summarizes the implementation of folder-based conversation organization and smart upload redirection for the chat application.

## Changes Made

### 1. Type Definitions (`_lib/types.ts`)
**Updated:**
- `Folder` interface now includes `conversations: Conversation[]` array
- Removed `folder_id` from `Conversation` (backend handles relationship)
- Added `ConversationListResponse` with `folders` and `conversations` arrays
- Updated `ConfirmUploadResponse` interface with `conversation_id`

##Updated:**
- `fetchConversations()`: Now returns `ConversationListResponse` with nested structure
  - GET `/conversation/` returns both folders (with conversations) and root conversations
  - Single endpoint replaces previous separate folder/conversation calls
- `createFolder(name)`: POST `/conversation/folder` - Creates a new folder
- `confirmUpload()`: Returns `ConfirmUploadResponse` with `conversation_
- Updated `confirmUpload()` to return `ConfirmUploadResponse` instead of `void`

##`folders` and `conversations` state populated from single API call
- `loadConversations()` fetches combined data and sorts both lists
- `createFolderHandler()` creates folder then reloads full data from backend
- Added `loadFolders()` function to fetch folders on mount
- Added `createFolderHandler()` function to create new folders

**Smart Upload Redirection:**
- Updated `sendMessage()` to handle `conversation_id` from upload confirmation
- When a file is uploaded without an active conversation:
  - Reads `conversation_id` from the `/uploads/confirm` response
  - Automatically redirects to that conversation
  - Loads existing messages for the conversation
  - Updates the conversation list
  - Exits early to avoid duplicate message sending

**Return Values:**
- Exported `folders` state (with nested conversations)
- Exported `conversations` state (root-level only)
- Exported `createFolderHandler` function
- Removed `loadFolders` (combined with `loadConversations`)

### 4. Chat Page UI (`[[...conversationId]]/page.tsx`)
**Sidebar Refactoring:**

#### Header Section:
- **"New Chat"** button - Creates root-level conversation
- **"New Folder"** button - Opens folder creation input

#### Folder Creation:
- Inline input field with Create/Cancel buttons
- Keyboard shortcuts: Enter to create, Escape to cancel
- Auto-expands newly created folders
- Displays success/error toast notifications

#### Conversation Display:from `conversations` array displayed first
- **Folders**: From `folders` array, each with nested `conversations`
  - Click folder to expand/collapse
  - Shows conversation count badge from `folder.conversations.length`
  - Nested conversation list when expanded
  - Empty state for folders with no conversations

#### Data Flow:
- Backend sends folders with pre-populated conversations
- No client-side filtering by `folder_id` needed
- Conversations are already organized by the backend
  - Empty state for folders with no conversations

#### Visual Features:
- Chevron icons (right/down) indicate folder expand state
- Delete buttons appear on hover for each conversation
- Active conversation highlighted with primary color
- Smooth transitions for all interactions

**State Management:**
- `expandedFolders`: Set of folder IDs that are currently expanded
- `showFolderInput`: Controls folder creation input visibility
- `newFolderName`: Tracks folder name being entered
- `isCreatingFolder`: Loading state during folder creation

## API Endpoints Used

### Conversations & Folders (Combined)
```
GET  /conversation/                    # Fetch all folders and conversations
Response: {
  "folders": [
    {
      "id": "uuid",
      "name": "string",
      "created_at": "timestamp",
      "conversations": [
        {
          "id": "uuid",
          "title": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ]
    }
  ],
  "conversations": [                    # Root-level conversations (no folder)
    {
      "id": "uuid",
      "title": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}

POST /conversation/folder              # Create new folder
Body: { "name": "string" }
Response: { "id": "uuid", "name": "string", "created_at": "timestamp" }
```

### Upload
```
POST /uploads/confirm
Body: { "object_key": "string", "original_filename": "string" }
Response: { 
  "message": "string",
  "object_key": "string", 
  "conversation_id": "uuid"  # <-- Critical for redirection
}
```

## User Workflows

### Creating a Folder
1. User clicks "New Folder" button
2. Input field appears inline in sidebar
3. User types folder name and presses Enter (or clicks Create)
4. Folder is created and appears at the top of the list
5. Folder auto-expands to show it's ready for conversations

### Uploading a File (Smart Redirection)
1. User uploads a file from home page (no active conversation)
2. File is uploaded to R2 storage
3. Backend confirms upload and returns `conversation_id`
4. Frontend automatically:
   - Sets that conversation as active
   - Navigates to `/chat/{conversation_id}`
   - Loads existing messages
   - Updates sidebar with conversation
5. User immediately sees their upload processing in the conversation

### Organizing Conversations
- Root-level conversations appear at the top
- Folders can be collapsed/expanded by clicking
- Conversations can be moved to folders (backend handles this via folder_id)
- Delete buttons work the same for all conversations

## Future Enhancements
- Drag-and-drop to move conversations between folders
- Folder rename/delete functionality
- Backend provides pre-organized data structure (folders with conversations)
- No `folder_id` field on conversations; relationship managed server-side
- Single API call fetches entire sidebar structure
- Folders are sorted by creation date (newest first)
- Root conversations sorted by update/ icons
- Search/filter within folders
- Folder sorting options

## Notes
- Conversations without `folder_id` are considered root-level
- Folders are sorted by creation date (newest first)
- The "New Chat" button always creates root-level conversations
- Smart upload only triggers when user is NOT already in a conversation
