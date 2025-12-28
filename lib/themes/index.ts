// Theme Configuration System
// To add a new theme:
// 1. Add theme id to ThemeId type
// 2. Create theme config in THEMES object
// 3. Add CSS variables in globals.css under [data-theme="your-theme-id"]

export type ThemeId = 'default' | 'neobrutalism' | 'forest' | 'ocean' | 'dark';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  // Component style variants
  styles: {
    borderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
    borderWidth: 'border' | 'border-2';
    shadow: string;
    shadowHover: string;
    buttonEffect: 'opacity' | 'scale' | 'translate' | 'none';
    fontWeight: 'font-medium' | 'font-semibold' | 'font-bold' | 'font-black';
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Clean & Minimal',
    description: 'A clean, professional look with subtle shadows',
    preview: {
      primary: '#1a1a2e',
      secondary: '#f1f1f4',
      accent: '#f1f1f4',
      background: '#ffffff',
    },
    styles: {
      borderRadius: 'rounded-2xl',
      borderWidth: 'border',
      shadow: 'shadow-sm',
      shadowHover: 'shadow-md',
      buttonEffect: 'opacity',
      fontWeight: 'font-medium',
    },
  },
  neobrutalism: {
    id: 'neobrutalism',
    name: 'Neobrutalism',
    description: 'Bold borders, offset shadows, playful colors',
    preview: {
      primary: '#a78bfa',
      secondary: '#7dd3c0',
      accent: '#f472b6',
      background: '#fefce8',
    },
    styles: {
      borderRadius: 'rounded-xl',
      borderWidth: 'border-2',
      shadow: 'shadow-[3px_3px_0px_hsl(var(--border))]',
      shadowHover: 'shadow-[1px_1px_0px_hsl(var(--border))]',
      buttonEffect: 'translate',
      fontWeight: 'font-bold',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy greens and warm natural tones',
    preview: {
      primary: '#22c55e',
      secondary: '#dcfce7',
      accent: '#fbbf24',
      background: '#fafaf5',
    },
    styles: {
      borderRadius: 'rounded-xl',
      borderWidth: 'border',
      shadow: 'shadow-sm',
      shadowHover: 'shadow-lg',
      buttonEffect: 'scale',
      fontWeight: 'font-semibold',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming blues and aquatic vibes',
    preview: {
      primary: '#0ea5e9',
      secondary: '#e0f2fe',
      accent: '#f0abfc',
      background: '#f8fafc',
    },
    styles: {
      borderRadius: 'rounded-2xl',
      borderWidth: 'border',
      shadow: 'shadow-md',
      shadowHover: 'shadow-xl',
      buttonEffect: 'scale',
      fontWeight: 'font-medium',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Docker Desktop inspired dark blue theme',
    preview: {
      primary: '#0073EB',
      secondary: '#1e293b',
      accent: '#4fd1c5',
      background: '#0f172a',
    },
    styles: {
      borderRadius: 'rounded-lg',
      borderWidth: 'border',
      shadow: 'shadow-md',
      shadowHover: 'shadow-lg',
      buttonEffect: 'scale',
      fontWeight: 'font-medium',
    },
  },
};

export const getTheme = (id: ThemeId): ThemeConfig => THEMES[id] || THEMES.default;
export const getAllThemes = (): ThemeConfig[] => Object.values(THEMES);
