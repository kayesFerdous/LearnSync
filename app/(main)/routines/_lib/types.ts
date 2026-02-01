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
