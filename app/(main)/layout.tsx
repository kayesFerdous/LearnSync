"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-out",
        sidebarOpen ? "md:ml-72" : "md:ml-0"
      )}>
        <TopBar />
        <div className="flex-1 overflow-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
