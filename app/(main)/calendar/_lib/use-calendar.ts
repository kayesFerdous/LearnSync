import { useState, useCallback } from 'react';
import type {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  ListEventsParams,
  CalendarEventParams,
} from './types';
import * as calendarApi from './api';

export interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  fetchEvents: (params?: ListEventsParams) => Promise<void>;
  createEvent: (
    eventData: CreateEventRequest,
    params?: CalendarEventParams
  ) => Promise<CalendarEvent | null>;
  updateEvent: (
    eventId: string,
    eventData: UpdateEventRequest,
    params?: CalendarEventParams
  ) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string, params?: CalendarEventParams) => Promise<boolean>;
  getEvent: (eventId: string, params?: CalendarEventParams) => Promise<CalendarEvent | null>;
  clearError: () => void;
}

export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchEvents = useCallback(async (params: ListEventsParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await calendarApi.listEvents(params);
      setEvents(response.events);
    } catch (err) {
      if (err instanceof calendarApi.CalendarApiError) {
        setError(err.detail);
      } else {
        setError('Failed to fetch events');
      }
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async (
      eventData: CreateEventRequest,
      params: CalendarEventParams = {}
    ): Promise<CalendarEvent | null> => {
      setLoading(true);
      setError(null);
      try {
        const newEvent = await calendarApi.createEvent(eventData, params);
        setEvents((prev) => [...prev, newEvent]);
        return newEvent;
      } catch (err) {
        if (err instanceof calendarApi.CalendarApiError) {
          setError(err.detail);
        } else {
          setError('Failed to create event');
        }
        console.error('Error creating event:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      eventData: UpdateEventRequest,
      params: CalendarEventParams = {}
    ): Promise<CalendarEvent | null> => {
      setLoading(true);
      setError(null);
      try {
        const updatedEvent = await calendarApi.updateEvent(eventId, eventData, params);
        setEvents((prev) =>
          prev.map((event) => (event.id === eventId ? updatedEvent : event))
        );
        return updatedEvent;
      } catch (err) {
        if (err instanceof calendarApi.CalendarApiError) {
          setError(err.detail);
        } else {
          setError('Failed to update event');
        }
        console.error('Error updating event:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteEvent = useCallback(
    async (eventId: string, params: CalendarEventParams = {}): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await calendarApi.deleteEvent(eventId, params);
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        return true;
      } catch (err) {
        if (err instanceof calendarApi.CalendarApiError) {
          setError(err.detail);
        } else {
          setError('Failed to delete event');
        }
        console.error('Error deleting event:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getEvent = useCallback(
    async (
      eventId: string,
      params: CalendarEventParams = {}
    ): Promise<CalendarEvent | null> => {
      setLoading(true);
      setError(null);
      try {
        const event = await calendarApi.getEvent(eventId, params);
        return event;
      } catch (err) {
        if (err instanceof calendarApi.CalendarApiError) {
          setError(err.detail);
        } else {
          setError('Failed to get event');
        }
        console.error('Error getting event:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    clearError,
  };
}
