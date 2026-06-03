import type { SupabaseClient } from '@supabase/supabase-js';

/** Parses query string and hash fragment from OAuth/recovery redirects. */
export function extractOAuthParamsFromUrl(url: string): Record<string, string> {
  const result: Record<string, string> = {};

  const queryMatch = url.match(/\?([^#]*)/);
  if (queryMatch?.[1]) {
    const qs = new URLSearchParams(queryMatch[1]);
    qs.forEach((value, key) => {
      result[key] = value;
    });
  }

  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    const hashParams = new URLSearchParams(url.slice(hashIdx + 1));
    hashParams.forEach((value, key) => {
      result[key] = value;
    });
  }

  return result;
}

function looksLikePasswordRecoveryRedirect(url: string, params: Record<string, string>): boolean {
  if (params.type === 'recovery') return true;
  if (/[#/?]reset-password/i.test(url) || url.includes('/reset-password')) return true;
  return false;
}

/** Recovery links vs Google OAuth errors (fragment may contain error= on failure). */
function urlMightBeRecoveryDeepLink(url: string, params: Record<string, string>): boolean {
  return looksLikePasswordRecoveryRedirect(url, params) || !!(params.token_hash && params.type === 'recovery');
}

function decodeAuthErrorFromParams(params: Record<string, string>): string | undefined {
  if (!params.error && !params.error_description && !params.error_code) return undefined;
  const desc = params.error_description ?? params.error ?? params.error_code ?? 'Authentication failed';
  try {
    return decodeURIComponent(String(desc).replace(/\+/g, ' '));
  } catch {
    return String(desc);
  }
}

/**
 * Applies tokens / PKCE code / recovery token_hash from a deep link when it is a password-recovery URL.
 * Avoids treating Google OAuth returns (same scheme) as recovery: those lack type=recovery and reset-password path.
 */
export async function applyPasswordRecoveryDeepLink(
  url: string,
  client: SupabaseClient,
): Promise<{ handled: boolean; error?: string }> {
  const params = extractOAuthParamsFromUrl(url);

  const authErr =
    urlMightBeRecoveryDeepLink(url, params) ? decodeAuthErrorFromParams(params) : undefined;
  if (authErr) {
    return { handled: true, error: authErr };
  }

  /** Supabase email can redirect with token_hash + type=recovery in the query (OTP-style), not only #access_token */
  if (params.token_hash && params.type === 'recovery') {
    try {
      const { error } = await client.auth.verifyOtp({
        token_hash: params.token_hash,
        type: 'recovery',
      });
      if (error) return { handled: true, error: error.message };
      return { handled: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Recovery verification failed';
      return { handled: true, error: msg };
    }
  }

  const hasOAuthPayload = !!(params.access_token || params.code);
  if (!hasOAuthPayload) return { handled: false };

  if (!looksLikePasswordRecoveryRedirect(url, params)) return { handled: false };

  try {
    if (params.code) {
      const { error } = await client.auth.exchangeCodeForSession(params.code);
      if (error) {
        const hint =
          /pkce|code verifier|invalid/i.test(error.message)
            ? `${error.message} Try opening the reset link on the same device where you requested it, or request a new email.`
            : error.message;
        return { handled: true, error: hint };
      }
      return { handled: true };
    }

    if (params.access_token) {
      const { error } = await client.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token ?? '',
      });
      if (error) return { handled: true, error: error.message };
      return { handled: true };
    }

    return { handled: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Recovery link failed';
    return { handled: true, error: msg };
  }
}
