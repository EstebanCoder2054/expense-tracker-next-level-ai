# ExpenseTracker — Project Context

> Evergreen reference. Product vision, tech stack, constraints, principles, roadmap overview, and coding rules.
> Phase-specific status, decisions, and history live in `docs/PHASE<N>.md`.

---

## 1. Product Vision

ExpenseTracker is a **premium, modern, action-first expense tracker** for personal finance, with strong support for shared spaces, collaborators, and bill splitting.

**This is NOT just a simple CRUD expense tracker.** The app should eventually support:

- Personal expense tracking
- Local-only mode without an account
- Cloud sync with an account
- Google auth and email/password auth
- Custom categories
- Budgets
- Reports by day/week/month/year
- Action-first home
- Weekly schedule/day selector for expenses
- Collaboration with permissions
- Shared spaces (personal, home, trip, couple, roommates, project)
- Splitwise-style bill splitting
- AI-powered natural language expense capture
- AI suggestions and categorization
- PDF / receipt / statement import (OCR + parser + AI reconciliation + human review)
- Widget support later
- Optional local AI later

The app should feel: **premium, modern, elegant, dark by default, easy to use, action-first, fast to capture data, safe and transparent with AI, scalable over time**.

---

## 2. High-Level Strategy

- Build the app in **phases**. Never attempt all phases at once.
- Each phase must leave the codebase in a **healthy, runnable, testable** state.
- Always know the full roadmap, but implement only the requested phase.
- When implementing a phase: keep future extensibility in mind, leave **concrete** TODOs only where useful, do not add fake placeholders everywhere, scaffold what's needed plus minimal forward-compatible structure.

---

## 3. Core Tech Stack

**Frontend:**
- Expo (development builds mindset, **not** Expo Go assumptions)
- React Native + TypeScript (strict)
- Expo Router
- React Hook Form + Zod
- TanStack Query
- Zustand only if needed for ephemeral local/cross-screen UI state
- React Native Reanimated 4 + Gesture Handler
- React Native Skia
- `expo-sqlite` for local persistence
- `expo-document-picker`, `expo-file-system`, `expo-secure-store`
- `expo-image-picker` / `expo-av` / speech libraries only when a phase requires them

**Backend:**
- Supabase (Auth, Postgres, Row Level Security, Storage)
- Realtime only when useful
- Edge Functions only when justified

**Monitoring / quality:**
- Structure code so Sentry can be added later; do not integrate until a phase asks for it
- Lint + format, strong typing, clean folder boundaries

---

## 4. Constraints

We want to **stay as free as possible early on**.

- No Apple auth for now
- Auth methods: Google + email/password
- Local-only mode **must** exist
- iOS simulator is enough for now
- Avoid paid-only dependencies unless absolutely necessary
- Avoid heavy backend complexity
- Avoid multi-repo architecture / microservices
- **One app, one repo, one Supabase project, one clean schema**

---

## 5. Architectural Principles

1. **Monolithic but modular.** Single app repo, organized by features and shared layers.
2. **Offline-first mindset.** User can create and browse core data locally. SQLite is the local source of truth. Remote sync layers on top.
3. **Local-first UX, server-backed collaboration.** App feels instant locally. Cloud enriches sync, backup, sharing, permissions, cross-device.
4. **AI is assistive, not authoritative.** Any AI-parsed import or memo goes through user-visible confirmation before persistence when confidence is not perfect.
5. **Strong domain modeling.** Design around concepts: user, profile, space, workspace member, expense, category, budget, split group, settlement, import job, import row, AI suggestion.
6. **Clean navigation and premium interactions.** Modal presentations, sheets, layered navigation, elegant transitions.
7. **Phase-safe development.** No premature implementation of advanced features, but no short-sighted design either.

---

## 6. Design Direction

- Dark theme by default
- Elegant premium finance app
- Action-first home
- Glass UI in selected places
- Subtle cyberpunk accents as differentiator (restrained futurism, not noisy sci-fi)
- Rounded cards, clean spacing, clear typography
- Orange / purple / charcoal accent family
- High readability, polished charts
- Soft blur / gradients in selected places
- Modern tab bar + modal system
- Premium weekly schedule strip
- Tasteful microinteractions; subtle glow and depth where appropriate

**Do NOT** create cluttered or overly flashy UI. The app must still feel practical and usable every day.

---

## 7. Navigation & UX Structure

**Tabs (eventual):** Home, Expenses, Capture (center action), Reports, Spaces.

- Bottom tabs for top-level areas
- Stacks for deep navigation
- Bottom sheets for quick actions and filters
- Full-screen modals for immersive creation/import flows
- Compact confirmation modals only when necessary

**UX notes:**
- Home is **not** a dense dashboard — prioritize quick actions, selected-day context, recent activity.
- Weekly schedule/day selector is a **first-class component**.
- Modals and sheets should make the app feel premium and modern.

---

## 8. Top-Level App Flows

**A. First run** — Splash → Onboarding → Entry choice (Google / email / Continue locally) → Initial preferences → Guided first action → Home.

**B. Returning authenticated user** — Restore session → Sync if needed → Home.

**C. Returning local user** — Restore local SQLite data → Home → Optionally encourage backup/sync later.

---

## 9. Screen Visions (high-level)

- **Onboarding:** 3–4 screens max, then entry, then small preferences flow (currency, locale, first day of week, etc.), then guide first capture.
- **Home:** action-first hybrid summary — greeting, quick action cards (Add / Memo / Scan / Split), weekly schedule strip, selected-day list, mini summaries, AI insight card, recent transactions, lightweight analytics preview.
- **Expenses:** data-oriented — list, grouping by day, search, filters, category chips, calendar/week mode, date range, expense detail, swipe actions.
- **Capture:** the headline differentiator. Eventually: manual add, quick text memo, voice memo, scan receipt, import statement/file, add split expense. Opens from a polished center action button as a premium modal/bottom sheet.
- **Reports:** day/week/month/year, category breakdown, trends, merchant analysis, budget vs actual, period comparisons, polished charts with subtle animations.
- **Spaces:** Personal / Home / Couple / Trip / Roommates / Project. Each space can contain expenses, budgets, collaborators, reports, split balances. Collaboration is a later phase; architecture must anticipate it.

---

## 10. AI Vision (phased)

1. Natural-language memo parsing
2. Category suggestions
3. Import cleanup / reconciliation
4. Insights and recommendations
5. Optional on-device lightweight model later

Examples the AI should eventually handle:
- "me gasté 20 dólares en la cena de hoy"
- "uber 14.50 ayer"
- "paid rent 900 today"
- "split dinner 120 with Ana and Carlos"

Conceptual pipeline: **deterministic parser → cloud-assisted interpretation → user review/confirmation before save when needed.** Never silently trust AI output.

---

## 11. Import / OCR Vision

Eventually support PDF statements, CSV imports, receipt photos, screenshots.

Pipeline: **pick file/image → OCR / text extraction → parser normalization → AI reconciliation/categorization → review UI → confirm import.**

Never silently trust imported data — review layer is mandatory.

---

## 12. Data Model Vision

The schema will grow over phases but should anticipate these entities from day one (named with future compatibility in mind):

`users`, `profiles`, `spaces`, `space_members`, `accounts`, `expenses`, `categories`, `category_rules`, `budgets`, `recurring_expenses`, `attachments`, `import_jobs`, `import_rows`, `split_groups`, `split_group_members`, `split_expenses`, `settlements`, `ai_suggestions`, `notifications`, `audit_logs`.

For current phases keep things lean, but **name things with future compatibility in mind.**

---

## 13. Local Mode + Sync Strategy

The app **must** support local-only mode:
- User can continue without an account
- Data stored locally in SQLite
- App is usable offline
- Later, local data can be migrated to cloud after sign-up/login

Design data access through **repositories / services** so local-first behavior is possible. Do not tightly couple screens to remote APIs. Prefer: domain models → repositories → local DB adapters → remote adapters when needed → sync-friendly boundaries.

**TanStack Query** manages async server/cache state. **SQLite** manages local persistence. **Do not confuse their roles.**

---

## 14. Project Structure

```
app/                 # expo-router file routes only
  (onboarding)/
  (tabs)/
  modals/
  expense/
  _layout.tsx

src/
  components/        # presentational, reused across features
    ui/              # Button, GlassCard, Screen, TextField
    schedule/        # WeekCalendar
    home/            # HeroAccent
    expenses/        # ExpenseRow, SwipeableExpenseRow
    navigation/      # GlassTabBar
  features/          # screen-level units, paired with repositories
    auth/
    onboarding/
    expenses/        # screens + expenseRepository
    home/
    capture/
    settings/        # settingsRepository
  hooks/             # React Query wrappers around repositories
  lib/
    auth/            # oauthRedirect, parseOAuthReturn
    constants/
    db/              # migrations, seedCategories
    query/           # QueryClient + queryKeys
    supabase/        # client (lazy, nullable), env
    theme/           # ThemeProvider, tokens, typography
    utils/           # date helpers, id (createId)
    validation/      # zod schemas
  types/             # domain.ts
```

Keep feature ownership clear. Avoid dumping into generic folders. Always prefer `@/...` over deep relative imports (`@/*` → `src/*`).

---

## 15. Theming

- Dark theme first
- Semantic color tokens
- Spacing scale
- Radius scale
- Shadow/glow strategy
- Typography styles
- Reusable card/button/input patterns

**Do not hardcode random colors anywhere.** Tokens live in `src/lib/theme/tokens.ts`.

---

## 16. Animation Guidelines

Use **Reanimated 4** for meaningful motion. Use **Skia** selectively for high-value visuals.

**Motion goals:** premium, smooth, lightweight, purposeful.

**Use motion for:** onboarding transitions, selected day indicator, card entrance, sheet presentation, tab feedback, chart transitions, success state microinteractions.

**Avoid:** noisy constant motion, gratuitous animation, hard-to-maintain animation logic.

**Future 3D concept:** optional hero/tutorial/save-success microinteraction — not core UX.

---

## 17. Auth Requirements

- Auth methods: **Google + email/password** (no Apple, no Clerk)
- Local-only mode with no account must work
- Sign up / sign in / session persistence
- Migration path from local mode to account-backed mode later
- **Supabase Auth** is the auth solution

---

## 18. Phased Implementation Plan (Overview)

Detailed per-phase scope, status, decisions, and history live in `docs/PHASE<N>.md`.

| Phase | Title | Status |
|------:|-------|--------|
| 1 | Foundation + local-first MVP shell | **Done** — see [PHASE1.md](PHASE1.md) |
| 2 | Auth + cloud foundation | **In progress** — see [PHASE2.md](PHASE2.md) + [PHASE2_SETUP.md](PHASE2_SETUP.md) |
| 3 | Budgets + reports | Planned — see [PHASE3.md](PHASE3.md) |
| 4 | Collaboration + spaces | Planned — see [PHASE4.md](PHASE4.md) |
| 5 | Split expenses | Planned — see [PHASE5.md](PHASE5.md) |
| 6 | AI capture + memo parsing | Planned — see [PHASE6.md](PHASE6.md) |
| 7 | Statement import / OCR / review flow | Planned — see [PHASE7.md](PHASE7.md) |
| 8 | Polish / widgets / advanced enhancements | Planned — see [PHASE8.md](PHASE8.md) |

---

## 19. Current Expectations When Implementing a Phase

When starting any phase:

1. Restate the phase scope
2. Propose the exact tasks
3. Identify files/folders to create or modify
4. Implement carefully
5. Avoid breaking changes
6. Keep the app runnable
7. Explain tradeoffs briefly

---

## 20. Coding Rules

- Use **strict TypeScript**
- Prefer small composable components
- Keep business logic out of screens when possible
- Use **Zod** for validation where forms/data contracts are involved
- Use **React Hook Form** for forms
- Keep local DB access **abstracted behind helpers/repositories**
- Do not hardcode sample data deep in production paths unless explicitly for mock/dev setup
- Avoid giant files, tangled navigation logic, excessive global state
- Prefer clean hooks and repositories
- Name things clearly according to product language
- Keep accessibility and responsiveness in mind
- Prefer realistic production-like code over shortcuts
- Do not implement fake backend behavior as if it were complete
- Mark unfinished integrations honestly and cleanly

---

## 21. Deliverable Style

When asked to implement something:

1. First provide a concise plan
2. Then implement
3. Then summarize what was done
4. Then note what remains for the next phase

If something is better deferred, **say so clearly.** If something risks overengineering, **avoid it.** If a library is not justified, **do not add it.**
