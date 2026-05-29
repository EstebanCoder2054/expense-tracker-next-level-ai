# Phase 4 — Collaboration + Spaces

> **Status: ⏳ Planned.** Not started.
> See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for vision.

---

## 1. Phase 4 Scope

**Spaces + collaboration.** Goals (from the original roadmap):

- Spaces
- Collaborators
- Member roles
- Permissions model
- Shared data groundwork

---

## 2. What This Phase Delivers (intended UX)

From [PROJECT_CONTEXT.md §9](PROJECT_CONTEXT.md):

- Space types: **Personal, Home, Couple, Trip, Roommates, Project**
- Each space can contain: expenses, budgets, collaborators, reports, split balances
- The Spaces tab (currently a Phase-1 placeholder) becomes real
- Switching the active space scopes everything on Home / Expenses / Reports / Capture to that space

**Key UX rule:** the Personal space is always present and is the default. Users without collaborators should never feel forced into a "spaces" mental model — the feature must be opt-in.

---

## 3. Prerequisites Before Starting Phase 4

- Phase 2 data sync **fully** working (upload + download). Spaces are inherently multi-device / multi-user, so cloud-first behavior must be reliable.
- Phase 3 budgets are nice-to-have but not strictly required.

---

## 4. Probable Schema Additions

**New tables:**

- `spaces` — `id`, `name`, `type` (`personal` / `home` / `couple` / `trip` / `roommates` / `project`), `owner_user_id`, `created_at`, `updated_at`.
- `space_members` — `space_id`, `user_id`, `role` (`owner` / `admin` / `member` / `viewer`), `joined_at`, `invited_email` (for pending invites).

**Existing tables get scoped:**

- `expenses.space_id` already exists in the schema (added in Phase 1 with `NULL` allowed). Make it required on a per-space write.
- `categories.space_id` — probably add. Decide whether categories are global per user or per space (likely **per user, optionally per space override**).
- `budgets.space_id` (Phase 3 table) — likewise per-space.

**RLS:** policies must check membership via `space_members`, not just `user_id`. This is the biggest RLS jump in the project — write tests / verify with a second account.

---

## 5. Probable Code Surfaces

- New repository: `src/features/spaces/spaceRepository.ts`
- Space switcher UI — likely a sheet from the Home greeting / profile chip
- Active-space context: `src/features/spaces/ActiveSpaceContext.tsx` (sits alongside `AuthContext` in the provider stack)
- All existing queries get an `activeSpaceId` filter — touches `expenseRepository`, the React Query keys, and probably the migration paths
- Invite flow — by email; pending invites stored in `space_members` with `user_id IS NULL` until accepted

---

## 6. Permissions Model (draft)

| Role | Read | Write expenses | Manage members | Manage space settings |
|---|---|---|---|---|
| `owner` | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ❌ |
| `member` | ✅ | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ |

Open questions:
- Do we need `viewer` in v1? (Probably not — start with owner / admin / member.)
- Per-category permissions? (Almost certainly not — overkill.)

---

## 7. Open Questions to Resolve Before Implementation

1. **Active-space scoping at the query level:** filter in repository, or filter in React Query key + repository? (Both — repository enforces, key invalidates on switch.)
2. **Local SQLite when a user belongs to multiple spaces on the same device:** cache all spaces locally, or only the active one? (Cache all for offline parity, scope by `space_id` in queries.)
3. **What happens to a user's pre-spaces expenses (created during Phase 1–3)?** Auto-assign to their Personal space on first run after the migration.
4. **Invites:** email-only, or also shareable link? (Email-only in v1; link-based later.)
5. **Realtime updates** when another member adds an expense — Phase 4 or deferred? (Probably defer to a v4.5 polish slice — get the basics working with manual refresh first.)

---

## 8. Tradeoffs to Watch

- **RLS complexity explodes** when policies depend on membership. Write the SQL carefully and verify with a second test account.
- **The "active space" feels global but isn't** — it's a per-device UI state, not a server-side state. Don't try to sync it.
- **Don't introduce spaces into screens that haven't been touched in Phase 4.** Use a default "Personal" space silently for solo users.

---

## 9. Not in Phase 4 (deferred)

- Splitwise-style balance / settlement logic — Phase 5.
- Per-member spending breakdowns in Reports — could be a Phase 4 polish slice or wait for Phase 5.
- Activity feeds / notifications — later.
