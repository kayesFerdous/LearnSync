'use client';

import { useMemo } from 'react';
import { Clock, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoutineClass } from '../_lib/types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../_lib/types';

interface WeeklyTimetableProps {
  classes: RoutineClass[];
  onEditClass: (classItem: RoutineClass) => void;
  onDeleteClass: (classItem: RoutineClass) => void;
}

// Generate consistent colors for course names
const COURSE_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-700 dark:text-orange-300' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-700 dark:text-pink-300' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/30', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-300' },
];

function getCourseColor(courseName: string, colorMap: Map<string, number>): typeof COURSE_COLORS[0] {
  if (!colorMap.has(courseName)) {
    colorMap.set(courseName, colorMap.size % COURSE_COLORS.length);
  }
  return COURSE_COLORS[colorMap.get(courseName)!];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getTimePosition(isoString: string): number {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // Each hour is 60px, starting from 6 AM (index 0)
  const startHour = 6;
  return (hours - startHour) * 60 + minutes;
}

function getClassDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60); // Duration in minutes
}

export function WeeklyTimetable({
  classes,
  onEditClass,
  onDeleteClass,
}: WeeklyTimetableProps) {
  // Create color map for consistent course colors
  const colorMap = useMemo(() => new Map<string, number>(), []);
  
  // Group classes by day
  const classesByDay = useMemo(() => {
    const grouped: Record<string, RoutineClass[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day] = [];
    });
    classes.forEach(cls => {
      if (grouped[cls.day]) {
        grouped[cls.day].push(cls);
      }
    });
    return grouped;
  }, [classes]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-border">
          <div className="p-3 text-xs font-medium text-muted-foreground text-center">
            <Clock className="h-4 w-4 mx-auto" />
          </div>
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="p-3 text-sm font-semibold text-foreground text-center border-l border-border"
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {/* Time Labels Column + Day Columns */}
          <div className="grid grid-cols-8">
            {/* Time Labels */}
            <div className="border-r border-border">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-[60px] flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-xs text-muted-foreground">{slot.display}</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className="relative border-l border-border"
              >
                {/* Hour Grid Lines */}
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    className="h-[60px] border-b border-border/50"
                  />
                ))}

                {/* Classes */}
                {classesByDay[day].map(cls => {
                  const top = getTimePosition(cls.start_time);
                  const height = getClassDuration(cls.start_time, cls.end_time);
                  const color = getCourseColor(cls.course_name, colorMap);

                  // Skip classes outside the visible time range
                  if (top < 0 || top > TIME_SLOTS.length * 60) return null;

                  return (
                    <div
                      key={cls.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg border px-2 py-1 overflow-hidden group cursor-pointer transition-all hover:shadow-md",
                        color.bg,
                        color.border
                      )}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 30)}px`,
                        minHeight: '30px',
                      }}
                      onClick={() => onEditClass(cls)}
                    >
                      <div className="flex flex-col h-full">
                        <span className={cn("text-xs font-semibold truncate", color.text)}>
                          {cls.course_name}
                        </span>
                        {height >= 45 && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                          </span>
                        )}
                      </div>

                      {/* Edit/Delete buttons on hover */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClass(cls);
                          }}
                          className="p-1 rounded bg-background/80 hover:bg-background border border-border text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Edit class"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClass(cls);
                          }}
                          className="p-1 rounded bg-background/80 hover:bg-red-50 border border-border text-muted-foreground hover:text-red-600 transition-colors"
                          aria-label="Delete class"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
