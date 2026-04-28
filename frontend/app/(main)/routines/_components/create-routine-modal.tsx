'use client';

import { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateRoutineRequest, CreateClassRequest } from '../_lib/types';
import { DAYS_OF_WEEK } from '../_lib/types';

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoutineRequest) => Promise<void>;
  isLoading?: boolean;
}

interface ClassFormRow {
  id: string;
  day: CreateClassRequest['day'];
  start_time: string;
  end_time: string;
  course_name: string;
}

export function CreateRoutineModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateRoutineModalProps) {
  const [title, setTitle] = useState('My Class Schedule');
  const [classes, setClasses] = useState<ClassFormRow[]>([
    { id: '1', day: 'Monday', start_time: '09:00', end_time: '10:30', course_name: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const addClassRow = () => {
    const newId = String(Date.now());
    setClasses(prev => [
      ...prev,
      { id: newId, day: 'Monday', start_time: '09:00', end_time: '10:30', course_name: '' },
    ]);
  };

  const removeClassRow = (id: string) => {
    if (classes.length <= 1) return;
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const updateClassRow = (id: string, field: keyof ClassFormRow, value: string) => {
    setClasses(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Schedule title is required');
      return;
    }

    const validClasses = classes.filter(c => c.course_name.trim());
    if (validClasses.length === 0) {
      setError('At least one class with a course name is required');
      return;
    }

    // Convert times to ISO format without timezone (local time)
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const formatLocalISO = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const generateWeeklyRecurrence = (
      day: CreateClassRequest['day'],
      endDate: string
    ): string[] => {
      const dayMap: Record<CreateClassRequest['day'], string> = {
        Monday: 'MO',
        Tuesday: 'TU',
        Wednesday: 'WE',
        Thursday: 'TH',
        Friday: 'FR',
        Saturday: 'SA',
        Sunday: 'SU',
      };
      const until = endDate.replace(/-/g, '');
      return [`RRULE:FREQ=WEEKLY;BYDAY=${dayMap[day]};UNTIL=${until}`];
    };

    const formattedClasses: CreateClassRequest[] = validClasses.map(cls => {
      const dayOffset = DAYS_OF_WEEK.indexOf(cls.day);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + mondayOffset + dayOffset);

      const [startHour, startMin] = cls.start_time.split(':').map(Number);
      const [endHour, endMin] = cls.end_time.split(':').map(Number);

      const startDateTime = new Date(targetDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(targetDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      return {
        day: cls.day,
        start_time: formatLocalISO(startDateTime),
        end_time: formatLocalISO(endDateTime),
        course_name: cls.course_name.trim(),
        recurrence: generateWeeklyRecurrence(cls.day, recurrenceEndDate),
      };
    });

    try {
      await onSubmit({
        title: title.trim(),
        classes: formattedClasses,
      });
      onClose();
    } catch {
      setError('Failed to create schedule. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-y-auto py-8">
        <div
          className="pointer-events-auto w-full max-w-2xl mx-4 rounded-2xl bg-card border border-border theme-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                Create Class Schedule
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Schedule Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Schedule Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring 2024 Schedule"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Classes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Classes</label>
                <button
                  type="button"
                  onClick={addClassRow}
                  disabled={isLoading}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  + Add Another Class
                </button>
              </div>

              <div className="space-y-3">
                {classes.map((cls, index) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Class {index + 1}
                      </span>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeClassRow(cls.id)}
                          disabled={isLoading}
                          className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={cls.course_name}
                        onChange={(e) => updateClassRow(cls.id, 'course_name', e.target.value)}
                        placeholder="Course name"
                        className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={isLoading}
                      />
                      <select
                        value={cls.day}
                        onChange={(e) => updateClassRow(cls.id, 'day', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        disabled={isLoading}
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Start</label>
                        <input
                          type="time"
                          value={cls.start_time}
                          onChange={(e) => updateClassRow(cls.id, 'start_time', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">End</label>
                        <input
                          type="time"
                          value={cls.end_time}
                          onChange={(e) => updateClassRow(cls.id, 'end_time', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurrence Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Repeat schedule</span>
                <span className="text-xs text-muted-foreground">
                  (classes repeat weekly)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Repeat until</label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center">
                  <p className="text-xs text-muted-foreground">
                    Your classes will be added to Google Calendar and repeat every week
                    until the selected end date.
                  </p>
                </div>
              </div>
            </div>

            {/* Note about Google Calendar sync */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 font-medium">
                📅 Your schedule will be automatically synced to Google Calendar as recurring events.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 border-t border-border/50 bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2",
                isLoading
                  ? "bg-primary/50 text-primary-foreground/70 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground theme-shadow"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating & Syncing...
                </>
              ) : (
                'Create Schedule'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
