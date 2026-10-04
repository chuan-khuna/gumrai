# 01: Project scaffold (tracer bullet)

**What to build:** A runnable Gumrai skeleton that proves every layer is connected. A developer starts local Supabase, starts the app, and sees a page that reads one row from the database. The supply-chain hardening and dev workflow are in place from the first commit.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Next.js (App Router) app managed with bun. Tailwind CSS is set up with colour tokens defined in OKLCH.
- [ ] Supply-chain hardening matches matcha-cafe: bun refuses packages younger than 7 days and pins exact versions. npm config sets ignore-scripts, exact saves and engine-strict.
- [ ] Supabase is initialised in the repo with a first migration. It is started through the Supabase CLI installed with Scoop, never as a package dependency.
- [ ] A server-side module, kept apart from UI per ADR 0001, reads from Supabase. A page renders what it returns.
- [ ] Database types are generated from the schema and used by the server module.
- [ ] Vitest runs, with one passing test.
- [ ] CLAUDE.md documents setup and commands (Docker Desktop, `supabase start`, dev, test, type generation, db reset), and that the release-age floor must not be lowered or excluded without asking.
- [ ] UI text is Thai.
