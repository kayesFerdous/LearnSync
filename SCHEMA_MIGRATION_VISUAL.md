# Schema Migration: Quick Visual Reference

## Before & After Comparison

### Data Structure Change

```
┌─────────────────────────────────────────────────────────────────┐
│                           BEFORE                                 │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "day": "Monday",                                               │
│   "time": "08:30 AM - 10:00 AM",  ← Single string field         │
│   "course_name": "CSE-101"                                       │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘

                              ⬇️ MIGRATION ⬇️

┌─────────────────────────────────────────────────────────────────┐
│                            AFTER                                 │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "day": "Monday",                                               │
│   "course_name": "CSE-101",                                      │
│   "start": {                         ← Structured object         │
│     "dateTime": "2026-01-19T08:30:00"  ← ISO 8601 format        │
│   },                                                             │
│   "end": {                           ← Structured object         │
│     "dateTime": "2026-01-19T10:00:00"  ← ISO 8601 format        │
│   }                                                              │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## UI Changes

### Edit Mode

**BEFORE:**
```
┌────────────────────────────────────────────┐
│ Day: [Monday ▼]                            │
│ Time: [08:30 AM - 10:00 AM]  ← Text input  │
│ Course: [CSE-101]                          │
│              [Delete] [Done]               │
└────────────────────────────────────────────┘
```

**AFTER:**
```
┌────────────────────────────────────────────┐
│ Day: [Monday ▼]                            │
│ Start Time: [08:30] End Time: [10:00]      │
│     ↑ Native time picker   ↑ Native picker │
│ Course: [CSE-101]                          │
│              [Delete] [Done]               │
└────────────────────────────────────────────┘
```

### View Mode

**BEFORE:**
```
┌────────────────────────────────────────────┐
│ 🕐 08:30 AM - 10:00 AM     CSE-101    ✏️🗑️ │
│    ↑ Displayed from "time" field           │
└────────────────────────────────────────────┘
```

**AFTER:**
```
┌────────────────────────────────────────────┐
│ 🕐 08:30 AM - 10:00 AM     CSE-101    ✏️🗑️ │
│    ↑ Formatted from start/end datetimes    │
└────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│   Backend    │
│  (Python)    │
└──────┬───────┘
       │ Sends interrupt with new schema
       │ { start: {dateTime: "..."}, end: {dateTime: "..."} }
       │
       ⬇️
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 1. types.ts: ClassSchedule interface with start/end  │ │
│ └──────────────────────────────────────────────────────┘ │
│                          ⬇️                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 2. chat-message.tsx: Renders RoutineApprovalWidget  │ │
│ └──────────────────────────────────────────────────────┘ │
│                          ⬇️                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 3. routine-approval-widget.tsx:                      │ │
│ │    - formatTimeRange() converts to "08:30 AM - ..." │ │
│ │    - Displays in view mode                           │ │
│ │    - Edit mode shows time pickers                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                          ⬇️                               │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 4. User approves → Send back same ISO format         │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────┘
                             │ Approval payload with ISO dates
                             │ { start: {dateTime: "..."}, end: {dateTime: "..."} }
                             ⬇️
                      ┌──────────────┐
                      │   Backend    │
                      │  (Python)    │
                      │ → Google Cal │
                      └──────────────┘
```

## Format Conversion Flow

```
ISO String                    Parsing                Display
────────────────────────────────────────────────────────────
"2026-01-19T08:30:00"   →   new Date()    →   "08:30 AM"
                             .getHours()
                             .getMinutes()
                             
                             
User Input                   Conversion             ISO String
────────────────────────────────────────────────────────────
Time Picker: 08:30      →   new Date()      →   "2026-01-19T08:30:00"
                            .setHours(8, 30)
                            .toISOString()
```

## Key Utility Functions

```typescript
┌───────────────────────────────────────────────────────────────┐
│ formatTimeRange(start, end): string                           │
├───────────────────────────────────────────────────────────────┤
│ Input:  "2026-01-19T08:30:00", "2026-01-19T10:00:00"         │
│ Output: "08:30 AM - 10:00 AM"                                 │
│                                                               │
│ • Parses ISO strings to Date objects                          │
│ • Converts to 12-hour format with AM/PM                       │
│ • Returns "Invalid time" on error                             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ timeToISO(timeStr, baseDate): string                          │
├───────────────────────────────────────────────────────────────┤
│ Input:  "08:30 AM", Date(2026-01-19)                         │
│ Output: "2026-01-19T08:30:00"                                 │
│                                                               │
│ • Parses time string with regex                               │
│ • Handles AM/PM conversion                                    │
│ • Uses base date for date portion                             │
└───────────────────────────────────────────────────────────────┘
```

## Component State Flow

```
┌────────────────────────────────────────────────────────────┐
│                   Initial State (from backend)              │
│ editedData.classes = [{                                     │
│   day: "Monday",                                            │
│   course_name: "CSE-101",                                   │
│   start: { dateTime: "2026-01-19T08:30:00" },              │
│   end: { dateTime: "2026-01-19T10:00:00" }                 │
│ }]                                                          │
└────────────────────────────────────────────────────────────┘
                          ⬇️
┌────────────────────────────────────────────────────────────┐
│                      View Mode Render                       │
│ <Clock /> formatTimeRange(                                  │
│   "2026-01-19T08:30:00",                                   │
│   "2026-01-19T10:00:00"                                    │
│ )                                                           │
│ → Displays: "08:30 AM - 10:00 AM"                          │
└────────────────────────────────────────────────────────────┘
                          ⬇️ User clicks Edit
┌────────────────────────────────────────────────────────────┐
│                      Edit Mode Render                       │
│ <input type="time"                                          │
│   value={new Date("2026-01-19T08:30:00")                   │
│          .toTimeString().slice(0,5)}                        │
│ />                                                          │
│ → Shows: "08:30"                                            │
└────────────────────────────────────────────────────────────┘
                          ⬇️ User changes to 09:00
┌────────────────────────────────────────────────────────────┐
│                    onChange Handler                         │
│ const date = new Date("2026-01-19T08:30:00");              │
│ date.setHours(9, 0);                                        │
│ const newStart = { dateTime: date.toISOString()            │
│                                  .slice(0, 19) };           │
│ → Result: "2026-01-19T09:00:00"                            │
└────────────────────────────────────────────────────────────┘
                          ⬇️ User clicks Done
┌────────────────────────────────────────────────────────────┐
│                   Updated State                             │
│ editedData.classes = [{                                     │
│   day: "Monday",                                            │
│   course_name: "CSE-101",                                   │
│   start: { dateTime: "2026-01-19T09:00:00" }, ← Updated    │
│   end: { dateTime: "2026-01-19T10:00:00" }                 │
│ }]                                                          │
└────────────────────────────────────────────────────────────┘
                          ⬇️ User approves
┌────────────────────────────────────────────────────────────┐
│              Payload Sent to Backend                        │
│ Same structure with updated times                           │
└────────────────────────────────────────────────────────────┘
```

## Testing Scenarios

```
┌─────────────────────────────────────────────────────────┐
│ Test Case 1: Morning Class                              │
├─────────────────────────────────────────────────────────┤
│ Input:  start: "2026-01-19T08:00:00"                    │
│         end:   "2026-01-19T09:30:00"                    │
│ Output: "08:00 AM - 09:30 AM"                           │
│ Status: ✅ PASS                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Test Case 2: Afternoon Class                            │
├─────────────────────────────────────────────────────────┤
│ Input:  start: "2026-01-19T14:00:00"                    │
│         end:   "2026-01-19T16:30:00"                    │
│ Output: "02:00 PM - 04:30 PM"                           │
│ Status: ✅ PASS                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Test Case 3: Midnight/Noon Edge Cases                   │
├─────────────────────────────────────────────────────────┤
│ Input:  start: "2026-01-19T00:00:00" (midnight)         │
│         end:   "2026-01-19T01:00:00"                    │
│ Output: "12:00 AM - 01:00 AM"                           │
│ Status: ✅ PASS                                          │
├─────────────────────────────────────────────────────────┤
│ Input:  start: "2026-01-19T12:00:00" (noon)             │
│         end:   "2026-01-19T13:00:00"                    │
│ Output: "12:00 PM - 01:00 PM"                           │
│ Status: ✅ PASS                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Test Case 4: Invalid Input                              │
├─────────────────────────────────────────────────────────┤
│ Input:  start: "invalid-string"                         │
│         end:   "also-invalid"                           │
│ Output: "Invalid time"                                  │
│ Status: ✅ PASS (graceful error handling)               │
└─────────────────────────────────────────────────────────┘
```

## Migration Checklist

```
Frontend:
✅ Update ClassSchedule interface in types.ts
✅ Create formatTimeRange() utility function
✅ Update routine-approval-widget view mode
✅ Update routine-approval-widget edit mode with time pickers
✅ Update handleAddClass for new structure
✅ Test TypeScript compilation
✅ Verify no runtime errors

Backend:
⏸️ Update extraction logic to output new schema
⏸️ Remove "time" field generation
⏸️ Generate ISO 8601 datetime strings
⏸️ Update approval handler to accept new schema
⏸️ Pass start/end to Google Calendar API
⏸️ Update tests with new schema format

Integration:
⏸️ Test end-to-end routine extraction flow
⏸️ Verify approval sends correct format
⏸️ Confirm Google Calendar integration works
⏸️ Test on multiple devices/browsers
⏸️ User acceptance testing
```

## Quick Reference

| Aspect | Old Format | New Format |
|--------|-----------|------------|
| **Field Name** | `time` | `start` + `end` |
| **Type** | `string` | `{ dateTime: string }` |
| **Format** | Human-readable | ISO 8601 |
| **Example** | `"08:30 AM - 10:00 AM"` | `start: { dateTime: "2026-01-19T08:30:00" }` |
| **Edit UI** | Text input | Native time pickers |
| **Parsing** | String split | `new Date()` |
| **Display** | Direct | `formatTimeRange()` |

---

**Status**: ✅ Frontend implementation complete and tested  
**Next Steps**: Backend integration and E2E testing
