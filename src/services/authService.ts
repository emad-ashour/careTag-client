/**
 * authService.ts
 *
 * Secure Keychain storage & Supabase Phone/Password Auth.
 */

import * as Keychain from 'react-native-keychain';
import { supabase } from './supabase';
import { USE_MOCK_API } from '../constants/config';

export interface UserProfile {
  id: string;
  mobile_number: string;
  email?: string;
  name: string;
  license_quota: number;
  provider: 'phone' | 'mock';
}

const KEYCHAIN_SERVICE = 'com.caretag.client.auth';

export const mockUserProfile = (provider: UserProfile['provider'], mobileNumber?: string, name?: string, email?: string): UserProfile => ({
  id: `usr-${provider}-123`,
  mobile_number: mobileNumber || '+970599000000',
  name: name || 'Abu Omar',
  email: email || 'abuomar@caretag.ps',
  license_quota: 1, // default 1 license
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

/**
 * Checks if a mobile number is already registered in the profiles table.
 */
export const checkMobileNumberExists = async (phone: string): Promise<boolean> => {
  if (USE_MOCK_API) {
    // In mock mode, simulate "+970599000000" as already registered
    return phone === '+970599000000';
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile_number', phone);

    if (error) throw error;
    return data && data.length > 0;
  } catch (err) {
    console.error('[authService] checkMobileNumberExists failed:', err);
    // If the database call fails (e.g. table doesn't exist yet), let auth signUp handle duplicate checks
    return false;
  }
};

/**
 * Signs up a user using Supabase Auth phone provider and stores user metadata.
 */
export const signUpWithPhone = async (
  phone: string,
  password: string,
  email: string,
  name: string
): Promise<{ user: UserProfile; token: string }> => {
  // Check if number already registered first
  const exists = await checkMobileNumberExists(phone);
  if (exists) {
    throw new Error('MOBILE_EXISTS');
  }

  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: {
        name,
        email,
      },
    },
  });

  if (error) {
    console.error('[authService] signUpWithPhone error:', error.message);
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error('Verification required or registration incomplete.');
  }

  // Create local user profile
  const user: UserProfile = {
    id: data.user.id,
    mobile_number: phone,
    name,
    email,
    license_quota: 1,
    provider: 'phone',
  };

  return { user, token: data.session.access_token };
};

/**
 * Signs in a user using Supabase Auth phone provider.
 */
export const signInWithPhone = async (phone: string, password: string): Promise<{ user: UserProfile; token: string }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  });

  if (error) {
    console.error('[authService] signInWithPhone error:', error.message);
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error('Failed to retrieve user session.');
  }

  let quota = 1;
  let name = 'User ' + phone.slice(-4);
  let email = '';
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('license_quota, name, email')
      .eq('id', data.user.id)
      .single();

    if (!profileErr && profile) {
      quota = profile.license_quota ?? 1;
      name = profile.name ?? name;
      email = profile.email ?? '';
    }
  } catch (err) {
    console.warn('[authService] Could not fetch profiles quota:', err);
  }

  const user: UserProfile = {
    id: data.user.id,
    mobile_number: phone,
    name,
    email,
    license_quota: quota,
    provider: 'phone',
  };

  return { user, token: data.session.access_token };
};
