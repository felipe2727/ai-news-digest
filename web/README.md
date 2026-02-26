# AI News Digest Web

Next.js 16 frontend for the AI News Digest project.

## Stack

- Next.js App Router
- React 19 + TypeScript
- Supabase (data + auth)
- Tailwind CSS v4

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `web/.env.local` (copy from `web/.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_PAT=...
GITHUB_REPO=felipe2727/ai-news-digest
```

3. Start dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Commands

- `pnpm dev` start development server
- `pnpm build` production build
- `pnpm start` run production server
- `pnpm lint` run eslint

## Notes

- Package manager is `pnpm` (lockfile: `pnpm-lock.yaml`).
- Public pages are cyber-editorial themed.
- Dashboard/admin pages are functional and intentionally less stylized for now.
