'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  Settings, 
  Sparkles, 
  FileText, 
  Shield, 
  User,
  X,
  Clock,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUiStore } from '@/lib/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & insights' },
  { href: '/chat', label: 'Chat', icon: MessageSquare, description: 'AI conversations' },
  { href: '/messaging', label: 'Messages', icon: MessageCircle, description: 'Direct messages' },
  { href: '/editor', label: 'Text Editor', icon: FileText, description: 'Create documents' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, description: 'Schedule & events' },
  { href: '/routines', label: 'Class Schedule', icon: Clock, description: 'Weekly routines' },
  { href: '/profile', label: 'Profile', icon: User, description: 'Your account' },
  { href: '/admin', label: 'Admin', icon: Shield, description: 'System management' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Preferences' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const isAdmin = useAuthStore((state) => state.user?.is_admin ?? false);

  const visibleNavItems = navItems.filter((item) => item.href !== '/admin' || isAdmin);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col h-screen w-72 bg-gradient-to-b from-card to-card/95 border-r border-border/50 transition-all duration-300 ease-out",
          sidebarOpen 
            ? "translate-x-0 shadow-2xl md:shadow-lg" 
            : "-translate-x-full"
        )}
        style={{
          willChange: 'transform',
        }}
      >
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between h-16 px-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 flex items-center justify-center text-primary-foreground bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                LearnSync
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Learning Platform
              </span>
            </div>
          </div>
          
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </span>
          </div>
          
          {visibleNavItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground/30 rounded-r-full" />
                )}
                
                <div className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary-foreground/15" 
                    : "bg-accent/50 group-hover:bg-accent"
                )}>
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{item.label}</span>
                  <span className={cn(
                    "text-[10px] truncate transition-colors",
                    isActive 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground/70"
                  )}>
                    {item.description}
                  </span>
                </div>

                {/* Hover glow effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative p-4 border-t border-border/50">
          {/* Decorative gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
          
          <div className="relative bg-gradient-to-br from-accent to-accent/50 rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Workspace Tip</p>
                <p className="text-[10px] text-muted-foreground">Plan your day in Calendar</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep classes, routines, and chats aligned by updating your schedule regularly.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}