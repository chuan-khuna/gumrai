# 01: Prefactor: every business-rule operation takes its client

**What to build:** Every operation in the server-side business rules module receives the Supabase client from its caller instead of making one inside. Pages, server actions and tests pass in the same secret-key client they effectively use today, so nothing a seller sees changes. This makes ticket 02 a swap of which client is passed, not a rewrite of every operation.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Every exported operation for Cost Items, Cost Categories, Cost Sheets and app status takes the client as its first argument and makes no client of its own.
- [ ] Pages and server actions obtain the client from one function in the business rules module and pass it through; they still never import the Supabase library or the client factory's internals.
- [ ] Tests pass a client in the same way; their assertions are unchanged.
- [ ] `bun run test` and `bun run check` pass, and the app behaves exactly as before.
- [ ] The Architecture document describes operations taking their client.
