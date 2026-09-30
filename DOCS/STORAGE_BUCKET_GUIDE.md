# Public Catalog Storage

The public site reads catalog and category images from Supabase Storage. Configure the buckets referenced by the image URLs as public-read only, with supported image types and sensible file-size limits.

## Access boundaries

- Browser access is read-only. The public site must not receive a Storage write policy or any privileged credential.
- Keep catalog asset writes in an authorized operational workflow outside the public app.
- Do not store private customer data or secrets in a public bucket.

## Public URL format

```text
https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/BUCKET_NAME/FILE_PATH
```

The optional `NEXT_PUBLIC_STORAGE_URL` environment variable can point to the base public-object URL. See [Environment Variables](ENVIRONMENT_VARIABLES.md).

## Verification

Open a known public catalog image URL in a browser and confirm it returns the expected image. If access fails, verify the project reference, bucket name, public-read configuration, object path, and Storage CORS origin. Do not make a bucket writable to resolve a read failure.
