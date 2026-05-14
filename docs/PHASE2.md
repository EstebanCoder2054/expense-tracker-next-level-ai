# Phase 2 — Supabase backend (monorepo)

This repo keeps **everything in one place**:

| Area | Location |
|------|----------|
| Mobile app (Expo) | `app/`, `src/` |
| Database schema, RLS, triggers | `supabase/migrations/` |
| Local Supabase config | `supabase/config.toml` |
| Optional later: Edge Functions | `supabase/functions/` |

There is no separate microservice repo: **Postgres + Auth + Row Level Security** on Supabase *is* the backend. The Expo app will call Supabase with the **publishable** or **anon** key (safe because RLS enforces per-user data).

### Do I need to “download Supabase”?

**No separate install is required** for what you’re doing:

| Tool | What it is |
|------|-------------|
| **`npx supabase@latest …`** | Runs the **Supabase CLI** from npm when you need it (login, link, `db push`). No permanent “Supabase app” install required. |
| **Browser dashboard** | [supabase.com](https://supabase.com) → your project. Use this for tables, Auth, SQL Editor, API keys — **this is enough** for day-to-day. |

Optional: Homebrew `brew install supabase/tap/supabase` if you prefer a global `supabase` command instead of `npx`.

### `db push` notices like “trigger does not exist, skipping”

That comes from `DROP TRIGGER IF EXISTS` on a **first** migration run — **normal**, not an error. Your **Table Editor** showing `profiles`, `categories`, `expenses`, `user_preferences` means the schema applied.

---

## Naming: `EXPO_PUBLIC_*` vs `NEXT_PUBLIC_*`

- **`NEXT_PUBLIC_*`** is for **Next.js** only.
- This repo is **Expo**: use **`EXPO_PUBLIC_*`** so Metro bundles those values into the client.
- The Supabase project URL must start with **`https://`** (not `http`).

---

## Part A — Create the Supabase project (dashboard)

Do these steps once per environment (e.g. one project for **dev**, another later for **production**).

### Step A1 — Account

1. Open [https://supabase.com](https://supabase.com) and sign in (GitHub is fine).
2. Click **New project**.

### Step A2 — Organization & project name

1. Pick an **organization** (personal or team).
2. **Name**: e.g. `expense-tracker-dev`.
3. **Database password**: generate a strong password and **save it in a password manager**. You rarely type it day to day; the CLI and dashboard use other keys. You need it for direct Postgres access (optional).

### Step A3 — Region

1. Choose a **region** close to you or your users (latency matters for the app).
2. **Free tier** is enough to start.

### Step A4 — Create & wait

1. Click **Create new project**.
2. Wait until status is **Healthy** (can take 1–2 minutes).

### Step A5 — Note these values (you will need them)

1. **Project Settings** (gear) → **Data API** / **API**:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL` (must be `https://...supabase.co`).
   - **Publishable key** (`sb_publishable_...`) → `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - If the JS client asks for a JWT-style key, use the **anon** / **legacy anon** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. **Never** put the **secret** / **service_role** key in the Expo app (server-only).

### Step A6 — Optional: direct Postgres string (CLI / tools)

Use **Project Settings → Database** connection string, or:

`postgresql://postgres:[YOUR-PASSWORD]@db.<PROJECT_REF>.supabase.co:5432/postgres`

Put that in `.env` as `DATABASE_URL` (see `.env.example`). Replace `[YOUR-PASSWORD]` with the **database password** you set when creating the project.

### Project creation checklist (your screenshots)

- **Enable Data API**: ON — fine (needed for `supabase-js`).
- **Automatically expose new tables**: ON is OK for dev; we still define explicit **RLS** in migrations.
- **Enable automatic RLS**: OFF is OK — our migration **manually** enables RLS on each table.

---

## Part B — Apply the database schema (“Step 3”)

**What this means:** Right now Supabase only has empty Postgres + Auth. **Applying the schema** creates our tables (`profiles`, `user_preferences`, `categories`, `expenses`), **RLS policies**, and **triggers** by running the SQL in `supabase/migrations/`.

**Why CLI:** One command (`db push`) applies the same migration files your repo uses — reproducible and matches production later.

You can do **either** B1 (recommended) **or** B2 (SQL Editor).

### Step B1 — Supabase CLI + linked project (recommended)

**B1.1 — Install CLI**

- macOS (Homebrew): `brew install supabase/tap/supabase`
- Or use without global install: `npx supabase@latest --help`

**B1.2 — Log in**

```bash
npx supabase@latest login
```

Opens the browser to create an access token; paste it back in the terminal.

**B1.3 — Link this repo to your cloud project**

From the **ExpenseTracker** root:

```bash
cd /path/to/ExpenseTracker
npx supabase@latest link --project-ref <YOUR_PROJECT_REF>
```

Your **project ref** is the subdomain in `https://<ref>.supabase.co` (e.g. `ntleambfvzgssmknfpvb`).

The CLI may ask for the **database password** you set when creating the project — same password as in `DATABASE_URL`.

**B1.4 — Push migrations**

```bash
npx supabase@latest db push
```

This runs all files in `supabase/migrations/` against the linked remote database.

**B1.5 — Confirm in dashboard**

- **Table Editor**: you should see `profiles`, `user_preferences`, `categories`, `expenses`.
- **Authentication** → **Policies**: RLS policies should exist on those tables.

---

### Step B2 — SQL Editor only (no CLI)

If you prefer not to use the CLI yet:

1. Dashboard → **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/20260205160000_phase2_core_schema.sql` in this repo.
3. Copy **the entire file** into the editor.
4. Click **Run**.

If you see an error about `EXECUTE FUNCTION`, try replacing:

`EXECUTE FUNCTION` → `EXECUTE PROCEDURE`

(Postgres version differences; Supabase usually accepts `EXECUTE FUNCTION`.)

---

## Part C — Authentication providers

### Step C0 — User signups (your “third image”: Authentication settings)

Under **Authentication → Sign In / Providers** (or **Configuration → Signups** depending on dashboard version):

| Setting | Your screenshot | What it means |
|--------|-------------------|----------------|
| **Allow new users to sign up** | ON | Users can register — keep ON for Phase 2. |
| **Confirm email** | ON | Users must click the link in email before first sign-in. **Good for production.** For faster Expo testing, you can turn **Confirm email** OFF temporarily (remember to turn it back ON later). |
| **Allow anonymous sign-ins** | OFF | Fine unless we explicitly add anonymous auth later. |
| **Allow manual linking** | OFF | Fine for now. |

Click **Save changes** if the dashboard asks.

---

### Step C1 — Email provider

1. **Authentication** → **Providers** → **Email**.
2. Ensure the Email provider is **enabled**.

---

### Step C2 — Google Sign-in (full walkthrough)

Goal: Google Cloud trusts Supabase’s **callback URL**, and Supabase has your **Web client** ID + secret.

**Copy this callback URL** (replace `<ref>` with your project ref if different):

`https://<ref>.supabase.co/auth/v1/callback`  
Example: `https://ntleambfvzgssmknfpvb.supabase.co/auth/v1/callback`

---

#### C2.1 — Pick a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Top bar → **project dropdown** → select an existing project **or** **New project** → name it (e.g. `ExpenseTracker`) → **Create**.

---

#### C2.2 — OAuth consent screen (required before credentials)

1. Left menu: **APIs & Services** → **OAuth consent screen**.
2. **User type**: choose **External** (unless you use Google Workspace with Internal only).
3. **Create** and fill the wizard:
   - **App name** (shown to users): e.g. `Expense Tracker`.
   - **User support email**: your email.
   - **Developer contact email**: your email.
4. **Scopes** (step 2): defaults are usually fine → **Save and continue**.
5. **Test users** (step 3, while app is in **Testing**): **Add users** → add **every Gmail** that will try Google sign-in (including yours). **Save and continue**.
6. **Summary** → **Back to dashboard**.

Until you **Publish** the app, only **test users** can complete Google login. That’s fine for development.

---

#### C2.3 — Enable Google Identity API (if prompted)

Some flows need the Google+ API / People API — if Google asks, enable **Google Identity Services** or follow any “Enable API” link from the error page. Often **Credentials** creation works without extra steps.

---

#### C2.4 — Create the **Web** OAuth client (for Supabase)

1. **APIs & Services** → **Credentials**.
2. **+ Create credentials** → **OAuth client ID**.
3. If Google says configure consent screen first, complete **C2.2** above.
4. **Application type**: **Web application**.
5. **Name**: e.g. `Supabase Web`.
6. **Authorized JavaScript origins** → **Add URI**:
   - `https://ntleambfvzgssmknfpvb.supabase.co`  
   (your Supabase host only — **no** path, **no** trailing slash issues; use `https`.)
7. **Authorized redirect URIs** → **Add URI**:
   - `https://ntleambfvzgssmknfpvb.supabase.co/auth/v1/callback`  
   (**must match Supabase’s Callback URL exactly**, character for character.)
8. **Create**.
9. A dialog shows **Client ID** and **Client secret** → copy both (secret is shown once; if you lose it, create a new secret in Google).

---

#### C2.5 — Paste into Supabase

1. Supabase → **Authentication** → **Providers** → **Google**.
2. Turn **Enable Sign in with Google** **ON**.
3. **Client IDs**: paste the **Web client** Client ID (long string ending often with `.apps.googleusercontent.com`).
4. **Client Secret**: paste the **Client secret** from the same dialog.
5. **Skip nonce checks** / **Allow users without an email**: leave **OFF** unless you hit a known platform bug (we can adjust when Expo is wired).
6. **Save**.

---

#### C2.6 — Supabase URL configuration (avoid redirect errors)

1. **Authentication** → **URL configuration**.
2. **Site URL**: for now you can use `http://localhost:3000` or your real site; for Expo dev we’ll add more redirect URLs when implementing the app.
3. **Redirect URLs**: add the same callback if listed, and any **Expo** URLs Supabase docs list for your flow (we’ll add `exp://` patterns in the app integration step).

---

#### C2.7 — Quick tests

- **Google Cloud** → **Credentials** → open your OAuth client → confirm **redirect URI** is exactly Supabase’s `/auth/v1/callback`.
- **Supabase** → **Authentication** → **Users**: after a successful test sign-in, a user row should appear.

**Common errors**

| Error | Fix |
|--------|-----|
| `redirect_uri_mismatch` | Redirect URI in Google must **exactly** match Supabase’s callback URL (scheme, host, path). |
| `Access blocked: App has not completed verification` | App in **Testing** → add your Gmail under **Test users** on the consent screen. |
| `invalid_client` | Wrong Client ID/secret pasted in Supabase; re-copy from Google. |

---

#### C2.8 — Expo / native Google later (optional next phase)

For **in-app** Google on iOS/Android, Google often wants **separate** OAuth clients (iOS bundle ID, Android package + SHA-256). You can add those **Client IDs** in Supabase’s **Client IDs** field **comma-separated**, alongside the Web client ID. We’ll do that when we implement the auth screens.

---

### Step C3 — Site URL & redirects (important for deep links later)

1. **Authentication** → **URL configuration**.
2. **Site URL**: for dev, `exp://` or your Expo dev URL; for production, your real app URL.
3. **Redirect URLs**: add patterns Supabase docs recommend for Expo (we will align these when implementing auth screens).

---

## Part D — App environment variables (Expo)

### Step D1 — Create `.env` in the project root (not committed)

Copy from `.env.example`. Typical entries:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Optional fallback:
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

SUPABASE_PROJECT_REF=xxxx
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxx.supabase.co:5432/postgres
```

Use **`EXPO_PUBLIC_*`** only for values that must be readable by the app. Keep **database password** and **service role** out of `EXPO_PUBLIC_*`.

### Step D2 — EAS / production builds

For **EAS Build**, add the same variables as **secrets** or **env** in `eas.json` / EAS dashboard so production builds see them.

---

## Part E — What the first migration created (mental model)

1. **`profiles`** — one row per `auth.users` row (created by trigger).
2. **`user_preferences`** — currency, locale, week start, onboarding flag (defaults on signup).
3. **`categories`** — your app’s category rows, scoped by `user_id`.
4. **`expenses`** — same fields as SQLite (`kind`, `pinned`, `space_id`, etc.), scoped by `user_id`.
5. **RLS** — users can only read/write rows where `user_id = auth.uid()`.
6. **Trigger `handle_new_user`** — on signup, inserts `profiles` + `user_preferences`.
7. **Trigger `expenses_category_user_check`** — ensures `category_id` belongs to the same `user_id` (extra safety beyond RLS).

---

## Part F — What we will do next in code (preview)

These are the **next implementation steps** after the database exists (we’ll do them in order when you say go):

1. Add `@supabase/supabase-js` + secure session storage adapter for Expo.
2. Create `src/lib/supabase/client.ts` reading `EXPO_PUBLIC_*` env vars.
3. Wire **Entry** / **Account** screens to sign up, sign in, sign out.
4. After login: **upload** local SQLite → Supabase (categories, expenses, prefs), then **download** merge rules / conflict policy.
5. Mark sync state in local `app_settings` so we don’t double-upload.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| `db push` asks for password | Use the DB password from project creation (A2); reset in Dashboard → Database if lost. |
| Migration fails on trigger syntax | Replace `EXECUTE FUNCTION` with `EXECUTE PROCEDURE` in the migration file and re-run (or fix in SQL Editor). |
| “permission denied for schema auth” | You ran only part of the SQL; run the **full** migration file including the `auth.users` trigger. |
| Tables empty after signup | Sign up a test user; check **Table Editor** → `profiles` / `user_preferences` for a new row. |

---

## One-command reminders (from repo root)

```bash
npx supabase@latest login
npx supabase@latest link --project-ref <ref>
npx supabase@latest db push
```

After you complete **Parts A–D**, say when you’re ready and we’ll start **Part F** in the app.
