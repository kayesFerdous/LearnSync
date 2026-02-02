// Routine types

export interface RoutineClass {
  id: string;
  routine_id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  course_name: string;
  recurrence?: string[];
}

export interface Routine {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  classes: RoutineClass[];
}

// Request types
export interface CreateRoutineRequest {
  title: string;
  classes: CreateClassRequest[];
}

export interface CreateClassRequest {
  day: RoutineClass['day'];
  start_time: string;
  end_time: string;
  course_name: string;
}

export interface UpdateClassRequest {
  day?: RoutineClass['day'];
  start_time?: string;
  end_time?: string;
  course_name?: string;
}

// Types for image extraction API (matches backend WeeklyRoutine schema)
export interface ExtractedClassSchedule {
  day: string;
  course_name: string;
  start: {
    dateTime: string; // ISO 8601 format
  };
  end: {
    dateTime: string; // ISO 8601 format
  };
  recurrence?: string[]; // RRULE array
}

export interface ExtractedRoutine {
  title: string;
  classes: ExtractedClassSchedule[];
}

// Types for confirm API (ApprovedWeeklyRoutine schema)
export interface ApprovedClassSchedule {
  day: string;
  course_name: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  recurrence?: string[];
}

export interface ApprovedRoutine {
  title: string;
  classes: ApprovedClassSchedule[];
}

// Days of the week for UI
export const DAYS_OF_WEEK: RoutineClass['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Time slots for the weekly view (6 AM to 10 PM)
export const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return {
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    display: hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
  };
});
