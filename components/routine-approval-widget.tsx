'use client';

import { useState } from 'react';
import { Check, X, Plus, Trash2, Edit3, Loader2, Calendar, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassSchedule {
  day: string;
  time: string;
  course_name: string;
}

interface RoutineData {
  title: string;
  classes: ClassSchedule[];
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

  const isEditable = !isLocked && status === 'pending';

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
    setEditedData(prev => ({
      ...prev,
      classes: [...prev.classes, { day: 'Monday', time: '', course_name: '' }],
    }));
    setEditingIndex(editedData.classes.length);
  };

  const handleRemoveClass = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== index),
    }));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleApprove = () => {
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
      "w-full max-w-lg rounded-2xl border-2 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4",
      status === 'pending' && "border-primary/30 bg-card shadow-xl",
      status === 'approved' && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      status === 'rejected' && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
      status === 'processing' && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
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
          status === 'approved' && "bg-green-500/10 text-green-600 dark:text-green-400",
          status === 'rejected' && "bg-red-500/10 text-red-600 dark:text-red-400",
          status === 'processing' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
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
          <Loader2 className="h-5 w-5 animate-spin text-yellow-600 dark:text-yellow-400" />
        )}
        {status === 'approved' && (
          <div className="p-1.5 rounded-full bg-green-500/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        )}
        {status === 'rejected' && (
          <div className="p-1.5 rounded-full bg-red-500/20">
            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                      ? "bg-primary/5 border-primary/30 shadow-sm"
                      : "bg-muted/30 border-border hover:border-primary/20"
                  )}
                >
                  {editingIndex === originalIndex && isEditable ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
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
                        <div>
                          <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Time</label>
                          <input
                            type="text"
                            value={cls.time}
                            onChange={(e) => handleClassChange(originalIndex, 'time', e.target.value)}
                            placeholder="e.g., 08:30 AM - 10:00 AM"
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
                          className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
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
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{cls.time || 'No time set'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {cls.course_name || 'Untitled Course'}
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
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        {isEditable && (
          <button
            onClick={handleAddClass}
            className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        )}
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 px-4 rounded-xl border-2 border-red-500/30 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Discard
          </button>
          <button
            onClick={handleApprove}
            disabled={editedData.classes.length === 0}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
              editedData.classes.length > 0
                ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Check className="h-4 w-4" />
            Confirm Routine
          </button>
        </div>
      )}
    </div>
  );
}
