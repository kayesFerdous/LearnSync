'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Plus, Trash2, X, Calendar as CalendarIcon, Clock, User, MapPin, Link as LinkIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useCalendar, type CalendarEvent } from './_lib';

// --- Interfaces ---

interface FullCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  url?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    creator?: string;
    organizer?: string;
    htmlLink?: string;
    description?: string;
    location?: string;
  };
}

// --- Helper Functions ---

const formatDateTimeLocal = (date: Date): string => {
  // Format: YYYY-MM-DDTHH:MM
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const convertToISOString = (dateTimeLocal: string, timeZone: string = 'Asia/Dhaka'): string => {
  // Convert datetime-local to ISO 8601 format
  return new Date(dateTimeLocal).toISOString();
};

const convertCalendarEventToFullCalendarEvent = (event: CalendarEvent): FullCalendarEvent => {
  return {
    id: event.id,
    title: event.summary || '(No Title)',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    backgroundColor: 'hsl(var(--primary))',
    borderColor: 'hsl(var(--primary))',
    extendedProps: {
      creator: event.creator?.email || event.creator?.displayName || '',
      organizer: event.organizer?.email || event.organizer?.displayName || '',
      htmlLink: event.htmlLink || '',
      description: event.description || '',
      location: event.location || '',
    }
  };
};

// --- Components ---

export default function CalendarPage() {
  const { user } = useAuthStore();
  const calendar = useCalendar();
  
  const [fullCalendarEvents, setFullCalendarEvents] = useState<FullCalendarEvent[]>([]);
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null);
  
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    start: '',
    end: '',
  });

  // Convert calendar events to FullCalendar format
  useEffect(() => {
    const converted = calendar.events.map(convertCalendarEventToFullCalendarEvent);
    setFullCalendarEvents(converted);
  }, [calendar.events]);

  // --- Resize Observer for Responsiveness ---
  useEffect(() => {
    if (!containerRef.current || !calendarRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // --- API Interactions ---

  const handleDatesSet = (arg: { start: Date; end: Date }) => {
    setCurrentRange({ start: arg.start, end: arg.end });
    calendar.fetchEvents({
      min_datetime: arg.start.toISOString(),
      max_datetime: arg.end.toISOString(),
      max_results: 100,
      single_events: true,
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = convertToISOString(formData.start);
      const endDateTime = convertToISOString(formData.end);

      const success = await calendar.createEvent({
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        start: {
          dateTime: startDateTime,
          timeZone: 'Asia/Dhaka',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Dhaka',
        },
      });

      if (success) {
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    if (!confirm('Are you sure you want to delete this event?')) return;

    const success = await calendar.deleteEvent(selectedEvent.id);

    if (success) {
      setIsDetailModalOpen(false);
      setSelectedEvent(null);
    }
  };

  // --- Event Handlers ---

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateRange({ start: selectInfo.start, end: selectInfo.end });
    setFormData({
      summary: '',
      description: '',
      location: '',
      start: formatDateTimeLocal(selectInfo.start),
      end: formatDateTimeLocal(selectInfo.end),
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = fullCalendarEvents.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsDetailModalOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      summary: '',
      description: '',
      location: '',
      start: '',
      end: '',
    });
  };

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className="flex-1 bg-card overflow-hidden flex flex-col">
        <style jsx global>{`
          .fc {
            --fc-border-color: var(--border);
            --fc-button-bg-color: var(--primary);
            --fc-button-border-color: var(--primary);
            --fc-button-hover-bg-color: color-mix(in srgb, var(--primary), black 10%);
            --fc-button-hover-border-color: color-mix(in srgb, var(--primary), black 10%);
            --fc-button-active-bg-color: color-mix(in srgb, var(--primary), black 20%);
            --fc-button-active-border-color: color-mix(in srgb, var(--primary), black 20%);
            --fc-event-bg-color: color-mix(in srgb, var(--primary), transparent 80%);
            --fc-event-border-color: transparent;
            --fc-event-text-color: var(--primary);
            --fc-today-bg-color: color-mix(in srgb, var(--accent), transparent 90%);
            font-family: inherit;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: var(--border);
          }
          .fc-col-header-cell-cushion {
            color: var(--foreground);
            font-weight: 600;
            font-size: 1rem;
            padding: 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .fc-daygrid-day-number {
            color: var(--foreground);
            font-weight: 500;
            font-size: 1rem;
            padding: 8px;
          }
          .fc-daygrid-day-top {
            flex-direction: row;
          }
          .fc-event {
            border-radius: 4px;
            padding: 4px 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            margin-bottom: 2px;
          }
          .fc-event:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 700;
            color: var(--foreground);
            padding-left: 0.5rem;
          }
          .fc-button {
            border-radius: 8px !important;
            text-transform: capitalize;
            font-weight: 500;
            padding: 8px 20px !important;
            border: 1px solid transparent !important;
            margin: 0 4px !important;
            transition: all 0.2s;
          }
          .fc-button:hover {
            transform: translateY(-1px);
          }
          .fc-header-toolbar {
            margin-bottom: 0 !important;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
            background-color: var(--card);
          }
          .fc-view-harness {
            background-color: var(--background);
          }
          /* Increase height of time slots */
          .fc-timegrid-slot {
            height: 3rem !important;
          }
          /* Better grid lines */
          .fc-scrollgrid {
            border: none !important;
          }
        `}</style>
        
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          height="100%"
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={fullCalendarEvents} // Use the converted events
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
        />
      </div>

      {/* Error Display */}
      {calendar.error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2">
            <span>{calendar.error}</span>
            <button onClick={calendar.clearError} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Create New Event</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Meeting with team"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Event details..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location (optional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Conference Room A"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calendar.loading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {calendar.loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold truncate pr-4">{selectedEvent.title}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Start: {new Date(selectedEvent.start).toLocaleString()}</p>
                  <p className="font-medium">End: {new Date(selectedEvent.end).toLocaleString()}</p>
                </div>
              </div>

              {selectedEvent.extendedProps.description && (
                <div className="flex items-start gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Description:</p>
                    <p className="mt-1">{selectedEvent.extendedProps.description}</p>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Location:</p>
                    <p className="mt-1">{selectedEvent.extendedProps.location}</p>
                  </div>
                </div>
              )}

              {(selectedEvent.extendedProps.creator || selectedEvent.extendedProps.organizer) && (
                <div className="flex items-start gap-3 text-sm">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    {selectedEvent.extendedProps.creator && (
                      <p><span className="text-muted-foreground">Creator:</span> {selectedEvent.extendedProps.creator}</p>
                    )}
                    {selectedEvent.extendedProps.organizer && (
                      <p><span className="text-muted-foreground">Organizer:</span> {selectedEvent.extendedProps.organizer}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.htmlLink && (
                <div className="flex items-start gap-3 text-sm">
                  <LinkIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <a 
                    href={selectedEvent.extendedProps.htmlLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    View in Google Calendar
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button
                  onClick={handleDeleteEvent}
                  disabled={calendar.loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {calendar.loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
