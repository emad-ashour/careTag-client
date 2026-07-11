/**
 * supabase.ts
 *
 * Configures and exports the Supabase client.
 * Dynamically resolves the API URL based on Platform.OS to support
 * local development database across emulators.
 */

import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Local development defaults for Supabase CLI
const LOCAL_IOS_URL = 'http://127.0.0.1:54321';
const LOCAL_ANDROID_URL = 'http://10.0.2.2:54321';

const SUPABASE_URL = Platform.select({
  ios: LOCAL_IOS_URL,
  android: LOCAL_ANDROID_URL,
  default: LOCAL_IOS_URL,
});

// Default placeholder Anon key for local supabase instance
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTgwMDAwMDAsImV4cCI6MTkxODAwMDAwMH0.placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Session hydration is handled manually via useAuthStore / Keychain
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
