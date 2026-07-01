/**
 * authStore.ts  — Zustand
 *
 * Global auth state. Hydrated from Keychain on cold start.
 * Controls which navigator (AuthStack vs MainTabs) the app renders.
 */

import { create } from 'zustand';
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithMicrosoft,
  signOut,
  storeToken,
  getStoredToken,
  clearStoredCredentials,
  mockUserProfile,
  type UserProfile,
} from '../services/authService';
import { USE_MOCK_API } from '../constants/config';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateSession: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginAsMock: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  hydrateSession: async () => {
    set({ isLoading: true });
    try {
      const token = await getStoredToken();
      if (token) {
        const stubUser = mockUserProfile('mock');
        set({ token, user: stubUser, isAuthenticated: true });
      }
    } catch (e) {
      console.warn('[authStore] hydrateSession failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithGoogle();
      const token = await _exchangeForCareTagToken(user);
      await storeToken(token);
      set({ user, token, isAuthenticated: true });
    } catch (e: any) {
      if (e.message !== 'CANCELLED') set({ error: e.message ?? 'Google login failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithFacebook: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithFacebook();
      const token = await _exchangeForCareTagToken(user);
      await storeToken(token);
      set({ user, token, isAuthenticated: true });
    } catch (e: any) {
      set({ error: e.message ?? 'Facebook login failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithMicrosoft: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithMicrosoft();
      const token = await _exchangeForCareTagToken(user);
      await storeToken(token);
      set({ user, token, isAuthenticated: true });
    } catch (e: any) {
      set({ error: e.message ?? 'Microsoft login failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  loginAsMock: () => {
    const user = mockUserProfile('mock');
    set({ user, token: 'mock-token-dev', isAuthenticated: true, error: null });
  },

  logout: async () => {
    const { user } = get();
    if (user) await signOut(user.provider);
    await clearStoredCredentials();
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

/**
 * TODO (backend): Replace with POST /auth/oauth { provider, accessToken } -> { token }
 */
async function _exchangeForCareTagToken(_user: UserProfile): Promise<string> {
  if (USE_MOCK_API) return `mock-jwt-${Date.now()}`;
  throw new Error('Real token exchange not yet implemented');
}
