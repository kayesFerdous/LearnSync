import type {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  EventListResponse,
  ListEventsParams,
  CalendarEventParams,
} from './types';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class CalendarApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail: string
  ) {
    super(message);
    this.name = 'CalendarApiError';
  }
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * List calendar events
 * GET /calendar/
 */
export async function listEvents(
  params: ListEventsParams = {}
): Promise<EventListResponse> {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/calendar${queryString}`, {
      method: 'GET',
      credentials: 'include', // Important for httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new CalendarApiError(
        'Failed to list events',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as EventListResponse;
  } catch (error) {
    if (error instanceof CalendarApiError) {
      throw error;
    }
    throw new CalendarApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Create a new calendar event
 * POST /calendar/
 */
export async function createEvent(
  eventData: CreateEventRequest,
  params: CalendarEventParams = {}
): Promise<CalendarEvent> {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/calendar${queryString}`, {
      method: 'POST',
      credentials: 'include', // Important for httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new CalendarApiError(
        'Failed to create event',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as CalendarEvent;
  } catch (error) {
    if (error instanceof CalendarApiError) {
      throw error;
    }
    throw new CalendarApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Get a single calendar event
 * GET /calendar/{event_id}
 */
export async function getEvent(
  eventId: string,
  params: CalendarEventParams = {}
): Promise<CalendarEvent> {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${API_BASE_URL}/calendar/${eventId}${queryString}`,
      {
        method: 'GET',
        credentials: 'include', // Important for httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new CalendarApiError(
        'Failed to get event',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as CalendarEvent;
  } catch (error) {
    if (error instanceof CalendarApiError) {
      throw error;
    }
    throw new CalendarApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Update an existing calendar event
 * PUT /calendar/{event_id}
 */
export async function updateEvent(
  eventId: string,
  eventData: UpdateEventRequest,
  params: CalendarEventParams = {}
): Promise<CalendarEvent> {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${API_BASE_URL}/calendar/${eventId}${queryString}`,
      {
        method: 'PUT',
        credentials: 'include', // Important for httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new CalendarApiError(
        'Failed to update event',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as CalendarEvent;
  } catch (error) {
    if (error instanceof CalendarApiError) {
      throw error;
    }
    throw new CalendarApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Delete a calendar event
 * DELETE /calendar/{event_id}
 */
export async function deleteEvent(
  eventId: string,
  params: CalendarEventParams = {}
): Promise<void> {
  try {
    const queryString = buildQueryString(params);
    const response = await fetch(
      `${API_BASE_URL}/calendar/${eventId}${queryString}`,
      {
        method: 'DELETE',
        credentials: 'include', // Important for httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new CalendarApiError(
        'Failed to delete event',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    // 204 No Content - no body to parse
  } catch (error) {
    if (error instanceof CalendarApiError) {
      throw error;
    }
    throw new CalendarApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
