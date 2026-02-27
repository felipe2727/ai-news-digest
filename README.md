# AI News Digest

Automated AI news pipeline plus editorial web front end.

- Backend: fetches AI news, deduplicates, scores, summarizes, emails, and exports to Supabase.
- Frontend: Next.js site that renders digests, articles, picks, search, and admin pages from Supabase.

## Repo Structure

- `backend/` Python pipeline and scheduler logic
- `web/` Next.js 16 app deployed on Vercel
- `supabase/migrations/` database schema and policies
- `data/` local JSON export fallback and snapshots

## Backend Quick Start

1. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Create `backend/.env`:

```env
OPENAI_API_KEY=...
GMAIL_ADDRESS=...
GMAIL_APP_PASSWORD=...

# Optional but recommended for semantic rerank
GEMINI_API_KEY=...

# Optional content enrichment
FIRECRAWL_API_KEY=...

# Optional Supabase export + subscriber send
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional hero image bucket name (default: hero-images)
SUPABASE_HERO_IMAGE_BUCKET=hero-images
```

3. Run pipeline:

```bash
# Full run
python main.py --force

# Dry run (no summarize/email)
python main.py --dry-run --force

# Scheduled behavior (respects interval_days)
python main.py
```

## Web Quick Start

This project uses `pnpm` (single lockfile: `web/pnpm-lock.yaml`).

1. Install dependencies:

```bash
cd web
pnpm install
```

2. Create `web/.env.local` (from `web/.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_PAT=...
GITHUB_REPO=felipe2727/ai-news-digest
```

3. Run locally:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Current Pipeline Flow

1. Fetch from Reddit, YouTube, News RSS, and GitHub
2. Deduplicate against `backend/state/seen_items.json`
3. Keyword scoring by topic
4. Optional semantic rerank via Gemini embeddings when `GEMINI_API_KEY` is set
5. Summarization and project ideas via OpenAI (`gpt-4o-mini` by default)
6. Hero image generation for the top-ranked article via OpenAI DALL-E 3 (`1792x1024`, `standard`)
7. Email send via Gmail SMTP
8. Export digest to Supabase (fallback to local JSON if export fails)

Hero image behavior:

- Only the top article in each digest run gets an AI-generated image URL.
- URL is stored in article `extra.hero_image`.
- If generation fails, frontend uses its built-in gradient fallback.

Build-this project behavior:

- Stored in `digests.project_recommendations` as a JSON array (single object).
- Exactly one project is generated per digest output.
- If multiple runs happen on the same UTC day, pipeline reuses that day’s existing project to keep one project per day.
- Prompt uses recent project history + daily category rotation to reduce repetition.

## GitHub Actions

Workflow: `.github/workflows/digest.yml`

- Schedule: daily at 09:00 UTC
- Runs `backend/main.py --force`
- Commits updated state/data files after successful run

Required repository secrets:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `GMAIL_ADDRESS`
- `GMAIL_APP_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional secret:

- `FIRECRAWL_API_KEY` (full-article enrichment)
