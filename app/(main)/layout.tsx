"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useAuthStore, useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUiStore();
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isMessagingPage = pathname.startsWith("/messaging");
  const isCoursePage = pathname.startsWith("/course");
  const isViewportLockedPage = isMessagingPage || isCoursePage;

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const validateAuth = async () => {
      if (!isHydrated) {
        return;
      }

      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      await Promise.race([fetchUser(), timeoutPromise]);

      if (!cancelled) {
        setAuthChecked(true);
      }
    };

    void validateAuth();

    return () => {
      cancelled = true;
    };
  }, [fetchUser, isHydrated]);

  useEffect(() => {
    if (authChecked && !user && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [authChecked, isAuthenticated, router, user]);

  if (!isHydrated || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!user && !isAuthenticated) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background",
        isViewportLockedPage ? "h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      <Sidebar />
      <main
        className={cn(
          "flex flex-col transition-all duration-300 ease-out",
          isViewportLockedPage ? "h-screen overflow-hidden" : "min-h-screen",
          sidebarOpen ? "md:ml-72" : "md:ml-0",
        )}
      >
        <TopBar />
        <div
          className={cn(
            "flex-1 relative min-h-0",
            isViewportLockedPage ? "overflow-hidden" : "overflow-auto",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
