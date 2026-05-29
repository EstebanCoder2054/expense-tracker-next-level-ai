# Phase 8 — Polish / Widgets / Advanced Enhancements

> **Status: ⏳ Planned.** Not started.
> This is the catch-all polish + premium-features phase that runs after the core product (Phases 1–7) is in place.

---

## 1. Phase 8 Scope

**Polish, widgets, and advanced enhancements.** Goals (from the original roadmap):

- Widgets
- Optional 3D delight moments
- Deeper insights
- Advanced premium polish

---

## 2. Likely Workstreams

### A. Home-screen widgets

- iOS: Swift-based widget extension (requires native code, custom EAS dev build).
- Android: equivalent (Glance / RemoteViews).
- Widget content: today's spend, current budget remaining, last expense, quick "Add" tap-through.
- Constraints: widgets can't run app JS — they read from a shared App Group on iOS (and an equivalent on Android). Need to design the data export so widgets can render without launching the app.

### B. Optional 3D delight moments

From [PROJECT_CONTEXT.md §16](PROJECT_CONTEXT.md):

> Future 3D concept: optional hero/tutorial/save-success microinteraction — not core UX.

Examples:
- Save-success burst on adding a large expense.
- Onboarding hero animation (Skia / React Native Skia / `three.js`-via-Expo-GL).
- A signature "you hit your budget" celebratory moment.

**Rule:** these are sprinkles, not features. Keep them rare and tasteful.

### C. Deeper insights

Extends Phase 3 reports with:

- "You spend 40% more on weekends" — pattern detection.
- "Your dining budget has crept up over 6 months" — trend callouts.
- "You're $X under budget this month — projected to end $Y under" — forecasting.

Probably uses the AI service abstraction from Phase 6.

### D. Advanced premium polish

The bucket for everything that didn't make earlier cuts:

- Microinteractions on every screen.
- Haptics tuned per action.
- Custom transition animations between routes.
- Accessibility audit + fixes.
- Performance pass — startup time, list-scroll smoothness on long expense lists.
- Localization (beyond the Spanish/English memo parsing from Phase 6).
- Light theme (currently dark-only — see [PROJECT_CONTEXT.md §15](PROJECT_CONTEXT.md)).

---

## 3. Other Things That Probably Land Here

These were mentioned in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) but don't fit a numbered earlier phase:

- **Sentry / monitoring integration** — structure has been preserved for it; wire it in here.
- **Optional on-device lightweight AI** ([PROJECT_CONTEXT.md §10 #5](PROJECT_CONTEXT.md)) — privacy-preserving memo parsing without a cloud round-trip.
- **Notifications** (`notifications` table is in the data model vision) — budget warnings, settlement reminders.
- **Audit logs** (`audit_logs` table) — visibility into shared-space activity.
- **Recurring expenses** (`recurring_expenses` table).
- **Category rules** (`category_rules` table) — auto-categorize based on user-defined rules.

---

## 4. Prerequisites Before Starting Phase 8

- Phases 1–7 stable and shipped.
- Real user feedback informing which polish items matter most.
- A clear sense of which features have product-market fit (so polish goes to the ones that do).

---

## 5. Tradeoffs to Watch

- **Phase 8 has no natural end.** Pick a slice, ship it, repeat. Don't try to do all of §2 in one go.
- **Widgets are a heavy lift** for the engineering time. Worth it if Home-screen presence matters for retention; skip otherwise.
- **3D moments age fast.** What feels premium in 2026 may feel dated in 2028. Use restraint.
- **Insights powered by AI cost money.** Cache aggressively. Many "insights" can be deterministic (a SQL query + a string template) — don't burn AI calls on patterns a query can find.

---

## 6. Open Questions for When Phase 8 Begins

1. **Which platform first for widgets** — iOS, Android, or both? Probably iOS first (matches the development priority).
2. **Insights surface** — a dedicated tab? A card on Home? Sent as notifications?
3. **Light mode** — is it worth the design + maintenance cost? Many premium dark apps stay dark-only forever (Things, Linear's mobile app).
4. **Sentry vs. self-hosted alternative** (PostHog, Highlight)? Probably Sentry given its maturity.

---

## 7. Closing Notes

Phase 8 is **deliberately open-ended.** Treat it as a backlog of polish slices, not a single block of work. Each slice should:

- Have a clear "what does this unlock?" answer
- Ship to users
- Get feedback
- Inform the next slice

This is the phase that turns a working app into a **product people love**.
