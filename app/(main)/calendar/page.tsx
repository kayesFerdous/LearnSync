'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { Plus, Trash2, X, Calendar as CalendarIcon, Clock, User, MapPin, Link as LinkIcon, Edit, Bell, Repeat2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useCalendar, type CalendarEvent } from './_lib';
import { RecurrenceModal } from './_components/recurrence-modal';
import { generateRRules, isValidRecurrenceArray, parseRRuleToHumanReadable } from './_lib/rrule-utils';
import type { RRuleFormState } from './_lib/rrule-utils';

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
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
    recurrence?: string[];
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
      reminders: event.reminders,
      recurrence: event.recurrence,
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FullCalendarEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    start: '',
    end: '',
    useDefaultReminders: true,
    customReminders: [{ method: 'popup' as 'email' | 'popup', minutes: 10 }],
    recurrence: [] as string[],
    recurrenceState: undefined as RRuleFormState | undefined,
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

      // Validate recurrence if present
      if (formData.recurrence.length > 0 && !isValidRecurrenceArray(formData.recurrence)) {
        alert('Invalid recurrence configuration');
        return;
      }

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
        reminders: {
          useDefault: formData.useDefaultReminders,
          overrides: formData.useDefaultReminders ? undefined : formData.customReminders,
        },
        recurrence: formData.recurrence.length > 0 ? formData.recurrence : undefined,
      });

      if (success) {
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const startDateTime = convertToISOString(formData.start);
      const endDateTime = convertToISOString(formData.end);

      // Validate recurrence if present
      if (formData.recurrence.length > 0 && !isValidRecurrenceArray(formData.recurrence)) {
        alert('Invalid recurrence configuration');
        return;
      }

      const success = await calendar.updateEvent(selectedEvent.id, {
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
        reminders: {
          useDefault: formData.useDefaultReminders,
          overrides: formData.useDefaultReminders ? undefined : formData.customReminders,
        },
        recurrence: formData.recurrence.length > 0 ? formData.recurrence : undefined,
      });

      if (success) {
        setIsEditModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating event:', error);
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
      useDefaultReminders: true,
      customReminders: [{ method: 'popup' as 'email' | 'popup', minutes: 10 }],
      recurrence: [],
      recurrenceState: undefined,
    });
    setIsCreateModalOpen(true);
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    
    const reminders = selectedEvent.extendedProps.reminders?.overrides?.map(r => ({
      method: r.method as 'email' | 'popup',
      minutes: r.minutes
    })) || [{ method: 'popup' as 'email' | 'popup', minutes: 10 }];
    
    setFormData({
      summary: selectedEvent.title,
      description: selectedEvent.extendedProps.description || '',
      location: selectedEvent.extendedProps.location || '',
      start: formatDateTimeLocal(new Date(selectedEvent.start)),
      end: formatDateTimeLocal(new Date(selectedEvent.end)),
      useDefaultReminders: selectedEvent.extendedProps.reminders?.useDefault ?? true,
      customReminders: reminders,
      recurrence: selectedEvent.extendedProps.recurrence || [],
      recurrenceState: undefined,
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
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
      useDefaultReminders: true,
      customReminders: [{ method: 'popup' as 'email' | 'popup', minutes: 10 }],
      recurrence: [],
      recurrenceState: undefined,
    });
  };

  const addReminder = () => {
    setFormData({
      ...formData,
      customReminders: [...formData.customReminders, { method: 'popup' as 'email' | 'popup', minutes: 10 }],
    });
  };

  const removeReminder = (index: number) => {
    setFormData({
      ...formData,
      customReminders: formData.customReminders.filter((_, i) => i !== index),
    });
  };

  const updateReminder = (index: number, field: 'method' | 'minutes', value: string | number) => {
    const updated = [...formData.customReminders];
    if (field === 'method') {
      updated[index].method = value as 'email' | 'popup';
    } else {
      updated[index].minutes = Number(value);
    }
    setFormData({ ...formData, customReminders: updated });
  };

  const handleRecurrenceApply = (recurrenceState: RRuleFormState) => {
    const rrules = generateRRules(recurrenceState);
    setFormData({
      ...formData,
      recurrence: rrules,
      recurrenceState: recurrenceState,
    });
    setIsRecurrenceModalOpen(false);
  };

  return (
  <div className="h-full flex flex-col m-2 border border-border rounded-lg shadow-md overflow-hidden" ref={containerRef}>
      <div className="flex-1 bg-card overflow-hidden flex flex-col rounded-[calc(var(--radius)-2px)]">
        <style jsx global>{`
          .fc {
            --fc-border-color: var(--border);
            --fc-button-bg-color: var(--primary);
            --fc-button-border-color: var(--primary);
            --fc-button-hover-bg-color: color-mix(in srgb, var(--primary), black 10%);
            --fc-button-hover-border-color: color-mix(in srgb, var(--primary), black 10%);
            --fc-button-active-bg-color: color-mix(in srgb, var(--primary), black 20%);
            --fc-button-active-border-color: color-mix(in srgb, var(--primary), black 20%);
            --fc-event-bg-color: var(--primary);
            --fc-event-border-color: var(--primary);
            --fc-event-text-color: var(--primary-foreground);
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
            background-color: var(--primary) !important;
            border-color: var(--primary) !important;
            color: var(--primary-foreground) !important;
          }
          .fc-event .fc-event-title,
          .fc-event .fc-event-time,
          .fc-event-content {
            color: var(--primary-foreground) !important;
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

              {/* Reminders Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminders
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useDefaultReminders}
                      onChange={(e) => setFormData({ ...formData, useDefaultReminders: e.target.checked })}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm text-muted-foreground">Use default</span>
                  </label>
                </div>

                {!formData.useDefaultReminders && (
                  <div className="space-y-2">
                    {formData.customReminders.map((reminder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={reminder.method}
                          onChange={(e) => updateReminder(index, 'method', e.target.value)}
                          className="px-2 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="popup">Popup</option>
                          <option value="email">Email</option>
                        </select>
                        <input
                          type="number"
                          value={reminder.minutes}
                          onChange={(e) => updateReminder(index, 'minutes', e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          min="0"
                        />
                        <span className="text-sm text-muted-foreground">min before</span>
                        {formData.customReminders.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReminder(index)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addReminder}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add reminder
                    </button>
                  </div>
                )}
              </div>

              {/* Recurrence Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Repeat2 className="h-4 w-4" />
                    Repeat
                  </label>
                </div>
                {formData.recurrence.length > 0 && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="text-muted-foreground">Current recurrence:</p>
                    <p className="mt-1 font-medium">{parseRRuleToHumanReadable(formData.recurrence[0])}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsRecurrenceModalOpen(true)}
                  className="w-full px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-accent transition-colors"
                >
                  {formData.recurrence.length > 0 ? 'Edit Recurrence' : 'Add Recurrence'}
                </button>
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

              {selectedEvent.extendedProps.reminders && (
                <div className="flex items-start gap-3 text-sm">
                  <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Reminders:</p>
                    {selectedEvent.extendedProps.reminders.useDefault ? (
                      <p className="mt-1">Using default reminders</p>
                    ) : selectedEvent.extendedProps.reminders.overrides && selectedEvent.extendedProps.reminders.overrides.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {selectedEvent.extendedProps.reminders.overrides.map((reminder, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="capitalize">{reminder.method}</span>
                            <span>-</span>
                            <span>{reminder.minutes} minutes before</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-muted-foreground">No reminders</p>
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.recurrence && selectedEvent.extendedProps.recurrence.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Repeat2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Recurrence:</p>
                    <p className="mt-1">{parseRRuleToHumanReadable(selectedEvent.extendedProps.recurrence[0])}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
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

      {/* Recurrence Modal */}
      <RecurrenceModal
        isOpen={isRecurrenceModalOpen}
        onClose={() => setIsRecurrenceModalOpen(false)}
        onApply={handleRecurrenceApply}
        initialState={formData.recurrenceState}
      />

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
              <h2 className="text-lg font-semibold">Edit Event</h2>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedEvent(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="p-4 space-y-4">
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

              {/* Reminders Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminders
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useDefaultReminders}
                      onChange={(e) => setFormData({ ...formData, useDefaultReminders: e.target.checked })}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm text-muted-foreground">Use default</span>
                  </label>
                </div>

                {!formData.useDefaultReminders && (
                  <div className="space-y-2">
                    {formData.customReminders.map((reminder, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={reminder.method}
                          onChange={(e) => updateReminder(index, 'method', e.target.value)}
                          className="px-2 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="popup">Popup</option>
                          <option value="email">Email</option>
                        </select>
                        <input
                          type="number"
                          value={reminder.minutes}
                          onChange={(e) => updateReminder(index, 'minutes', e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          min="0"
                        />
                        <span className="text-sm text-muted-foreground">min before</span>
                        {formData.customReminders.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReminder(index)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addReminder}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add reminder
                    </button>
                  </div>
                )}
              </div>

              {/* Recurrence Section */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Repeat2 className="h-4 w-4" />
                    Repeat
                  </label>
                </div>
                {formData.recurrence.length > 0 && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="text-muted-foreground">Current recurrence:</p>
                    <p className="mt-1 font-medium">{parseRRuleToHumanReadable(formData.recurrence[0])}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsRecurrenceModalOpen(true)}
                  className="w-full px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-accent transition-colors"
                >
                  {formData.recurrence.length > 0 ? 'Edit Recurrence' : 'Add Recurrence'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calendar.loading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                >
                  {calendar.loading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
