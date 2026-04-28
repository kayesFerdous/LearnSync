/**
 * Simple toast notification utility
 * Shows temporary notification messages to the user
 */

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
const toasts: Map<string, Toast> = new Map();

export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 3000
): string {
  const id = `toast-${++toastId}`;
  const toast: Toast = { id, message, type, duration };

  toasts.set(id, toast);
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function dismissToast(id: string): void {
  toasts.delete(id);
  notifyListeners();
}

export function subscribeToToasts(listener: (toasts: Toast[]) => void): () => void {
  listeners.add(listener);
  // Send initial state
  listener(Array.from(toasts.values()));
  // Return unsubscribe function
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  const toastArray = Array.from(toasts.values());
  listeners.forEach(listener => listener(toastArray));
}

// Convenience functions
export function showSuccessToast(message: string, duration?: number): string {
  return showToast(message, 'success', duration);
}

export function showErrorToast(message: string, duration?: number): string {
  return showToast(message, 'error', duration);
}

export function showInfoToast(message: string, duration?: number): string {
  return showToast(message, 'info', duration);
}
