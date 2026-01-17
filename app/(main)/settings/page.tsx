'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  User, 
  Palette, 
  Settings2,
  Mail,
  Shield,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSelector } from '@/components/theme-selector';
import { TimezoneSelector } from '@/components/timezone-selector';
import { useAuthStore } from '@/lib/store';

// --- Small Reusable UI Components ---

function SettingsSection({ 
  title, 
  icon: Icon, 
  children,
  className 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h2>
      <div className="bg-card rounded-xl p-6 theme-shadow border border-border space-y-6">
        {children}
      </div>
    </section>
  );
}

function SettingsItem({
  icon: Icon,
  title,
  description,
  children,
  onClick
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between group",
        onClick && "cursor-pointer"
      )} 
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "h-6 w-11 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        checked ? "bg-primary" : "bg-secondary"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded-full absolute top-1 shadow-sm transition-all duration-200 bg-white",
          checked ? "right-1" : "left-1 bg-muted-foreground"
        )}
      />
    </button>
  );
}

function ProfileCard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  return (
    <div className="bg-card rounded-xl p-6 theme-shadow border border-border flex items-center gap-4 md:gap-6">
      <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-secondary overflow-hidden shrink-0 border-2 border-border">
        {user.picture ? (
          <img src={user.picture} alt={user.username} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold truncate">{user.username}</h2>
          {user.is_admin && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Admin</span>
          )}
        </div>
        <p className="text-muted-foreground truncate flex items-center gap-1.5 text-sm md:text-base">
          <Mail className="h-4 w-4" />
          {user.email}
        </p>
        <div className="flex gap-2 mt-3">
             <button className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors font-medium">
               Edit Profile
             </button>
             <button 
               onClick={handleLogout}
               className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors font-medium flex items-center gap-1"
             >
               <LogOut className="h-3 w-3" />
               Log out
             </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  // Local state for toggles (mocking functionality)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(true);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="pb-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your account preferences and workspace configuration.</p>
        </header>

        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Profile</h2>
          <ProfileCard />
        </section>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" icon={Palette}>
          <div>
            <div className="mb-4">
              <h3 className="font-medium text-foreground">Theme Preference</h3>
              <p className="text-sm text-muted-foreground">Select a theme that suits your workflow.</p>
            </div>
            <ThemeSelector />
          </div>
        </SettingsSection>

        {/* Account Settings Section */}
        <SettingsSection title="Account & Preferences" icon={User}>
          
          {/* Use TimezoneSelector directly but maybe wrapped nicely? 
              TimezoneSelector mimics the layout internally, but let's just render it. 
              The TimezoneSelector component has its own 'space-y-4' and structure.
              For consistency, we might eventually want to refactor TimezoneSelector,
              but for now, it fits okay. 
          */}
          <div className="-mt-2"> {/* Minor adjust to align with other items padding if needed */}
             <TimezoneSelector /> 
          </div>
          
          <div className="h-px bg-border" />

          {/* Notifications */}
          <SettingsItem 
            icon={Bell} 
            title="Email Notifications" 
            description="Receive updates about your routine and tasks."
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled} 
            />
          </SettingsItem>
          
          <div className="h-px bg-border" />

          {/* Calendar Sync */}
          <SettingsItem 
             icon={CalendarIcon} 
             title="Calendar Storage" 
             description="Sync your schedule with Google Calendar."
             onClick={() => setCalendarSyncEnabled(!calendarSyncEnabled)}
          >
            <Switch 
              checked={calendarSyncEnabled} 
              onCheckedChange={setCalendarSyncEnabled} 
            />
          </SettingsItem>

           <div className="h-px bg-border" />
           
           <SettingsItem 
             icon={Shield} 
             title="Security" 
             description="Manage password and 2FA settings."
             onClick={() => {}} // Placeholder
           >
             <button className="text-sm font-medium text-primary hover:underline">Manage</button>
           </SettingsItem>

        </SettingsSection>
        
        <div className="pt-4 flex justify-center">
             <p className="text-xs text-muted-foreground">
                 IDP Frontend v0.1.0 • Client ID: 460b...14811
             </p>
        </div>

      </div>
    </div>
  );
}
