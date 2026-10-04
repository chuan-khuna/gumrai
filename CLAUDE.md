## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Stack

Next.js (App Router) + Tailwind v4, TypeScript, Supabase (local Postgres in Docker), Vitest, bun. No FastAPI (ADR 0001). UI text is Thai only.

- **bun only.** Never reach for npm, pnpm or yarn, and never delete `bun.lock` to work around a resolution failure.
- `bunfig.toml` sets `minimumReleaseAge = 604800` (7 days) and `exact = true`. **Do not lower the release-age floor, and do not add a `minimumReleaseAgeExcludes` entry, without asking first.**
- `.npmrc` sets `ignore-scripts`, `save-exact` and `engine-strict` so an accidental `npm install` is not a security downgrade.
- bun does not run dependency postinstall scripts unless they are trusted. If an install needs `bun pm trust`, ask before trusting. The `supabase` CLI package is on bun's built-in trusted list, which is why its postinstall (the binary download) runs.

## Setup

1. Install and start **Docker Desktop**.
2. `bun install`
3. `cp .env.example .env.local`. The values are the Supabase CLI's fixed local keys.
4. `bun run db:start` starts local Supabase and applies `supabase/migrations/`. The first run pulls the Docker images.
5. `bun run dev`, then open http://localhost:3000. Supabase Studio is at http://127.0.0.1:54323.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Next dev server |
| `bun run test` | Vitest, once. Integration tests need local Supabase running |
| `bun run check` | `tsc --noEmit` |
| `bun run db:start` / `db:stop` | Start or stop local Supabase (`supabase start` / `supabase stop`) |
| `bun run db:reset` | Recreate the local database from migrations, then `supabase/seed.sql` |
| `bun run db:types` | Regenerate `src/server/database.types.ts` from the local schema |

The Supabase CLI is a bun devDependency, so run it as `bunx supabase …`. It was planned to come from Scoop, but that install failed.

## Database

- Every schema change is a new migration: `bunx supabase migration new <name>`. Never edit a migration that has been committed.
- After changing the schema, run `bun run db:types` and commit the regenerated types.
- Sample data lives only in `supabase/seed.sql`, which `db:reset` applies. Migrations insert no sample data.
- Money and quantities are Postgres `numeric`, never float.

## Code layout

- `src/server/` is the server-side business rules module (ADR 0001), the only code that talks to Supabase. `supabase.ts` makes the client. Pages and components call the operations beside it and never import the client.
- `src/app/` holds the pages. They do no business logic and no database calls of their own.
- Design tokens (colours, fonts, radii, shadows, easings) live in the active theme preset, `src/styles/presets/bubblegum.css`, which `src/styles/globals.css` imports. Colours are OKLCH, and the preset is the only place a colour is written down. `DESIGN.html` illustrates the system.
- **Always use the alias, never a relative path.** `@/*` is `src/*`. It is declared in both `tsconfig.json` and `vitest.config.ts`. Change one, change the other.

## Tests

- Test behaviour through a module's public interface. Do not test React components or chart rendering.
- Tests of `src/server/` run against the real local Supabase, never a mock, and each test sets up and isolates its own data.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
