# Chat Viewer Plugin Guide

## Overview
The chat interface now uses a flexible, resizable split-pane layout that makes it easy to add new viewer types (PDF, Schedule, etc.) alongside the chat.

## Architecture

### Components
1. **ResizableSplitPane** - Manages the split layout with drag-to-resize functionality
2. **ViewerContainer** - Generic wrapper that provides consistent header/close button for all viewers
3. **useViewerState** - Hook for managing viewer state with localStorage persistence

### State Flow
```
ChatInput (file selected) 
  → page.tsx handlePdfSelect() 
  → openViewer('pdf', file) 
  → ResizableSplitPane activates 
  → ViewerContainer renders 
  → PdfViewerPanel displays content
```

## Adding a New Viewer Type

### Step 1: Update ViewerType enum
Edit `app/(main)/chat/_lib/use-viewer-state.ts`:

```typescript
export type ViewerType = 'pdf' | 'schedule' | 'document' | null;
```

### Step 2: Create Your Viewer Component
Example: `app/(main)/chat/_components/schedule-viewer-panel.tsx`

```typescript
'use client';

interface ScheduleViewerPanelProps {
  data: any; // Your schedule data structure
}

export function ScheduleViewerPanel({ data }: ScheduleViewerPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Your viewer UI here */}
      <div className="p-4">
        <h3>Schedule Content</h3>
        {/* Render your schedule */}
      </div>
    </div>
  );
}
```

### Step 3: Export from index.ts
Add to `app/(main)/chat/_components/index.ts`:

```typescript
export { ScheduleViewerPanel } from './schedule-viewer-panel';
```

### Step 4: Integrate in page.tsx
Update the `rightPane` content in the ResizableSplitPane:

```typescript
rightPane={
  viewerContent && (
    <ViewerContainer
      viewerType={viewerContent.type}
      onClose={closeViewer}
      title={viewerContent.type === 'schedule' ? 'Schedule Viewer' : undefined}
    >
      {viewerContent.type === 'pdf' && (
        <PdfViewerPanel file={viewerContent.data} />
      )}
      {viewerContent.type === 'schedule' && (
        <ScheduleViewerPanel data={viewerContent.data} />
      )}
    </ViewerContainer>
  )
}
```

### Step 5: Trigger Viewer Opening
From anywhere in your code (e.g., after AI generates a schedule):

```typescript
const { openViewer } = useViewerState();

// When you have schedule data to display
openViewer('schedule', scheduleData);
```

## Features

### Resizable Split Pane
- Default: Chat takes 100% width
- Active: Chat slides to 40% (configurable), Viewer takes 60%
- Users can drag the divider to resize (min 30%, max 70%)
- Split ratio persists in localStorage

### Smooth Animations
- 300ms transition when viewer opens/closes
- Smooth drag interaction with visual feedback

### Keyboard & Touch Support
- Drag with mouse or touch
- Visual hover states on resize handle

### Responsive Layout
- Automatically adapts to container size
- Clean, centered chat interface when no viewer active

## Best Practices

1. **Keep Viewers Simple**: Viewers should be pure content components without their own headers/close buttons
2. **Use ViewerContainer**: Always wrap your viewer in ViewerContainer for consistent UX
3. **Type Safety**: Add proper TypeScript types for your viewer data
4. **State Management**: Use the `openViewer()` function to activate viewers
5. **Cleanup**: ViewerContainer handles closing - just render your content

## Example: Opening from ChatMessage
If AI response contains a schedule that should open viewer:

```typescript
// In your message processing logic
if (message.has_schedule) {
  openViewer('schedule', message.schedule_data);
}
```

## State Persistence
- Split ratio is saved to localStorage as `chat-split-ratio`
- Viewers don't persist across page reloads (by design)
- Each viewer type can manage its own internal state

## Current Implementation
- ✅ PDF Viewer (fully implemented)
- 🚧 Schedule Viewer (placeholder ready)
- 📝 Easy to add more viewer types
