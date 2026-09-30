# Public Site Environment Variables

Create `apps/public/.env.local` for local development and configure the same values in the hosting platform for deployment.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STORAGE_URL=https://your-project-ref.supabase.co/storage/v1/object/public
```

`NEXT_PUBLIC_SUPABASE_URL` and a public anon/publishable key are required. The app accepts either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the compatibility name `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `NEXT_PUBLIC_STORAGE_URL` is optional and defaults to the public Storage URL for the configured Supabase project.

Get the project URL and public key from the Supabase project API settings. Use only a public anon/publishable key here. Never configure a service-role key, database password, or other privileged secret in a `NEXT_PUBLIC_*` variable or in this app.

Keep `.env.local` out of version control. After changing local values, restart the development server. Missing Supabase settings leave data-backed features unavailable; the public pages should continue to render their safe empty states.
