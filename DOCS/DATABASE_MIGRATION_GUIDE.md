# Supabase Database Migrations

The `supabase/migrations` directory contains the schema and policy history required by the public site, including products, categories, offers, festivals, prices, inquiries, and public banner data.

## Applying migrations

Use the Supabase CLI linked to the intended project, or review and apply the SQL through the Supabase Dashboard. Apply migrations in filename order and verify each result before proceeding. For production, use an authorized operator and follow the project's normal backup and change-review process.

The public app connects with a public anon/publishable key and relies on existing row-level security policies. Migrations that change access policies require explicit security review. Never expose a service-role key to the public app or browser.

## Verification

After migration, verify that expected tables and policies exist, then exercise public reads and inquiry submission using the public app. Missing or inaccessible data should remain a safe empty/error state in the app; do not widen access policies as a quick workaround.
