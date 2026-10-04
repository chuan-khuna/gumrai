# 01: Project scaffold (tracer bullet)

**What to build:** A runnable Gumrai skeleton that proves every layer is connected. A developer starts local Supabase, starts the app, and sees a page that reads one row from the database. The supply-chain hardening and dev workflow are in place from the first commit.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Next.js (App Router) app managed with bun. Tailwind CSS is set up with colour tokens defined in OKLCH.
- [x] Supply-chain hardening matches matcha-cafe: bun refuses packages younger than 7 days and pins exact versions. npm config sets ignore-scripts, exact saves and engine-strict.
- [x] Supabase is initialised in the repo with a first migration. It is started through the Supabase CLI, a bun devDependency (`bunx supabase start`). *Changed from Scoop: see Comments.*
- [x] A server-side module, kept apart from UI per ADR 0001, reads from Supabase. A page renders what it returns.
- [x] Database types are generated from the schema and used by the server module.
- [x] Vitest runs, with one passing test.
- [x] CLAUDE.md documents setup and commands (Docker Desktop, `supabase start`, dev, test, type generation, db reset), and that the release-age floor must not be lowered or excluded without asking.
- [x] UI text is Thai.

## Comments

**2026-10-04: implemented.**

- **The Supabase CLI comes from bun, not Scoop.** The Scoop install failed, so the user chose `supabase` as a devDependency. The blocked-postinstall concern doesn't apply: `supabase` is on bun's built-in trusted list (`bun pm untrusted` reports none), so its binary downloads. The 7-day floor resolved it to 2.118.0. The spec's Local development note was updated to match.
- **Versions resolved under the 7-day floor, all pinned exact:** next 16.3.6, react 19.3.0, @supabase/supabase-js 2.117.2, tailwindcss 4.3.3, typescript 7.0.2, vitest 5.0.2.
- **Tracer bullet:**
  - Migration `20261004000000_app_status.sql` creates a one-row `app_status` table. It is not part of the domain.
  - `src/server/app-status.ts` reads it through `src/server/supabase.ts`, which uses the secret key and runs on the server only.
  - `src/app/page.tsx` renders it.
  - Drop the table once issue 02 gives the app a real page to read.
- **Types:** `bun run db:types` writes `src/server/database.types.ts`, which types the Supabase client.
- **Test:** `src/server/app-status.test.ts`, an integration test against local Supabase with no mock.
- **Verified:**
  - `bun run test` passes (1 test).
  - `bun run check` and `bun run build` pass.
  - `supabase db reset` followed by `bun run test` passes.
  - The dev server renders "เชื่อมต่อฐานข้อมูลแล้ว".
- `next dev` adds a `nextjs-agent-rules` block to CLAUDE.md on its own. The block is kept, as it advises.
