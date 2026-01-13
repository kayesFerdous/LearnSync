# Recurring Events Feature Implementation

## Overview

This document describes the implementation of the Recurring Events feature for the Google Calendar integration in the frontend application. The feature allows users to schedule recurring classes/events (e.g., "Every Monday and Wednesday until May") in a single action.

## Changes Made

### 1. Type Definitions Updated

**File:** [`app/(main)/calendar/_lib/types.ts`](app/(main)/calendar/_lib/types.ts)

Added optional `recurrence: string[]` field to:
- `CalendarEvent` - Represents an event returned from the API
- `CreateEventRequest` - Request body for creating events
- `UpdateEventRequest` - Request body for updating events

The recurrence field contains an array of RFC 5545 RRULE strings (e.g., `["RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20240530T140000Z"]`).

### 2. RRULE Utilities

**File:** [`app/(main)/calendar/_lib/rrule-utils.ts`](app/(main)/calendar/_lib/rrule-utils.ts)

Core utilities for handling recurrence rules:

#### Key Functions:

- **`dateToUTCRRuleFormat(date: Date): string`**
  - Converts JavaScript Date to RFC 5545 UTC format (e.g., "20240530T140000Z")
  - **CRITICAL:** UNTIL dates must be in UTC; this handles the conversion
  - Always formats to UTC timezone using `getUTC*` methods

- **`generateRRules(formState: RRuleFormState): string[]`**
  - Converts form state into valid RRULE strings
  - Returns array with single RRULE string
  - Always prefixes with "RRULE:"
  - Supports: FREQ, INTERVAL, BYDAY, UNTIL, COUNT

- **`isValidRecurrenceString(str: string): boolean`**
  - Validates that string starts with "RRULE:" or "RDATE:"
  - Used before sending to API

- **`isValidRecurrenceArray(arr: string[]): boolean`**
  - Validates all strings in array

- **`parseRRuleToHumanReadable(rrule: string): string`**
  - Converts RRULE to human-readable format
  - Example: "Every 1 weekly on Monday, Wednesday until May 30, 2024"
  - Used in event detail modal

#### RRuleFormState Interface:

```typescript
interface RRuleFormState {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;           // e.g., 1, 2, 3
  daysOfWeek?: string[];      // ['MO', 'WE', 'FR']
  endType: 'until' | 'count' | 'never';
  untilDate?: Date;           // For UNTIL
  count?: number;             // For COUNT
}
```

### 3. Recurrence Modal Component

**File:** [`app/(main)/calendar/_components/recurrence-modal.tsx`](app/(main)/calendar/_components/recurrence-modal.tsx)

Advanced recurrence configuration UI with:

- **Frequency Selection:** Daily, Weekly, Monthly, Yearly
- **Interval:** Every N frequency units (1-99)
- **Days of Week:** Multi-select for weekly recurrence (Sun-Sat)
- **End Options:** Never, On Date (with datetime picker), or After N occurrences
- **Live Preview:** Shows human-readable recurrence summary

Features:
- Validates that weekly recurrence has at least one day selected
- Validates that count/until are properly set
- Passes configured RRuleFormState to parent callback

### 4. Calendar Page Updates

**File:** [`app/(main)/calendar/page.tsx`](app/(main)/calendar/page.tsx)

#### Import Changes:
- Added `RecurrenceModal` component
- Added RRULE utilities: `generateRRules`, `parseRRuleToHumanReadable`, `isValidRecurrenceArray`
- Added `Repeat2` icon from lucide-react
- Imported `RRuleFormState` type

#### Form State Extended:
```typescript
formData: {
  // ... existing fields
  recurrence: string[];           // Array of RRULE strings
  recurrenceState?: RRuleFormState; // Current configuration
}
```

#### Handler Updates:

- **`handleRecurrenceApply(recurrenceState: RRuleFormState)`**
  - Called when user applies recurrence in modal
  - Generates RRULE strings using `generateRRules()`
  - Updates form state

- **`handleCreateEvent`** and **`handleUpdateEvent`**
  - Now validate recurrence using `isValidRecurrenceArray()`
  - Include recurrence in API request if present
  - Pass `recurrence` field in request payload

#### UI Updates:

**Create Modal:**
- Added "Repeat" section with current recurrence display
- Button to open RecurrenceModal
- Shows human-readable recurrence summary

**Edit Modal:**
- Same recurrence section as create modal
- Allows editing existing recurrence

**Event Details Modal:**
- Displays recurrence if present
- Shows human-readable format using `parseRRuleToHumanReadable()`
- Uses `Repeat2` icon for consistency

### 5. Index Exports

**File:** [`app/(main)/calendar/_lib/index.ts`](app/(main)/calendar/_lib/index.ts)

Exported recurrence utilities:
- `generateRRules`
- `isValidRecurrenceArray`
- `parseRRuleToHumanReadable`
- `dateToUTCRRuleFormat`
- Type: `RRuleFormState`, `Frequency`, `EndType`

## Critical Implementation Details

### UTC Conversion for UNTIL

When a user selects an end date in the recurrence modal, the `dateToUTCRRuleFormat()` function converts it to UTC. This is **mandatory** for Google Calendar:

```typescript
// Example: User selects "May 30, 2024 at 2:40 PM (local)"
// Gets converted to: "20240530T144000Z" (UTC)
const utcDate = new Date(date.getTime());
```

### RRULE Validation

Before sending the API request:
1. Check all recurrence strings start with "RRULE:" or "RDATE:"
2. Backend will validate the complete RRULE syntax

### API Integration

The create/update event handlers now include:
```typescript
recurrence: formData.recurrence.length > 0 ? formData.recurrence : undefined,
```

This sends the recurrence array only if configured, matching the backend schema.

## Example Usage

### Creating a Recurring Event

1. User clicks "Create New Event"
2. Fills in basic details (title, date, time, etc.)
3. Clicks "Add Recurrence"
4. RecurrenceModal opens
5. Configures:
   - Frequency: Weekly
   - Interval: 1
   - Days: Monday, Wednesday, Friday
   - Ends: On date (May 30, 2024)
6. Clicks "Apply"
7. Modal shows: "Every 1 weekly on Mon, Wed, Fri until May 30, 2024"
8. Generates RRULE: `["RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;UNTIL=20240530T235959Z"]`
9. Submits create event with recurrence included

### Viewing Recurring Events

1. Event appears in calendar (Google Calendar handles expansion)
2. Click event to see details
3. "Recurrence" section shows: "Every 1 weekly on Mon, Wed, Fri until May 30, 2024"

### Editing Recurring Events

1. Click event → "Edit"
2. Modify details
3. Click "Edit Recurrence" to change schedule
4. Update event

## Testing Checklist

- [ ] Create event with daily recurrence
- [ ] Create event with weekly recurrence on specific days
- [ ] Create event with monthly recurrence
- [ ] Create event with recurrence ending on specific date
- [ ] Create event with recurrence count (e.g., 10 occurrences)
- [ ] Create event with never-ending recurrence
- [ ] Edit existing recurring event
- [ ] Delete recurring event
- [ ] Verify recurrence displays correctly in event details
- [ ] Verify RRULE format is valid (starts with "RRULE:")
- [ ] Verify UTC conversion for UNTIL dates

## Backend Requirements

The backend API must:
1. Accept `recurrence: List[str]` in CreateEventRequest and UpdateEventRequest
2. Validate RRULE syntax (must start with "RRULE:" or "RDATE:")
3. Pass recurrence array to Google Calendar API
4. Return recurrence in event responses

## Notes

- Single events mode with `singleEvents=true` parameter expands recurring events automatically
- For academic calendars (4-6 month routines), this reduces API calls from hundreds to single calls
- Human-readable display helps users verify their configuration before saving
