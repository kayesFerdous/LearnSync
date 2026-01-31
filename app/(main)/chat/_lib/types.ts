// Chat Types

export interface Conversation {
  id: string;          // UUID
  title: string;       // Default: "New Conversation"
  created_at: string;  // ISO Date string
  updated_at: string | null;
}

export interface Folder {
  id: string;          // UUID
  name: string;        // Folder name
  created_at: string;  // ISO Date string
  icon?: string;       // E.g. "📚"
  theme?: string;      // E.g. "bg-blue-500" or hex
  conversations: Conversation[]; // Conversations in this folder
}

export interface ConversationListResponse {
  folders: Folder[];       // Folders with nested conversations
  conversations: Conversation[]; // Root-level conversations (no folder)
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

export interface ConfirmUploadResponse {
  message: string;
  object_key: string;
  conversation_id: string;
}

// Batch Upload Types

export interface BatchPresignFileRequest {
  filename: string;
  content_type: string;
  file_size: number; // bytes
}

export interface BatchPresignRequest {
  files: BatchPresignFileRequest[];
}

export interface BatchPresignFileResponse {
  filename: string;
  upload_url: string;
  object_key: string;
}

export interface BatchPresignResponse {
  files: BatchPresignFileResponse[];
}

export interface BatchConfirmFileRequest {
  original_filename: string;
  object_key: string;
}

export interface BatchConfirmRequest {
  conversation_id: string | null;
  files: BatchConfirmFileRequest[];
}

export interface BatchConfirmResponse {
  message: string;
  processed_files: string[]; // list of object_key strings
  conversation_id: string;
}

// Upload progress tracking
export interface FileUploadProgress {
  filename: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  progress?: number; // 0-100
  error?: string;
}

// File Processing Status Types (async polling mechanism)
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface FileStatusResponse {
  id: string;
  status: ProcessingStatus;
  error_message: string | null;
  filename: string;
}

// Uploaded file with processing status
export interface UploadedFile {
  id: string;
  filename: string;
  status: ProcessingStatus;
  error_message?: string;
  object_key?: string;
}

// Process URL Response (new async flow)
export interface ProcessUrlResponse {
  message: string;
  url: string;
  file_id: string;
}
