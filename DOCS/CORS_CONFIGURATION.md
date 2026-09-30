# Public Site CORS Configuration

The public Next.js app calls its own API routes same-origin. Direct browser requests to Supabase REST or Storage should be allowed from the deployed public-site origin and any local development origin that is actually used.

## Supabase API

In the Supabase project settings, add the public site origins required by the deployment, for example:

- `http://localhost:3002` for local development
- `https://your-public-domain.example` for production

Do not add wildcard origins for production. Supabase CORS does not replace row-level security; keep the existing policies as the source of authorization.

## Storage

If the browser loads public catalog images directly from Supabase Storage, allow `GET`, `HEAD`, and `OPTIONS` for the same public origins in Storage CORS settings. The public site does not upload files, so do not enable browser write methods for it.

## Troubleshooting

- Confirm the request's `Origin` exactly matches a configured origin, including scheme and port.
- Confirm the bucket is intended for public image reads and the URL uses the correct project and bucket.
- Check the browser network response and Supabase logs; do not solve CORS errors by widening database RLS policies.
