# Phase 5 — Split Expenses

> **Status: ⏳ Planned.** Not started.
> See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for vision.

---

## 1. Phase 5 Scope

**Splitwise-style bill splitting.** Goals (from the original roadmap):

- Split groups
- Split expense logic
- Balances
- Settlements
- Debt simplification

---

## 2. What This Phase Delivers (intended UX)

From [PROJECT_CONTEXT.md §10 (Split)](PROJECT_CONTEXT.md):

- Create split groups
- Choose payers and participants
- Split equally / exact / percentage / shares
- Track balances per group + per user
- Settle debts
- Show **who owes whom**
- Debt simplification (minimize the number of transfers across a group)

The Capture sheet's **"Split"** row (currently a Phase-5 placeholder) becomes a real flow.

---

## 3. Prerequisites Before Starting Phase 5

- **Phase 4 (Spaces)** is the natural foundation — a split group is conceptually a space with all participants as members. We can either:
  - **(a)** Model split groups *as* spaces (reuse `spaces` + `space_members`), or
  - **(b)** Model them as a separate `split_groups` table linked optionally to a space.
- Decide which **before** writing the schema.

---

## 4. Probable Schema Additions

**New tables** (per [PROJECT_CONTEXT.md §12](PROJECT_CONTEXT.md)):

- `split_groups` — `id`, `name`, `space_id` (nullable if standalone groups are allowed), `created_at`, `updated_at`.
- `split_group_members` — `split_group_id`, `user_id` (nullable for "ghost" non-app participants), `display_name`, `joined_at`.
- `split_expenses` — links an `expense` row to a split group, plus the split metadata (method: `equal` / `exact` / `percentage` / `shares`).
- `split_expense_shares` — per-participant share rows: who paid, who owes, amount.
- `settlements` — `id`, `from_user_id`, `to_user_id`, `amount`, `currency`, `settled_at`, `split_group_id`.

**Important:** support **non-app participants** (ghost members) — friends who aren't users yet. They have a display name but no `user_id`. When they join the app later, claim the ghost rows and reassign.

---

## 5. Probable Code Surfaces

- New repositories: `src/features/splits/splitRepository.ts`, `src/features/splits/settlementRepository.ts`.
- Balance calculator: pure-function utility, well-tested. **This is the most algorithmically interesting code in the app.** Write unit tests for it (even though the project doesn't have a test runner yet — add one for this).
- Debt simplification: greedy algorithm that minimizes the number of settlement transfers in a group. Standard problem; multiple references online.
- Split creation UI — extends the Add Expense flow with a participants picker + split-method selector.
- "Who owes whom" view per group + a global view.

---

## 6. Open Questions to Resolve Before Implementation

1. **Split groups = spaces (option a) or separate (option b)?** Option (a) is simpler if spaces already work well. Option (b) gives more flexibility (split with friends who aren't space members).
2. **Currency mismatches:** what if expenses in a group span multiple currencies? V1: refuse mixed currency in a group. V1.5: store FX rate at expense creation and compute balances in the group's primary currency.
3. **Ghost participants:** required from day one, or v2? (Required — friends who aren't on the app yet is a huge use case.)
4. **Settlement payments:** in-app marking-as-settled only (no payment integration), or eventually Plaid / Stripe? Mark-as-settled is enough for many years.
5. **Notifications** when a balance crosses a threshold or when someone marks a settlement — Phase 5 or later?

---

## 7. Tradeoffs to Watch

- **Splitwise has been doing this for a decade.** Don't pretend we'll out-feature them in one phase — focus on the 80% that actually gets used.
- **The balance algorithm is easy to get subtly wrong.** Floating-point currency math, rounding rules ("who eats the cent"), and edge cases (zero participants, single participant) all need explicit tests.
- **Performance:** balances must recompute fast when a new split expense is added. Either compute on the fly (simpler) or maintain running aggregates (faster but more invariants to maintain). Start with on-the-fly.

---

## 8. Not in Phase 5 (deferred)

- Payment processing (Plaid / Stripe / Venmo) — not in scope.
- Recurring split expenses (rent, etc.) — could be Phase 5 polish or a later phase.
- Group expense templates — later.
- Cross-group debt simplification — much later.
