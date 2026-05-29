# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## File tree

Generated tree (excludes `node_modules/`, `.git/`, `ios/`, `android/`, `.expo/`, `.vscode/`, `assets/`):

```
.
├── CLAUDE.md
├── app.json                          # Expo config: scheme=expensetracker, new arch, typed routes
├── tsconfig.json                     # strict TS, @/* → src/*
├── package.json
├── package-lock.json
├── expo-env.d.ts
├── .env / .env.example               # EXPO_PUBLIC_SUPABASE_* + DATABASE_URL (.env gitignored)
│
├── app/                              # expo-router file-based routes
│   ├── _layout.tsx                   # Root provider stack + Stack screens
│   ├── index.tsx                     # Auth/onboarding redirect gate
│   ├── +html.tsx                     # Web HTML shell
│   ├── +not-found.tsx
│   ├── (onboarding)/                 # _layout, entry, slides, preferences
│   ├── (tabs)/                       # _layout (GlassTabBar) + home, expenses, reports, spaces
│   ├── expense/                      # _layout, [id], add  (modal-presented)
│   └── modals/                       # account, add-category, calendar, capture
│
├── src/
│   ├── components/                   # Presentational, reused across features
│   │   ├── ui/                       # Button, GlassCard, Screen, TextField
│   │   ├── navigation/GlassTabBar.tsx
│   │   ├── home/HeroAccent.tsx
│   │   ├── expenses/                 # ExpenseRow, SwipeableExpenseRow
│   │   └── schedule/WeekCalendar.tsx
│   │
│   ├── features/                     # Screen-level units, paired with repositories
│   │   ├── auth/AuthContext.tsx
│   │   ├── capture/CaptureModalScreen.tsx
│   │   ├── expenses/                 # ExpensesListScreen, ExpenseEditorScreen, expenseRepository
│   │   ├── home/                     # HomeScreen, selectedDateContext
│   │   ├── onboarding/               # EntryScreen, OnboardingSlidesScreen, PreferencesScreen
│   │   └── settings/settingsRepository.ts
│   │
│   ├── hooks/useExpenseQueries.ts    # React Query wrappers around repositories
│   ├── types/domain.ts               # Expense, Category, AppPreferences, ExpenseKind
│   │
│   └── lib/
│       ├── auth/                     # oauthRedirect, parseOAuthReturn
│       ├── constants/localeCurrency.ts
│       ├── db/                       # SQLite migrations + seedCategories
│       ├── query/queryClient.ts      # QueryClient + queryKeys
│       ├── supabase/                 # client (lazy, nullable), env
│       ├── theme/                    # ThemeProvider (dark-only), tokens, typography
│       ├── utils/                    # date helpers, id (createId)
│       └── validation/expense.ts     # zod schemas
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260205160000_phase2_core_schema.sql  # profiles, user_preferences, categories, expenses + RLS
│
├── docs/
│   ├── PROJECT_CONTEXT.md            # Evergreen vision, stack, principles, roadmap, coding rules
│   ├── PHASE1.md                     # ✅ Done — foundation + local-first MVP shell
│   ├── PHASE2.md                     # 🟡 In progress — auth done; data sync pending
│   ├── PHASE2_SETUP.md               # Supabase dashboard walkthrough (account, schema push, OAuth, env)
│   ├── PHASE3.md                     # ⏳ Planned — budgets + reports
│   ├── PHASE4.md                     # ⏳ Planned — collaboration + spaces
│   ├── PHASE5.md                     # ⏳ Planned — split expenses
│   ├── PHASE6.md                     # ⏳ Planned — AI capture + memo parsing
│   ├── PHASE7.md                     # ⏳ Planned — statement import / OCR / review
│   └── PHASE8.md                     # ⏳ Planned — polish / widgets / advanced
│
├── components/__tests__/             # ⚠ Expo-template leftover, ignore
└── constants/                        # ⚠ Empty template leftover, ignore
```

## Commands

```bash
npm run start          # Expo dev server (Metro)
npm run ios            # Build & run iOS dev client (uses ios/ native project)
npm run android        # Build & run Android dev client
npm run web            # Web target via Metro
npm run typecheck      # tsc --noEmit — the only static check wired up

# Supabase (CLI via npx, no global install required)
npm run supabase:login
npm run supabase:link  # then pass --project-ref <ref>
npm run db:push        # apply supabase/migrations/*.sql to the linked remote DB
```

There is **no test runner, linter, or formatter configured**. The legacy `components/__tests__/StyledText-test.js` is a leftover from the Expo template and is not run. `npm run typecheck` is the validation gate.

Single-file iteration: edit, then `npm run typecheck`. For UI changes, run `npm run ios` / `npm run android` against the existing native projects (this is an **Expo dev client** workflow, not Expo Go — the `expensetracker://` custom scheme in `app.json` requires a dev build).

## Architecture

This is an Expo (SDK 54) React Native app with a Supabase cloud backend. The app works **offline-first on SQLite** and adds Supabase auth + cloud sync on top.

### Two parallel data stores

- **Local: `expo-sqlite`** — primary data source while the app runs. Schema lives in [src/lib/db/migrations.ts](src/lib/db/migrations.ts) and is applied on every cold start by `SQLiteProvider`'s `onInit` in [app/_layout.tsx](app/_layout.tsx). Tables: `app_settings`, `categories`, `expenses`. Migrations use `CREATE TABLE IF NOT EXISTS` + an `ensureLegacyColumns` step that `ALTER TABLE`s missing columns — when adding a column, append to both `BASE_SQL` and `ensureLegacyColumns` so existing installs upgrade.
- **Cloud: Supabase Postgres** — mirrors local schema with `user_id` scoping + RLS. Schema in [supabase/migrations/](supabase/migrations/). The `categories.id` / `expenses.id` columns are `TEXT` (not UUID) so they match the SQLite ids generated by `createId()` — this is intentional for sync.

The cloud sync upload/download step is **not implemented yet** (see [docs/PHASE2.md §6](docs/PHASE2.md) and [docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md) Part F). Auth is wired; data sync is the next milestone.

## Project context (multi-phase docs)

Full product vision, tech stack, principles, and the phased roadmap live in [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md). Read it before non-trivial work.

Per-phase status, scope, decisions, and history live in `docs/PHASE<N>.md`:
- **Phase 1** ✅ Done — [docs/PHASE1.md](docs/PHASE1.md)
- **Phase 2** 🟡 In progress — [docs/PHASE2.md](docs/PHASE2.md) (narrative) + [docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md) (Supabase dashboard walkthrough)
- **Phases 3–8** ⏳ Planned — [docs/PHASE3.md](docs/PHASE3.md), [docs/PHASE4.md](docs/PHASE4.md), [docs/PHASE5.md](docs/PHASE5.md), [docs/PHASE6.md](docs/PHASE6.md), [docs/PHASE7.md](docs/PHASE7.md), [docs/PHASE8.md](docs/PHASE8.md)

### Routing (expo-router, typed routes enabled)

File-based routing under [app/](app/). The root [app/_layout.tsx](app/_layout.tsx) wires the provider stack in this exact order (matters — later providers can use earlier ones):

```
GestureHandlerRootView → QueryClientProvider → SQLiteProvider → ThemeProvider → AuthProvider → SelectedDateProvider → Stack
```

Route groups:
- `(tabs)` — main app (home, expenses, reports, spaces) behind the GlassTabBar
- `(onboarding)` — entry/slides/preferences flow
- `modals/` — presented as iOS-style modals (`presentation: 'modal'`)
- `expense/[id]` and `expense/add` — also modal-presented

[app/index.tsx](app/index.tsx) is the gate: it waits for `AuthContext.initialized` + reads `app_settings.onboarding_complete` from SQLite, then redirects to onboarding slides, preferences, or `/(tabs)/home`. Auth state and onboarding state are independent — a signed-out user who finished onboarding still lands on home.

### Auth (`src/features/auth/AuthContext.tsx` + `src/lib/supabase/`)

- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) lazily creates the client and returns `null` when env vars are missing (`getSupabaseEnv().configured === false`). Every consumer must handle the null case — the app is designed to run without cloud credentials.
- Session storage uses `expo-secure-store` (NOT AsyncStorage) — keys are encrypted at rest on device.
- Google OAuth uses `expo-web-browser` + `signInWithOAuth({ skipBrowserRedirect: true })` and manually parses the return URL via [src/lib/auth/parseOAuthReturn.ts](src/lib/auth/parseOAuthReturn.ts). The redirect URI comes from [src/lib/auth/oauthRedirect.ts](src/lib/auth/oauthRedirect.ts) and must be registered in the Supabase dashboard's Redirect URLs.
- The `expensetracker://` scheme in [app.json](app.json) must stay in sync with the Supabase redirect URL list.

### Data layer pattern

- **Repositories** in `src/features/<feature>/<feature>Repository.ts` take a `SQLiteDatabase` and return mapped domain types from [src/types/domain.ts](src/types/domain.ts). They convert snake_case rows to camelCase domain objects.
- **React Query hooks** in [src/hooks/useExpenseQueries.ts](src/hooks/useExpenseQueries.ts) wrap the repositories. Query keys live centrally in [src/lib/query/queryClient.ts](src/lib/query/queryClient.ts). Mutations call `invalidateExpenseData()` which uses a `predicate` to invalidate derived queries (`breakdown`, `activity`, `periodTotals`) — when adding new derived query shapes, extend that predicate.
- Components consume the DB via `useSQLiteContext()` from `expo-sqlite` (provided by the root layout), never by importing a singleton.

### Theme & UI

- Dark-mode-only currently — [ThemeProvider](src/lib/theme/ThemeProvider.tsx) hard-codes `darkTheme`. Tokens in [src/lib/theme/tokens.ts](src/lib/theme/tokens.ts).
- The visual language is "glassmorphic": `expo-blur`, `@shopify/react-native-skia`, `expo-linear-gradient`, and reanimated/Skia-driven effects. Reusable shells live in [src/components/ui/](src/components/ui/) (`GlassCard`, `Screen`, `Button`, `TextField`).
- `react-native-reanimated` v4 + `react-native-worklets` — new arch is enabled (`newArchEnabled: true` in app.json). Worklet syntax must use the v4 conventions.

### Path aliases

`@/*` resolves to `src/*` (see [tsconfig.json](tsconfig.json)). Always prefer `@/...` over deep relative imports.

### Env vars

Only `EXPO_PUBLIC_*` vars are bundled into the client (Expo convention — not `NEXT_PUBLIC_*`). The Supabase publishable/anon key is safe to ship because RLS is enforced server-side. Service role keys and `DATABASE_URL` must never get an `EXPO_PUBLIC_` prefix. See [.env.example](.env.example).

### Legacy folders

`components/` and `constants/` at the repo root are leftovers from the original Expo template — ignore them and put new code under `src/`.
