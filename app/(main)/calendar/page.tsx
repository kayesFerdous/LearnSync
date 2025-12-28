'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="h-[calc(100vh-6rem)] bg-surface rounded-3xl p-6 shadow-sm border border-surface-highlight overflow-hidden">
        <style jsx global>{`
        .fc {
          --fc-border-color: hsl(var(--surface-highlight));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-event-bg-color: hsl(var(--primary) / 0.2);
          --fc-event-border-color: transparent;
          --fc-event-text-color: hsl(var(--primary));
          --fc-today-bg-color: hsl(var(--surface-highlight) / 0.5);
          font-family: inherit;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: hsl(var(--surface-highlight));
        }
        .fc-col-header-cell-cushion {
          color: hsl(var(--text-muted));
          font-weight: 600;
          padding: 8px 0;
        }
        .fc-daygrid-day-number {
          color: hsl(var(--text-main));
          font-weight: 500;
        }
        .fc-event {
          border-radius: 6px;
          padding: 2px 4px;
          font-weight: 500;
        }
        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700;
          color: hsl(var(--text-main));
        }
        .fc-button {
          border-radius: 9999px !important;
          text-transform: capitalize;
          font-weight: 500;
          padding: 8px 16px !important;
          border: none !important;
        }
        .fc-button-primary {
            background-color: hsl(var(--primary)) !important;
        }
        .fc-button-active {
            background-color: hsl(var(--primary)) !important;
            filter: brightness(0.9);
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        height="100%"
        events={[
          { title: 'Project Review', date: new Date().toISOString().split('T')[0] }
        ]}
      />
    </div>
    </div>
  );
}
