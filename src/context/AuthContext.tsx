import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

// Expo Go doesn't carry your app's Apple Sign-In entitlement, so native
// Apple auth can terminate the process. Gate it on dev/prod builds only.
const isExpoGo = Constants.appOwnership === 'expo';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const DISPLAY_NAME_ALLOWED_RE = /^[A-Za-z0-9 '._-]+$/;

function randomUserHandle(): string {
  return `User${Math.floor(10000 + Math.random() * 90000)}`;
}

function sanitizeMetaName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2 || cleaned.length > 30) return null;
  if (!DISPLAY_NAME_ALLOWED_RE.test(cleaned)) return null;
  return cleaned;
}

async function setProfileName(userId: string, mode: 'insert' | 'update'): Promise<void> {
  // Try up to 3 handles in case of a unique-index collision with another User#####.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = randomUserHandle();
    const { error } =
      mode === 'insert'
        ? await supabase.from('profiles').insert({ id: userId, display_name: candidate })
        : await supabase.from('profiles').update({ display_name: candidate }).eq('id', userId);
    if (!error) return;
    // 23505 = unique_violation → retry with a different handle.
    if ((error as { code?: string }).code !== '23505') return;
  }
}

async function ensureProfile(user: User) {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .single();

  // Prefer a validated name from the OAuth provider metadata; otherwise fall
  // back to a neutral "User#####" handle. We never use the email prefix — it
  // leaks personal info (see ProfileScreen display-name editor).
  const metaName =
    sanitizeMetaName(user.user_metadata?.display_name) ??
    sanitizeMetaName(user.user_metadata?.full_name) ??
    sanitizeMetaName(user.user_metadata?.name);

  if (!data) {
    if (metaName) {
      const { error } = await supabase.from('profiles').insert({ id: user.id, display_name: metaName });
      if (error) await setProfileName(user.id, 'insert');
    } else {
      await setProfileName(user.id, 'insert');
    }
  } else if (!data.display_name) {
    if (metaName) {
      const { error } = await supabase.from('profiles').update({ display_name: metaName }).eq('id', user.id);
      if (error) await setProfileName(user.id, 'update');
    } else {
      await setProfileName(user.id, 'update');
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) ensureProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) ensureProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, displayName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signInWithGoogle() {
    try {
      const redirectUrl = AuthSession.makeRedirectUri();
      console.log('[auth] google redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) return { error: error?.message ?? 'Failed to start Google sign-in' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success') return { error: null };

      // Supabase may return tokens in the URL fragment (implicit flow) or as a
      // `?code=` query param (PKCE). Handle both so neither path silently fails.
      const url = new URL(result.url);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token') ?? url.searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? url.searchParams.get('refresh_token');
      const code = url.searchParams.get('code');

      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) return { error: exErr.message };
        return { error: null };
      }

      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (sessionError) return { error: sessionError.message };
      }

      return { error: null };
    } catch (e) {
      console.error('[auth] google sign-in failed:', e);
      const message = e instanceof Error ? e.message : 'Google sign-in failed';
      return { error: message };
    }
  }

  async function signInWithApple() {
    if (Platform.OS !== 'ios') {
      return { error: 'Apple sign-in is only available on iOS' };
    }

    if (isExpoGo) {
      return {
        error:
          'Apple sign-in requires a development build. Use email or Google sign-in while testing in Expo Go.',
      };
    }

    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        return { error: 'Apple sign-in is not available on this device.' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { error: 'No identity token received from Apple' };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      return { error: error?.message ?? null };
    } catch (e) {
      const code = (e as { code?: string } | undefined)?.code;
      // User tapped "Cancel" on the Apple sheet — not an error.
      if (code === 'ERR_REQUEST_CANCELED') return { error: null };
      console.error('[auth] apple sign-in failed:', e);
      const message = e instanceof Error ? e.message : 'Apple sign-in failed';
      return { error: message };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
