# Agent log

## 2026-09-30
- Repo: `/Users/maccy/Desktop/hey/KTECH_PROJECT_003_PUBLIC`
- Working tree: clean on `main` before changes.
- Latest commits pulled from origin/main:
  - `8296b93` Return all banners with debug info to diagnose filtering issue
  - `c0516b9` Disable caching and add debug logging for offer display
  - `2bd3fc6` Add debug logging to offer banners API and FeaturedFestivalSection
  - `3cd5d4d` Fix realtime subscription channel name conflicts
  - `838cacb` Fix linting errors and add testing library dependency
- Baseline verification results:
  - `npm run lint` -> failed in `src/components/FeaturedFestivalSection.tsx` on explicit `any` at the banner filtering logic.
  - `npx tsc --noEmit` -> not run successfully because lint stopped the chain; later run was not reached in initial combined command.
  - `npx vitest --run` -> failed in 4 suites with pre-existing issues (document undefined in tests, formatWeight mismatch, import resolution issues from alias setup).
  - `npm run build` -> not reached due earlier test failures.
- Root cause identified in the banner: `src/components/FeaturedFestivalSection.tsx` fetches `/api/offer-banners`, then sets `setOfferBanners(banners)` from the raw API response instead of the filtered/validated active offer data, and that API route returns all banners with debug metadata instead of a public `{ offers, banners }` payload. This leaves the banner render unfiltered and the offer logic effectively mock/debug-oriented.

## Final patch status
- Added the public active-offer helper in `src/lib/offers.ts` with `getActiveOffers` and `getVisibleOfferBanners`, including empty-array safe failure handling and filtering of malformed rows.
- Updated the public offer APIs to respond with `{ offers, banners }` and to use the same safe data filtering rather than debug payloads.
- Updated the banner component to fetch from `/api/offers` and keep the festival block untouched while only replacing the offer-side logic.
- Added targeted Vitest coverage for the offer helper behaviour.
- Verification status:
  - `npx eslint src/lib/offers.ts src/components/FeaturedFestivalSection.tsx src/app/api/offers/route.ts src/app/api/offer-banners/route.ts src/types/index.ts` -> passed.
  - `npx tsc --noEmit --pretty false` -> passed.
  - `npx vitest --run src/components/__tests__/ProductCard.test.tsx src/lib/__tests__/offers.test.ts` -> passed (7/7).
  - `npm run build` -> passed with warnings that `.env.local` is missing and the app expects `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to exist.
- Product-side pricing note: added a shared helper in `src/lib/pricing.ts` and wired both the product card and detail page through the same calculation to keep badge and price consistent. This stays aligned with the repo’s existing discount behavior and does not invent a new formula without the admin source of truth.
- Environment note: `.env.local` is missing in this checkout, so the live database count and dev-server curl checks were skipped rather than guessed or run against the wrong environment.

## 2026-10-08: New arrivals diagnosis
- Created branch `fix/new-arrivals-stack` from the current `feat/stored-offer-display` checkout; preserved the pre-existing local edits in `src/app/globals.css`, `src/app/layout.tsx`, and untracked `src/components/PullToRefresh.tsx`.
- Root cause: `src/components/NewArrivalsStrip.tsx` only considers products for which `isNewArrival(created_at)` is true; `src/lib/utils.ts` defines this as a five-day window. A week-old published product is therefore removed from both homepage arrival lists. The same time-based test controlled the `New` badge in `ProductCard` and the banner API.
- Production read-only check: queried `https://ktech-project-003-public.vercel.app/api/products?sort=created_at&order=desc&limit=32`, which is backed by `getAnonClient()` and its Supabase publishable/anon key. It returned 51 total rows readable through the public endpoint; the newest entries were `published` and `available`, and the returned list included products dated 2026-09-30. The `new_only=true` query returned only two rows dated 2026-10-05. This verifies public anon-role read access for those rows and confirms the age-filter discrepancy; no schema/RLS action is indicated.
- The live empty display was not reproducible at diagnosis time because two products were inside the five-day window. If the fetch fails, `HomeProductsSection` currently logs the error, clears loading, and lets the component render its misleading empty-state message; there is no visible retry/error state.
- Initial data is fetched from `/api/products` before subscribing to realtime, so this is not realtime-only population. `src/app/api/products/route.ts` is `force-dynamic` with `revalidate = 0`, the homepage fetch uses `cache: "no-store"`, and the homepage itself is dynamic; Next/Vercel caching is not the identified cause.
- Existing realtime invalidates/refetches on product inserts and updates but does not subscribe to product deletes or explicitly refetch after reconnect. It also does not locally reconcile events with arrival ranks.
- No database writes, schema changes, RLS changes, migrations, or environment changes were made for this diagnosis.
