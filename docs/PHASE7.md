# Phase 7 — Statement Import / OCR / Review Flow

> **Status: ⏳ Planned.** Not started.
> See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the broader Import / OCR vision.

---

## 1. Phase 7 Scope

**File / statement / receipt import with OCR + AI reconciliation + human review.** Goals (from the original roadmap):

- File selection
- Text extraction pipeline scaffolding
- Parser
- Review / import staging UI
- AI reconciliation hooks

---

## 2. What This Phase Delivers (intended UX)

From [PROJECT_CONTEXT.md §11](PROJECT_CONTEXT.md):

Eventually support: **PDF statements, CSV imports, receipt photos, screenshots.**

The Capture sheet's **"Import"** row (currently a Phase-7 placeholder) becomes a real flow.

User journey:

1. User taps Import → picks a file or image.
2. App extracts text (OCR if image; PDF text extraction otherwise).
3. Parser normalizes into candidate expense rows.
4. AI reconciles + categorizes the rows (deferred to the same AI service abstraction from Phase 6).
5. Review/staging UI shows all candidate rows with confidence indicators — user accepts / edits / rejects each one.
6. Accepted rows are persisted as expenses.

**Rule:** Never silently trust imported data. The review layer is mandatory.

---

## 3. Conceptual Pipeline

1. **Pick file / image** — `expo-document-picker` / `expo-image-picker`.
2. **OCR or text extraction** — PDF text via a library (TBD); images via OCR.
3. **Parser normalization** — bank-statement formats vary wildly; start with one or two formats (e.g. a CSV layout and a common PDF statement template) and expand.
4. **AI reconciliation / categorization** — reuse the Phase 6 AI service abstraction. Map rows to existing categories.
5. **Review UI** — staged table of candidate expenses. Accept all / accept each / edit each.
6. **Confirm import** — persist to SQLite (and sync to cloud).

---

## 4. Prerequisites Before Starting Phase 7

- Phase 6 AI service abstraction exists and is stable — Phase 7 reuses it.
- Phase 2 sync is fully working — imports can be large; users will want them visible across devices.
- Categories are well-defined (Phase 1–3).

---

## 5. Probable Code Surfaces

- `src/features/imports/ImportEntryScreen.tsx` — file/image picker.
- `src/features/imports/extractText/` — OCR + PDF parsing.
- `src/features/imports/parsers/` — format-specific parsers (CSV layouts, statement templates).
- `src/features/imports/ReviewImportScreen.tsx` — the staging / review UI.
- `src/features/imports/importRepository.ts` — repository for `import_jobs` and `import_rows`.
- New tables (per [PROJECT_CONTEXT.md §12](PROJECT_CONTEXT.md)):
  - `import_jobs` — `id`, `user_id`, `source_file_name`, `status` (`pending` / `parsing` / `awaiting_review` / `committed` / `failed`), `created_at`, `updated_at`.
  - `import_rows` — `id`, `import_job_id`, `raw_data` (JSONB), `proposed_expense` (JSONB), `confidence`, `decision` (`pending` / `accepted` / `rejected` / `edited`), `committed_expense_id` (nullable).
- `attachments` table for storing the source file (in Supabase Storage) so users can revisit the original.

---

## 6. Format Coverage Strategy

Bank statement formats are infinite. Don't try to support all of them.

- **V1:** CSV with a configurable column mapping (date, amount, description), plus one or two specific bank PDF templates.
- **V1.5:** receipt photos (OCR).
- **V2+:** more bank PDF templates as users request.

Make the format parsers **pluggable** so adding a new one is small and self-contained.

---

## 7. OCR Provider

Options:
- **Cloud OCR** (Google Vision / AWS Textract / similar) — accurate, costs money per page.
- **On-device OCR** (Vision framework on iOS, ML Kit on Android) — free, lower accuracy on dense statements.

Probable choice: **on-device first** (receipt photos are short, on-device is good enough), fall back to cloud for dense PDFs if accuracy is too low.

---

## 8. Open Questions to Resolve Before Implementation

1. **Where does parsing run?** Client (fast, no server cost) vs. Edge Function (consistent across devices, easier to update). Start client-side, move to Edge Function later if needed.
2. **Source file retention:** how long do we store the user's uploaded PDFs in Supabase Storage? Indefinite is simplest; some users will want a "delete original after import" toggle.
3. **Duplicate detection:** if a user re-imports the same statement, detect and skip already-imported rows. Hash the row's normalized form.
4. **Multi-currency statements:** rare but exist. Probably reject in v1; warn the user.
5. **Privacy / security:** bank statements are highly sensitive. Encrypt at rest in Storage. Document data handling clearly.

---

## 9. Tradeoffs to Watch

- **OCR quality varies enormously by document.** Set expectations honestly — the review screen exists *because* OCR is imperfect.
- **Don't auto-import without review.** The whole point of the review layer is user trust.
- **Statement parsing is a long tail of edge cases.** Ship a narrow v1 that works perfectly on a handful of formats; expand from feedback.
- **Storage costs.** Receipts + statements add up. Track usage; consider expiry policies.

---

## 10. Not in Phase 7 (deferred)

- Real-time bank connection (Plaid / Truelayer) — different problem, not in scope.
- Automatic recurring-transaction detection — Phase 8 polish.
- Tax-export tooling — far later.
