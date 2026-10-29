# Middleware

Server middleware lives in `server/middleware/`. Nitro runs files in lexicographic order — prefix with `01.`, `02.`.

References: `server/middleware/01.auth.ts`, `server/constants/publicRoutes.ts`, `server/utils/authUtils.ts`

## 01.auth.ts

- Runs for `/api/*` only, skipping the exact paths in `PUBLIC_ROUTES` (`/api/health`, `/api/auth/signup`)
- Verifies the Supabase session cookie with `serverSupabaseClient(event).auth.getClaims()` (`resolveAuthSub`) — never decode JWTs by hand
- Loads our `users` row by `sub_id` and sets `event.context.user`. No session, invalid token, or no `users` row → 401
- Downstream code uses `event.context.user!` — the middleware guarantees it for non-public routes

## Rules

- A new public endpoint goes into `PUBLIC_ROUTES` — nowhere else
- Never put request-shape validation in middleware — that belongs in the route handler via `readValidatedBody` / `getValidatedQuery` / `getValidatedRouterParams`
- Ownership is not middleware's job: controllers scope trip data by `event.context.user.id` and 404 on a trip that isn't the caller's
- An inbound webhook (e.g. a future Twilio status callback) is a public route that authenticates by verifying the provider's signature inside the handler, via that provider's service
