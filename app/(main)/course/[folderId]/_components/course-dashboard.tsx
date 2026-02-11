"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  FileImage,
  FileAudio,
  FileSpreadsheet,
  FileType,
  Presentation,
  Globe,
  Code,
  File,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { Folder, FolderFile, FolderFileType, ProcessingStatus } from '@/app/(main)/chat/_lib/types';
import { fetchFolderFiles, updateFolder } from '@/app/(main)/chat/_lib/api';
import { cn } from '@/lib/utils';
import { BatchUploadModal } from './batch-upload-modal';
import { CourseSettingsModal } from './course-settings-modal';
import { FileDeleteDialog } from './file-delete-dialog';
import { MindmapCanvas } from './mindmap';

// UI Extension for this component
export interface CourseFolder extends Folder {
  color?: string; // Optional because we might enhance it on the fly
  // icon is now part of base Folder
  description?: string;
}

interface CourseDashboardProps {
  folder: CourseFolder;
}

// File type configuration with icons and colors
const fileTypeConfig: Record<FolderFileType, { icon: React.ElementType; color: string; label: string }> = {
  pdf: { icon: FileText, color: '#ef4444', label: 'PDF' },
  docx: { icon: FileType, color: '#2563eb', label: 'Word' },
  pptx: { icon: Presentation, color: '#f97316', label: 'PowerPoint' },
  xlsx: { icon: FileSpreadsheet, color: '#22c55e', label: 'Excel' },
  html: { icon: Code, color: '#8b5cf6', label: 'HTML' },
  markdown: { icon: FileText, color: '#6b7280', label: 'Markdown' },
  png: { icon: FileImage, color: '#ec4899', label: 'PNG' },
  jpeg: { icon: FileImage, color: '#ec4899', label: 'JPEG' },
  tiff: { icon: FileImage, color: '#ec4899', label: 'TIFF' },
  wav: { icon: FileAudio, color: '#06b6d4', label: 'WAV' },
  mp3: { icon: FileAudio, color: '#06b6d4', label: 'MP3' },
  vtt: { icon: FileText, color: '#14b8a6', label: 'VTT' },
  url: { icon: Globe, color: '#3b82f6', label: 'URL' },
  unknown: { icon: File, color: '#9ca3af', label: 'File' }
};

// Status configuration
const statusConfig: Record<ProcessingStatus, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
  pending: { icon: Clock, color: '#f59e0b', label: 'Pending', bgColor: 'bg-amber-500/10' },
  processing: { icon: Loader2, color: '#3b82f6', label: 'Processing', bgColor: 'bg-blue-500/10' },
  completed: { icon: CheckCircle2, color: '#22c55e', label: 'Completed', bgColor: 'bg-emerald-500/10' },
  failed: { icon: XCircle, color: '#ef4444', label: 'Failed', bgColor: 'bg-red-500/10' },
  cancelled: { icon: AlertCircle, color: '#6b7280', label: 'Cancelled', bgColor: 'bg-gray-500/10' }
};

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [files, setFiles] = useState<FolderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FolderFile | null>(null);
  
  // Local state for folder customization (updates after save)
  const [folderName, setFolderName] = useState(folder.name);
  const [folderIcon, setFolderIcon] = useState<string | undefined>(folder.icon);
  const [folderTheme, setFolderTheme] = useState<string | undefined>(folder.theme);
  
  // Use provided color/icon or fallback to generated ones
  // We check folder.theme first, then folder.color (legacy/extension), then generated
  const metadata = getFolderMetadata(folder.id);
  // Theme from backend is likely a color string now
  const themeColor = folderTheme || folder.color || metadata.color;
  const displayIcon = folderIcon || metadata.icon;

  // Fetch folder files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setFilesLoading(true);
        setFilesError(null);
        const response = await fetchFolderFiles(folder.id);
        setFiles(response.files);
      } catch (error) {
        console.error('Failed to fetch folder files:', error);
        setFilesError(error instanceof Error ? error.message : 'Failed to load files');
      } finally {
        setFilesLoading(false);
      }
    };
    
    loadFiles();
  }, [folder.id]);

  const handleUploadSuccess = (conversationId: string) => {
    // Navigate to the new conversation after upload
    router.push(`/chat/${conversationId}`);
    // Also refresh the files list
    fetchFolderFiles(folder.id).then(response => setFiles(response.files)).catch(console.error);
  };

  // Remove deleted file from state with smooth animation
  const handleFileDeleted = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setFileToDelete(null);
  }, []);

  // Handle folder settings save
  const handleSettingsSave = useCallback(async (data: { name?: string; icon?: string; color?: string }) => {
    await updateFolder(folder.id, data);
    
    // Update local state after successful save
    if (data.name) setFolderName(data.name);
    if (data.icon) setFolderIcon(data.icon);
    if (data.color) setFolderTheme(data.color);
    
    // Trigger a soft refresh to update sidebar, etc.
    router.refresh();
  }, [folder.id, router]);

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
          {displayIcon}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {folderName}
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
          description="Customize appearance and name"
          themeColor={themeColor}
          onClick={() => setIsSettingsModalOpen(true)}
        />
      </section>

      {/* Course Mindmap */}
      <section className="max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Course Mindmap</h2>
          </div>
        </div>
        <MindmapCanvas folderId={folder.id} />
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

      {/* Knowledge Base Files */}
      <section className="max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Knowledge Base</h2>
            {!filesLoading && files.length > 0 && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden shadow-sm">
          {filesLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
              <p>Loading files...</p>
            </div>
          ) : filesError ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-red-500/10">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p>{filesError}</p>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {files.map((file) => (
                <FileCard 
                  key={file.id} 
                  file={file} 
                  themeColor={themeColor}
                  onDelete={(f) => setFileToDelete(f)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <div 
                className="p-4 rounded-full bg-muted/50"
                style={{ color: themeColor }}
              >
                <Upload className="w-8 h-8 opacity-50" />
              </div>
              <p>No files uploaded yet. Upload documents to build your knowledge base!</p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                Upload Files
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        folderId={folder.id}
        themeColor={themeColor}
      />

      {/* File Delete Dialog */}
      <FileDeleteDialog
        file={fileToDelete}
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        onDeleted={handleFileDeleted}
      />

      {/* Course Settings Modal */}
      <CourseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSettingsSave}
        currentName={folderName}
        currentIcon={displayIcon}
        currentColor={themeColor}
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

interface FileCardProps {
  file: FolderFile;
  themeColor: string;
  onDelete?: (file: FolderFile) => void;
}

function FileCard({ file, themeColor, onDelete }: FileCardProps) {
  const typeConfig = fileTypeConfig[file.file_type] || fileTypeConfig.unknown;
  const status = statusConfig[file.status] || statusConfig.pending;
  const FileIcon = typeConfig.icon;
  const StatusIcon = status.icon;
  
  // Truncate filename if too long
  const displayName = file.filename.length > 28 
    ? file.filename.slice(0, 25) + '...' 
    : file.filename;
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col p-4 rounded-xl border bg-card transition-all duration-300",
        "hover:shadow-md hover:border-[var(--theme-color)]/30 hover:-translate-y-0.5"
      )}
      style={{ '--theme-color': themeColor } as React.CSSProperties}
    >
      {/* File Type Icon + Actions */}
      <div className="flex items-start justify-between mb-3">
        <div 
          className="p-2.5 rounded-lg transition-transform group-hover:scale-105 duration-300"
          style={{ backgroundColor: `${typeConfig.color}15` }}
        >
          <FileIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Status Badge */}
          <div 
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              status.bgColor
            )}
          >
            <StatusIcon 
              className={cn("w-3 h-3", file.status === 'processing' && "animate-spin")} 
              style={{ color: status.color }} 
            />
            <span style={{ color: status.color }}>{status.label}</span>
          </div>

          {/* Delete Button — appears on hover */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file);
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100",
                "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                "focus-visible:opacity-100 focus-visible:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              )}
              aria-label={`Delete ${file.filename}`}
              title="Delete file"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      {/* File Info */}
      <div className="flex-1 min-w-0">
        <h4 
          className="font-medium text-sm text-foreground truncate mb-1 group-hover:text-[var(--theme-color)] transition-colors"
          title={file.filename}
        >
          {displayName}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span 
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
            style={{ 
              backgroundColor: `${typeConfig.color}15`, 
              color: typeConfig.color 
            }}
          >
            {typeConfig.label}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
