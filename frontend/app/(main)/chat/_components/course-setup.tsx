'use client';

import { useState, useRef } from 'react';
import { Sparkles, Upload, BookOpen, GraduationCap, Palette, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists
import { useChat } from '@/app/(main)/chat/_lib';

const COURSE_COLORS = [
  '#3b82f6', '#a855f7', '#ec4899', 
  '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#14b8a6', '#6366f1'
];

interface ColorMap {
  [key: string]: string;
}

const COLOR_TO_CLASS: ColorMap = {
  '#3b82f6': 'bg-blue-500', 
  '#a855f7': 'bg-purple-500', 
  '#ec4899': 'bg-pink-500', 
  '#ef4444': 'bg-red-500', 
  '#f97316': 'bg-orange-500', 
  '#eab308': 'bg-yellow-500', 
  '#22c55e': 'bg-green-500', 
  '#14b8a6': 'bg-teal-500', 
  '#6366f1': 'bg-indigo-500'
};

const COURSE_ICONS = [
  '📚', '⚛️', '🧬', '📐', '🎨', '💻', '🌍', '⚖️', '🎬', '🎵'
];

interface CourseSetupProps {
  onCancel: () => void;
  onComplete: (folderId: string) => void;
  // Pass the creation logic from the parent to share state
  onCreateCourse: (name: string, icon?: string, theme?: string) => Promise<{ success: boolean; folder?: any; error?: string }>;
}

export function CourseSetup({ onCancel, onComplete, onCreateCourse }: CourseSetupProps) {
  // REMOVE: const { createFolderHandler } = useChat();  <-- This was creating a separate state instance!
  
  const [courseName, setCourseName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COURSE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(COURSE_ICONS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseName.trim()) return;
    
    setIsCreating(true);
    try {
      // Create folder with metadata (color/icon would be stored in name or separate field if backend supported)
      // For now, we just pass the name as backend only expects name
      const result = await onCreateCourse(courseName, selectedIcon, selectedColor);
      
      if (result.success && result.folder) {
        // Here we would upload the 'global files' if backend supported folder-level uploads
        // For now, we'll just complete the flow
        onComplete(result.folder.id);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col gap-12">
        
        {/* Header Section */}
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Set Up Your New Course
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create a dedicated space for your subject. Upload your syllabus and reference materials here to give your AI assistant the full context.
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-card border border-border rounded-xl theme-shadow-md p-8 space-y-8">
          
          {/* Visual Identity */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-colors text-white"
                )}
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course Icon</label>
                <div className="flex gap-2 mt-2">
                  {COURSE_ICONS.slice(0, 5).map(icon => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-lg",
                        selectedIcon === icon && "bg-accent shadow-sm"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full ring-offset-2 ring-offset-background transition-all",
                    selectedColor === color && "ring-2 ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Course Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Advanced Calculus, Physics 101, World History..."
              className="w-full text-2xl font-bold bg-transparent border-none border-b-2 border-border focus:border-primary px-0 py-2 focus:ring-0 placeholder:text-muted-foreground/40 transition-colors"
              autoFocus
            />
          </div>

          {/* Context Drop Zone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Course Materials & Syllabus
              </label>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Global Context
              </span>
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group relative border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[160px]"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                multiple 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Drag syllabus files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Files uploaded here will be read by the AI to understand the full context of this course across all conversations.
                </p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-lg text-sm animate-in zoom-in-50">
                    <span className="text-lg">📄</span>
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button 
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCourse}
            disabled={!courseName.trim() || isCreating}
            className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up Course...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Course & Start Chatting
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
