'use client';

import { useState, useEffect } from 'react';
import { Check, X, Plus, Trash2, Edit3, Loader2, Calendar, Clock, BookOpen, CalendarRange, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedRoutine, ExtractedClassSchedule, ApprovedRoutine } from '../_lib/types';

/**
 * Formats ISO datetime strings to readable time range
 */
function formatTimeRange(startDateTime: string, endDateTime: string): string {
  try {
    const formatTime = (isoString: string) => {
      const timeStr = isoString.slice(11, 19);
      const [hoursStr, minutesStr] = timeStr.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = minutesStr;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(startDateTime)} - ${formatTime(endDateTime)}`;
  } catch {
    return 'Invalid time';
  }
}

/**
 * Finds the next occurrence of a specific day of the week
 */
function getNextOccurrenceOfDay(dayName: string, afterDate: Date = new Date()): Date {
  const dayMap: Record<string, number> = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6,
  };
  
  const targetDay = dayMap[dayName];
  const startDate = new Date(afterDate);
  startDate.setDate(startDate.getDate() + 1);
  
  const daysToAdd = (targetDay - startDate.getDay() + 7) % 7;
  
  const result = new Date(startDate);
  result.setDate(result.getDate() + daysToAdd);
  
  return result;
}

/**
 * Generates RRULE for a class
 */
function generateRecurrenceForClass(
  classItem: ExtractedClassSchedule,
  endDate: string
): ExtractedClassSchedule | null {
  try {
    const dayMap: Record<string, string> = {
      'Sunday': 'SU', 'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
      'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA',
    };

    const byDay = dayMap[classItem.day];
    if (!byDay) return null;

    const nextOccurrence = getNextOccurrenceOfDay(classItem.day);

    const startTimeStr = classItem.start.dateTime.slice(11, 19);
    const endTimeStr = classItem.end.dateTime.slice(11, 19);

    const year = nextOccurrence.getFullYear();
    const month = String(nextOccurrence.getMonth() + 1).padStart(2, '0');
    const day = String(nextOccurrence.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const correctedStartISO = `${dateStr}T${startTimeStr}`;
    const correctedEndISO = `${dateStr}T${endTimeStr}`;

    // Format end date for RRULE (YYYYMMDD)
    const untilDate = new Date(endDate);
    const untilStr = `${untilDate.getFullYear()}${String(untilDate.getMonth() + 1).padStart(2, '0')}${String(untilDate.getDate()).padStart(2, '0')}`;

    const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`;

    return {
      ...classItem,
      start: { dateTime: correctedStartISO },
      end: { dateTime: correctedEndISO },
      recurrence: [rrule],
    };
  } catch {
    return null;
  }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface RoutineEditorProps {
  data: ExtractedRoutine;
  onApprove: (editedData: ApprovedRoutine) => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function RoutineEditor({
  data,
  onApprove,
  onReject,
  isProcessing = false,
}: RoutineEditorProps) {
  const [editedData, setEditedData] = useState<ExtractedRoutine>(() => ({
    title: data.title,
    classes: data.classes.map(c => ({ ...c })),
  }));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    new Date(new Date().getTime() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Auto-generate recurrence when end date changes
  useEffect(() => {
    if (!isProcessing && editedData.classes.length > 0) {
      const updatedClasses = editedData.classes.map(classItem => {
        const updated = generateRecurrenceForClass(
          { ...classItem, recurrence: undefined },
          recurrenceEndDate
        );
        return updated || classItem;
      });
      
      const currentRrule = editedData.classes[0]?.recurrence?.[0] || '';
      const newRrule = updatedClasses[0]?.recurrence?.[0] || '';
      if (currentRrule !== newRrule) {
        setEditedData(prev => ({ ...prev, classes: updatedClasses }));
      }
    }
  }, [isProcessing, editedData.classes.length, recurrenceEndDate]);

  const handleTitleChange = (newTitle: string) => {
    setEditedData(prev => ({ ...prev, title: newTitle }));
  };

  const handleClassChange = (index: number, field: string, value: any) => {
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
    
    const newClass: ExtractedClassSchedule = {
      day: 'Monday',
      course_name: '',
      start: { dateTime: defaultStart.toISOString().slice(0, 19) },
      end: { dateTime: defaultEnd.toISOString().slice(0, 19) },
    };
    
    const classWithRecurrence = generateRecurrenceForClass(newClass, recurrenceEndDate) || newClass;
    
    setEditedData(prev => ({
      ...prev,
      classes: [...prev.classes, classWithRecurrence],
    }));
    setEditingIndex(editedData.classes.length);
    setValidationErrors([]);
  };

  const handleRemoveClass = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
    if (editingIndex === index) setEditingIndex(null);
    setValidationErrors([]);
  };

  const handleApprove = () => {
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
    onApprove(editedData as ApprovedRoutine);
  };

  // Group classes by day
  const groupedClasses = editedData.classes.reduce((acc, cls, index) => {
    if (!acc[cls.day]) acc[cls.day] = [];
    acc[cls.day].push({ ...cls, originalIndex: index });
    return acc;
  }, {} as Record<string, (ExtractedClassSchedule & { originalIndex: number })[]>);

  const sortedDays = Object.keys(groupedClasses).sort(
    (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
  );

  return (
    <div className={cn(
      "w-full rounded-2xl border overflow-hidden transition-all duration-300 theme-shadow-lg",
      isProcessing
        ? "border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-900/10"
        : "border-primary/30 bg-card"
    )}>
      {/* Header */}
      <div className={cn(
        "px-5 py-4 flex items-center gap-3 border-b",
        isProcessing
          ? "bg-yellow-500/10 border-yellow-500/20"
          : "bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20"
      )}>
        <div className={cn(
          "p-2.5 rounded-xl",
          isProcessing
            ? "bg-yellow-500/10 text-yellow-600"
            : "bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary"
        )}>
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {!isProcessing ? (
            <input
              type="text"
              value={editedData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-transparent font-semibold text-foreground text-lg outline-none border-b border-transparent focus:border-primary/50 transition-colors"
              placeholder="Schedule Title"
            />
          ) : (
            <h3 className="font-semibold text-foreground text-lg truncate">{editedData.title}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {isProcessing ? 'Saving and syncing to Google Calendar...' : 'Review and edit your extracted schedule'}
          </p>
        </div>
        {isProcessing && (
          <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto">
        {editedData.classes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No classes found</p>
            <p className="text-xs mt-1">Add classes manually below</p>
          </div>
        ) : (
          sortedDays.map(day => (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="px-2">{day}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
              </div>
              {groupedClasses[day].map(({ originalIndex, ...cls }) => (
                <div
                  key={originalIndex}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all duration-200",
                    editingIndex === originalIndex
                      ? "bg-primary/5 border-primary/30 theme-shadow ring-2 ring-primary/20"
                      : "bg-muted/30 border-border hover:border-primary/20 hover:bg-muted/50"
                  )}
                >
                  {editingIndex === originalIndex && !isProcessing ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-medium">Day</label>
                        <select
                          value={cls.day}
                          onChange={(e) => handleClassChange(originalIndex, 'day', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          {DAYS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-medium">Start Time</label>
                          <input
                            type="time"
                            value={cls.start.dateTime.slice(11, 16)}
                            onChange={(e) => {
                              const newDateTime = cls.start.dateTime.slice(0, 11) + e.target.value + ':00';
                              handleClassChange(originalIndex, 'start', { dateTime: newDateTime });
                            }}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-medium">End Time</label>
                          <input
                            type="time"
                            value={cls.end.dateTime.slice(11, 16)}
                            onChange={(e) => {
                              const newDateTime = cls.end.dateTime.slice(0, 11) + e.target.value + ':00';
                              handleClassChange(originalIndex, 'end', { dateTime: newDateTime });
                            }}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block font-medium">Course Name</label>
                        <input
                          type="text"
                          value={cls.course_name}
                          onChange={(e) => handleClassChange(originalIndex, 'course_name', e.target.value)}
                          placeholder="e.g., CSE-321 Algorithms"
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => handleRemoveClass(originalIndex)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium">
                          {formatTimeRange(cls.start.dateTime, cls.end.dateTime)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {!cls.course_name && !isProcessing && (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          cls.course_name ? "text-foreground" : "text-amber-600 italic"
                        )}>
                          {cls.course_name || 'Click to add course name'}
                        </span>
                      </div>
                      {!isProcessing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingIndex(originalIndex)}
                            className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveClass(originalIndex)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

        {/* Add Class Button */}
        {!isProcessing && (
          <button
            onClick={handleAddClass}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        )}

        {/* Schedule Duration Section */}
        {editedData.classes.length > 0 && (
          <div className="pt-5 border-t border-border/50 mt-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Schedule Duration</span>
            </div>
            
            {!isProcessing && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Classes repeat weekly until:
                </label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
            
            <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-primary/20">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-semibold">
                    Repeats weekly until {new Date(recurrenceEndDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {editedData.classes.length} class{editedData.classes.length !== 1 ? 'es' : ''} will be synced to Google Calendar
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {validationErrors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400">{error}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isProcessing && (
        <div className="px-5 py-4 border-t border-border bg-muted/30 flex items-center gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-3 px-4 rounded-xl border border-muted-foreground/30 text-muted-foreground font-medium text-sm hover:bg-muted hover:border-muted-foreground/50 transition-all flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Discard
          </button>
          <button
            onClick={handleApprove}
            disabled={editedData.classes.length === 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
              editedData.classes.length > 0
                ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Calendar className="h-4 w-4" />
            Save & Sync to Calendar
          </button>
        </div>
      )}
    </div>
  );
}
