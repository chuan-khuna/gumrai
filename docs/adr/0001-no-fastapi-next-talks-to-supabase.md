# No FastAPI: Next.js talks to Supabase directly

The planned stack had Next.js → FastAPI → Supabase. We dropped FastAPI for now. The app's work is CRUD on the Cost List and Cost Sheets plus profit arithmetic that must run in the browser so figures update while typing, so FastAPI would only relay calls to Supabase. A second service would double deploys and failure points. It would also make us verify Supabase tokens and check ownership by hand, where Supabase Auth (which supports Discord) and RLS give that for free once login lands.

## Consequences

- Business rules, such as unlinking Linked Lines when their Cost Item is deleted, live in a server-side module in Next.js, kept apart from the UI. If another client (a Discord bot, a mobile app) ever needs the same rules, that module is what moves to an API service.
- Profit arithmetic stays in client-side TypeScript, ported from matcha-cafe's `src/domain/`.
