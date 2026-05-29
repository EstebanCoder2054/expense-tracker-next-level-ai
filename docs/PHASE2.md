# Phase 2 — Auth + Cloud Foundation

> **Status: 🟡 In progress.** Auth is implemented end-to-end (Supabase client, session restore, email + Google, SecureStore persistence, route guards). **Data sync — pushing/pulling SQLite expenses/categories to Supabase — is NOT done yet.**
>
> See also:
> - [PHASE2_SETUP.md](PHASE2_SETUP.md) — the operational Supabase dashboard walkthrough (account, schema push, providers, redirect URLs, env vars). Read this for hands-on setup.
> - [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — overall vision, stack, principles.

---

## 1. Phase 2 Scope

**Auth + cloud foundation.** Goals:

- Integrate Supabase project
- Google auth
- Email/password auth
- Profile/session handling
- Local-to-auth migration strategy scaffolding
- Remote profile basics
- Protected app flow
- **Preserve local mode support** (a user who chose "Continue locally" must still work without an account)

---

## 2. Numbered Phase 2 Plan (the order we agreed on)

1. **Create Supabase project + base schema** (profiles, user preferences, categories, expenses) with RLS scoping every table to `user_id`.
2. **Add Supabase client** (lazy, nullable — app must run without env vars) and env wiring (`EXPO_PUBLIC_SUPABASE_*`).
3. **Auth context** — session restore from SecureStore, sign-in, sign-up, sign-out, Google OAuth.
4. **Wire UI** — Entry screen (email + password + Google + Continue locally), Account modal (signed-in state + sign out).
5. **Route guard** in `app/index.tsx` — auth-aware redirect after waiting for `initialized`.
6. **Local↔cloud migration scaffolding** — `entry_mode` field (`local` / `pending_cloud`) already exists from Phase 1; use it to flag "user has local data to upload after sign-in."
7. **Schema parity** — ensure local SQLite shape matches the cloud table shape (it does; both use `TEXT` IDs to align with `createId()`).
8. **Data sync — upload, then download.** **NOT IMPLEMENTED YET** (see §6 below).

A slimmer Phase 2 cut commonly used: **steps 1–6 + step 8 upload-only first**, then download + second-device + migration polish as a follow-up slice.

---

## 3. What Is Implemented (as of this writing)

### Packages added

- `@supabase/supabase-js`
- `expo-secure-store`
- `expo-linking` (replaced `expo-auth-session` — see §5)
- `react-native-url-polyfill`

### Files added / changed

| File | Purpose |
|---|---|
| `src/lib/supabase/env.ts` | Reads `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (falls back to publishable key). Returns `configured: false` if missing. |
| `src/lib/supabase/client.ts` | Lazy, **nullable** singleton client with **SecureStore** session persistence. Every consumer must handle the `null` case — app is designed to run without cloud credentials. |
| `src/features/auth/AuthContext.tsx` | Session restore, `signInWithPassword`, `signUpWithPassword` (returns `hasSession` when email-confirm is off), `signInWithGoogle` (in-app browser + PKCE / hash handling), `signOut`, `initialized` flag. |
| `src/lib/auth/oauthRedirect.ts` | Builds the OAuth redirect URI using **`expo-linking`** + the `expensetracker` scheme. |
| `src/lib/auth/parseOAuthReturn.ts` | Handles the OAuth return URL — `exchangeCodeForSession` / `setSession`. |
| `app/_layout.tsx` | `react-native-url-polyfill` imported first, then **`AuthProvider`** wrapping the stack (inside `SQLiteProvider`). |
| `app/index.tsx` | Waits for auth `initialized`. Signed in + onboarding incomplete → preferences. Signed in + onboarding complete → home. Signed out → onboarding/home as Phase 1. |
| `app/(onboarding)/EntryScreen` | Email + password, **Sign in**, **Create account**, **Google**, **Continue locally**. Sets `entryMode = 'pending_cloud'` after cloud auth. |
| `app/modals/account.tsx` | Signed-in: shows email + **Sign out**. Signed-out: **Sign in or sign up** → entry route. |
| `supabase/migrations/20260205160000_phase2_core_schema.sql` | `profiles`, `user_preferences`, `categories`, `expenses` + RLS. `categories.id` and `expenses.id` are **`TEXT`** (not UUID) to match `createId()` for sync. |
| `docs/PHASE2_SETUP.md` | Full Supabase dashboard walkthrough (renamed from `docs/PHASE2.md`). |
| `.env.example` | `EXPO_PUBLIC_SUPABASE_*` + `DATABASE_URL` template. |

### Behaviors that work end-to-end

- Cold start with no credentials → `getSupabaseEnv().configured === false`, app falls back to local mode cleanly.
- Cold start with credentials → session is restored from SecureStore.
- Email sign-up → if Supabase has "Confirm email" **off**, session is returned immediately and the app routes to home.
- Email sign-in → session stored in SecureStore.
- Google sign-in → opens the in-app browser, returns via `expensetracker://auth/callback`, session exchanged and stored.
- Sign-out from the Account modal clears the session.
- `npx tsc --noEmit` passes.

---

## 4. Key Decisions Made During Phase 2

### Session storage: SecureStore, not AsyncStorage

`expo-secure-store` is used (NOT AsyncStorage). Keys are encrypted at rest on device. The Supabase client is configured to use SecureStore as the auth storage adapter.

### Supabase client is lazy + nullable

`src/lib/supabase/client.ts` returns `null` when env vars are missing (`getSupabaseEnv().configured === false`). **Every consumer must handle the null case.** This keeps Phase 1 ("local-only with no cloud") working even after Phase 2 ships — a deliberate principle from [PROJECT_CONTEXT.md §13](PROJECT_CONTEXT.md).

### ID strategy: `TEXT` IDs everywhere

`categories.id` and `expenses.id` are `TEXT` (not UUID) in Postgres because SQLite generates them with `createId()`. This is **intentional for sync** — the same row keeps the same id locally and in the cloud, so upload/download is idempotent. Don't "fix" this to UUID.

### `EXPO_PUBLIC_*`, not `NEXT_PUBLIC_*`

Only `EXPO_PUBLIC_*` vars are bundled into the Expo client. The Supabase publishable/anon key is safe to ship because **RLS is enforced server-side**. Service-role keys and `DATABASE_URL` must **never** get an `EXPO_PUBLIC_` prefix.

### Google OAuth uses `expo-linking`, not `expo-auth-session`

We started with `expo-auth-session` and **removed it.** It pulls a nested `expo-crypto` that fails to compile with the current Expo SDK (Swift `StaticAsyncFunction` errors). Replaced with `expo-linking`'s `Linking.createURL('auth/callback', { scheme: 'expensetracker' })` in `src/lib/auth/oauthRedirect.ts`. CocoaPods was refreshed (`ExpoCrypto` removed from the iOS project).

### `expensetracker://auth/callback` must stay in the Supabase Redirect URLs

The `expensetracker://` scheme in `app.json` and the Supabase **Authentication → URL configuration → Redirect URLs** list must stay in sync. Allow-listed entry for the dev build: `expensetracker://auth/callback`. If Google OAuth says `redirect_uri_mismatch`, add **exactly** the URI from the error (or log `getOAuthRedirectUri()` once) — multiple entries are allowed.

### Dev build only — no Expo Go assumptions

The `expensetracker://` scheme requires a dev build. `expo-auth-session`'s `exp://…/--/auth/callback` Expo Go URL is **not needed**. Docs and code comments were updated to reflect this.

### Provider order in `app/_layout.tsx`

The order matters (later providers can use earlier ones):

```
GestureHandlerRootView
  → QueryClientProvider
    → SQLiteProvider
      → ThemeProvider
        → AuthProvider
          → SelectedDateProvider
            → Stack
```

`react-native-url-polyfill` is imported **first** at the top of `_layout.tsx`, before anything else — Supabase's fetch path needs it on RN.

### Auth state and onboarding state are independent

A signed-out user who finished onboarding still lands on home. A signed-in user who hasn't done preferences is routed through onboarding's preferences screen. The route gate (`app/index.tsx`) checks both `AuthContext.initialized` and `app_settings.onboarding_complete`.

---

## 5. Trouble We've Hit (and How We Solved It)

- **`expo-auth-session` broke the iOS build.** Nested `expo-crypto` failed Swift compile (`StaticAsyncFunction`). **Fix:** removed `expo-auth-session`, switched to `expo-linking`. Pods refreshed.
- **First iOS build needed `iPhone 17` simulator targeting.** Used `npx expo run:ios --device "iPhone 17"`. To list available sims: `xcrun simctl list devices available | grep iPhone`.
- **Trigger creation in the migration.** Some Supabase Postgres versions error on `EXECUTE PROCEDURE` vs `EXECUTE FUNCTION`. Both work depending on PG version; if `db push` complains, swap the keyword. See [PHASE2_SETUP.md](PHASE2_SETUP.md) troubleshooting section.
- **`db push` "trigger does not exist, skipping"** notices are informational — first-time push of a migration that drops/creates a trigger will report this on the drop step; safe to ignore.
- **Env vars not loading after `.env` edits** → `npx expo start -c` once to clear the cache.

---

## 6. What's Left in Phase 2 (NOT done yet)

The big one: **data sync between SQLite and Supabase.**

Specifically:

1. **Upload after sign-in / sign-up.** When `entry_mode === 'pending_cloud'`, push the local `categories` and `expenses` rows to Supabase tagged with the new `user_id`. Mark `entry_mode = 'synced'` (or similar) once done.
2. **Download on session restore.** On a second device (or after sign-in on a fresh install), pull the user's cloud rows into local SQLite.
3. **Conflict rules.** Since IDs are stable, "last-write-wins by `updated_at`" is the simplest workable rule. Document it before implementing.
4. **Realtime (optional, deferred).** Not in Phase 2 unless we specifically pull it forward.
5. **Migration polish.** Edge cases: user signs out → local data stays? User signs in to a *different* account on the same device → what happens? Document the decisions before implementing.

This is **Part F** in [PHASE2_SETUP.md](PHASE2_SETUP.md) — the setup guide describes what we're about to build; the code doesn't exist yet.

---

## 7. Forward-Looking Notes / Open Questions

- **Anonymous / local-only users:** stay SQLite-only until they sign in. Sign-in then triggers the upload step. Decision was made — do **not** require sign-in for Phase 2.
- **Email-only first, Google later** is an acceptable shipping cut if Google OAuth setup proves slow — the auth code already handles both.
- **Profile table** is in the schema but profile-editing UI is minimal. Could extend with display name, avatar, etc. in a later phase.
- **Sentry / monitoring** still not wired (per Phase 2 scope — deliberate).

---

## 8. Phase 2 Run / Dev Workflow

Same as Phase 1 (dev build only, not Expo Go), plus:

```bash
# Supabase CLI (via npx — no global install)
npm run supabase:login
npm run supabase:link        # then pass --project-ref <ref>
npm run db:push              # apply supabase/migrations/*.sql to the linked remote DB
```

When env vars change in `.env`, restart Metro with `-c` once: `npx expo start -c`.

To test the full auth loop:

1. Replay onboarding (from Home) or clear app data so you reach Entry again.
2. **Email:** sign up / sign in. If Supabase has "Confirm email" on, check inbox after sign-up.
3. **Google:** opens the browser, returns to the app after consent.
4. **Continue locally** still skips cloud auth entirely.
5. **Account modal:** shows "Signed in as …" + **Sign out** when logged in.

---

## 9. Security Reminders

- DB password / service-role keys must **never** appear in code, `.env` files committed to git, or chat. If they have, **rotate them immediately** in the Supabase dashboard and update `.env`.
- `.env` is gitignored; `.env.example` is the committed template.
- RLS is the line of defense — the publishable/anon key in the bundle is safe **only because** RLS is enforced on every table. Don't add tables without RLS policies.

---

## 10. Handoff to Phase 3

Phase 3 (Budgets + Reports) can begin once §6 above (data sync) is at least *upload-complete*. Phase 3 doesn't strictly require sync to be 100% — local-only reports work — but if a user signs in mid-Phase-3 work, their data should already be flowing to the cloud.
