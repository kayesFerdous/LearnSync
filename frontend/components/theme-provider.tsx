'use client';

import { useEffect } from 'react';
import { useThemeStore, useFontStore } from '@/lib/store';
import { getTheme } from '@/lib/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme } = useThemeStore();
  const { currentFont } = useFontStore();

  useEffect(() => {
    document.documentElement.classList.add('theme-transition');
    const timeout = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 240);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-font', currentFont);
    
    // Store theme config in CSS custom property for component access
    const theme = getTheme(currentTheme);
    document.documentElement.style.setProperty('--theme-id', theme.id);

    return () => window.clearTimeout(timeout);
  }, [currentTheme, currentFont]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', currentFont);
  }, [currentFont]);

  // Prevent flash of wrong theme on initial load
  useEffect(() => {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.currentTheme) {
          document.documentElement.setAttribute('data-theme', parsed.state.currentTheme);
        }
      } catch {
        // Use default theme
      }
    }

    const storedFont = localStorage.getItem('font-storage');
    if (storedFont) {
      try {
        const parsedFont = JSON.parse(storedFont);
        if (parsedFont.state?.currentFont) {
          document.documentElement.setAttribute('data-font', parsedFont.state.currentFont);
        }
      } catch {
        // Use default font
      }
    }
  }, []);

  return <>{children}</>;
}

// Hook to get current theme config
export function useTheme() {
  const { currentTheme, setTheme } = useThemeStore();
  const theme = getTheme(currentTheme);
  
  return {
    theme,
    themeId: currentTheme,
    setTheme,
    styles: theme.styles,
  };
}
