/**
 * RFC 5545 RRULE generation utilities
 * Used to convert form state into valid RRULE strings for Google Calendar
 */

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type EndType = 'until' | 'count' | 'never';

export interface RRuleFormState {
  frequency: Frequency;
  interval: number; // e.g., 1 for every week, 2 for every 2 weeks
  daysOfWeek?: string[]; // e.g., ['MO', 'WE', 'FR'] for weekly
  endType: EndType;
  untilDate?: Date; // For UNTIL constraint
  count?: number; // For COUNT constraint
}

/**
 * Convert a Date to UTC ISO string in the format required by RRULE
 * E.g., 20240530T140000Z
 *
 * CRITICAL: UNTIL in RRULE must be in UTC format
 * @param date - The date to convert
 * @returns UTC formatted string (e.g., "20240530T140000Z")
 */
export function dateToUTCRRuleFormat(date: Date): string {
  const utcDate = new Date(date.getTime());
  
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const hours = String(utcDate.getUTCHours()).padStart(2, '0');
  const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(utcDate.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate an RFC 5545 RRULE string from form state
 *
 * @param formState - The recurrence form configuration
 * @returns Array with single RRULE string (e.g., ["RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20240530T140000Z"])
 *
 * @example
 * const state: RRuleFormState = {
 *   frequency: 'WEEKLY',
 *   interval: 1,
 *   daysOfWeek: ['MO', 'WE'],
 *   endType: 'until',
 *   untilDate: new Date('2024-05-30T23:59:59'),
 * };
 * const result = generateRRules(state);
 * // Result: ["RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;UNTIL=20240530T235959Z"]
 */
export function generateRRules(formState: RRuleFormState): string[] {
  let rrule = `RRULE:FREQ=${formState.frequency}`;

  // Add interval (skip if 1)
  if (formState.interval > 1) {
    rrule += `;INTERVAL=${formState.interval}`;
  }

  // Add BYDAY for weekly recurrence
  if (
    formState.frequency === 'WEEKLY' &&
    formState.daysOfWeek &&
    formState.daysOfWeek.length > 0
  ) {
    rrule += `;BYDAY=${formState.daysOfWeek.join(',')}`;
  }

  // Add end constraint (UNTIL or COUNT)
  if (formState.endType === 'until' && formState.untilDate) {
    const utcUntil = dateToUTCRRuleFormat(formState.untilDate);
    rrule += `;UNTIL=${utcUntil}`;
  } else if (formState.endType === 'count' && formState.count) {
    rrule += `;COUNT=${formState.count}`;
  }
  // If endType === 'never', no end constraint is added

  return [rrule];
}

/**
 * Validate that a recurrence string starts with RRULE: or RDATE:
 *
 * @param recurrenceStr - The recurrence string to validate
 * @returns true if valid, false otherwise
 */
export function isValidRecurrenceString(recurrenceStr: string): boolean {
  return recurrenceStr.startsWith('RRULE:') || recurrenceStr.startsWith('RDATE:');
}

/**
 * Validate all recurrence strings in an array
 *
 * @param recurrenceArray - Array of recurrence strings
 * @returns true if all are valid, false if any are invalid
 */
export function isValidRecurrenceArray(recurrenceArray: string[]): boolean {
  return recurrenceArray.every(isValidRecurrenceString);
}

/**
 * Parse a human-readable description from an RRULE
 * Used for display purposes in the event detail modal
 *
 * @param rrule - The RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20240530T140000Z")
 * @returns Human-readable string (e.g., "Weekly on Monday, Wednesday until May 30, 2024")
 */
export function parseRRuleToHumanReadable(rrule: string): string {
  if (!rrule.startsWith('RRULE:')) {
    return rrule; // Return as-is if not an RRULE
  }

  const parts = rrule.substring(6).split(';');
  const params: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      params[key] = value;
    }
  });

  let description = '';

  // Frequency
  const freq = params['FREQ']?.toLowerCase() || 'daily';
  description = `Every ${params['INTERVAL'] ? `${params['INTERVAL']} ` : ''}${freq}`;

  // Days of week
  if (params['BYDAY']) {
    const dayMap: Record<string, string> = {
      MO: 'Monday',
      TU: 'Tuesday',
      WE: 'Wednesday',
      TH: 'Thursday',
      FR: 'Friday',
      SA: 'Saturday',
      SU: 'Sunday',
    };
    const days = params['BYDAY']
      .split(',')
      .map((d) => dayMap[d] || d)
      .join(', ');
    description += ` on ${days}`;
  }

  // End constraint
  if (params['UNTIL']) {
    const until = parseRRuleDate(params['UNTIL']);
    description += ` until ${until}`;
  } else if (params['COUNT']) {
    description += ` for ${params['COUNT']} occurrences`;
  }

  return description;
}

/**
 * Parse a date string from RRULE format (e.g., "20240530T140000Z") to readable format
 *
 * @param dateStr - Date string in RRULE format
 * @returns Formatted date string (e.g., "May 30, 2024")
 */
export function parseRRuleDate(dateStr: string): string {
  // Parse RRULE date format: YYYYMMDDTHHmmssZ
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthIndex = parseInt(month, 10) - 1;
  const monthName = monthNames[monthIndex];

  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}
