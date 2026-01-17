'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  Check, 
  ChevronsUpDown, 
  Search, 
  Loader2,
  Globe
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// --- Timezone Data ---
// Standard IANA timezones with friendly labels
interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

const RAW_TIMEZONES: TimezoneOption[] = [
  // UTC
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', region: 'Universal' },
  
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', region: 'Americas' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Eastern Canada (Toronto)', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Pacific Canada (Vancouver)', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)', region: 'Americas' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires)', region: 'Americas' },
  { value: 'America/Bogota', label: 'Colombia Time (Bogotá)', region: 'Americas' },
  
  // Europe
  { value: 'Europe/London', label: 'GMT/BST (London)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Central European Time (Madrid)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Central European Time (Rome)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Central European Time (Amsterdam)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Central European Time (Stockholm)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow Time (Moscow)', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Turkey Time (Istanbul)', region: 'Europe' },
  { value: 'Europe/Kyiv', label: 'Eastern European Time (Kyiv)', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)', region: 'Asia' },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (Riyadh)', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Kolkata)', region: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (Dhaka)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok)', region: 'Asia' },
  { value: 'Asia/Jakarta', label: 'Western Indonesia Time (Jakarta)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (Seoul)', region: 'Asia' },
  { value: 'Asia/Tashkent', label: 'Uzbekistan Time (Tashkent)', region: 'Asia' },

  // Pacific
  { value: 'Australia/Sydney', label: 'Eastern Australia (Sydney)', region: 'Pacific' },
  { value: 'Australia/Melbourne', label: 'Eastern Australia (Melbourne)', region: 'Pacific' },
  { value: 'Australia/Brisbane', label: 'Eastern Australia (Brisbane)', region: 'Pacific' },
  { value: 'Australia/Adelaide', label: 'Central Australia (Adelaide)', region: 'Pacific' },
  { value: 'Australia/Perth', label: 'Western Australia (Perth)', region: 'Pacific' },
  { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)', region: 'Pacific' },
  { value: 'Pacific/Fiji', label: 'Fiji Time', region: 'Pacific' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Eastern European Time (Cairo)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'West Africa Time (Lagos)', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (Nairobi)', region: 'Africa' },
];

function getCurrentTimeInZone(timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: timezone
    }).format(new Date());
  } catch (e) {
    return '--:--';
  }
}

export function TimezoneSelector() {
  const { user, updateUserSettings } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with store
  const selectedTimezone = user?.settings?.timezone || 'UTC';

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter timezones
  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return RAW_TIMEZONES;
    const lower = searchQuery.toLowerCase();
    return RAW_TIMEZONES.filter(tz => 
      tz.label.toLowerCase().includes(lower) || 
      tz.value.toLowerCase().includes(lower) ||
      tz.region.toLowerCase().includes(lower)
    );
  }, [searchQuery]);

  const handleSelect = async (timezone: string) => {
    setIsOpen(false);
    if (timezone === selectedTimezone) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserSettings({ timezone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to update timezone', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedOption = RAW_TIMEZONES.find(tz => tz.value === selectedTimezone) || {
    value: selectedTimezone,
    label: selectedTimezone, // Fallback label
    region: 'Custom'
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/5 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-base">Timezone</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set your current location time for accurate scheduling.
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSaving}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left bg-background border rounded-xl transition-all duration-200",
            isOpen ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50",
            isSaving && "opacity-70 cursor-wait"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0">
               <span className="font-medium truncate">{selectedOption.label}</span>
               <span className="text-xs text-muted-foreground truncate">
                 Current Time: {getCurrentTimeInZone(selectedTimezone)}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-2 shrink-0">
             {isSaving ? (
               <Loader2 className="h-4 w-4 animate-spin text-primary" />
             ) : (
               <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
             )}
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col max-h-[300px]">
            {/* Search Input */}
            <div className="p-2 border-b border-border bg-popover sticky top-0 z-10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search city or timezone..."
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-transparent rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-1 scrollbar-thin">
              {filteredTimezones.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No timezone found.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTimezones.map((tz) => {
                    const isSelected = selectedTimezone === tz.value;
                    return (
                      <button
                        key={tz.value}
                        onClick={() => handleSelect(tz.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors group",
                          isSelected 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                         <div className="flex flex-col items-start text-left">
                            <span>{tz.label}</span>
                            <span className="text-[10px] text-muted-foreground opacity-70 group-hover:opacity-100">{tz.region} • {getCurrentTimeInZone(tz.value)}</span>
                         </div>
                         {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Status Feedback */}
      {saveSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-in slide-in-from-top-1 fade-in duration-300">
           <Check className="h-3.5 w-3.5" />
           <span>Timezone updated</span>
        </div>
      )}
    </div>
  );
}
