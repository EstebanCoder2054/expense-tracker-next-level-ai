# Phase 6 — AI Capture + Memo Parsing

> **Status: ⏳ Planned.** Not started.
> See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the broader AI vision.

---

## 1. Phase 6 Scope

**Quick memo capture + AI parsing.** Goals (from the original roadmap):

- Quick memo parsing flow
- Maybe voice scaffolding
- AI suggestion service abstraction
- Review UI for AI-generated structured expense

---

## 2. What This Phase Delivers (intended UX)

From [PROJECT_CONTEXT.md §10 (AI)](PROJECT_CONTEXT.md):

The user types or speaks a free-form line, the app parses it into a structured expense, and the user **confirms before save**.

Target examples:
- "me gasté 20 dólares en la cena de hoy"
- "uber 14.50 ayer"
- "paid rent 900 today"
- "split dinner 120 with Ana and Carlos"

The Capture sheet's **"Memo"** row (currently a Phase-6 placeholder) becomes a real flow.

---

## 3. Conceptual AI Pipeline

The pipeline is the **core principle of how AI is introduced** to the app (also stated in [PROJECT_CONTEXT.md §10](PROJECT_CONTEXT.md)):

1. **Deterministic parser first** — regex / heuristics catch the easy 80% (amount + currency + simple verbs) without an API call.
2. **Cloud-assisted interpretation second** — when the deterministic parser is uncertain, call the cloud AI service to fill in gaps (category, date if relative like "yesterday", merchant).
3. **User review/confirmation before save when needed** — never silently trust AI output. Confidence threshold determines whether the review screen is shown automatically or only on request.

**Rule:** AI is **assistive, not authoritative.** Confidence must be surfaced.

---

## 4. Prerequisites Before Starting Phase 6

- Phase 2 (auth) done — AI calls need a signed-in user (rate limiting, abuse prevention).
- Phase 3 (categories well-established) — the AI parser maps memos to existing categories.
- An **AI service abstraction** in `src/lib/ai/` that hides the provider choice so we can swap models / providers without touching screens.

---

## 5. Probable Code Surfaces

- `src/lib/ai/` — provider-agnostic interface (`parseMemo(text): Promise<MemoParseResult>`).
- `src/lib/ai/parsers/deterministic.ts` — the regex/heuristic layer.
- `src/lib/ai/providers/<provider>.ts` — actual cloud caller (could be Supabase Edge Function → Anthropic / OpenAI / etc.).
- `src/features/capture/MemoCaptureScreen.tsx` — text input + (optionally) voice input.
- `src/features/capture/ReviewParsedExpenseScreen.tsx` — the review/confirmation screen.
- New table: `ai_suggestions` (mentioned in [PROJECT_CONTEXT.md §12](PROJECT_CONTEXT.md)) — store parses for analytics + improving the deterministic layer over time.

---

## 6. Voice (Optional in Phase 6)

Voice memo is a stretch goal for Phase 6. If included:

- `expo-av` or platform speech APIs.
- Speech-to-text → feeds the same text-parsing pipeline.
- Make voice a clearly-second-class entry point in v1 — text is the default.

If skipped: voice becomes Phase 6.5 polish or rolls into Phase 8.

---

## 7. Open Questions to Resolve Before Implementation

1. **Which cloud AI provider?** Anthropic Claude is the obvious default given our environment. Confirm pricing fits the "stay as free as possible" constraint.
2. **Where does the API key live?** **Never in the client bundle.** Use a Supabase Edge Function or a thin server endpoint as a proxy. The client calls our endpoint with the user's session token; the endpoint adds the AI provider key.
3. **Rate limiting:** per-user daily cap to prevent abuse. Track in `ai_suggestions` or a usage counter.
4. **Languages:** the example list includes Spanish + English. Confirm the deterministic parser supports both common date words ("hoy", "ayer", "today", "yesterday").
5. **Confidence threshold for auto-save:** probably default to "always show review" in v1, then dial down once the parser proves reliable.
6. **Privacy:** memos are sensitive. Document what gets sent to the provider, and add a settings toggle to disable AI parsing entirely.

---

## 8. Tradeoffs to Watch

- **Deterministic-first matters.** If every memo costs an AI call, the product is expensive and slow. The deterministic layer is the moat.
- **Hallucination is a real risk** when the AI guesses a category. Always show the chosen category in the review screen — never auto-save without confirmation in v1.
- **Don't over-promise voice.** Voice quality varies wildly by device; text-first is the safer bet.

---

## 9. Not in Phase 6 (deferred)

- Document / receipt OCR — that's Phase 7.
- AI-generated insights ("you spend 40% more on weekends") — Phase 6 polish or later.
- On-device / local AI — far future ([PROJECT_CONTEXT.md §10 #5](PROJECT_CONTEXT.md)).
- Multi-turn chat / agent flows — explicitly out of scope.
