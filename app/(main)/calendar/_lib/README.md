# Google Calendar Integration - API Documentation

This document explains how to use the newly implemented Google Calendar API integration in your Next.js frontend.

## Overview

The calendar integration is organized into the following files:

- **types.ts**: TypeScript interfaces matching backend Pydantic models
- **api.ts**: API client functions for all calendar endpoints
- **use-calendar.ts**: React hook for state management
- **index.ts**: Barrel export for convenient imports

## Quick Start

```typescript
import { useCalendar } from './_lib';

function MyComponent() {
  const calendar = useCalendar();

  // Fetch events
  useEffect(() => {
    calendar.fetchEvents({
      min_datetime: new Date().toISOString(),
      max_results: 50,
    });
  }, []);

  // Access events
  console.log(calendar.events);
  console.log(calendar.loading);
  console.log(calendar.error);
}
```

## API Functions

All API functions automatically include `credentials: 'include'` for httpOnly cookie authentication.

### 1. List Events

```typescript
import { listEvents } from './_lib';

const response = await listEvents({
  min_datetime: '2023-10-01T00:00:00Z',
  max_datetime: '2023-10-31T23:59:59Z',
  max_results: 100,
  single_events: true,
  calendar_id: 'primary',
});

console.log(response.events);
```

### 2. Create Event

```typescript
import { createEvent } from './_lib';

const newEvent = await createEvent({
  summary: 'Team Meeting',
  description: 'Weekly sync meeting',
  location: 'Conference Room A',
  start: {
    dateTime: '2023-10-27T10:00:00',
    timeZone: 'Asia/Dhaka',
  },
  end: {
    dateTime: '2023-10-27T11:00:00',
    timeZone: 'Asia/Dhaka',
  },
  attendees: [
    { email: 'john@example.com' },
    { email: 'jane@example.com' },
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 1440 }, // 1 day before
      { method: 'popup', minutes: 10 },   // 10 minutes before
    ],
  },
});
```

### 3. Get Single Event

```typescript
import { getEvent } from './_lib';

const event = await getEvent('event_id_here', {
  calendar_id: 'primary',
});
```

### 4. Update Event

```typescript
import { updateEvent } from './_lib';

const updatedEvent = await updateEvent(
  'event_id_here',
  {
    summary: 'Updated Meeting Title',
    start: {
      dateTime: '2023-10-27T14:00:00',
      timeZone: 'Asia/Dhaka',
    },
  },
  {
    calendar_id: 'primary',
  }
);
```

### 5. Delete Event

```typescript
import { deleteEvent } from './_lib';

await deleteEvent('event_id_here', {
  calendar_id: 'primary',
});
```

## Using the Custom Hook

The `useCalendar` hook provides a convenient way to manage calendar state:

```typescript
import { useCalendar } from './_lib';

function CalendarComponent() {
  const calendar = useCalendar();

  // Fetch events when component mounts
  useEffect(() => {
    calendar.fetchEvents({
      min_datetime: new Date().toISOString(),
      max_results: 50,
    });
  }, []);

  // Create a new event
  const handleCreate = async () => {
    const newEvent = await calendar.createEvent({
      summary: 'New Event',
      start: { dateTime: '2023-10-27T10:00:00', timeZone: 'Asia/Dhaka' },
      end: { dateTime: '2023-10-27T11:00:00', timeZone: 'Asia/Dhaka' },
    });

    if (newEvent) {
      console.log('Event created:', newEvent);
    } else {
      console.error('Failed to create event:', calendar.error);
    }
  };

  // Update an event
  const handleUpdate = async (eventId: string) => {
    const updated = await calendar.updateEvent(eventId, {
      summary: 'Updated Title',
    });

    if (updated) {
      console.log('Event updated:', updated);
    }
  };

  // Delete an event
  const handleDelete = async (eventId: string) => {
    const success = await calendar.deleteEvent(eventId);

    if (success) {
      console.log('Event deleted');
    }
  };

  return (
    <div>
      {calendar.loading && <p>Loading...</p>}
      {calendar.error && (
        <div className="error">
          {calendar.error}
          <button onClick={calendar.clearError}>Dismiss</button>
        </div>
      )}
      {calendar.events.map(event => (
        <div key={event.id}>
          <h3>{event.summary}</h3>
          <p>{event.start?.dateTime}</p>
          <button onClick={() => handleUpdate(event.id)}>Update</button>
          <button onClick={() => handleDelete(event.id)}>Delete</button>
        </div>
      ))}
      <button onClick={handleCreate}>Create Event</button>
    </div>
  );
}
```

## Type Safety

All functions are fully typed. Here's an example:

```typescript
import type { 
  CalendarEvent, 
  CreateEventRequest, 
  UpdateEventRequest,
  CalendarTime,
} from './_lib';

const eventData: CreateEventRequest = {
  summary: 'Meeting',
  start: {
    dateTime: '2023-10-27T10:00:00',
    timeZone: 'Asia/Dhaka',
  },
  end: {
    dateTime: '2023-10-27T11:00:00',
    timeZone: 'Asia/Dhaka',
  },
};

// TypeScript will ensure all required fields are present
```

## Error Handling

All API functions throw `CalendarApiError` on failure:

```typescript
import { createEvent, CalendarApiError } from './_lib';

try {
  const event = await createEvent({
    summary: 'Test Event',
    start: { dateTime: '2023-10-27T10:00:00', timeZone: 'Asia/Dhaka' },
    end: { dateTime: '2023-10-27T11:00:00', timeZone: 'Asia/Dhaka' },
  });
  console.log('Success:', event);
} catch (error) {
  if (error instanceof CalendarApiError) {
    console.error('API Error:', error.statusCode, error.detail);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## All-Day Events

For all-day events, use the `date` field instead of `dateTime`:

```typescript
const allDayEvent = await createEvent({
  summary: 'All Day Event',
  start: {
    date: '2023-10-27', // YYYY-MM-DD format
  },
  end: {
    date: '2023-10-28',
  },
});
```

## Configuration

The API base URL is configured in `_lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

Update this to match your backend server URL in production.

## Integration in Calendar Page

The calendar page ([page.tsx](app/(main)/calendar/page.tsx)) has been fully integrated with the new API:

1. **Fetches events** when the calendar view changes
2. **Creates events** through the modal form
3. **Deletes events** from the detail modal
4. **Displays errors** with a toast notification
5. **Handles loading states** for all operations

All API calls use the proper TypeScript types and httpOnly cookie authentication.
