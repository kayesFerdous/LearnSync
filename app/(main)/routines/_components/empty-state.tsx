'use client';

import { Calendar, Plus, Upload } from 'lucide-react';

interface EmptyStateProps {
  onCreateSchedule: () => void;
}

export function EmptyState({ onCreateSchedule }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-primary/10 mb-6">
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
          Create Schedule
        </button>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">or</span>
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground font-medium cursor-not-allowed opacity-60"
          title="Coming soon"
        >
          <Upload className="h-5 w-5" />
          Upload Image
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">
            Soon
          </span>
        </button>
      </div>

      <div className="mt-12 p-6 rounded-xl bg-muted/50 border border-border max-w-lg">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          What you can do with Class Schedule:
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Add your weekly classes with course names and times
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Automatically sync to Google Calendar as recurring events
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            Edit or remove individual classes anytime
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            View your entire week at a glance
          </li>
        </ul>
      </div>
    </div>
  );
}
