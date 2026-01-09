"use client";

import { useAuthStore } from "@/lib/store";
import { User, LogIn, LogOut, ChevronRight, Home } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function TopBar() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    return {
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href,
      isLast
    };
  });

  // Mock login for demonstration
  const handleLogin = () => {
    login({
      id: "1",
      name: "Demo User",
      email: "user@example.com",
      avatarUrl: "https://github.com/shadcn.png", // Mock backend URL
    });
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14 flex items-center px-4 justify-between sticky top-0 z-50 w-full">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
            {!crumb.isLast && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <div className="h-8 w-8 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                <div className="px-2 py-1.5 text-sm font-semibold">
                  Profile
                </div>
                <div className="h-px bg-muted my-1" />
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="h-px bg-muted my-1" />
                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors px-4 py-2 rounded-md hover:bg-accent"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        )}
      </div>
    </header>
  );
}
