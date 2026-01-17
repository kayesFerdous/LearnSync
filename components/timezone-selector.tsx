'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// IANA Timezone Format
const TIMEZONES = [
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  
  // Americas
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'America/Toronto', label: 'America/Toronto (Eastern Canada)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Mexico)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brazil)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (Argentina)' },
  
  // Europe
  { value: 'Europe/London', label: 'Europe/London (UK/GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central Europe)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Germany)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (Spain)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (Italy)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (Netherlands)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (Russia)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (Turkey)' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (Thailand)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (Hong Kong)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (South Korea)' },
  
  // Pacific & Oceania
  { value: 'Australia/Sydney', label: 'Australia/Sydney (Eastern Australia)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (Victoria)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (Western Australia)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (New Zealand)' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Africa/Cairo (Egypt)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (South Africa)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (Nigeria)' },
];

export function TimezoneSelector() {
  const { user, updateUserSettings } = useAuthStore();
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.settings?.timezone) {
      setSelectedTimezone(user.settings.timezone);
    } else {
      setSelectedTimezone('UTC');
    }
  }, [user?.settings?.timezone]);

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    setSelectedTimezone(newTimezone);
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateUserSettings({ timezone: newTimezone });
      setSaveMessage({ type: 'success', text: 'Timezone updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error updating timezone:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update timezone' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Timezone</h3>
          <p className="text-sm text-muted-foreground">Set your preferred timezone for scheduling</p>
        </div>
      </div>
      
      <div className="ml-12 space-y-2">
        <select
          value={selectedTimezone}
          onChange={handleTimezoneChange}
          disabled={isSaving}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        
        {saveMessage && (
          <p className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {saveMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
