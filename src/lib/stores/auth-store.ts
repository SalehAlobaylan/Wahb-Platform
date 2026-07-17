import { create } from 'zustand';
import type { AuthUser } from '@/types';
import { useFeedStore } from './feed-store';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set((state) => {
    if (state.user?.id !== user.id) useFeedStore.getState().resetInteractionState();
    return { user, isAuthenticated: true, isLoading: false };
  }),
  clearUser: () => set((state) => {
    if (state.user) useFeedStore.getState().resetInteractionState();
    return { user: null, isAuthenticated: false, isLoading: false };
  }),
  setLoading: (isLoading) => set({ isLoading }),
}));
