/**
 * authService.ts
 *
 * Secure Keychain storage & third-party OAuth integrations.
 */

import * as Keychain from 'react-native-keychain';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'facebook' | 'microsoft' | 'mock';
}

const KEYCHAIN_SERVICE = 'com.caretag.client.auth';

export const mockUserProfile = (provider: UserProfile['provider']): UserProfile => ({
  id: `usr-${provider}-123`,
  email: `john.doe@${provider}-auth.com`,
  name: 'John Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  provider,
});

export const storeToken = async (token: string): Promise<void> => {
  await Keychain.setGenericPassword('auth_session', token, {
    service: KEYCHAIN_SERVICE,
  });
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
    if (credentials) {
      return credentials.password;
    }
  } catch (error) {
    console.error('[authService] getStoredToken error:', error);
  }
  return null;
};

export const clearStoredCredentials = async (): Promise<void> => {
  await Keychain.resetGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    // Configure if not already configured
    await GoogleSignin.configure();
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Parse Google user
    const user = userInfo.data?.user;
    if (!user) throw new Error('No user data returned from Google');
    
    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Google User',
      avatarUrl: user.photo || undefined,
      provider: 'google',
    };
  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('CANCELLED');
    }
    console.error('[authService] Google sign in failed:', error);
    throw error;
  }
};

export const signInWithFacebook = async (): Promise<UserProfile> => {
  // Stubbed for standard implementation
  return mockUserProfile('facebook');
};

export const signInWithMicrosoft = async (): Promise<UserProfile> => {
  // Stubbed for standard implementation
  return mockUserProfile('microsoft');
};

export const signOut = async (provider: UserProfile['provider']): Promise<void> => {
  if (provider === 'google') {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.warn('[authService] Google signOut failed:', e);
    }
  }
};
