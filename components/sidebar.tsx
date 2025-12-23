'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, Settings, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card h-screen sticky top-0 transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex items-center py-6 mb-4 transition-all duration-300", isCollapsed ? "px-0 justify-center" : "px-6 gap-3")}>
        <div className="h-8 w-8 flex items-center justify-center text-primary shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100"
        )}>
          <span className="text-xl font-bold text-foreground whitespace-nowrap tracking-tight">
            LearnSync
          </span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all relative group",
                isActive 
                  ? "text-primary-foreground bg-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 transition-colors")} strokeWidth={2} />
              
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isCollapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100"
              )}>
                 <span className="whitespace-nowrap">
                  {item.label}
                </span>
              </div>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-border flex items-center", isCollapsed ? "flex-col gap-4 justify-center" : "justify-end")}>
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
              isCollapsed ? "" : ""
            )}
        >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}

