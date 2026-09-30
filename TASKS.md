# Public Site Tasks

Public-site production and quality work. Keep changes within the public app unless a shared database or build-tool change is required.

## Security and reliability

- [ ] Ensure local environment files are ignored and no credentials are tracked.
- [ ] Keep public database access constrained by existing Supabase row-level security policies.
- [ ] Preserve safe empty and retry states when Supabase or public APIs are unavailable.

## Performance and SEO

- [ ] Replace remaining raw `<img>` tags with `next/image` where it is appropriate.
- [ ] Review collection data loading for blank initial states and layout shifts.
- [ ] Add or verify dynamic metadata for product and collection pages.
- [ ] Verify image remote patterns and production caching behavior.

## Accessibility and UX

- [ ] Add accessible names to filter/sort controls and social links.
- [ ] Review keyboard access and responsive behavior for offers, product browsing, and inquiry submission.

## Testing

- [ ] Add Playwright coverage for public product browsing and inquiry submission.
- [ ] Keep component and API tests aligned with public empty/error states.
