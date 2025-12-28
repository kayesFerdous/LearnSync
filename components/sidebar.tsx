'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, Settings, ChevronLeft, ChevronRight, Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/editor', label: 'Text Editor', icon: FileText },
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
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center h-[72px] shrink-0 px-4 gap-3 overflow-hidden">
        <div className="h-9 w-9 flex items-center justify-center text-primary-foreground bg-primary rounded-xl theme-shadow shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className={cn(
          "text-xl font-bold text-foreground whitespace-nowrap tracking-tight transition-opacity duration-300",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}>
          LearnSync
        </span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 mt-2 px-3 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-11 px-3 gap-3 rounded-xl text-sm font-medium transition-colors duration-200 ease-out relative group overflow-hidden",
                isActive 
                  ? "text-primary-foreground bg-primary theme-shadow" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-300",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}>
                {item.label}
              </span>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-[60px] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 border border-border theme-shadow">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-border shrink-0 overflow-hidden">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center h-10 w-full px-3 gap-3 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out overflow-hidden"
        >
          <ChevronLeft className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out",
            isCollapsed && "rotate-180"
          )} />
          <span className={cn(
            "text-sm whitespace-nowrap transition-opacity duration-300",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
}