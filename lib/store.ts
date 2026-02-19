import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from './themes';

export type FontId = 'system' | 'space-mono';

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'neobrutalism',
      setTheme: (theme) => set({ currentTheme: theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

interface FontState {
  currentFont: FontId;
  setFont: (font: FontId) => void;
}

export const useFontStore = create<FontState>()(
  persist(
    (set) => ({
      currentFont: 'system',
      setFont: (font) => set({ currentFont: font }),
    }),
    {
      name: 'font-storage',
    }
  )
);

interface UserSettings {
  timezone: string;
  theme: string;
  font: FontId;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  picture: string | null;
  is_admin: boolean;
  subscribed: boolean;
  created_at: string;
  updated_at: string | null;
  settings: UserSettings;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<User>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        const normalizedUser = user && user.settings ? {
          ...user,
          settings: {
            ...user.settings,
            font: user.settings.font || 'system',
          },
        } : user;

        if (normalizedUser?.settings?.theme) {
          useThemeStore.getState().setTheme(normalizedUser.settings.theme as ThemeId);
        }
        if (normalizedUser?.settings?.font) {
          useFontStore.getState().setFont(normalizedUser.settings.font as FontId);
        }
        set({ user: normalizedUser, isAuthenticated: !!normalizedUser });
      },
      logout: async () => {
        try {
          await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Failed to log out:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },
      fetchUser: async () => {
        try {
          const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookies
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('[Auth Store] fetchUser response:', {
              username: userData.username,
              email: userData.email,
              picture: userData.picture,
            });

            const normalizedUser = userData && userData.settings ? {
              ...userData,
              settings: {
                ...userData.settings,
                font: userData.settings.font || 'system',
              },
            } : userData;

            set({ user: normalizedUser, isAuthenticated: true });
            if (normalizedUser?.settings?.theme) {
              useThemeStore.getState().setTheme(normalizedUser.settings.theme as ThemeId);
            }
            if (normalizedUser?.settings?.font) {
              useFontStore.getState().setFont(normalizedUser.settings.font as FontId);
            }
          } else {
            // If fetching fails (e.g. 401), clear authentication state
            console.log('[Auth Store] fetchUser failed with status:', response.status);
            if (response.status === 401) {
              set({ user: null, isAuthenticated: false });
            }
          }
        } catch (error) {
          console.error('[Auth Store] Failed to fetch user:', error);
          // On network error, keep existing state (from localStorage)
          // Don't clear the state unless it's an explicit 401
        }
      },
      updateUserSettings: async (settings) => {
        const currentUser = get().user;

        // 1. Optimistic Update (Immediate UI Reflection)
        // Create an optimistic user object merged with new settings
        let optimisticUser: User | null = null;
        if (currentUser) {
          optimisticUser = {
            ...currentUser,
            settings: {
              ...(currentUser.settings || {}),
              ...settings
            }
          } as User;

          set({ user: optimisticUser });
        }

        // 2. Sync Theme Store immediately (Vital for ThemeProvider)
        if (settings.theme) {
          useThemeStore.getState().setTheme(settings.theme as ThemeId);
        }
        if (settings.font) {
          useFontStore.getState().setFont(settings.font as FontId);
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/me/settings`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(settings),
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => response.statusText);
            throw new Error(detail || 'Failed to update settings');
          }

          const hasJson = response.headers.get('content-type')?.includes('application/json');
          const responseBody = hasJson ? await response.json() : null;

          // 3. Confirm with Final Data
          // Use the response from server if available, otherwise keep optimistic
          let finalUser = optimisticUser;

          if (responseBody) {
            finalUser = {
              ...(optimisticUser || {}),
              ...responseBody,
              settings: {
                ...(optimisticUser?.settings || {}),
                ...(responseBody.settings || {}),
              }
            } as User;
          }

          set({ user: finalUser });

          // Re-sync theme only if server returned a DIFFERENT theme than what we asked for
          // (e.g. invalid theme fallback)
          const confirmedTheme = finalUser?.settings?.theme;
          if (confirmedTheme && settings.theme && confirmedTheme !== settings.theme) {
            useThemeStore.getState().setTheme(confirmedTheme as ThemeId);
          }

          const confirmedFont = finalUser?.settings?.font;
          if (confirmedFont && settings.font && confirmedFont !== settings.font) {
            useFontStore.getState().setFont(confirmedFont as FontId);
          }

          return finalUser as User;

        } catch (error) {
          // 4. Revert on Error
          console.error('Update failed, reverting...', error);
          set({ user: currentUser });

          // Revert theme store
          const oldTheme = currentUser?.settings?.theme;
          if (oldTheme) {
            useThemeStore.getState().setTheme(oldTheme as ThemeId);
          }
          const oldFont = currentUser?.settings?.font;
          if (oldFont) {
            useFontStore.getState().setFont(oldFont as FontId);
          }

          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Properly handle hydration from localStorage
      onRehydrateStorage: () => (state) => {
        console.log('[Auth Store] Rehydrating from localStorage:', state?.user ? {
          username: state.user.username,
          email: state.user.email,
          picture: state.user.picture,
          isAuthenticated: state.isAuthenticated
        } : 'No user data');

        if (state?.user) {
          // When rehydrating, sync theme and font stores
          if (state.user.settings?.theme) {
            useThemeStore.getState().setTheme(state.user.settings.theme as ThemeId);
          }
          if (state.user.settings?.font) {
            useFontStore.getState().setFont(state.user.settings.font as FontId);
          }
        }
      },
    }
  )
);

interface UiState {
  breadcrumbOverrides: Record<string, string>;
  setBreadcrumbOverride: (segment: string, label: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      breadcrumbOverrides: {},
      setBreadcrumbOverride: (segment, label) =>
        set((state) => ({
          breadcrumbOverrides: { ...state.breadcrumbOverrides, [segment]: label }
        })),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);

/* ===========================================
   Workspace Store — Spatial Canvas State
   =========================================== */

export interface QuickNote {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface WorkspaceState {
  selectedNodeId: string | null;
  inspectorOpen: boolean;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  quickNotes: QuickNote[];
  selectNode: (nodeId: string) => void;
  deselectNode: () => void;
  toggleWorkspaceSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  addQuickNote: (note: QuickNote) => void;
  removeQuickNote: (noteId: string) => void;
  updateQuickNote: (noteId: string, text: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  (set) => ({
    selectedNodeId: null,
    inspectorOpen: false,
    sidebarCollapsed: false,
    rightPanelOpen: true,
    quickNotes: [],
    selectNode: (nodeId) => set({ selectedNodeId: nodeId, inspectorOpen: true }),
    deselectNode: () => set({ selectedNodeId: null, inspectorOpen: false }),
    toggleWorkspaceSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
    addQuickNote: (note) => set((state) => ({ quickNotes: [...state.quickNotes, note] })),
    removeQuickNote: (noteId) => set((state) => ({
      quickNotes: state.quickNotes.filter((n) => n.id !== noteId),
    })),
    updateQuickNote: (noteId, text) => set((state) => ({
      quickNotes: state.quickNotes.map((n) => n.id === noteId ? { ...n, text } : n),
    })),
  })
);
