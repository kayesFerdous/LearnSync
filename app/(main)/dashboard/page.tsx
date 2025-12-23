import { MessageSquare, Calendar as CalendarIcon, TrendingUp, Activity, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Good morning, Kayes</h1>
          <p className="text-muted-foreground">System status: <span className="text-primary font-medium">Online</span></p>
        </div>
        <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center text-foreground font-bold text-lg shadow-sm relative">
          K
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer relative overflow-hidden">
          <MessageSquare className="h-8 w-8" />
          <span className="font-bold">New Chat</span>
        </button>
        <button className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-all text-foreground cursor-pointer relative overflow-hidden">
          <CalendarIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium">Add Event</span>
        </button>
        <button className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-all text-foreground cursor-pointer relative overflow-hidden">
          <Activity className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium">Activity</span>
        </button>
        <button className="group flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border border-border hover:bg-accent hover:text-accent-foreground transition-all text-foreground cursor-pointer relative overflow-hidden">
          <Zap className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-medium">Quick Task</span>
        </button>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming
            </h2>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          
          <div className="bg-card rounded-xl p-1 shadow-sm border border-border relative overflow-hidden group">
            <div className="p-5 flex items-start gap-4 relative z-10">
              <div className="flex flex-col items-center bg-muted rounded-lg p-3 min-w-[80px] border border-border">
                <span className="text-xs font-bold text-primary tracking-wider">DEC</span>
                <span className="text-2xl font-bold text-foreground">17</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Project Review</h3>
                <p className="text-muted-foreground text-sm mb-3">10:00 AM - 11:30 AM</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">Work</span>
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-1 shadow-sm border border-border relative overflow-hidden group opacity-60 hover:opacity-100 transition-opacity">
             <div className="p-5 flex items-start gap-4 relative z-10">
              <div className="flex flex-col items-center bg-muted rounded-lg p-3 min-w-[80px] border border-border">
                <span className="text-xs font-bold text-muted-foreground tracking-wider">DEC</span>
                <span className="text-2xl font-bold text-muted-foreground">18</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">Team Sync</h3>
                <p className="text-muted-foreground text-sm mb-3">02:00 PM - 03:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Stats
          </h2>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border h-full relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="font-medium text-muted-foreground">Learning Streak</span>
            </div>
            
            <div className="relative z-10">
              <div className="text-5xl font-bold text-foreground mb-1">12</div>
              <div className="text-sm text-muted-foreground">Consecutive days</div>
            </div>
            
            <div className="mt-8 flex gap-1 h-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={cn("flex-1 rounded-full", i < 5 ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
