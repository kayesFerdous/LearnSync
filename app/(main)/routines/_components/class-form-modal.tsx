'use client';

import { useState, useEffect } from 'react';
import { X, Clock, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoutineClass, CreateClassRequest } from '../_lib/types';
import { DAYS_OF_WEEK } from '../_lib/types';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClassRequest) => Promise<void>;
  initialData?: RoutineClass | null;
  isLoading?: boolean;
  defaultRecurrence?: string[];
}

export function ClassFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  defaultRecurrence,
}: ClassFormModalProps) {
  const [formData, setFormData] = useState<CreateClassRequest>({
    day: 'Monday',
    start_time: '',
    end_time: '',
    course_name: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Parse ISO datetime to local time for editing
        const startDate = new Date(initialData.start_time);
        const endDate = new Date(initialData.end_time);
        
        setFormData({
          day: initialData.day,
          start_time: formatTimeForInput(startDate),
          end_time: formatTimeForInput(endDate),
          course_name: initialData.course_name,
        });
      } else {
        setFormData({
          day: 'Monday',
          start_time: '09:00',
          end_time: '10:30',
          course_name: '',
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.course_name.trim()) {
      setError('Course name is required');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      setError('Start and end times are required');
      return;
    }

    // Check that end time is after start time
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    // Convert times to ISO format without timezone (local time)
    // We'll use a reference date (today) since the backend expects ISO datetime
    const today = new Date();
    const dayOffset = DAYS_OF_WEEK.indexOf(formData.day);
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + mondayOffset + dayOffset);

    const startDateTime = new Date(targetDate);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(targetDate);
    endDateTime.setHours(endHour, endMin, 0, 0);

    const defaultEndDate = new Date(
      Date.now() + 16 * 7 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    const submitData: CreateClassRequest = {
      day: formData.day,
      start_time: formatLocalISO(startDateTime),
      end_time: formatLocalISO(endDateTime),
      course_name: formData.course_name.trim(),
      recurrence: (defaultRecurrence && defaultRecurrence.length > 0)
        ? defaultRecurrence
        : generateWeeklyRecurrence(formData.day, defaultEndDate),
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch {
      setError('Failed to save class. Please try again.');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl bg-card border border-border theme-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                {isEditing ? 'Edit Class' : 'Add New Class'}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Course Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Course Name
              </label>
              <input
                type="text"
                value={formData.course_name}
                onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
                placeholder="e.g., Physics 101"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Day */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Day
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value as CreateClassRequest['day'] }))}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                disabled={isLoading}
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
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
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  isEditing ? 'Update Class' : 'Add Class'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
