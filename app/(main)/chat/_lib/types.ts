// Chat Types

export interface Conversation {
  id: string;          // UUID
  title: string;       // Default: "New Conversation"
  created_at: string;  // ISO Date string
  updated_at: string | null;
}

export interface ClassSchedule {
  day: string;
  course_name: string;
  start: {
    dateTime: string; // ISO 8601 format: "2024-01-15T08:30:00"
  };
  end: {
    dateTime: string; // ISO 8601 format: "2024-01-15T10:00:00"
  };
  recurrence?: string[]; // Per-class recurrence (RRULE array)
}

export interface RoutineData {
  title: string;
  classes: ClassSchedule[];
  recurrence?: string[];
}

export interface InterruptPayload {
  type: 'routine_approval_required';
  extracted_data: RoutineData;
}

export type InterruptStatus = 'pending' | 'approved' | 'rejected' | 'processing';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  created_at?: string; // ISO date string
  thinking?: {
    status?: string;
  };
  isStreaming?: boolean;
  interrupt?: {
    payload: InterruptPayload;
    status: InterruptStatus;
  };
  additional_kwargs?: {
    routine_approved?: boolean;
    routine_data?: RoutineData;
  };
}

export type BackendStreamEvent =
  | { type: 'status'; message?: string }
  | { type: 'chunk'; content?: string }
  | { type: 'done' }
  | { type: 'error'; message?: string }
  | { type: 'interrupt'; payload: InterruptPayload }
  | { type: 'conversation_id'; payload: string }
  | { type: 'routine_approved'; payload: { routine_data: RoutineData } };

export interface ChatTag {
  id: string;
  label: string;
}

export interface PresignRequest {
  filename: string;
  content_type: string;
}

export interface PresignResponse {
  upload_url: string;
  object_key: string;
}

export interface ConfirmUploadRequest {
  object_key: string;
  original_filename: string;
}
