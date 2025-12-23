import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'default' | 'forest' | 'dark';

interface ThemeState {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'default',
      setTheme: (theme) => set({ currentTheme: theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
