"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUiStore();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const isMessagingPage = pathname.startsWith("/messaging");

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Prevent flash of wrong content during hydration
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background",
        isMessagingPage ? "h-screen overflow-hidden" : "min-h-screen",
      )}
    >
      <Sidebar />
      <main
        className={cn(
          "flex flex-col transition-all duration-300 ease-out",
          isMessagingPage ? "h-screen overflow-hidden" : "min-h-screen",
          sidebarOpen ? "md:ml-72" : "md:ml-0",
        )}
      >
        <TopBar />
        <div
          className={cn(
            "flex-1 relative min-h-0",
            isMessagingPage ? "overflow-hidden" : "overflow-auto",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
