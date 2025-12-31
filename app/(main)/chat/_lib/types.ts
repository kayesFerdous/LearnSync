// Chat Types

export interface ClassSchedule {
  day: string;
  time: string;
  course_name: string;
}

export interface RoutineData {
  title: string;
  classes: ClassSchedule[];
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
  thinking?: {
    status?: string;
  };
  isStreaming?: boolean;
  interrupt?: {
    payload: InterruptPayload;
    status: InterruptStatus;
  };
}

export type BackendStreamEvent =
  | { type: 'status'; message?: string }
  | { type: 'chunk'; content?: string }
  | { type: 'done' }
  | { type: 'error'; message?: string }
  | { type: 'interrupt'; payload: InterruptPayload };

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
