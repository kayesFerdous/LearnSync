# Routine Time Rendering Fix

## Problem
The UI was not fully rendering the actual time and dates in the routine approval widget. The issue occurred because:

1. **Data Format Mismatch**: The backend was returning `start` and `end` fields as **strings** (e.g., `"2026-01-24T05:30:00"`), but the frontend component expected them as **objects with a `dateTime` property** (e.g., `{ dateTime: "2026-01-24T05:30:00" }`).

2. **Field Name Inconsistency**: The backend used `course` while the frontend expected `course_name`.

## Solution
Created a **normalization function** that transforms backend routine data into the frontend-expected format at the point of entry.

### Changes Made

#### 1. **api.ts** - Added `normalizeRoutineData` function
- Exported new utility function to normalize routine data
- Handles flexible input formats:
  - Converts string timestamps to object format with `dateTime` property
  - Maps `course` field name to `course_name`
  - Preserves all other fields (day, recurrence, title, etc.)
- Applied normalization in three places:
  1. `fetchMessages()` - When loading conversation history
  2. `processStream()` - When receiving real-time routine_approved events

#### 2. **use-chat.ts** - Updated routine handlers
- Imported `normalizeRoutineData` from api.ts
- Updated three `onRoutineApproved` handlers to normalize data:
  1. Main chat handler (initial message flow)
  2. Resume handler (approval flow)
  3. Reject handler (rejection flow)

### Example Transformation
**Before (Backend):**
```json
{
  "title": "Class Routine",
  "classes": [
    {
      "day": "Saturday",
      "course": "Financial Accounting",
      "start": "2026-01-24T05:30:00",
      "end": "2026-01-24T07:00:00"
    }
  ]
}
```

**After (Frontend):**
```json
{
  "title": "Class Routine",
  "classes": [
    {
      "day": "Saturday",
      "course_name": "Financial Accounting",
      "start": { "dateTime": "2026-01-24T05:30:00" },
      "end": { "dateTime": "2026-01-24T07:00:00" }
    }
  ]
}
```

## Files Modified
1. `/app/(main)/chat/_lib/api.ts` - Added normalization function and applied it
2. `/app/(main)/chat/_lib/use-chat.ts` - Updated handlers to use normalization

## Benefits
- ✅ Times now render correctly in the routine approval widget
- ✅ Flexible input format handling (supports both string and object formats)
- ✅ Single point of transformation prevents data format issues across the app
- ✅ No changes needed to UI components or types
- ✅ Backwards compatible with existing data structures
