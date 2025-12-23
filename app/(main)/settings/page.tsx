'use client';

import { cn } from '@/lib/utils';
import { Bell, Calendar as CalendarIcon, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account settings.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Account
        </h2>
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
            <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">Notifications</h3>
                        <p className="text-sm text-muted-foreground">Manage your email notifications</p>
                    </div>
                </div>
                <div className="h-6 w-11 bg-secondary rounded-full relative transition-colors group-hover:bg-primary/20">
                    <div className="h-4 w-4 bg-muted-foreground rounded-full absolute top-1 left-1 shadow-sm group-hover:bg-primary group-hover:translate-x-5 transition-all"></div>
                </div>
            </div>
            
            <div className="h-px bg-border" />

             <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">Sync Calendar</h3>
                        <p className="text-sm text-muted-foreground">Connect with Google Calendar</p>
                    </div>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full relative">
                    <div className="h-4 w-4 bg-primary-foreground rounded-full absolute top-1 right-1 shadow-sm"></div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
