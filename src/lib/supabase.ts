import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OAuth consent shows this URL’s host. Options (both need a paid Supabase org):
// - Vanity subdomain: https://bootwatch.supabase.co (CLI: vanity-subdomains activate; cannot mix with custom domain).
// - Custom domain: https://api.bootwatch.app (Dashboard custom-domain add-on).
// After either is live, set EXPO_PUBLIC_SUPABASE_URL to that origin and add
// https://<that-host>/auth/v1/callback to Google Cloud → OAuth client → Authorized redirect URIs.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
