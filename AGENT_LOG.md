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

## 2026-10-08: Rank-based arrivals implementation
- Added centralized limits in `src/lib/arrivals.ts`: 8 New Arrivals, 3 recent rows x 8 cards, 24 Recently Arrived, 32 total. `partitionArrivals` filters published rows, sorts by `created_at` descending then `id`, and returns disjoint slices with no age check.
- The homepage fetches one 32-row product list with `cache: "no-store"`; its API path is dynamic and tie-broken by `id`. The request includes all published products (including sold status) and has a 10-second timeout. Errors show an alert and Retry control while successful data remains in state.
- Removed five-day filtering and time-based `New` badges from the arrivals component, product cards, banner API, and legacy `new_only` API behavior. `new_only=true` now caps the newest rank at 8. The New badge is explicitly enabled only in the New Arrivals section.
- Realtime now observes INSERT, UPDATE, and DELETE without a published-only subscription filter, reconciles local list state by ID, removes unpublishes/deletes, preserves rank for ordinary updates, refreshes the top-32 list after each event and on reconnect, and cleans up the channel on unmount.
- Added a 400ms FLIP-style entrance/cascade animation only for unique published inserts; initial fetch and normal updates do not animate, and reduced-motion preference disables it.
- Added partition boundary/order/age tests, UI badge/section tests, realtime reconciliation tests, and animation/reduced-motion tests.
- Commits on `fix/new-arrivals-stack`: `6b3e845` diagnosis, `7d99ba1` partition/config/tests, `62d9ff4` ranked UI/API integration, `a51747b` realtime reconciliation. Animation remains the final isolated commit.
- Final validation: `npm run lint` passed; `npx tsc --noEmit --pretty false` passed; all 29 arrivals/realtime/card/motion tests passed. Full Vitest reports 45 passed and 6 unrelated failures: five `FeaturedFestivalSection` tests throw because local Supabase variables are absent, and `utils.test.ts` expects `formatWeight(5.24)` to be `5.2g` while current behavior returns `5.240g` (pre-existing mismatch).
- `npm run build` completed successfully, including its TypeScript phase. During static data generation, the existing product and sitemap fetches logged missing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no local environment values were added or changed.

## 2026-10-08: Public storefront performance baseline
- Baseline target: live production before this task, `https://ktech-project-003-public.vercel.app`. Lighthouse 13.5.0 mobile preset with simulated throttling; TTFB is Lighthouse's `server-response-time` audit. INP is not available from a lab run; TBT is reported instead.

| Route | TTFB | FCP | LCP | TBT | CLS | JS transfer | Image requests / transfer | Network requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage `/` | 20 ms | 1.2 s | 4.3 s | 50 ms | 0.00 | 250,263 B | 9 / 270,698 B | 48 |
| Catalog `/collections` | 140 ms | 1.2 s | 4.5 s | 60 ms | 0.00 | 243,382 B | 17 / 550,865 B | 57 |
| Product `/products/05ff39ff-6f11-4b7d-9e74-85faf7f55857` | 70 ms | 1.2 s | 3.1 s | 0 ms | 0.00 | 247,643 B | 10 / 333,448 B | 43 |

- The product page's separately observed browser resource list had 18 requests on a direct navigation; Lighthouse's clean mobile run recorded 43. Its Next-optimized first product image was about 48 KB. A read-only download of the original JPEG was 190,972 B.
- The requested card-click-to-visible timing could not be collected reliably with the attached browser harness. It hid the rendered card from Playwright's visibility check, and an initial timing mark was reused across attempts; that invalid 26.3 s result is discarded. No temporary instrumentation was retained.
- Local `npm run build` completed with Next.js 16.2.12. Its route table classified `/` and `/products/[id]` as dynamic, `/collections` as a static shell with client-fetched data, and `/api/products` plus `/api/products/[id]` as dynamic. The build printed missing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` diagnostics during page-data collection and sitemap generation, but completed. The output does not include route-size byte totals.
- Click/data path: `ProductCard` renders a real `next/link` to `/products/${id}` with default viewport prefetch. `/products/[id]/page.tsx` is a server component. It queries product plus embedded category, offer, and discounts in one Supabase REST request, then awaits a second related-products request before rendering `ProductDetailView`. `generateMetadata` also calls `getProduct`; whether the underlying Supabase fetch is deduplicated was not measured. The client detail view renders only after those server awaits, then opens Realtime subscriptions in an effect. There is no product-route `loading.tsx` boundary, so dynamic navigation cannot show a prefetched skeleton.
- Confirmed causes: the dynamic route is uncached and blocks on serial related-products work; there is no route fallback while waiting. The fully client-only/effect-fetch diagnosis is false: detail is server-rendered. Product and related queries already use explicit selects and embedded relationships (not `select('*')`), though related products select many detail-only fields and category SVG/offer text that cards do not use. Product images already use `next/image`, card images are lazy by default, and the main detail image is prioritized. The sample original is 191 KB versus 48 KB optimized. Fonts are self-hosted by `next/font`; visits insertion is not part of the product route; Realtime subscriptions are created after render and cleaned up.
- Production response headers showed `x-vercel-id: bom1::iad1::...`: Mumbai edge, function execution in `iad1`. The Supabase hostname resolves through Cloudflare and does not reveal its project region; region remains unverified and must be checked in the Supabase dashboard before recommending a function region.
- DB index metadata was unavailable without Supabase dashboard access. No SQL was run. Verify indexes on `public.products` for primary key `id`, published `created_at` ordering, and `(category_id, created_at)` ordering; only add partial indexes if equivalent indexes are absent.
