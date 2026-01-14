# Routine Recurrence Feature - Visual Guide

## Component Layout

### Edit Mode (Pending Status)

```
┌────────────────────────────────────────────────────────────────┐
│  📅 Fall 2024 Schedule                                   🟡    │
│     Review and edit the extracted schedule              |      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Classes:                                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ━━━ Monday ━━━━                                        │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM          [✏️] [🗑️]       │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  ━━━ Wednesday ━━━                                      │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM          [✏️] [🗑️]       │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  ━━━ Friday ━━━━                                        │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM          [✏️] [🗑️]       │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  [+ Add Class]                                          │ │
│  │                                                          │ │
│  │  ── Repeat Pattern ──────────────────┐ [Clear]        │ │
│  │  ┌──────────────────────────────────┐                 │ │
│  │  │ Every 1 weekly on Mon, Wed, Fri  │                 │ │
│  │  │ until May 30, 2024               │                 │ │
│  │  └──────────────────────────────────┘                 │ │
│  │  [Edit Pattern]                                        │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [Discard]                         [✓ Confirm Routine]        │
└────────────────────────────────────────────────────────────────┘
```

### View Mode (Approved/Rejected/Processing)

```
┌────────────────────────────────────────────────────────────────┐
│  📅 Fall 2024 Schedule                               ✓ Saved   │
│     Schedule confirmed and saved                     Green     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Classes:                                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  ━━━ Monday ━━━━                                        │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM                           │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  ━━━ Wednesday ━━━                                      │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM                           │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  ━━━ Friday ━━━━                                        │ │
│  │  ├─ 🕐 10:00 AM - 11:30 AM                           │ │
│  │  │  CSE-321                                            │ │
│  │                                                          │ │
│  │  ── Repeat Pattern ─────────────────────────────────   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Every 1 weekly on Mon, Wed, Fri until May 30...  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  (No action buttons - routine is locked)                       │
└────────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

### Adding Recurrence

```
User views pending routine
          ↓
    Sees "Add Repeat Pattern" button
          ↓
       Clicks button
          ↓
    RecurrenceModal opens
          ↓
    User configures:
    ├─ Frequency: Weekly
    ├─ Interval: 1
    ├─ Days: Monday, Wednesday, Friday
    └─ End: Until May 30, 2024
          ↓
       Clicks "Apply"
          ↓
    Modal closes
          ↓
    Widget preview updates:
    "Every 1 weekly on Mon, Wed, Fri until May 30, 2024"
          ↓
    User confirms routine
          ↓
    API sends with recurrence
```

### Editing Recurrence

```
User views routine with pattern
          ↓
    Sees current pattern preview
          ↓
       Clicks "Edit Pattern"
          ↓
    RecurrenceModal opens with current state
          ↓
    User modifies (e.g., changes days)
          ↓
       Clicks "Apply"
          ↓
    Preview updates immediately
          ↓
    User confirms routine
```

### Clearing Recurrence

```
User sees recurrence pattern
          ↓
    Clicks [Clear] button
          ↓
    Pattern removed instantly
          ↓
    Button changes to "Add Repeat Pattern"
          ↓
    User confirms without recurrence
```

## RecurrenceModal Integration

```
┌─────────────────────────────────────────────────────────────┐
│  ❌ Recurring Event                               z-[60]   │
├─────────────────────────────────────────────────────────────┤
│  Repeat: [Daily] [Weekly] [Monthly] [Yearly]              │
│                                                            │
│  Every: [1___] Weeks                                      │
│                                                            │
│  Days (for Weekly):                                       │
│  [Sun] [Mon] [Tue] [Wed] [Thu] [Fri] [Sat]              │
│                                                            │
│  Ends:                                                    │
│  ○ Never                                                 │
│  ○ On a date: [Date picker]                             │
│  ○ After: [10__] occurrences                            │
│                                                            │
│  Preview:                                                │
│  ┌───────────────────────────────────────────┐          │
│  │ Every 1 weekly on Mon, Wed, Fri...        │          │
│  └───────────────────────────────────────────┘          │
│                                                            │
│  [Cancel]                                     [Apply]   │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Modal appears with `z-[60]` to ensure it's above the widget (`z-50`)

## Color & Styling Guide

### Recurrence Section Colors

| Element | Color | Usage |
|---------|-------|-------|
| Section Label | `text-muted-foreground` | "Repeat Pattern" heading |
| Clear Button | `text-red-600` | Hover shows red background |
| Edit Button | `border-primary/30` | Text in primary color |
| Preview Box | `bg-primary/5` + `border-primary/20` | Pattern display |
| Preview Text | `text-foreground` | Readable pattern description |

### State Styling

| Status | Header | Border | Icon |
|--------|--------|--------|------|
| `pending` | Primary/5 | Primary/30 | Primary |
| `approved` | Green/10 | Green/50 | Check ✓ |
| `rejected` | Red/10 | Red/50 | X |
| `processing` | Yellow/10 | Yellow/50 | Spinner |

## Responsive Behavior

### Desktop (> 768px)
- Full width widget with max-w-lg constraint
- Recurrence section shows inline with classes
- Modal centered in viewport
- All buttons visible

### Tablet (640px - 768px)
- Widget width adjusted to container
- Recurrence section maintains layout
- Modal slightly smaller
- Touch-friendly button sizes maintained

### Mobile (< 640px)
- Full screen container
- Recurrence section stacks cleanly
- Modal takes up most of viewport
- Larger touch targets for buttons
- Scrollable content in modal

## Recurrence Pattern Examples

### Academic Year
```
Frequency: Weekly
Days: Monday, Wednesday, Friday
End: Until December 15, 2024
Result: "Every 1 weekly on Mon, Wed, Fri until Dec 15, 2024"
```

### Daily Standup
```
Frequency: Daily
Interval: 1
End: Until March 31, 2025
Result: "Every 1 daily until Mar 31, 2025"
```

### Bi-weekly Team Meeting
```
Frequency: Weekly
Interval: 2
Days: Tuesday
End: After 26 occurrences
Result: "Every 2 weekly on Tue for 26 occurrences"
```

### Monthly Review
```
Frequency: Monthly
End: Never
Result: "Every 1 monthly"
```

## Accessibility Features

### Keyboard Navigation
- Tab through buttons
- Enter to activate
- Modal opens/closes with Escape
- Focus management in modal

### Screen Reader Support
- `aria-label` on buttons
- Descriptive button text
- Section headings
- Icon descriptions

### Visual Indicators
- Icon + text on all buttons
- Color not only indicator (patterns supported)
- Sufficient contrast ratios
- Focus visible states

## State Transitions

### Editing Routine

```
pending → edit mode
   ↓
User adds recurrence
   ↓
Form state updates
   ↓
Preview shows pattern
   ↓
User confirms
   ↓
Sends to API with recurrence
   ↓
approved/rejected/processing
```

### Locking States

```
pending (isEditable = true)
├─ Can edit classes
├─ Can add/edit/clear recurrence
└─ Can confirm/reject

processing (isEditable = false)
├─ Can't edit anything
└─ Shows spinner and message

approved/rejected (isEditable = false)
├─ Read-only display
└─ Shows pattern if configured
```

## Component Tree

```
RoutineApprovalWidget
├─ State: editedData, editingIndex, isRecurrenceModalOpen, recurrenceState
├─ Section: Header (Title)
├─ Section: Classes
│  ├─ Days (Monday, Tuesday, etc.)
│  ├─ Class Items (with Edit/Delete)
│  └─ Add Class Button
├─ Section: Recurrence (NEW)
│  ├─ Label: "Repeat Pattern"
│  ├─ Clear Button (if configured)
│  ├─ Preview Box (if configured)
│  └─ Add/Edit Pattern Button
├─ Modal: RecurrenceModal (z-[60])
└─ Section: Actions (Discard/Confirm)
```

## Performance Considerations

- Modal uses React.useState (no re-renders unless state changes)
- RRULE generation is pure function (no side effects)
- Pattern preview updates only when recurrence changes
- No unnecessary component renders

## Next Steps for Users

After confirming routine with recurrence:
1. Backend receives recurrence array
2. Backend validates RRULE syntax
3. Backend passes to Google Calendar API
4. Calendar expands instances based on RRULE
5. All individual classes appear in calendar

Result: Full semester schedule created from single routine!
