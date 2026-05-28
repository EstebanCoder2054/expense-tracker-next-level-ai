import * as Linking from 'expo-linking';

/**
 * Must match an entry in Supabase → Authentication → URL configuration → Redirect URLs.
 * Uses `app.json` scheme (`expensetracker`) — typically `expensetracker://auth/callback` on a dev build.
 * (We avoid `expo-auth-session` here so iOS builds don’t pull a mismatched nested `expo-crypto`.)
 */
export function getOAuthRedirectUri(): string {
  return Linking.createURL('auth/callback', { scheme: 'expensetracker' });
}
