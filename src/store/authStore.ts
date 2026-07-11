/**
 * authStore.ts — Zustand
 *
 * Global auth state. Hydrated from Keychain on cold start.
 * Controls which navigator (AuthStack vs MainTabs) the app renders.
 */

import { create } from 'zustand';
import {
  signUpWithPhone as apiSignUpWithPhone,
  signInWithPhone as apiSignInWithPhone,
  storeToken,
  getStoredToken,
  clearStoredCredentials,
  mockUserProfile,
  type UserProfile,
} from '../services/authService';
import { USE_MOCK_API } from '../constants/config';
import { supabase } from '../services/supabase';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrateSession: () => Promise<void>;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  signUpWithPhone: (phone: string, password: string, email: string, name: string) => Promise<void>;
  loginAsMock: (mobileNumber?: string) => void;
  logout: () => Promise<void>;
  updateUserQuota: (newQuota: number) => void;
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
        if (USE_MOCK_API || token === 'mock-token-dev') {
          const stubUser = mockUserProfile('mock');
          set({ token, user: stubUser, isAuthenticated: true });
        } else {
          const { data: { user: sbUser }, error } = await supabase.auth.getUser(token);
          if (sbUser) {
            let quota = 1;
            let name = 'User ' + (sbUser.phone ?? '').slice(-4);
            let email = '';
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('license_quota, name, email')
                .eq('id', sbUser.id)
                .single();
              if (profile) {
                quota = profile.license_quota ?? 1;
                name = profile.name ?? name;
                email = profile.email ?? '';
              }
            } catch (err) {
              console.warn('[authStore] Failed to fetch custom profile quota on hydration:', err);
            }

            const userProfile: UserProfile = {
              id: sbUser.id,
              mobile_number: sbUser.phone ?? '',
              name,
              email,
              license_quota: quota,
              provider: 'phone',
            };
            set({ token, user: userProfile, isAuthenticated: true });
          } else {
            await clearStoredCredentials();
            set({ token: null, user: null, isAuthenticated: false });
          }
        }
      }
    } catch (e) {
      console.warn('[authStore] hydrateSession failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithPhone: async (phone, password) => {
    set({ isLoading: true, error: null });
    try {
      if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 800));
        const user = mockUserProfile('mock', phone);
        await storeToken('mock-token-dev');
        set({ user, token: 'mock-token-dev', isAuthenticated: true });
      } else {
        const { user, token } = await apiSignInWithPhone(phone, password);
        await storeToken(token);
        set({ user, token, isAuthenticated: true });
      }
    } catch (e: any) {
      set({ error: e.message ?? 'Login failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithPhone: async (phone, password, email, name) => {
    set({ isLoading: true, error: null });
    try {
      if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 800));
        
        // Mock check for existing phone number
        if (phone === '+970599000000') {
          throw new Error('MOBILE_EXISTS');
        }

        const user = mockUserProfile('mock', phone, name, email);
        await storeToken('mock-token-dev');
        set({ user, token: 'mock-token-dev', isAuthenticated: true });
      } else {
        const { user, token } = await apiSignUpWithPhone(phone, password, email, name);
        await storeToken(token);
        set({ user, token, isAuthenticated: true });
      }
    } catch (e: any) {
      set({ error: e.message ?? 'Registration failed' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  loginAsMock: (mobileNumber) => {
    const user = mockUserProfile('mock', mobileNumber);
    set({ user, token: 'mock-token-dev', isAuthenticated: true, error: null });
  },

  logout: async () => {
    if (!USE_MOCK_API) {
      await supabase.auth.signOut();
    }
    await clearStoredCredentials();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUserQuota: (newQuota: number) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, license_quota: newQuota } });
    }
  },

  clearError: () => set({ error: null }),
}));
