# CODEX Review Log (This Session)

This file captures the full working history from the moment you asked for a thorough repo review through the latest fixes in this session.

Date context used during work: February 2026 (local machine).

## 1. Initial Request: Thorough Repo Review (Read-only)

You asked for a thorough revision of the repo and explicitly said to only read files.

What was done:

- Enumerated tracked files with `git ls-files`.
- Reviewed backend pipeline files:
  - `backend/main.py`
  - `backend/fetchers.py`
  - `backend/scorer.py`
  - `backend/summarizer.py`
  - `backend/emailer.py`
  - `backend/enricher.py`
  - `backend/dedup.py`
  - `backend/models.py`
  - `backend/supabase_export.py`
  - `backend/data_export.py`
  - `backend/config.yaml`
  - `backend/templates/digest.html`
  - state files and sample data snapshots
- Reviewed frontend files under `web/src/app`, `web/src/components`, `web/src/lib`.
- Reviewed Supabase migrations under `supabase/migrations`.
- Verified “read-through complete”.

No code changes were made at this stage.

## 2. Repo/Deployment Sync and Rollback Operations

You requested:

- Deploy this local state to the repo connected to Vercel: `felipe2727/ai-news-digest`.
- Roll back `felipe2727/ai-news-digest-v2` as a safety clone.

What was discovered:

- Local branch was behind `origin/main` by state-update commits.
- `ai-news-digest-v2` had a frontend overhaul commit (`13f74ef`) not present on `ai-news-digest/main`.

What was executed:

1. Cherry-picked the `v2` overhaul commit into a clean worktree based on `origin/main`.
2. Pushed to `ai-news-digest/main`:
   - Resulting commit on `ai-news-digest/main`: `d0af26b`
3. For `ai-news-digest-v2`:
   - Created backup branch: `backup-before-rollback-20260226` -> `13f74ef`
   - Force-updated `main` back to `f2e8760`

Outcome:

- Vercel-connected repo received the intended overhaul.
- `v2` repo safely rolled back with backup branch preserved.

## 3. Requested Quick Fixes (1-3)

You asked to implement:

1. lockfile consistency,
2. docs/runtime alignment,
3. footer copy consistency.

Implemented:

- Removed `web/package-lock.json` (kept `pnpm-lock.yaml` as source of truth).
- Rewrote root `README.md` to match actual current runtime and env requirements.
- Updated email template footer text:
  - from “Summaries by Claude”
  - to “Summaries by OpenAI”

Pushed as:

- `da8b30b` — docs/runtime alignment + lockfile cleanup + footer fix.

## 4. Hero Image Generation (OpenAI) Wiring

You requested DALL-E hero generation path for top article.

Implemented backend:

- Added `Summarizer.generate_hero_image()` in `backend/summarizer.py`.
- Called it in `backend/main.py` for top-ranked article only (`scored[0]`), post-summary.
- Stored result in `item.extra["hero_image"]`.
- Graceful fallback to frontend gradient if generation fails.

Pushed as:

- `7223eb4` — hero image generation wiring.

## 5. Local Validation Run (with provided OpenAI key)

What happened:

1. Initial run failed due missing local dependency (`ModuleNotFoundError: supabase`).
2. Installed backend requirements.
3. Ran forced pipeline successfully:
   - fetch -> score -> summarize -> email -> Supabase export succeeded.
4. This validated pipeline and OpenAI summarization path locally.

Note:

- At that moment, local checkout was not the exact latest branch snapshot for one check; later validation and fixes were performed directly against `origin/main`.

## 6. Hero Image Missing Investigation and Fix

Issue reported:

- Feb 26 hero image still missing on homepage.

Root cause found:

- `articles.extra.hero_image` values included expired OpenAI temporary URLs (403).
- Supabase Storage bucket for persistent hero images did not exist at first.

Fixes executed:

1. Created Supabase Storage bucket:
   - `hero-images` (public).
2. Backfilled the specific FasterQwenTTS records:
   - generated/stored a persistent image URL in Supabase Storage,
   - updated corresponding `articles.extra.hero_image`,
   - verified URL returned HTTP 200.
3. Improved backend persistence:
   - `generate_hero_image()` now downloads generated image and uploads to Supabase Storage,
   - stores permanent public URL instead of temporary OpenAI blob URL.

Pushed as:

- `eb48d79` — grid size normalization (home cards) + persistent hero image storage.

## 7. Build Library / Build This Problems (Duplicates + Sizing + Daily Rules)

You reported:

1. Build Library card sizes inconsistent.
2. Duplicate/near-duplicate ideas (CodeBuddy/CodeGuard repetition).
3. Need one project per day:
   - today’s project in home hero/build module,
   - previous days only in library.

### 7.1 Data model consistency check

Confirmed storage locations:

- Build-this ideas: `public.digests.project_recommendations` (JSON string).
- Hero image URL: `public.articles.extra.hero_image`.
- Image binary: Supabase Storage bucket (`hero-images`).

### 7.2 UI/Query behavior fixes

Implemented:

- `web/src/lib/queries.ts`:
  - added `getBuildLibraryProjects(limitDays)`:
    - one project per day,
    - excludes current day (latest project day),
    - deduplicates repeated ideas by normalized signature.
- `web/src/app/picks/page.tsx`:
  - switched to `getBuildLibraryProjects`,
  - fixed-height grid rows (`auto-rows-[420px]`),
  - full-height cards for uniform box sizes,
  - clamped text to prevent uneven growth.
- `web/src/components/blog/ProjectPicks.tsx`:
  - parser now returns one pick (`slice(0, 1)`) for consistency.

### 7.3 Generation quality and diversity fixes

Implemented backend changes:

- `backend/summarizer.py`:
  - `recommend_projects(...)` now accepts:
    - `recent_projects` (anti-duplication context),
    - `target_category` (daily rotation control).
  - Prompt strengthened for novelty and specificity.
  - category is constrained.
  - one retry when output is too similar to recent ideas.
  - parser normalized to single-project array output.
- `backend/main.py`:
  - daily category rotation policy added.
  - pulls recent ideas from Supabase for anti-duplication.
  - reuses existing same-day project recommendation if one already exists (prevents multiple different projects on same day).

### 7.4 Historical data normalization

One-time Supabase cleanup executed:

- For days with multiple digests, normalized `project_recommendations` to one canonical project for that day.
- Rows updated during cleanup: 3.

Pushed as:

- `8d0b818` — Build Library sizing + one-per-day dedupe + stronger generation logic.

## 8. Current Request (This Turn): Final Two Fixes

You requested:

1. Add a Library/Projects nav entry.
2. Create `CODEXREVIEW.md` with full session handoff.

Implemented now:

- Updated navbar command group to include:
  - `open /library` -> `/picks`.
- Also corrected existing nav command target:
  - `$ cd /articles` now points to `/articles` (it incorrectly pointed to `/` before).

Files changed in this step:

- `web/src/components/shared/Navbar.tsx`
- `CODEXREVIEW.md` (this file)

## 9. Commit Timeline on `origin/main` During This Session

Ordered oldest -> newest relevant session commits:

- `d0af26b` Cyber-editorial overhaul landed in `ai-news-digest`.
- `da8b30b` Docs/runtime + lockfile + footer consistency.
- `7223eb4` DALL-E hero generation hook.
- `4c1167c` Docs refresh for current setup.
- `eb48d79` Persistent hero image storage + card sizing normalization.
- `8d0b818` Build Library dedupe/one-per-day + generation hardening.
- (current pending commit in this worktree for navbar + CODEXREVIEW, to be pushed from this turn)

## 10. Validation Notes

Checks performed across this session:

- Python syntax checks for backend changed files via `python -m py_compile`.
- Targeted TypeScript checks (`pnpm exec tsc --noEmit`) for updated frontend branch.
- Targeted ESLint checks for touched files.
- Full repo lint/build still reports pre-existing unrelated issues in other files (not introduced by these fixes).
- Direct Supabase queries used to verify:
  - duplicate project/day patterns,
  - hero image fields,
  - storage bucket state,
  - URL validity.

## 11. Security Note

- An OpenAI key was provided in chat during this session and used for validation.
- Key value is intentionally not copied into this file.
- Recommended: rotate/revoke and replace in GitHub Actions secrets and local `.env`.

