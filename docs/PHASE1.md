# Phase 1 — Foundation + Local-First MVP Shell

> **Status: ✅ Done.** Shipped on `main`. Phase 1 is the foundation that every later phase builds on.
> For overall product vision and tech stack, see [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

---

## 1. Phase 1 Scope (as defined at the start)

Build the **foundation + local-first MVP shell**:

- Initialize Expo app architecture
- Set up Expo Router
- Set up TypeScript strictness
- Set up theme system
- Set up core UI primitives
- Set up local SQLite
- Create basic onboarding flow
- Create entry/auth choice screens (UI only — Google + email placeholders allowed)
- Create local-only mode path
- Create initial home screen skeleton
- Create weekly schedule strip
- Create expenses list basics
- Create add expense flow (manual)
- Create category support basics
- Create persistence for local expenses
- Create action-first home
- Create polished navigation scaffolding
- **Keep everything local-first** — no cloud

Detailed Phase 1 scope (as restated mid-phase):

- Scaffold app structure with Expo Router
- Dark theme system + design tokens
- Core reusable UI primitives
- Premium onboarding flow
- Auth entry choice screen with: Continue with Google (UI only), Sign in / Sign up with email (UI only), Continue locally
- Implement local-only mode path
- SQLite local persistence
- Local expense model + categories + basic local storage
- Action-first Home tab
- Weekly schedule strip
- Expenses tab/list
- Capture modal/sheet
- Add Expense flow (manual)
- Persist expenses locally
- Filter by selected day
- Simple Reports placeholder screen

---

## 2. What Was Implemented

### Architecture decisions made in Phase 1

- **Expo Router** file routes under `app/`, with route groups `(onboarding)`, `(tabs)`, and feature routes `modals/`, `expense/`.
- **Local-first data:** `expo-sqlite` + `SQLiteProvider` + `onInit` migrations; **repositories** (`expenseRepository`, `settingsRepository`) isolate SQL from UI so Supabase can plug in later.
- **Server-style cache for local reads:** TanStack Query wraps repository calls and invalidates on writes. Clear split: SQLite = source of truth, Query = async/cache layer.
- **Theme:** single dark `ThemeProvider` + `src/lib/theme/tokens.ts` (semantic colors, spacing, radii, shadows).
- **Forms:** React Hook Form + Zod (`expense`, preferences).
- **UI:** small primitives in `src/components/ui/`, feature screens in `src/features/*`.

### Deliverables

| Area | Details |
|------|---------|
| **Stack** | Expo 54, Expo Router, strict TS, Reanimated 4, Gesture Handler, Skia, expo-sqlite, TanStack Query, RHF, Zod |
| **Theme** | `src/lib/theme/tokens.ts`, `ThemeProvider`, typography helpers |
| **DB** | `migrations.ts` + `seedCategories.ts`, WAL + foreign keys |
| **Screens** | Onboarding → Entry → Preferences → Tabs; Home + Expenses + placeholders; Capture modal; Add expense |
| **UX** | Dark UI, glass/blur cards, Skia hero accent, animated week strip, quick actions |

### Folder structure created

- `app/` — routes only (`_layout.tsx`, `index.tsx`, groups, modals)
- `src/lib/` — theme, db, validation, query, utils
- `src/features/` — home, expenses, onboarding, capture, settings
- `src/components/` — ui, schedule, expenses, home
- `src/types/`, `src/hooks/`

### Local data strategy

- Tables: `categories`, `expenses` (with nullable `space_id`), `app_settings`
- IDs: client-generated (`createId`) — sync-friendly for Phase 2+
- **Entry mode** stored (`local` / `pending_cloud`) for Phase 2 migration

### Navigation strategy

- `app/index.tsx` → `<Redirect>` to onboarding or `(tabs)/home` based on `app_settings.onboarding_complete`
- Root **Stack:** onboarding group, tabs, `modals/capture`, `expense/add` (modals)
- **Center tab** uses a custom `tabBarButton` that opens `/modals/capture` (no `...props` spread — avoids ref typing issues)

---

## 3. What Is Real vs. Placeholder in Phase 1

A grounded view of what actually works after Phase 1:

### Things you can actually test (real behavior)

- **Onboarding** — 4 slides → entry → preferences → Home. Persists `onboarding_complete` in SQLite.
- **Continue locally** path — full local-only flow.
- **Add expense** (manual) — persists to SQLite, shows up on Home and Expenses tabs.
- **Weekly schedule strip** — selecting a day filters Home list/summary.
- **Categories** — seeded on first run.
- **Capture modal** — opens; the **Add expense** path works.

### Intentionally placeholder in Phase 1 (by design, not bugs)

| Surface | What's there | Why placeholder |
|---|---|---|
| **Google / Email on Entry** | Alert only — not real auth | Phase 2 — Supabase auth |
| **Reports** tab | Copy + layout only | Phase 3 — charts, ranges, real analytics |
| **Spaces** tab | Copy only, mentions `spaceId` | Phase 4 — shared spaces / collaboration |
| **Home quick actions: Memo, Import, Split** | Open Capture; only manual add is implemented | Phase 5–7+ |
| **Capture rows** other than "Add expense" | Labels say Phase 5/6/7 — no flows wired | Phase 5–7+ |
| **Any sync / cloud / account** behavior | Not present | Phase 2+ |

So Phase 1 delivers: **offline-capable expense tracking with categories, calendar, home summaries, list + editor, onboarding, and shell UI** — with Reports / Spaces / cloud intentionally deferred.

---

## 4. Tradeoffs Made in Phase 1

- **TanStack Query for local-only data.** Slight overhead in Phase 1, but matches Phase 2+ server state and keeps screens thin. Worth it.
- **Skipped AsyncStorage entirely.** Settings live in SQLite so there's only one persistence path.
- **Skia limited on web** (fallback view). Native gets the gradient.
- **No tests, no linter, no formatter wired.** `npm run typecheck` is the only validation gate. Acceptable for Phase 1; revisit later.

---

## 5. Notable Phase 1 Issues & Fixes (for memory)

- **`@shopify/react-native-skia` was wrongly listed as an Expo config plugin** in `app.json`. Removing it from `expo.plugins` fixed the prebuild failure (`NativeSetup` / `ERR_MODULE_NOT_FOUND`). Skia is a normal RN library — autolinked by `npx expo run:ios`, not a config plugin.
- **Development build, not Expo Go.** Phase 1 was built with the dev-client workflow from day one. The `expensetracker://` scheme in `app.json` requires a dev build. `expo start` only loads the JS bundle into an already-installed dev client. First-time / native-change rebuilds use `npx expo run:ios` (or `--device "iPhone 17"` to target a specific simulator).
- **Center tab button typing.** Custom `tabBarButton` does **not** spread `...props` — that caused ref typing issues; passing only the handlers/style we need avoids them.

---

## 6. Phase 1 Run / Dev Workflow (still applies)

```bash
# First build (or after native deps change):
npx expo run:ios
# or target a specific simulator:
npx expo run:ios --device "iPhone 17"

# Daily loop after the dev client is installed:
npm start            # Metro bundler — open the ExpenseTracker dev app on the simulator
npm run typecheck    # tsc --noEmit
```

**Never use Expo Go.** SQLite + Skia + the custom URL scheme require the dev client.

To re-run onboarding during dev: delete the app from the simulator (or clear app data) so SQLite resets.

---

## 7. What Phase 1 Did **Not** Do (handoff to Phase 2)

Per the original plan, Phase 1 explicitly left these for Phase 2:

- Supabase project setup
- Google + email/password auth
- Session restoration + profile
- Guarded routes (auth-aware redirects)
- Local → cloud migration using existing repositories and `entry_mode`

The schema and repositories were designed so Phase 2 could **plug into** the existing layer rather than rewrite it. See [PHASE2.md](PHASE2.md) for what happens next.

---

## 8. Phase 1 — Closing Notes

- Codebase is in a healthy, runnable state on `main`.
- Repositories + SQLite + TanStack Query form the seam Phase 2 will write through.
- IDs are client-generated (`createId`) — already sync-compatible.
- `entry_mode` field exists in `app_settings` ready to signal "user has local data that should be migrated after sign-in."
