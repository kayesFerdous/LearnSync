"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Palette, Type, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name?: string; icon?: string; color?: string }) => Promise<void>;
  currentName: string;
  currentIcon: string;
  currentColor: string;
}

// Predefined color palette
const colorPalette = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#7c3aed' },
];

// Predefined icon options
const iconOptions = [
  '📚', '📖', '📝', '✏️', '🎓', '💡', '🔬', '🧪', '🧮', '📐', 
  '🖥️', '💻', '🌐', '🎨', '🎭', '🎵', '📊', '📈', '🗂️', '📁',
  '🏛️', '🌍', '🧠', '⚙️', '🔧', '🛠️', '📱', '🎯', '🚀', '⭐',
];

export function CourseSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentIcon,
  currentColor,
}: CourseSettingsModalProps) {
  const [name, setName] = useState(currentName);
  const [icon, setIcon] = useState(currentIcon);
  const [color, setColor] = useState(currentColor);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setIcon(currentIcon);
      setColor(currentColor);
      setError(null);
      setActiveTab('general');
    }
  }, [isOpen, currentName, currentIcon, currentColor]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Course name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: { name?: string; icon?: string; color?: string } = {};
      
      if (name !== currentName) updateData.name = name.trim();
      if (icon !== currentIcon) updateData.icon = icon;
      if (color !== currentColor) updateData.color = color;

      // Only call API if something changed
      if (Object.keys(updateData).length > 0) {
        await onSave(updateData);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  }, [onClose, handleSave]);

  if (!isOpen) return null;

  const hasChanges = name !== currentName || icon !== currentIcon || color !== currentColor;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg bg-card border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        style={{ 
          '--theme-color': color,
          borderColor: `${color}30`
        } as React.CSSProperties}
      >
        {/* Header */}
        <div 
          className="relative px-6 py-5 border-b overflow-hidden"
          style={{ borderColor: `${color}20` }}
        >
          {/* Gradient background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{ 
              background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` 
            }}
          />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 flex items-center justify-center rounded-xl text-2xl border-2 bg-background/80"
                style={{ borderColor: color }}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Course Settings</h2>
                <p className="text-sm text-muted-foreground">Customize your course appearance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: `${color}15` }}>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-all relative",
              activeTab === 'general' 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Type className="w-4 h-4" />
              General
            </span>
            {activeTab === 'general' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-all relative",
              activeTab === 'appearance' 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </span>
            {activeTab === 'appearance' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
              {/* Course Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  Course Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter course name"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-background text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 transition-all duration-200"
                  )}
                  style={{ 
                    borderColor: `${color}30`,
                    '--tw-ring-color': color 
                  } as React.CSSProperties}
                  autoFocus
                />
              </div>

              {/* Live Preview */}
              <div className="mt-6 p-4 rounded-xl border bg-muted/30" style={{ borderColor: `${color}20` }}>
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Preview
                </p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-3xl border-2 bg-background shadow-sm"
                    style={{ borderColor: color }}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{name || 'Untitled Course'}</h3>
                    <p className="text-sm text-muted-foreground">Course Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Icon Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Course Icon
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {iconOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all duration-200",
                        "hover:scale-110 hover:shadow-md",
                        icon === emoji 
                          ? "ring-2 bg-muted" 
                          : "bg-background hover:bg-muted/50"
                      )}
                      style={{ 
                        '--tw-ring-color': color,
                        borderColor: icon === emoji ? color : 'transparent'
                      } as React.CSSProperties}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  Theme Color
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {colorPalette.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        "relative w-full aspect-square rounded-xl transition-all duration-200",
                        "hover:scale-105 hover:shadow-lg",
                        color === c.value && "ring-2 ring-offset-2 ring-offset-background"
                      )}
                      style={{ 
                        backgroundColor: c.value,
                        '--tw-ring-color': c.value
                      } as React.CSSProperties}
                      title={c.name}
                    >
                      {color === c.value && (
                        <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl border bg-muted/30" style={{ borderColor: `${color}20` }}>
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Theme Preview
                </p>
                <div 
                  className="p-4 rounded-xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${color}20 0%, transparent 60%)` 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 flex items-center justify-center rounded-xl text-3xl border-2 bg-background shadow-sm"
                      style={{ borderColor: color }}
                    >
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{name || 'Untitled Course'}</h3>
                      <div 
                        className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${color}20`,
                          color: color
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        Active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-muted/30"
          style={{ borderColor: `${color}15` }}
        >
          <p className="text-xs text-muted-foreground">
            {hasChanges ? '• Unsaved changes' : 'No changes'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200",
                "flex items-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                hasChanges && "hover:opacity-90 hover:shadow-lg"
              )}
              style={{ backgroundColor: color }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
