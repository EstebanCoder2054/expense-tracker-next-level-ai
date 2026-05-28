export function getSupabaseEnv(): {
  url: string;
  anonKey: string;
  configured: boolean;
} {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    '';
  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    configured: Boolean(url && anonKey),
  };
}
