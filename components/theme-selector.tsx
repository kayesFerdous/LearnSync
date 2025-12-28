'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';
import { getAllThemes, type ThemeId } from '@/lib/themes';

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();
  const themes = getAllThemes();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {themes.map((theme) => {
        const isSelected = themeId === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id as ThemeId)}
            className={cn(
              "relative p-4 rounded-xl border-2 text-left transition-all duration-200 group",
              isSelected
                ? "border-primary bg-primary/5 theme-shadow-md"
                : "border-border bg-card hover:border-primary/50 hover:theme-shadow"
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}

            {/* Color preview */}
            <div className="flex gap-2 mb-3">
              <div
                className="h-8 w-8 rounded-lg border border-border/50"
                style={{ backgroundColor: theme.preview.primary }}
              />
              <div
                className="h-8 w-8 rounded-lg border border-border/50"
                style={{ backgroundColor: theme.preview.secondary }}
              />
              <div
                className="h-8 w-8 rounded-lg border border-border/50"
                style={{ backgroundColor: theme.preview.accent }}
              />
              <div
                className="h-8 w-8 rounded-lg border border-border/50"
                style={{ backgroundColor: theme.preview.background }}
              />
            </div>

            {/* Theme info */}
            <h3 className={cn(
              "font-semibold text-foreground mb-1",
              isSelected && "text-primary"
            )}>
              {theme.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {theme.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
