"use client";

import { useAuthStore, useUiStore } from "@/lib/store";
import { User, LogIn, LogOut, ChevronRight, Home, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TopBar() {
  const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
  const { breadcrumbOverrides, sidebarOpen, toggleSidebar } = useUiStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const [imageError, setImageError] = useState(false);

  // Reset image error state when user picture changes
  useEffect(() => {
    setImageError(false);
  }, [user?.picture]);

  // Only fetch user if not already loaded (handles page refresh without localStorage)
  useEffect(() => {
    if (!user && !isAuthenticated) {
      fetchUser();
    }
  }, []);

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;

    // Check for override (handle UUIDs or specific segments)
    const label = breadcrumbOverrides[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return {
      label,
      href,
      isLast
    };
  });

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 h-16 flex items-center px-4 justify-between sticky top-0 z-40 w-full">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200",
            "hover:bg-accent text-muted-foreground hover:text-foreground",
            "active:scale-95"
          )}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <div className="relative">
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border/50 hidden sm:block" />

        {/* Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-accent/50">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {crumb.isLast ? (
                <span className="font-medium text-foreground px-2 py-1 rounded-lg bg-accent/50">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/50">
                  {crumb.label}
                </Link>
              )}
              {!crumb.isLast && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-200",
                "hover:bg-accent/80",
                isProfileOpen && "bg-accent"
              )}
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium text-foreground">{user.username || 'User'}</span>
                <span className="text-[10px] text-muted-foreground">Online</span>
              </div>
              <div className="relative">
                <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-border/50 bg-muted flex items-center justify-center ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  {user.picture && user.picture.trim() !== '' && !imageError ? (
                    <img
                      src={user.picture}
                      alt={user.username}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-lg font-bold text-primary">
                        {(user.username || 'User').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-2 text-popover-foreground shadow-xl z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-foreground">{user.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>View Profile</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setIsProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
