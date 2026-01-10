import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from './themes';

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
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

interface User {
  user_id: string;
  username: string;
  email: string;
  picture: string | null;
  is_admin: boolean;
  subscribed: boolean;
  created_at: string;
  updated_at: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        try {
          await fetch('http://localhost:8000/auth/logout', {
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
          const response = await fetch('http://localhost:8000/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookies
          });

          if (response.ok) {
            const userData = await response.json();
            set({ user: userData, isAuthenticated: true });
          } else {
             // If fetching fails (e.g. 401), we might want to logout
             // or at least not set the user. 
             // Depending on requirements, we might want to clear state if 401.
             if (response.status === 401) {
                set({ user: null, isAuthenticated: false });
             }
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          // Optionally handle network errors
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
