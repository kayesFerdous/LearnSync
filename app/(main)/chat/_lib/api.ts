import type { BackendStreamEvent, PresignResponse } from './types';

export const BACKEND_URL = 'http://localhost:8000/chat_bot';
const API_BASE_URL = 'http://localhost:8000';

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
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return 'Image size must be less than 10MB';
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
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return `PDF size must be less than 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
  }
  return null;
};

export const presignUpload = async (filename: string, contentType: string): Promise<PresignResponse> => {
  const response = await fetch(`${API_BASE_URL}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export const confirmUpload = async (objectKey: string, originalFilename: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/uploads/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ object_key: objectKey, original_filename: originalFilename }),
  });
  if (!response.ok) throw new Error('Failed to confirm upload');
};

/**
 * Process SSE stream and call appropriate handlers
 */
export interface StreamHandlers {
  onStatus: (message: string) => void;
  onChunk: (content: string) => void;
  onInterrupt: (payload: BackendStreamEvent & { type: 'interrupt' }) => void;
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
        case 'status':
          handlers.onStatus(event.message ?? 'Thinking...');
          break;
        case 'chunk':
          handlers.onChunk(event.content ?? '');
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
