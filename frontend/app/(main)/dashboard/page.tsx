'use client';

import Link from 'next/link';
import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useCalendar, type CalendarEvent } from '../calendar/_lib';
import { useRoutine, type RoutineClass } from '../routines/_lib';

const DAY_TO_INDEX: Record<RoutineClass['day'], number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

type NextRoutineClass = {
  classItem: RoutineClass;
  start: Date;
  end: Date;
};

const getEventStart = (event: CalendarEvent): Date | null => {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) {
    return null;
  }

  const parsed = new Date(start);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getEventEnd = (event: CalendarEvent): Date | null => {
  const end = event.end?.dateTime || event.end?.date;
  if (!end) {
    return null;
  }

  const parsed = new Date(end);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const findNextRoutineClass = (classes: RoutineClass[]): NextRoutineClass | null => {
  if (!classes.length) {
    return null;
  }

  const now = new Date();
  let nextClass: NextRoutineClass | null = null;

  for (const classItem of classes) {
    const classStart = new Date(classItem.start_time);
    const classEnd = new Date(classItem.end_time);

    if (Number.isNaN(classStart.getTime()) || Number.isNaN(classEnd.getTime())) {
      continue;
    }

    const targetDay = DAY_TO_INDEX[classItem.day];
    const daysUntil = (targetDay - now.getDay() + 7) % 7;

    const candidateStart = new Date(now);
    candidateStart.setDate(now.getDate() + daysUntil);
    candidateStart.setHours(
      classStart.getHours(),
      classStart.getMinutes(),
      classStart.getSeconds(),
      0
    );

    const candidateEnd = new Date(now);
    candidateEnd.setDate(now.getDate() + daysUntil);
    candidateEnd.setHours(
      classEnd.getHours(),
      classEnd.getMinutes(),
      classEnd.getSeconds(),
      0
    );

    if (candidateEnd <= candidateStart) {
      candidateEnd.setDate(candidateEnd.getDate() + 1);
    }

    if (candidateStart <= now) {
      candidateStart.setDate(candidateStart.getDate() + 7);
      candidateEnd.setDate(candidateEnd.getDate() + 7);
    }

    if (!nextClass || candidateStart < nextClass.start) {
      nextClass = {
        classItem,
        start: candidateStart,
        end: candidateEnd,
      };
    }
  }

  return nextClass;
};

const formatDateLabel = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatTimeLabel = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatRelative = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `In ${diffMinutes}m`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    return minutes === 0 ? `In ${hours}h` : `In ${hours}h ${minutes}m`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
};

const EventRow = ({
  icon,
  title,
  subtitle,
  rightMeta,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  rightMeta: string;
}) => {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 p-3 transition-all hover:border-primary/40 hover:bg-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
        {rightMeta}
      </span>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { events, loading: calendarLoading, error: calendarError, fetchEvents } = useCalendar();
  const { routine, isLoading: routineLoading, error: routineError } = useRoutine();

  useEffect(() => {
    void fetchEvents({
      min_datetime: new Date().toISOString(),
      max_results: 12,
      single_events: true,
    });
  }, [fetchEvents]);

  const username = user?.username || 'there';

  const upcomingEvents = useMemo(() => {
    const now = new Date();

    return events
      .map((event) => ({ event, start: getEventStart(event) }))
      .filter((item): item is { event: CalendarEvent; start: Date } => Boolean(item.start && item.start >= now))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3);
  }, [events]);

  const nextClass = useMemo(() => {
    return findNextRoutineClass(routine?.classes || []);
  }, [routine?.classes]);

  const nextEvent = upcomingEvents[0];

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-6">
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Good day, {username}</h1>
            <p className="text-muted-foreground">Today at a glance: your next commitments are ready.</p>
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-lg font-bold text-foreground shadow-sm">
            {(username[0] || 'U').toUpperCase()}
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/chat"
            className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-md transition-all hover:bg-primary/90"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="font-bold">New Chat</span>
          </Link>
          <Link
            href="/calendar"
            className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-6 text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarIcon className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="font-medium">Add Event</span>
          </Link>
          <Link
            href="/routines"
            className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-6 text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <Activity className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="font-medium">Routines</span>
          </Link>
          <Link
            href="/calendar"
            className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-6 text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <Zap className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="font-medium">Plan Day</span>
          </Link>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Today
              </h2>
              <Link href="/calendar" className="text-xs text-primary hover:underline">
                View calendar
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_52%)]" />
              <div className="relative space-y-4 p-5">
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Next class from routine</span>
                  </div>

                  {routineLoading ? (
                    <p className="text-sm text-muted-foreground">Loading routine...</p>
                  ) : nextClass ? (
                    <>
                      <p className="text-lg font-semibold text-foreground">{nextClass.classItem.course_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateLabel(nextClass.start)} • {formatTimeLabel(nextClass.start)} - {formatTimeLabel(nextClass.end)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-primary">{formatRelative(nextClass.start)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {routineError ? 'Could not load routine schedule.' : 'No upcoming class found. Add classes in your routine.'}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Upcoming events</p>
                    <span className="text-xs text-muted-foreground">Next 3</span>
                  </div>

                  {calendarLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                      ))}
                    </div>
                  ) : upcomingEvents.length > 0 ? (
                    <div className="space-y-2.5">
                      {upcomingEvents.map(({ event, start }) => {
                        const end = getEventEnd(event);
                        const subtitle = end
                          ? `${formatDateLabel(start)} • ${formatTimeLabel(start)} - ${formatTimeLabel(end)}`
                          : `${formatDateLabel(start)} • ${formatTimeLabel(start)}`;

                        return (
                          <EventRow
                            key={event.id}
                            icon={<CalendarIcon className="h-4 w-4" />}
                            title={event.summary || 'Untitled event'}
                            subtitle={subtitle}
                            rightMeta={formatRelative(start)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {calendarError ? 'Could not load calendar events.' : 'No upcoming events. Add one to get started.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    href="/calendar"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Open full schedule
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pulse
            </h2>
            <div className="relative h-full overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="relative z-10 mb-6 flex items-center gap-3">
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="font-medium text-muted-foreground">Your next step</span>
              </div>

              <div className="relative z-10">
                {nextEvent ? (
                  <>
                    <div className="mb-1 text-4xl font-bold text-foreground">{formatRelative(nextEvent.start)}</div>
                    <div className="text-sm text-muted-foreground">until {nextEvent.event.summary || 'your next event'}</div>
                  </>
                ) : (
                  <>
                    <div className="mb-1 text-4xl font-bold text-foreground">Free</div>
                    <div className="text-sm text-muted-foreground">No upcoming events in calendar</div>
                  </>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Upcoming events</span>
                  <span className="font-semibold text-foreground">{upcomingEvents.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Routine classes</span>
                  <span className="font-semibold text-foreground">{routine?.classes.length || 0}</span>
                </div>
                <div className="mt-4 flex h-2 gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 rounded-full',
                        i < Math.min(7, upcomingEvents.length + (nextClass ? 1 : 0)) ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
