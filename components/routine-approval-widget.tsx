'use client';

import { useState, useEffect } from 'react';
import { Check, X, Plus, Trash2, Edit3, Loader2, Calendar, Clock, BookOpen, CalendarRange, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecurrenceModal } from '@/app/(main)/calendar/_components/recurrence-modal';
import { generateRRules, parseRRuleToHumanReadable } from '@/app/(main)/calendar/_lib/rrule-utils';
import type { RRuleFormState } from '@/app/(main)/calendar/_lib/rrule-utils';

interface ClassSchedule {
  day: string;
  course_name: string;
  start: {
    dateTime: string; // ISO 8601 format
  };
  end: {
    dateTime: string; // ISO 8601 format
  };
  recurrence?: string[]; // Per-class recurrence (RRULE array)
}

/**
 * Formats ISO datetime strings to readable time range
 * @param startDateTime ISO 8601 datetime string (e.g., "2024-01-15T08:30:00")
 * @param endDateTime ISO 8601 datetime string (e.g., "2024-01-15T10:00:00")
 * @returns Formatted time range (e.g., "08:30 AM - 10:00 AM")
 */
function formatTimeRange(startDateTime: string, endDateTime: string): string {
  try {
    // Extract time directly from ISO string to avoid timezone conversion
    // ISO format: "2024-01-15T08:30:00" -> extract "08:30:00"
    const formatTime = (isoString: string) => {
      const timeStr = isoString.slice(11, 19); // Extract "HH:MM:SS"
      const [hoursStr, minutesStr] = timeStr.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = minutesStr;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(startDateTime)} - ${formatTime(endDateTime)}`;
  } catch (error) {
    return 'Invalid time';
  }
}

/**
 * Creates ISO datetime string from time input
 * @param timeStr Time string (e.g., "08:30 AM")
 * @param baseDate Base date to use for the datetime
 * @returns ISO 8601 datetime string
 */
function timeToISO(timeStr: string, baseDate: Date = new Date()): string {
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return baseDate.toISOString().slice(0, 19);
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString().slice(0, 19);
  } catch (error) {
    return baseDate.toISOString().slice(0, 19);
  }
}

/**
 * Finds the next occurrence of a specific day of the week
 * @param dayName Day name (e.g., "Monday", "Tuesday")
 * @param afterDate Reference date (defaults to today)
 * @returns Next occurrence of that day
 */
function getNextOccurrenceOfDay(dayName: string, afterDate: Date = new Date()): Date {
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  
  const targetDay = dayMap[dayName];
  const startDate = new Date(afterDate);
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
  
  let daysToAdd = (targetDay - startDate.getDay() + 7) % 7;
  
  const result = new Date(startDate);
  result.setDate(result.getDate() + daysToAdd);
  
  return result;
}

/**
 * Generates individual recurrence pattern for a single class
 * Creates a weekly recurring event starting from the class's first actual occurrence
 * Uses date-based ending (UNTIL) for student routines
 * @param classItem The class schedule
 * @param endDate ISO date string for when the recurrence should end
 * @returns Updated class with corrected dates and RRULE for this specific class
 */
function generateRecurrenceForClass(
  classItem: ClassSchedule,
  endDate: string
): ClassSchedule | null {
  try {
    const dayMap: Record<string, string> = {
      'Sunday': 'SU',
      'Monday': 'MO',
      'Tuesday': 'TU',
      'Wednesday': 'WE',
      'Thursday': 'TH',
      'Friday': 'FR',
      'Saturday': 'SA',
    };

    const byDay = dayMap[classItem.day];
    if (!byDay) return null;

    // Find the next occurrence of this day
    const nextOccurrence = getNextOccurrenceOfDay(classItem.day);

    // Extract time directly from ISO string (preserve exact time from backend)
    // ISO format: "2026-01-16T11:30:00" -> extract "11:30:00"
    const startTimeStr = classItem.start.dateTime.slice(11, 19); // "HH:MM:SS"
    const endTimeStr = classItem.end.dateTime.slice(11, 19); // "HH:MM:SS"

    // Format the date portion from nextOccurrence (YYYY-MM-DD)
    const year = nextOccurrence.getFullYear();
    const month = String(nextOccurrence.getMonth() + 1).padStart(2, '0');
    const day = String(nextOccurrence.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Combine date with exact time from backend (no timezone conversion)
    const correctedStartISO = `${dateStr}T${startTimeStr}`;
    const correctedEndISO = `${dateStr}T${endTimeStr}`;

    // Create RRULE with UNTIL (date-based ending)
    const state: RRuleFormState = {
      frequency: 'WEEKLY',
      interval: 1,
      daysOfWeek: [byDay],
      endType: 'until',
      untilDate: new Date(endDate),
    };

    // Generate RRULE string
    const rrules = generateRRules(state);

    // Return updated class with corrected dates and recurrence
    return {
      ...classItem,
      start: { dateTime: correctedStartISO },
      end: { dateTime: correctedEndISO },
      recurrence: rrules,
    };
  } catch (error) {
    console.error('Error generating recurrence for class:', error);
    return null;
  }
}

/**
 * Automatically generates recurrence patterns for all classes
 * Each class gets corrected dates matching its day of week and per-class recurrence
 * Uses date-based ending (UNTIL) for student routines
 * @param classes Array of class schedules
 * @param _endType Deprecated - kept for backwards compatibility, always uses 'date'
 * @param endDate ISO date string for when the recurrence should end
 * @returns Updated classes array with corrected dates and per-class recurrence
 */
function generateAutoRecurrence(
  classes: ClassSchedule[],
  _endType: 'count' | 'date' = 'date',
  endDate: number | string = new Date(new Date().getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
): ClassSchedule[] {
  if (!classes || classes.length === 0) return classes;
  
  // Ensure endDate is a string
  const endDateStr = typeof endDate === 'string' ? endDate : new Date(new Date().getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    return classes.map(classItem => {
      // Skip if this class already has recurrence
      if (classItem.recurrence && classItem.recurrence.length > 0) {
        return classItem;
      }

      // Generate recurrence and corrected dates for this specific class
      const updated = generateRecurrenceForClass(classItem, endDateStr);
      
      return updated || classItem;
    });
  } catch (error) {
    console.error('Error generating auto-recurrence:', error);
    return classes;
  }
}

interface RoutineData {
  title: string;
  classes: ClassSchedule[];
  recurrence?: string[];
}

interface RoutineApprovalWidgetProps {
  data: RoutineData;
  onApprove: (editedData: RoutineData) => void;
  onReject: () => void;
  isLocked?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'processing';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RoutineApprovalWidget({
  data,
  onApprove,
  onReject,
  isLocked = false,
  status = 'pending',
}: RoutineApprovalWidgetProps) {
  const [editedData, setEditedData] = useState<RoutineData>(() => ({
    title: data.title,
    classes: data.classes.map(c => ({ ...c })),
  }));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Recurrence end date state (always use date-based ending for student routines)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    new Date(new Date().getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const isEditable = !isLocked && status === 'pending';

  // Auto-generate per-class recurrence patterns when data loads or end date changes
  useEffect(() => {
    // Generate/regenerate recurrence for all classes when:
    // 1. Not already locked/processing
    // 2. There are classes to work with
    if (isEditable && editedData.classes.length > 0) {
      // Always regenerate to apply the current end date
      const classesWithoutRecurrence = editedData.classes.map(c => ({
        ...c,
        recurrence: undefined // Clear existing recurrence to force regeneration
      }));
      const updatedClasses = generateAutoRecurrence(classesWithoutRecurrence, 'date', recurrenceEndDate);
      
      // Only update if there's an actual change to prevent infinite loops
      const currentRrule = editedData.classes[0]?.recurrence?.[0] || '';
      const newRrule = updatedClasses[0]?.recurrence?.[0] || '';
      if (currentRrule !== newRrule) {
        setEditedData(prev => ({
          ...prev,
          classes: updatedClasses,
        }));
      }
    }
  }, [isEditable, editedData.classes.length, recurrenceEndDate]); // Regenerate when end date changes

  const handleTitleChange = (newTitle: string) => {
    setEditedData(prev => ({ ...prev, title: newTitle }));
  };

  const handleClassChange = (index: number, field: keyof ClassSchedule, value: string) => {
    setEditedData(prev => ({
      ...prev,
      classes: prev.classes.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleAddClass = () => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setHours(8, 0, 0, 0);
    const defaultEnd = new Date(now);
    defaultEnd.setHours(9, 30, 0, 0);
    
    const newClass: ClassSchedule = {
      day: 'Monday',
      course_name: '',
      start: { dateTime: defaultStart.toISOString().slice(0, 19) },
      end: { dateTime: defaultEnd.toISOString().slice(0, 19) },
    };
    
    // Generate recurrence for the new class immediately
    const classWithRecurrence = generateRecurrenceForClass(newClass, recurrenceEndDate) || newClass;
    
    setEditedData(prev => ({
      ...prev,
      classes: [...prev.classes, classWithRecurrence],
    }));
    setEditingIndex(editedData.classes.length);
    setValidationErrors([]); // Clear errors when adding new class
  };

  const handleRemoveClass = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
    if (editingIndex === index) setEditingIndex(null);
    setValidationErrors([]); // Clear errors when removing class
  };

  const handleApprove = () => {
    // Validate that all classes have course names
    const classesWithoutNames = editedData.classes
      .map((c, i) => ({ index: i + 1, name: c.course_name }))
      .filter(c => !c.name || c.name.trim() === '');
    
    if (classesWithoutNames.length > 0) {
      setValidationErrors([
        `Please add course names to all classes. Missing: ${classesWithoutNames.map(c => `Class #${c.index}`).join(', ')}`
      ]);
      return;
    }
    
    setValidationErrors([]);
    onApprove(editedData);
  };

  // Group classes by day for a cleaner display
  const groupedClasses = editedData.classes.reduce((acc, cls, index) => {
    if (!acc[cls.day]) acc[cls.day] = [];
    acc[cls.day].push({ ...cls, originalIndex: index });
    return acc;
  }, {} as Record<string, (ClassSchedule & { originalIndex: number })[]>);

  // Sort days in order
  const sortedDays = Object.keys(groupedClasses).sort(
    (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
  );

  return (
    <div className={cn(
      "w-full max-w-lg rounded-2xl border overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 theme-shadow-lg",
      status === 'pending' && "border-primary/30 bg-card",
      status === 'approved' && "border-green-500/50 bg-green-50/50",
      status === 'rejected' && "border-red-500/50 bg-red-50/50",
      status === 'processing' && "border-yellow-500/50 bg-yellow-50/50"
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center gap-3 border-b",
        status === 'pending' && "bg-primary/5 border-primary/20",
        status === 'approved' && "bg-green-500/10 border-green-500/20",
        status === 'rejected' && "bg-red-500/10 border-red-500/20",
        status === 'processing' && "bg-yellow-500/10 border-yellow-500/20"
      )}>
        <div className={cn(
          "p-2 rounded-lg",
          status === 'pending' && "bg-primary/10 text-primary",
          status === 'approved' && "bg-green-500/10 text-green-600",
          status === 'rejected' && "bg-red-500/10 text-red-600",
          status === 'processing' && "bg-yellow-500/10 text-yellow-600"
        )}>
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditable ? (
            <input
              type="text"
              value={editedData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent font-semibold text-foreground outline-none border-b border-transparent focus:border-primary/50 transition-colors"
              placeholder="Schedule Title"
            />
          ) : (
            <h3 className="font-semibold text-foreground truncate">{editedData.title}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {status === 'pending' && 'Review and edit the extracted schedule'}
            {status === 'processing' && 'Processing your request...'}
            {status === 'approved' && 'Schedule confirmed and saved'}
            {status === 'rejected' && 'Schedule was discarded'}
          </p>
        </div>
        {status === 'processing' && (
          <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
        )}
        {status === 'approved' && (
          <div className="p-1.5 rounded-full bg-green-500/20">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        )}
        {status === 'rejected' && (
          <div className="p-1.5 rounded-full bg-red-500/20">
            <X className="h-4 w-4 text-red-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
        {editedData.classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No classes added yet</p>
          </div>
        ) : (
          sortedDays.map(day => (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="h-px flex-1 bg-border" />
                <span>{day}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {groupedClasses[day].map(({ originalIndex, ...cls }) => (
                <div
                  key={originalIndex}
                  className={cn(
                    "group relative p-3 rounded-xl border transition-all",
                    editingIndex === originalIndex
                      ? "bg-primary/5 border-primary/30 theme-shadow"
                      : "bg-muted/30 border-border hover:border-primary/20"
                  )}
                >
                  {editingIndex === originalIndex && isEditable ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Day</label>
                        <select
                          value={cls.day}
                          onChange={(e) => handleClassChange(originalIndex, 'day', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50"
                        >
                          {DAYS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Start Time</label>
                          <input
                            type="time"
                            value={cls.start.dateTime.slice(11, 16)}
                            onChange={(e) => {
                              const newDateTime = cls.start.dateTime.slice(0, 11) + e.target.value + ':00';
                              const newStart = { dateTime: newDateTime };
                              handleClassChange(originalIndex, 'start', newStart as any);
                            }}
                            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">End Time</label>
                          <input
                            type="time"
                            value={cls.end.dateTime.slice(11, 16)}
                            onChange={(e) => {
                              const newDateTime = cls.end.dateTime.slice(0, 11) + e.target.value + ':00';
                              const newEnd = { dateTime: newDateTime };
                              handleClassChange(originalIndex, 'end', newEnd as any);
                            }}
                            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Course Name</label>
                        <input
                          type="text"
                          value={cls.course_name}
                          onChange={(e) => handleClassChange(originalIndex, 'course_name', e.target.value)}
                          placeholder="e.g., CSE-321"
                          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleRemoveClass(originalIndex)}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            {formatTimeRange(cls.start.dateTime, cls.end.dateTime)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          {!cls.course_name && isEditable && (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm font-medium truncate block",
                            cls.course_name ? "text-foreground" : "text-amber-600 italic"
                          )}>
                            {cls.course_name || 'Add course name'}
                          </span>
                        </div>
                        {isEditable && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingIndex(originalIndex)}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveClass(originalIndex)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* Add Class Button */}
        {isEditable && (
          <button
            onClick={handleAddClass}
            className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        )}

        {/* Schedule Duration Section - User-friendly recurrence config */}
        {editedData.classes.length > 0 && (
          <div className="pt-4 border-t border-border/50 mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Schedule Duration</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your classes will repeat weekly on their scheduled days until the end date.
            </p>
            
            {/* End Date Selection */}
            {isEditable && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Classes repeat until:
                </label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
            
            {/* Schedule Summary - Clear and friendly */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-medium">
                    Repeats weekly until {new Date(recurrenceEndDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editedData.classes.length} class{editedData.classes.length !== 1 ? 'es' : ''} will be added to your calendar
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {validationErrors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 px-4 rounded-xl border border-muted-foreground/30 text-muted-foreground font-medium text-sm hover:bg-muted hover:border-muted-foreground/50 transition-all flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={editedData.classes.length === 0}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
              editedData.classes.length > 0
                ? "bg-primary hover:bg-primary/90 text-primary-foreground theme-shadow"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </button>
        </div>
      )}
    </div>
  );
}
