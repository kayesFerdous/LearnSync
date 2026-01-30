"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Upload, 
  Settings, 
  MessageSquare,
  Clock,
  BookOpen,
  FileText,
  MoreVertical
} from 'lucide-react';
import { Folder } from '@/app/(main)/chat/_lib/types'; // Adjusted import path based on workspace
import { cn } from '@/lib/utils';
import { BatchUploadModal } from './batch-upload-modal';

// UI Extension for this component
export interface CourseFolder extends Folder {
  color?: string; // Optional because we might enhance it on the fly
  // icon is now part of base Folder
  description?: string;
}

interface CourseDashboardProps {
  folder: CourseFolder;
}

// Temporary helper if backend data is missing
export const getFolderMetadata = (id: string) => {
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
  // Simple hash function to get consistent color for an ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  
  return {
    color: colors[colorIndex],
    icon: "📚" // Default icon
  };
};

export function CourseDashboard({ folder }: CourseDashboardProps) {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Use provided color/icon or fallback to generated ones
  // We check folder.theme first, then folder.color (legacy/extension), then generated
  const metadata = getFolderMetadata(folder.id);
  // Theme from backend is likely a color string now
  const themeColor = folder.theme || folder.color || metadata.color;
  const folderIcon = folder.icon || metadata.icon;

  const handleUploadSuccess = (conversationId: string) => {
    // Navigate to the new conversation after upload
    router.push(`/chat/${conversationId}`);
  };

  return (
    <div 
      className="min-h-screen p-6 space-y-8 transition-colors duration-500"
      style={{ 
        '--theme-color': themeColor,
        background: `linear-gradient(to bottom, ${themeColor}15 0%, transparent 400px)`
      } as React.CSSProperties}
    >
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div 
          className="w-24 h-24 flex items-center justify-center rounded-2xl text-6xl shadow-xl bg-background border-2 transition-transform hover:scale-105 duration-300"
          style={{ borderColor: themeColor }}
        >
          {folderIcon}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {folder.name}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {folder.description || "Course Dashboard"}
          </p>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <QuickActionCard 
          icon={<PlusCircle className="w-6 h-6" />}
          title="New Chat"
          description="Start a new conversation context"
          themeColor={themeColor}
          onClick={() => router.push(`/chat?folderId=${folder.id}`)}
        />
        <QuickActionCard 
          icon={<Upload className="w-6 h-6" />}
          title="Upload Documents"
          description="Add documents to knowledge base"
          themeColor={themeColor}
          onClick={() => setIsUploadModalOpen(true)}
        />
        <QuickActionCard 
          icon={<Settings className="w-6 h-6" />}
          title="Course Settings"
          description="Manage preferences and tools"
          themeColor={themeColor}
          onClick={() => console.log('Settings clicked')}
        />
      </section>

      {/* Recent Activity */}
      <section className="max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-sm">
          {folder.conversations && folder.conversations.length > 0 ? (
            <div className="divide-y">
              {folder.conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-white group-hover:bg-[var(--theme-color)] transition-all duration-300 ring-1 ring-transparent group-hover:ring-[var(--theme-color)]"
                      style={{ '--theme-color': themeColor } as React.CSSProperties}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {conversation.title || 'Untitled Conversation'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {conversation.updated_at 
                          ? format(new Date(conversation.updated_at), 'MMM d, yyyy • h:mm a')
                          : format(new Date(conversation.created_at), 'MMM d, yyyy • h:mm a')
                        }
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <div 
                className="p-4 rounded-full bg-muted/50"
                style={{ color: themeColor }}
              >
                <FileText className="w-8 h-8 opacity-50" />
              </div>
              <p>No conversations yet. Start a new one to get going!</p>
            </div>
          )}
        </div>
      </section>

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        themeColor={themeColor}
      />
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  themeColor: string;
  onClick: () => void;
}

function QuickActionCard({ icon, title, description, themeColor, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-6 rounded-xl border bg-card/80 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1 text-left group border-transparent hover:border-[var(--theme-color)]/20"
      )}
      style={{
        '--theme-color': themeColor
      } as React.CSSProperties}
    >
      <div 
        className="p-3 rounded-lg mb-4 text-white shadow-md transition-transform group-hover:scale-110 duration-300"
        style={{ backgroundColor: themeColor }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--theme-color)] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground group-hover:text-muted-foreground/80">
        {description}
      </p>
    </button>
  );
}
