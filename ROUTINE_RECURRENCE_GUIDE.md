# Recurring Events Feature in Routine Generator

## Overview

The recurrence feature has been seamlessly integrated into the Routine Approval Widget, allowing users to set repeat patterns for their entire routine/schedule during the approval process.

## Features

### User Experience Highlights

1. **Seamless Integration**
   - Recurrence section appears only in edit mode (pending status)
   - Non-intrusive UI that doesn't clutter the interface
   - Clear visual separation from class listings

2. **Easy Configuration**
   - "Add Repeat Pattern" button to configure recurrence
   - Opens same RecurrenceModal used in Calendar
   - Live preview shows human-readable format
   - "Clear" button to remove recurrence quickly

3. **View & Display**
   - Edit mode: Shows current pattern with option to modify
   - View mode (locked): Displays pattern if set
   - Pattern displayed in human-readable format
   - Read-only when routine is approved/rejected/processing

## Implementation Details

### Changes Made

#### 1. **RoutineApprovalWidget Component Updates**
**File:** `components/routine-approval-widget.tsx`

**New Imports:**
```typescript
import { Repeat2 } from 'lucide-react';
import { RecurrenceModal } from '@/app/(main)/calendar/_components/recurrence-modal';
import { generateRRules, parseRRuleToHumanReadable } from '@/app/(main)/calendar/_lib/rrule-utils';
import type { RRuleFormState } from '@/app/(main)/calendar/_lib/rrule-utils';
```

**Type Updates:**
- `RoutineData` now includes optional `recurrence: string[]`
- Stores array of RRULE strings matching backend schema

**New State:**
```typescript
const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
const [recurrenceState, setRecurrenceState] = useState<RRuleFormState | undefined>(undefined);
```

**New Handlers:**
- `handleRecurrenceApply()` - Applies user's recurrence configuration
- `handleClearRecurrence()` - Removes recurrence from routine

#### 2. **Chat Types Update**
**File:** `app/(main)/chat/_lib/types.ts`

```typescript
export interface RoutineData {
  title: string;
  classes: ClassSchedule[];
  recurrence?: string[];  // NEW
}
```

### UI Components

#### Edit Mode (Pending Status)
- Recurrence section appears after class list
- Border separator for visual hierarchy
- Two buttons:
  - "Add Repeat Pattern" (if empty)
  - "Edit Pattern" (if configured)
- Clear button on the right
- Live preview box showing current pattern

#### View Mode (Locked/Approved/Rejected)
- Recurrence section only shows if pattern is set
- Read-only display with human-readable format
- No interactive elements

## Usage Flow

### Creating Routine with Recurrence

1. **Extract Schedule**
   - User uploads image/inputs routine
   - Backend extracts classes and sends approval request

2. **Review & Configure**
   - RoutineApprovalWidget appears in chat
   - User can edit title and classes
   - User clicks "Add Repeat Pattern"

3. **Configure Recurrence**
   - RecurrenceModal opens
   - Same interface as Calendar recurrence modal
   - User selects: frequency, interval, days, end condition
   - Click "Apply" to confirm

4. **Preview & Confirm**
   - Widget shows human-readable pattern
   - User can still edit/clear if needed
   - User clicks "Confirm Routine" to approve

5. **Submission**
   - Edited routine data includes recurrence array
   - Backend receives and processes with calendar API

### Editing Existing Recurrence

1. Widget shows current pattern preview
2. Click "Edit Pattern" button
3. RecurrenceModal opens with current state
4. Modify configuration
5. Click "Apply"
6. Preview updates immediately

## Integration with Backend

### API Request Payload

When user approves routine, request includes:

```json
{
  "title": "Fall 2024 Schedule",
  "classes": [
    {
      "day": "Monday",
      "time": "10:00 AM - 11:30 AM",
      "course_name": "CSE-321"
    }
  ],
  "recurrence": ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20241215T235959Z"]
}
```

### Expected Backend Response

```json
{
  "title": "Fall 2024 Schedule",
  "classes": [...],
  "recurrence": [...]
}
```

## Design Considerations

### Visual Hierarchy
- Recurrence section placed after classes
- Border separator indicates new section
- Smaller font and muted colors when not editing
- Primary colors when hovering/editing

### Color Scheme
- Edit mode: Primary colors for interactivity
- View mode: Muted colors for read-only state
- Pattern preview: Primary/5 background with primary/20 border
- Icons: Repeat2 icon matches Calendar component

### Responsive Design
- Works on mobile and desktop
- Modal handles overflow with scrolling
- Button text clearly indicates action
- Touch-friendly button sizes

### Accessibility
- Clear labels for form sections
- Descriptive button text
- Icon + text for better clarity
- Proper ARIA attributes inherited from RecurrenceModal

## User Experience Enhancements

### Quick Actions
- "Clear" button for fast removal
- "Edit Pattern" vs "Add Repeat Pattern" context-aware text
- Single-click modal opening

### Visual Feedback
- Pattern preview box with distinct styling
- Button hover states
- Smooth transitions
- Icon feedback (Repeat2 icon)

### Error Prevention
- Validation in RecurrenceModal
- Can't confirm with invalid pattern
- Pattern stays in modal until valid
- Clear error messages

### Information Display
- Human-readable format: "Every 1 weekly on Mon, Wed, Fri until May 30, 2024"
- No raw RRULE shown to users
- Clear and understandable language

## Future Enhancements

1. **Quick Templates**
   - "Weekly for semester" preset
   - "Daily for term" preset
   - "Bi-weekly" option

2. **Smart Defaults**
   - Auto-detect end date based on semester calendar
   - Suggest end dates based on institution

3. **Recurrence Summaries**
   - Show preview of first/last occurrence
   - Count of total occurrences

4. **Calendar Integration**
   - One-click add to Google Calendar after approval
   - Show calendar conflicts

5. **Batch Operations**
   - Apply same recurrence to multiple routines
   - Copy recurrence between routines

## Testing Checklist

- [ ] Add recurrence to new routine
- [ ] Edit existing recurrence
- [ ] Clear recurrence
- [ ] View locked routine with recurrence
- [ ] Recurrence persists through approval
- [ ] API payload includes recurrence
- [ ] Modal z-index correct (appears above widget)
- [ ] Responsive on mobile
- [ ] Validation works properly
- [ ] Human-readable format displays correctly
- [ ] Unit conversion (UTC) works for UNTIL dates
- [ ] Different frequencies work (Daily, Weekly, Monthly, Yearly)

## Code Example

```tsx
// Using the updated RoutineApprovalWidget
<RoutineApprovalWidget
  data={{
    title: "Spring 2024 Classes",
    classes: [
      { day: "Monday", time: "10:00 AM - 11:30 AM", course_name: "CSE-321" },
      { day: "Wednesday", time: "10:00 AM - 11:30 AM", course_name: "CSE-321" },
    ],
    recurrence: [] // Empty initially
  }}
  onApprove={(editedData) => {
    // editedData will include recurrence if user configured it
    console.log(editedData.recurrence); 
    // e.g., ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20240512T235959Z"]
  }}
  onReject={() => console.log("Routine rejected")}
  status="pending"
/>
```

## Technical Details

### State Management
- Recurrence modal state controlled by parent widget
- Recurrence state tracked separately for edit restoration
- Clean separation between UI state and data state

### Event Handlers
- `handleRecurrenceApply()` generates RRULE and updates data
- `handleClearRecurrence()` removes recurrence completely
- Handlers maintain data consistency

### Component Composition
- RecurrenceModal reused without modification
- RRULE utilities used directly from calendar module
- No code duplication

## Known Limitations

1. Recurrence applies to entire routine, not individual classes
2. Only one recurrence pattern per routine
3. Backend must support recurrence field in RoutineData
4. Classes themselves don't change based on recurrence (backend handles expansion)

## Conclusion

The recurrence feature provides a powerful way for users to schedule entire semester routines in one action, reducing friction and improving user experience. The seamless integration with the Calendar module ensures consistency and maintainability.
