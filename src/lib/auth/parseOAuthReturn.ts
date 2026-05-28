import type { SupabaseClient } from '@supabase/supabase-js';

/** Parse access_token flow (hash) or PKCE (query ?code=). */
export function parseOAuthReturnParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    const hash = url.slice(hashIdx + 1);
    new URLSearchParams(hash).forEach((v, k) => {
      out[k] = v;
    });
  }
  if (!out.access_token && !out.code) {
    const qIdx = url.indexOf('?');
    if (qIdx !== -1) {
      const end = hashIdx === -1 ? url.length : hashIdx;
      const query = url.slice(qIdx + 1, end);
      new URLSearchParams(query).forEach((v, k) => {
        out[k] = v;
      });
    }
  }
  return out;
}

export async function applyOAuthReturnUrl(
  supabase: SupabaseClient,
  url: string,
): Promise<void> {
  const params = parseOAuthReturnParams(url);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  const access = params.access_token;
  const refresh = params.refresh_token;
  if (access && refresh) {
    const { error } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    if (error) throw error;
    return;
  }
  throw new Error('No authorization code or tokens in return URL');
}
