Backfill avatars script

This folder contains `backfill-avatars.mjs` to populate `profiles.avatar_url` from storage or auth metadata.

Usage (PowerShell):

1) Dry run for a specific user (no writes):

$env:SUPABASE_URL = "https://<project>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<SERVICE_ROLE_KEY>"
node .\scripts\backfill-avatars.mjs --user <user-id> --bucket avatars --dry

2) Full run (writes changes):

$env:SUPABASE_URL = "https://<project>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<SERVICE_ROLE_KEY>"
node .\scripts\backfill-avatars.mjs --bucket avatars

Notes:
- Default bucket is `avatars`. Change with `--bucket <name>`.
- Use the Service Role key only locally and keep it secret.
- The script will try several strategies: use `profiles.avatar_path`, check auth admin metadata, or list objects under `avatars/<userId>/` and create publicUrl.
