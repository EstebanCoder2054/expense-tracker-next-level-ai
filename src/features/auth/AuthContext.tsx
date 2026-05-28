import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { applyOAuthReturnUrl } from '@/lib/auth/parseOAuthReturn';
import { getOAuthRedirectUri } from '@/lib/auth/oauthRedirect';
import { getSupabase } from '@/lib/supabase/client';
import { getSupabaseEnv } from '@/lib/supabase/env';

WebBrowser.maybeCompleteAuthSession();

export type AuthContextValue = {
  supabase: ReturnType<typeof getSupabase>;
  session: Session | null;
  user: User | null;
  initialized: boolean;
  cloudConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; hasSession: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  const cloudConfigured = getSupabaseEnv().configured;
  const supabase = useMemo(() => getSupabase(), []);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setInitialized(true);
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitialized(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error('Supabase is not configured') };
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error ? new Error(error.message) : null };
    },
    [supabase],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error('Supabase is not configured'), hasSession: false };
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      return {
        error: error ? new Error(error.message) : null,
        hasSession: Boolean(data.session),
      };
    },
    [supabase],
  );

  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null; cancelled?: boolean }> => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    try {
      const redirectTo = getOAuthRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: new Error(error.message) };
      if (!data.url) return { error: new Error('No OAuth URL from Supabase') };
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: null, cancelled: true };
      }
      if (result.type !== 'success' || !('url' in result) || !result.url) {
        return { error: null, cancelled: true };
      }
      await applyOAuthReturnUrl(supabase, result.url);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      session,
      user: session?.user ?? null,
      initialized,
      cloudConfigured,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [
      supabase,
      session,
      initialized,
      cloudConfigured,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
