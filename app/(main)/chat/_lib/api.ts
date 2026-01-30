import type { 
  BackendStreamEvent, 
  PresignResponse, 
  Conversation, 
  Message, 
  RoutineData, 
  Folder, 
  ConfirmUploadResponse, 
  ConversationListResponse,
  BatchPresignFileRequest,
  BatchPresignResponse,
  BatchConfirmRequest,
  BatchConfirmResponse,
  FileUploadProgress
} from './types';

export const BACKEND_URL = 'http://localhost:8000/chat_bot';
const API_BASE_URL = 'http://localhost:8000';

// Maximum file size for uploads (10MB per file)
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10,485,760 bytes

// Maximum total batch size (20MB)
export const MAX_BATCH_SIZE = 20 * 1024 * 1024; // 20,971,520 bytes

/**
 * Parse a Server-Sent Events block into a BackendStreamEvent
 */
export const parseSseBlock = (block: string): BackendStreamEvent | null => {
  const dataLines = block
    .split('\n')
    .filter(l => l.startsWith('data:'))
    .map(l => l.slice(5).trimStart());
  const jsonText = dataLines.join('\n').trim();
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText) as BackendStreamEvent;
  } catch {
    return null;
  }
};

/**
 * Convert a File to base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate an image file for type and size
 */
export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `Image size must be less than ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }
  return null;
};

/**
 * Validate a PDF file for type and size
 */
export const validatePdfFile = (file: File): string | null => {
  if (file.type !== 'application/pdf') {
    return 'Please select a valid PDF file';
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `PDF size must be less than ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
  }
  return null;
};

/**
 * Validate any file for size
 */
export const validateFileSize = (file: File): string | null => {
  if (file.size > MAX_UPLOAD_SIZE) {
    return `File "${file.name}" exceeds the maximum allowed size of ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }
  return null;
};

/**
 * Validate multiple files for size (per-file and total batch limits)
 * Returns an array of error messages (empty if all files are valid)
 */
export const validateBatchFileSize = (files: File[], existingFiles: File[] = []): string[] => {
  const errors: string[] = [];
  
  // Check per-file size limit
  for (const file of files) {
    if (file.size > MAX_UPLOAD_SIZE) {
      errors.push(`File "${file.name}" exceeds the 10MB limit.`);
    }
  }
  
  // Check total batch size limit (including existing files)
  const allFiles = [...existingFiles, ...files];
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_BATCH_SIZE) {
    errors.push('Total upload exceeds the 20MB limit. Please remove some files.');
  }
  
  return errors;
};

/**
 * Calculate total size of files in bytes
 */
export const calculateTotalSize = (files: File[]): number => {
  return files.reduce((sum, file) => sum + file.size, 0);
};

export const presignUpload = async (filename: string, contentType: string): Promise<PresignResponse> => {
  const response = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ filename, content_type: contentType }),
  });
  if (!response.ok) throw new Error('Failed to get presigned URL');
  return response.json();
};

export const uploadToR2 = async (url: string, file: File): Promise<void> => {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: file,
  });
  if (!response.ok) throw new Error('Failed to upload file to R2');
};

export const confirmUpload = async (objectKey: string, originalFilename: string): Promise<ConfirmUploadResponse> => {
  const response = await fetch(`${API_BASE_URL}/uploads/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ object_key: objectKey, original_filename: originalFilename }),
  });
  if (!response.ok) throw new Error('Failed to confirm upload');
  return response.json();
};

/**
 * Request presigned URLs for multiple files in a single batch request
 * POST /uploads/presign
 */
export const batchPresignUpload = async (files: BatchPresignFileRequest[]): Promise<BatchPresignResponse> => {
  const response = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ files }),
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({ detail: 'File size exceeds maximum allowed size' }));
      throw new Error(errorData.detail || 'One or more files exceed the maximum allowed size (10MB)');
    }
    throw new Error('Failed to get presigned URLs');
  }
  
  return response.json();
};

/**
 * Confirm multiple file uploads in a single batch request
 * POST /uploads/confirm
 */
export const batchConfirmUpload = async (request: BatchConfirmRequest): Promise<BatchConfirmResponse> => {
  const response = await fetch(`${API_BASE_URL}/uploads/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Failed to confirm batch upload');
  }
  
  return response.json();
};

/**
 * Upload a single file to R2 using the presigned URL
 * Returns true on success, throws on failure
 */
export const uploadFileToR2 = async (
  url: string, 
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Failed to upload file: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during file upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('File upload was aborted'));
    });
    
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

/**
 * Batch upload workflow: presign, upload to R2, and confirm
 * Handles multiple files in a single batch operation
 */
export const batchUploadFiles = async (
  files: File[],
  conversationId: string | null = null,
  onProgress?: (progress: FileUploadProgress[]) => void
): Promise<BatchConfirmResponse> => {
  // Validate per-file size limits
  for (const file of files) {
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error(`File "${file.name}" exceeds the 10MB limit.`);
    }
  }
  
  // Validate total batch size
  const totalSize = calculateTotalSize(files);
  if (totalSize > MAX_BATCH_SIZE) {
    throw new Error('Total upload exceeds the 20MB limit. Please remove some files.');
  }

  // Initialize progress tracking
  const progressMap: Map<string, FileUploadProgress> = new Map();
  files.forEach(file => {
    progressMap.set(file.name, {
      filename: file.name,
      status: 'pending',
      progress: 0
    });
  });

  const updateProgress = () => {
    if (onProgress) {
      onProgress(Array.from(progressMap.values()));
    }
  };

  // Step 1: Request presigned URLs for all files
  // Note: file_size must be an integer (bytes)
  const presignRequest: BatchPresignFileRequest[] = files.map(file => ({
    filename: file.name,
    content_type: file.type,
    file_size: Math.round(file.size) // Ensure integer
  }));

  const presignResponse = await batchPresignUpload(presignRequest);

  // Create a map of filename to presign response for easy lookup
  const presignMap = new Map(
    presignResponse.files.map(f => [f.filename, f])
  );

  // Step 2: Upload each file to R2
  const uploadPromises = files.map(async (file) => {
    const presignData = presignMap.get(file.name);
    if (!presignData) {
      throw new Error(`No presigned URL found for file: ${file.name}`);
    }

    progressMap.set(file.name, {
      filename: file.name,
      status: 'uploading',
      progress: 0
    });
    updateProgress();

    try {
      await uploadFileToR2(presignData.upload_url, file, (progress) => {
        progressMap.set(file.name, {
          filename: file.name,
          status: 'uploading',
          progress
        });
        updateProgress();
      });

      progressMap.set(file.name, {
        filename: file.name,
        status: 'uploaded',
        progress: 100
      });
      updateProgress();

      return {
        original_filename: file.name,
        object_key: presignData.object_key
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      progressMap.set(file.name, {
        filename: file.name,
        status: 'failed',
        progress: 0,
        error: errorMessage
      });
      updateProgress();
      throw error;
    }
  });

  // Wait for all uploads to complete
  const uploadedFiles = await Promise.all(uploadPromises);

  // Step 3: Confirm all uploads in a single batch request
  const confirmRequest: BatchConfirmRequest = {
    conversation_id: conversationId,
    files: uploadedFiles
  };

  return batchConfirmUpload(confirmRequest);
};

/**
 * Process SSE stream and call appropriate handlers
 */
export interface StreamHandlers {
  onStatus: (message: string) => void;
  onChunk: (content: string) => void;
  onConversationId?: (conversationId: string) => void;
  onInterrupt: (payload: BackendStreamEvent & { type: 'interrupt' }) => void;
  onRoutineApproved?: (payload: { routine_data: RoutineData }) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export const processStream = async (
  response: Response,
  handlers: StreamHandlers
): Promise<void> => {
  if (!response.body) {
    throw new Error('Backend did not provide a streaming response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (!event) continue;

      switch (event.type) {
        case 'conversation_id':
          // Handle conversation creation metadata
          handlers.onConversationId?.(event.payload);
          break;
        case 'status':
          handlers.onStatus(event.message ?? 'Thinking...');
          break;
        case 'chunk':
          handlers.onChunk(event.content ?? '');
          break;
        case 'routine_approved':
          const normalizedPayload = {
            routine_data: normalizeRoutineData(event.payload?.routine_data)
          };
          handlers.onRoutineApproved?.(normalizedPayload as any);
          finished = true;
          break;
        case 'interrupt':
          handlers.onInterrupt(event);
          finished = true;
          break;
        case 'error':
          handlers.onError(event.message ?? 'Error');
          finished = true;
          break;
        case 'done':
          handlers.onDone();
          finished = true;
          break;
      }

      if (finished) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }
  }
};

/**
 * Fetch all conversations and folders for the sidebar
 * GET /conversation/
 * Returns folders with nested conversations and root-level conversations
 */
export const fetchConversations = async (): Promise<ConversationListResponse> => {
  const response = await fetch(`${API_BASE_URL}/conversation/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store', // Prevent caching
  });
  if (!response.ok) throw new Error(`Failed to fetch conversations (${response.status})`);
  return response.json();
};

/**
 * Normalize routine data from backend format to frontend format
 * Handles multiple input formats for flexibility:
 * - start/end as strings (ISO format)
 * - start/end as objects with dateTime property
 * - course vs course_name field names
 */
export const normalizeRoutineData = (routineData: any): RoutineData | undefined => {
  if (!routineData) return undefined;
  
  try {
    return {
      title: routineData.title || '',
      classes: (routineData.classes || []).map((cls: any) => ({
        day: cls.day || '',
        course_name: cls.course_name || cls.course || '',
        start: {
          dateTime: typeof cls.start === 'string' 
            ? cls.start 
            : (cls.start?.dateTime || ''),
        },
        end: {
          dateTime: typeof cls.end === 'string' 
            ? cls.end 
            : (cls.end?.dateTime || ''),
        },
        recurrence: cls.recurrence,
      })),
      recurrence: routineData.recurrence,
    };
  } catch (error) {
    console.error('Error normalizing routine data:', error, routineData);
    return undefined;
  }
};

/**
 * Fetch message history for a specific conversation
 * GET /conversation/{conversationId}/messages
 */
export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}/messages`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  
  if (!response.ok) throw new Error(`Failed to fetch messages (${response.status})`);
  
  const rawMessages: Array<{ 
    type: 'human' | 'ai'; 
    content: string; 
    created_at?: string;
    additional_kwargs?: {
      routine_approved?: boolean;
      routine_data?: any;
    };
  }> = await response.json();
  
  // Map backend format to frontend Message interface with unique IDs
  return rawMessages.map((msg, index) => ({
    id: `${conversationId}-${index}-${Date.now()}`, // Ensure unique ID
    role: msg.type === 'human' ? 'user' : 'ai',
    content: msg.content,
    created_at: msg.created_at || new Date().toISOString(), // Use provided timestamp or fallback to now
    thinking: undefined,
    isStreaming: false,
    additional_kwargs: msg.additional_kwargs ? {
      routine_approved: msg.additional_kwargs.routine_approved,
      routine_data: normalizeRoutineData(msg.additional_kwargs.routine_data),
    } : undefined,
  }));
};

/**
 * Delete a conversation permanently
 * DELETE /conversation/{conversationId}
 * Returns 204 No Content on success
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  
  // 204 No Content is success
  if (response.status === 204) {
    return;
  }
  
  // Handle error responses
  if (response.status === 404) {
    throw new Error('Conversation not found');
  }
  
  if (response.status === 400) {
    throw new Error('Invalid conversation ID format');
  }
  
  if (!response.ok) {
    throw new Error(`Failed to delete conversation (${response.status})`);
  }
};

/**
 * Create a new folder
 * POST /conversation/folder
 */
export const createFolder = async (name: string, icon?: string, theme?: string): Promise<Folder> => {
  const response = await fetch(`${API_BASE_URL}/conversation/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, icon, color: theme }) // Map theme to color for backend
  });
  if (!response.ok) throw new Error(`Failed to create folder (${response.status})`);
  return response.json();
};

/**
 * Update conversation title
 * PATCH /conversation/{conversationId}
 */
export const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title })
  });
  if (!response.ok) throw new Error(`Failed to update conversation (${response.status})`);
  // Backend returns { status: "success" }, we don't need the body
};

/**
 * Update folder (rename, change icon/color)
 * PATCH /conversation/folder/{folderId}
 */
export const updateFolder = async (folderId: string, data: { name?: string, color?: string, icon?: string }): Promise<void> => {
  // Ensure we map 'theme' to 'color' if passed, though strict typing suggests 'color' is what we use in internal API calls
  const response = await fetch(`${API_BASE_URL}/conversation/folder/${folderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(`Failed to update folder (${response.status})`);
  // Backend returns { status: "success" }
};

/**
 * Delete a folder
 * DELETE /conversation/folder/{folderId}
 */
export const deleteFolder = async (folderId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/conversation/folder/${folderId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  
  if (response.status === 204) return;
  if (!response.ok) throw new Error(`Failed to delete folder (${response.status})`);
};
