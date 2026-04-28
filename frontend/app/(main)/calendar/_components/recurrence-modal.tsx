import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { Frequency, RRuleFormState } from '../_lib/rrule-utils';

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (recurrenceState: RRuleFormState) => void;
  initialState?: RRuleFormState;
}

const defaultRecurrenceState: RRuleFormState = {
  frequency: 'WEEKLY',
  interval: 1,
  daysOfWeek: [],
  endType: 'never',
};

const DAYS_OF_WEEK = [
  { code: 'SU', label: 'Sunday' },
  { code: 'MO', label: 'Monday' },
  { code: 'TU', label: 'Tuesday' },
  { code: 'WE', label: 'Wednesday' },
  { code: 'TH', label: 'Thursday' },
  { code: 'FR', label: 'Friday' },
  { code: 'SA', label: 'Saturday' },
];

export function RecurrenceModal({
  isOpen,
  onClose,
  onApply,
  initialState,
}: RecurrenceModalProps) {
  const [state, setState] = React.useState<RRuleFormState>(
    initialState || defaultRecurrenceState
  );

  React.useEffect(() => {
    if (initialState) {
      setState(initialState);
    }
  }, [initialState]);

  const toggleDayOfWeek = (dayCode: string) => {
    setState((prev: RRuleFormState) => {
      const daysOfWeek = prev.daysOfWeek || [];
      if (daysOfWeek.includes(dayCode)) {
        return {
          ...prev,
          daysOfWeek: daysOfWeek.filter((d: string) => d !== dayCode),
        };
      } else {
        return {
          ...prev,
          daysOfWeek: [...daysOfWeek, dayCode],
        };
      }
    });
  };

  const handleApply = () => {
    // Validate that if weekly, at least one day is selected
    if (state.frequency === 'WEEKLY' && (!state.daysOfWeek || state.daysOfWeek.length === 0)) {
      alert('Please select at least one day for weekly recurrence');
      return;
    }

    // Validate that if count is selected, count is > 0
    if (state.endType === 'count' && (!state.count || state.count <= 0)) {
      alert('Please enter a valid count');
      return;
    }

    // Validate that if until is selected, date is set
    if (state.endType === 'until' && !state.untilDate) {
      alert('Please select an end date');
      return;
    }

    onApply(state);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">Recurring Event</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Repeat</label>
            <div className="grid grid-cols-2 gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as Frequency[]).map(
                (freq) => (
                  <button
                    key={freq}
                    onClick={() => setState({ ...state, frequency: freq })}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      state.frequency === freq
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input hover:bg-accent'
                    }`}
                  >
                    {freq.charAt(0) + freq.slice(1).toLowerCase()}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Interval Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Every</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="99"
                value={state.interval}
                onChange={(e) =>
                  setState({ ...state, interval: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-20 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">
                {state.frequency.charAt(0) + state.frequency.slice(1).toLowerCase()}(s)
              </span>
            </div>
          </div>

          {/* Days of Week (for Weekly) */}
          {state.frequency === 'WEEKLY' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Days</label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => toggleDayOfWeek(code)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      state.daysOfWeek?.includes(code)
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input hover:bg-accent'
                    }`}
                  >
                    {label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Ends</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={state.endType === 'never'}
                  onChange={() => setState({ ...state, endType: 'never' })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Never</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={state.endType === 'until'}
                  onChange={() => setState({ ...state, endType: 'until' })}
                  className="w-4 h-4"
                />
                <span className="text-sm">On a date</span>
              </label>

              {state.endType === 'until' && (
                <input
                  type="datetime-local"
                  value={
                    state.untilDate
                      ? new Date(state.untilDate.getTime() - state.untilDate.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      setState({
                        ...state,
                        untilDate: new Date(e.target.value),
                      });
                    }
                  }}
                  className="ml-6 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={state.endType === 'count'}
                  onChange={() => setState({ ...state, endType: 'count' })}
                  className="w-4 h-4"
                />
                <span className="text-sm">After</span>
              </label>

              {state.endType === 'count' && (
                <div className="ml-6 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={state.count || ''}
                    onChange={(e) =>
                      setState({
                        ...state,
                        count: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-20 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">occurrences</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Preview:</p>
            <p className="text-sm font-medium mt-1">
              {generateRecurrenceSummary(state)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function generateRecurrenceSummary(state: RRuleFormState): string {
  let summary = `Every ${state.interval} ${state.frequency.toLowerCase()}(s)`;

  if (state.frequency === 'WEEKLY' && state.daysOfWeek && state.daysOfWeek.length > 0) {
    const dayMap: Record<string, string> = {
      SU: 'Sun',
      MO: 'Mon',
      TU: 'Tue',
      WE: 'Wed',
      TH: 'Thu',
      FR: 'Fri',
      SA: 'Sat',
    };
    const days = state.daysOfWeek.map((d: string) => dayMap[d]).join(', ');
    summary += ` on ${days}`;
  }

  if (state.endType === 'until' && state.untilDate) {
    summary += ` until ${state.untilDate.toLocaleDateString()}`;
  } else if (state.endType === 'count' && state.count) {
    summary += ` for ${state.count} occurrences`;
  }

  return summary;
}
