'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeToToasts, dismissToast } from '../_lib/toast';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded-lg border theme-shadow pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200",
            toast.type === 'success' && "bg-green-50 border-green-200 text-green-900",
            toast.type === 'error' && "bg-red-50 border-red-200 text-red-900",
            toast.type === 'info' && "bg-blue-50 border-blue-200 text-blue-900"
          )}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium flex-1 max-w-xs">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 rounded hover:bg-white/20 transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
