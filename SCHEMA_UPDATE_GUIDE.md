# Frontend Schema Update - Google Calendar Format

## Changes Made

### 1. Type Definitions Updated (`app/(main)/chat/_lib/types.ts`)

**Old Schema:**
```typescript
export interface ClassSchedule {
  day: string;
  time: string;  // "08:30 AM - 10:00 AM"
  course_name: string;
}
```

**New Schema:**
```typescript
export interface ClassSchedule {
  day: string;
  course_name: string;
  start: {
    dateTime: string; // ISO 8601: "2024-01-15T08:30:00"
  };
  end: {
    dateTime: string; // ISO 8601: "2024-01-15T10:00:00"
  };
}
```

### 2. Routine Approval Widget Updated (`components/routine-approval-widget.tsx`)

#### New Utility Functions Added:

**`formatTimeRange(startDateTime, endDateTime)`**
- Converts ISO datetime strings to readable format
- Example: `"2024-01-15T08:30:00"` → `"08:30 AM - 10:00 AM"`
- Handles 12-hour format with AM/PM
- Returns "Invalid time" on error

**`timeToISO(timeStr, baseDate)`**
- Converts time strings back to ISO format
- Example: `"08:30 AM"` → `"2024-01-15T08:30:00"`
- Used for time input conversions (currently not actively used, but available for future needs)

#### UI Changes:

**Edit Mode:**
- Replaced single "Time" text input with two `<input type="time">` fields
- "Start Time" and "End Time" displayed side-by-side
- Native time picker for better UX
- Automatic ISO 8601 conversion on change

**View Mode:**
- Displays formatted time range using `formatTimeRange()`
- Example: `"08:30 AM - 10:00 AM"`

**Add New Class:**
- Default times: 8:00 AM - 9:30 AM
- Automatically creates ISO datetime strings

## Example Data Structures

### Backend Response (Extracted Routine):
```json
{
  "title": "Weekly Class Schedule",
  "classes": [
    {
      "day": "Sunday",
      "course_name": "CSE-101",
      "start": { "dateTime": "2026-01-18T08:00:00" },
      "end": { "dateTime": "2026-01-18T09:30:00" }
    },
    {
      "day": "Monday",
      "course_name": "PHY-201",
      "start": { "dateTime": "2026-01-19T10:00:00" },
      "end": { "dateTime": "2026-01-19T11:30:00" }
    },
    {
      "day": "Wednesday",
      "course_name": "CSE-321",
      "start": { "dateTime": "2026-01-21T14:00:00" },
      "end": { "dateTime": "2026-01-21T15:30:00" }
    }
  ],
  "recurrence": ["RRULE:FREQ=WEEKLY;BYDAY=SU,MO,WE;UNTIL=20260515T235959Z"]
}
```

### Frontend Approval Payload (Sent to Backend):
```json
{
  "title": "Weekly Class Schedule (Edited)",
  "classes": [
    {
      "day": "Monday",
      "course_name": "CSE-101",
      "start": { "dateTime": "2026-01-19T08:30:00" },
      "end": { "dateTime": "2026-01-19T10:00:00" }
    },
    {
      "day": "Wednesday",
      "course_name": "CSE-101",
      "start": { "dateTime": "2026-01-21T08:30:00" },
      "end": { "dateTime": "2026-01-21T10:00:00" }
    },
    {
      "day": "Friday",
      "course_name": "CSE-101",
      "start": { "dateTime": "2026-01-23T08:30:00" },
      "end": { "dateTime": "2026-01-23T10:00:00" }
    }
  ],
  "recurrence": ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260515T235959Z"]
}
```

## Testing Checklist

### Unit Testing
- [ ] Verify `formatTimeRange()` correctly formats various time ranges
- [ ] Test with edge cases (midnight, noon, invalid strings)
- [ ] Confirm ISO datetime parsing works across timezones

### Integration Testing
- [ ] Backend sends routine with new schema format
- [ ] Frontend correctly displays times in approval widget
- [ ] Edit mode allows changing start/end times independently
- [ ] Time picker UI works on mobile and desktop
- [ ] Approval sends correct ISO datetime format back
- [ ] Recurrence pattern works with new schema

### Visual Testing
- [ ] Time display is properly formatted (12-hour with AM/PM)
- [ ] Edit mode shows native time pickers
- [ ] Layout remains clean with new time inputs
- [ ] No visual regressions in view mode

### Error Handling
- [ ] Invalid ISO strings show "Invalid time"
- [ ] Missing start/end objects handled gracefully
- [ ] Malformed datetime strings don't crash the app

## Migration Notes

### Backward Compatibility
⚠️ **Breaking Change**: The `time` field has been completely replaced with `start` and `end` objects. No backward compatibility with old schema.

### What Backend Needs to Do:
1. ✅ Send `start.dateTime` and `end.dateTime` in ISO 8601 format
2. ✅ Remove the `time` field from responses
3. ✅ Accept the same format in approval payloads
4. ✅ Ensure datetime strings are in format: `"YYYY-MM-DDTHH:mm:ss"`

### Timezone Considerations:
- Frontend displays times in **local timezone**
- Backend should send times in **UTC or target timezone**
- JavaScript `Date` object handles conversion automatically
- Consider adding explicit timezone handling if needed

## Example User Flows

### Flow 1: View Extracted Routine
1. User uploads routine image
2. Backend extracts schedule and sends interrupt with new schema
3. Frontend displays classes with formatted times
4. User sees: "08:00 AM - 09:30 AM" for CSE-101

### Flow 2: Edit Class Times
1. User clicks Edit on a class
2. UI shows two time pickers (Start Time: 08:00, End Time: 09:30)
3. User changes End Time to 10:00
4. User clicks Done
5. View updates to show "08:00 AM - 10:00 AM"

### Flow 3: Add New Class
1. User clicks "Add Class"
2. New class appears with default times (08:00 AM - 09:30 AM)
3. User edits day, times, and course name
4. User confirms routine
5. Frontend sends ISO datetime objects to backend

## Sample Test Data

```typescript
// Test Data for Development
const sampleRoutineData = {
  title: "Fall 2026 Schedule",
  classes: [
    {
      day: "Monday",
      course_name: "Data Structures",
      start: { dateTime: "2026-01-19T08:00:00" },
      end: { dateTime: "2026-01-19T09:30:00" }
    },
    {
      day: "Monday",
      course_name: "Algorithms",
      start: { dateTime: "2026-01-19T10:00:00" },
      end: { dateTime: "2026-01-19T11:30:00" }
    },
    {
      day: "Wednesday",
      course_name: "Data Structures",
      start: { dateTime: "2026-01-21T08:00:00" },
      end: { dateTime: "2026-01-21T09:30:00" }
    },
    {
      day: "Wednesday",
      course_name: "Database Systems",
      start: { dateTime: "2026-01-21T14:00:00" },
      end: { dateTime: "2026-01-21T16:00:00" }
    },
    {
      day: "Friday",
      course_name: "Algorithms Lab",
      start: { dateTime: "2026-01-23T14:00:00" },
      end: { dateTime: "2026-01-23T17:00:00" }
    }
  ],
  recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260515T235959Z"]
};
```

## Format Conversion Examples

### Old Format → New Format
```javascript
// OLD
{
  day: "Monday",
  time: "08:30 AM - 10:00 AM",
  course_name: "CSE-101"
}

// NEW
{
  day: "Monday",
  course_name: "CSE-101",
  start: { dateTime: "2026-01-19T08:30:00" },
  end: { dateTime: "2026-01-19T10:00:00" }
}
```

### ISO to Display
```javascript
formatTimeRange("2026-01-19T08:30:00", "2026-01-19T10:00:00")
// Output: "08:30 AM - 10:00 AM"

formatTimeRange("2026-01-19T14:00:00", "2026-01-19T16:30:00")
// Output: "02:00 PM - 04:30 PM"

formatTimeRange("2026-01-19T00:00:00", "2026-01-19T01:00:00")
// Output: "12:00 AM - 01:00 AM"

formatTimeRange("2026-01-19T12:00:00", "2026-01-19T13:00:00")
// Output: "12:00 PM - 01:00 PM"
```

## Benefits of New Schema

1. **Google Calendar Alignment**: Directly compatible with Google Calendar API event structure
2. **Better Time Handling**: Separate start/end allows for precise duration calculations
3. **Timezone Support**: ISO 8601 format supports timezone information
4. **Date Awareness**: Can handle multi-day events if needed
5. **Industry Standard**: Uses widely accepted datetime format
6. **Type Safety**: Strongly typed with clear structure
7. **Future Proof**: Easy to extend with additional time properties

## API Contract

### Interrupt Payload (Backend → Frontend)
```typescript
{
  type: 'interrupt',
  payload: {
    type: 'routine_approval_required',
    extracted_data: {
      title: string;
      classes: Array<{
        day: string;
        course_name: string;
        start: { dateTime: string }; // ISO 8601
        end: { dateTime: string };   // ISO 8601
      }>;
      recurrence?: string[]; // Optional RRULE array
    }
  }
}
```

### Approval Payload (Frontend → Backend)
```typescript
{
  messageId: string;
  editedData: {
    title: string;
    classes: Array<{
      day: string;
      course_name: string;
      start: { dateTime: string }; // ISO 8601
      end: { dateTime: string };   // ISO 8601
    }>;
    recurrence?: string[]; // Optional RRULE array
  }
}
```

## Notes for Developers

1. **Always use ISO 8601 format**: `YYYY-MM-DDTHH:mm:ss` (19 characters without timezone)
2. **Time extraction**: Use `new Date(isoString).toTimeString().slice(0, 5)` for time input values
3. **Time conversion**: Create new Date, set hours/minutes, then `.toISOString().slice(0, 19)`
4. **Display formatting**: Always use `formatTimeRange()` helper for consistent display
5. **Error handling**: Wrap Date operations in try-catch to handle invalid strings
6. **TypeScript**: Updated interfaces ensure compile-time type safety

## Status

✅ **COMPLETED**
- Type definitions updated
- Utility functions implemented
- UI components updated
- Edit mode refactored
- View mode updated
- TypeScript compilation successful
- No runtime errors

🚀 **READY FOR TESTING**
- Integration testing with backend
- User acceptance testing
- Cross-browser testing
- Mobile responsiveness verification
