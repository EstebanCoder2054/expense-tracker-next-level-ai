# Phase 3 — Budgets + Reports

> **Status: ⏳ Planned.** Not started. This doc is a scaffold for when Phase 3 begins.
> See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for vision and [PHASE2.md](PHASE2.md) for the prerequisite (data sync should be at least upload-complete first).

---

## 1. Phase 3 Scope

**Budgets + richer analytics.** Goals (from the original roadmap):

- Budgets
- Richer analytics
- Day / week / month / year reports
- Category charts
- Better dashboard cards
- Improved insights scaffolding

---

## 2. What This Phase Delivers (intended UX)

From the **Reports Screen Vision** in [PROJECT_CONTEXT.md §9](PROJECT_CONTEXT.md):

- Day / week / month / year views
- Category breakdown
- Trends over time
- Merchant analysis
- Budget vs. actual
- Comparisons to previous period
- Visual cards and polished charts
- Subtle animations

**Reports should be elegant and readable.** Skia is the intended charting layer (called out in the Phase 1 placeholder copy).

Plus the **budgets** half:

- Define budgets per category (and possibly per space later)
- Budget periods (monthly default; weekly / yearly optional)
- Budget vs actual computed on the fly from existing `expenses` rows
- Surface remaining budget on Home and inside Reports

---

## 3. Prerequisites Before Starting Phase 3

- **Phase 2 data sync (at least upload)** should be done — see [PHASE2.md §6](PHASE2.md). Reports work locally without sync, but users signing in mid-Phase-3 should already have their data flowing to the cloud.
- The Reports tab currently shows Phase-3 placeholder copy — that's the target surface.

---

## 4. Probable Schema Additions

**New tables** (names anticipated in [PROJECT_CONTEXT.md §12](PROJECT_CONTEXT.md)):

- `budgets` — `id`, `user_id`, `category_id`, `period` (`monthly` / `weekly` / `yearly`), `amount`, `currency`, `starts_on`, `created_at`, `updated_at`.
- (Optional) `category_rules` if we want auto-categorization rules separate from the user's manual choices.

**RLS:** every new table scopes by `user_id`. Same pattern as Phase 2.

**Local SQLite:** mirror the schema. Add to both `BASE_SQL` and `ensureLegacyColumns` in `src/lib/db/migrations.ts` so existing installs upgrade cleanly.

---

## 5. Probable Code Surfaces

- New repository: `src/features/budgets/budgetRepository.ts`
- New React Query hooks: `src/hooks/useBudgetQueries.ts`
- Reports screen: lift from placeholder → real screen at `app/(tabs)/reports.tsx`
- Charts: probably a `src/components/charts/` folder (Skia-based). Reuse `GlassCard` etc.
- Home cards: budget-progress card, monthly summary card, trend mini-card

---

## 6. Open Questions to Resolve Before Implementation

1. **Budget scope:** per-category only, or also overall? (Probably both — overall = sum of categories or an explicit "all" bucket.)
2. **Currency handling for reports:** assume single currency for v1, or multi-currency conversion? (Single currency in v1 is fine — multi-currency can come later with the `currency` field already on expenses.)
3. **Date range UI on Reports:** segmented control (D / W / M / Y) plus a period picker? Custom range?
4. **Charting library:** Skia (consistent with the rest of the app's premium feel) vs. Victory / Reanimated chart. Skia is the implicit default per design direction.
5. **Empty states:** users with no budgets, users with no expenses in the selected period. Must be polished, not placeholder text.

---

## 7. Tradeoffs to Watch

- **Don't overbuild analytics in Phase 3.** Trends and merchant analysis are easy to bloat. Ship the must-haves first; add depth in later passes.
- **Performance:** category breakdown over a year of expenses must be smooth. Pre-aggregate where possible (or rely on SQLite GROUP BY — it's fast on the volumes a personal-finance app sees).
- **Skia charts are pretty but expensive to write.** Budget time for chart polish.

---

## 8. Not in Phase 3 (deferred)

- Shared / space-level budgets — Phase 4 (spaces) lands first.
- Splitwise-style balances — Phase 5.
- AI-generated insights (e.g. "you spend 40% more on weekends") — Phase 6+.
- Forecasting — later.
