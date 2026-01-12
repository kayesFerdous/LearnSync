// Common Sub-types
export interface CalendarTime {
  dateTime?: string; // ISO 8601 string (e.g., "2023-10-27T10:00:00Z")
  date?: string;     // YYYY-MM-DD (for all-day events)
  timeZone?: string; // e.g., "Asia/Dhaka", "UTC"
}

export interface CalendarUser {
  email?: string;
  displayName?: string;
  self?: boolean;
}

export interface ReminderOverride {
  method: "email" | "popup";
  minutes: number;
}

export interface EventReminders {
  useDefault: boolean;
  overrides?: ReminderOverride[];
}

// Main Event Entity
export interface CalendarEvent {
  id: string;
  status?: string;
  htmlLink?: string;
  summary?: string;
  description?: string;
  location?: string;
  creator?: CalendarUser;
  organizer?: CalendarUser;
  start?: CalendarTime;
  end?: CalendarTime;
  reminders?: EventReminders;
}

// Request DTOs
export interface CreateEventRequest {
  summary: string;
  description?: string;
  location?: string;
  start: CalendarTime;
  end: CalendarTime;
  attendees?: Array<{ email: string }>;
  reminders?: EventReminders;
}

export interface UpdateEventRequest {
  summary?: string;
  description?: string;
  location?: string;
  start?: CalendarTime;
  end?: CalendarTime;
  attendees?: Array<{ email: string }>;
  reminders?: EventReminders;
}

export interface EventListResponse {
  events: CalendarEvent[];
}

// Query parameters
export interface ListEventsParams {
  min_datetime?: string; // ISO format
  max_datetime?: string; // ISO format
  max_results?: number;
  single_events?: boolean;
  calendar_id?: string;
}

export interface CalendarEventParams {
  calendar_id?: string;
}
