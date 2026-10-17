# Vercel avatar generation

Static assets remain in public. Node functions in api/avatar delegate to
avatar-vercel.mjs. Existing local server and file ledger are unchanged.

Connect Upstash Redis to Production. The service accepts KV_REST_API_URL and
KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN).
Use the write token, never the read-only token. Disable database eviction.
Lifetime keys deliberately have no expiry; do not delete/reset the database.

Set the existing AVATAR_PROVIDER, AVATAR_MODEL, AVATAR_API_KEY,
AVATAR_SESSION_SECRET, AVATAR_GENERATION_ENABLED, AVATAR_PLAYER_DAILY_LIMIT,
AVATAR_DAILY_LIMIT, AVATAR_DAILY_BUDGET_MILLIS, AVATAR_COST_CEILING_MILLIS,
AVATAR_PROVIDER_BUDGET_CONFIRMED and optional AVATAR_TOTAL_LIMIT in Vercel
Production environment variables. Preserve existing budget values unless the
owner explicitly changes them. Set AVATAR_PLAYER_TOTAL_LIMIT=2.
Secrets must never be committed. Secure cookies are enforced by the handler.
Missing/invalid settings disable paid generation. Redeploy after changing env.

GET /api/avatar/config should return JSON (enabled:false until configured).
POST /api/avatar/generate accepts a JPEG and idempotency key from the same origin.
Quota is reserved atomically in Redis before invoking the provider; failed calls
also consume an attempt. Duplicate submissions never invoke the provider twice.
Successful results may be cached in a warm function; cold duplicates return 409.
The browser identity is a signed cookie; clearing it or changing browser creates
a new identity. This is not a login-enforced person-level quota.
No original photo or generated image is stored in Redis.

Functions allow 180 seconds, provider timeout is 120 seconds. Generation output
is limited to 4 million Base64 characters to stay below Vercel response limits.
Local tests mock the provider and never incur image-generation fees. Optional
Redis integration test: run redis:7-alpine as container sfm-avatar-test, then
SFM_REDIS_TEST=1 node --test tests/avatar-cloud.test.mjs.

This database starts a new quota history for the online domain; existing local
file-ledger history is not imported automatically. Existing local limits remain
unchanged. A paid end-to-end production request still requires owner testing.
