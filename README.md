# Avirat Jewelers Public Site

The customer-facing catalog and inquiry site for Avirat Jewelers. It is a Next.js app backed by Supabase and provides product discovery, categories, offers, festival content, pricing information, and inquiry submission. The repository keeps the Supabase migrations because they define the shared database contract used by the public site.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project configured with the migrations in `supabase/migrations`

## Setup

Install dependencies from the repository root:

```bash
npm install
```

Create `apps/public/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1/object/public
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also accepted as a compatibility alias for the anon key. The public app uses only public credentials; never put a service-role key in this app or its browser environment.

## Development

```bash
npm run dev
```

The public site runs at `http://localhost:3002`.

## Checks

```bash
npm test
npm run lint
npm run build
```

Run one test file with:

```bash
npx vitest run apps/public/src/components/__tests__/FeaturedFestivalSection.test.tsx
```

## Database

Migrations are retained in `supabase/migrations`. Review and apply pending migrations through the Supabase CLI or dashboard using an authorized database operator. Public access is governed by the existing row-level security policies; do not broaden those policies to make a feature work.

Additional public-site guidance is in `DOCS/`. The Next.js app and its package scripts live in `apps/public`.
