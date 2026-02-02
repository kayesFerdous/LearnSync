'use client';

import { Calendar, Plus, Upload, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onCreateSchedule: () => void;
  onUploadImage: () => void;
}

export function EmptyState({ onCreateSchedule, onUploadImage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-6">
        <Calendar className="h-12 w-12 text-primary" />
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        No Class Schedule Yet
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Create your weekly class schedule to keep track of your courses. 
        Your schedule will automatically sync with Google Calendar.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onCreateSchedule}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors theme-shadow"
        >
          <Plus className="h-5 w-5" />
          Create Manually
        </button>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">or</span>
        </div>

        <button
          onClick={onUploadImage}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
        >
          <Sparkles className="h-5 w-5" />
          Upload Image
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1">
            AI
          </span>
        </button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-2xl w-full">
        <div className="p-5 rounded-xl bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Create Manually
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Add classes one by one
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Set precise times and days
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Full control over details
            </li>
          </ul>
        </div>
        
        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Upload Image (AI)
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              AI extracts your schedule
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              Review and edit before saving
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              Works with photos or screenshots
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
