# Gumrai (กำไร)

A Thai-language web app that helps a seller work out cost, selling price and profit for each thing they sell, using a reusable list of what they buy.

- **Cost List** (ลิสต์ต้นทุน): each thing you buy, entered once with its Unit Cost and Unit, grouped by Cost Category.
- **Cost Sheets** (ชีตต้นทุน): one per thing you sell. Each has its Selling Price, GP and VAT, and cost lines taken from the Cost List or typed by hand. A sheet shows Net Profit and two charts.

The domain terms are defined in [GLOSSARY.md](GLOSSARY.md). The v1 spec is [.scratch/gumrai-v1/spec.md](.scratch/gumrai-v1/spec.md).

Stack: Next.js (App Router), Tailwind v4, TypeScript, Supabase (local Postgres in Docker), TanStack Charts, Vitest, bun.

## Getting started

### Prerequisites

- [bun](https://bun.sh). Use it for everything, never npm, pnpm or yarn.
- Node.js 22.12 or newer.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), installed and running. Local Supabase runs in it.

### 1. Install dependencies

```sh
bun install
```

This also installs the Supabase CLI as a devDependency, so you run it as `bunx supabase …`. `bunfig.toml` only installs package versions that are at least 7 days old and pins exact versions.

### 2. Configure the environment

```sh
cp .env.example .env.local
```

Then fill in `SUPABASE_SECRET_KEY`. Once local Supabase is running (step 3), run `bunx supabase status` and copy its `SECRET_KEY` value into `.env.local`. It only works against the local Docker stack.

### 3. Start the local database

```sh
bun run db:start
```

The first run pulls the Supabase Docker images, which takes a few minutes. It starts Postgres and applies every migration in `supabase/migrations/`.

To load the sample Cost Items and a sample sheet for development:

```sh
bun run db:reset
```

This recreates the database from the migrations, then applies `supabase/seed.sql`. **It wipes all local data.** Without it you get a fresh, empty database with only the three starting Cost Categories.

### 4. Run the app

```sh
bun run dev
```

| URL | Where it goes |
| --- | --- |
| http://localhost:3000 | Gumrai |
| http://localhost:3000/cost-list | Cost List |
| http://localhost:3000/sheets | Cost Sheets |
| http://127.0.0.1:54323 | Supabase Studio, to browse the database |

### 5. Run the checks

```sh
bun run check   # tsc --noEmit
bun run test    # Vitest; the integration tests need local Supabase running
```

When you're done, `bun run db:stop` stops the Supabase containers.

## Install skills

```
npx skills add mattpocock/skills#v1.3.1
npx skills add nutlope/hallmark
npx skills add pbakaus/impeccable
```

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the Next.js dev server |
| `bun run build` / `bun run start` | Make a production build, or serve it |
| `bun run test` | Run Vitest once |
| `bun run test:watch` | Run Vitest in watch mode |
| `bun run check` | Type-check with `tsc --noEmit` |
| `bun run db:start` / `db:stop` | Start or stop local Supabase |
| `bun run db:reset` | Recreate the local database from migrations, then apply the seed |
| `bun run db:types` | Regenerate `src/server/database.types.ts` from the local schema |

## Changing the database

1. Create a migration with `bunx supabase migration new <name>`. Never edit a migration that is already committed.
2. Apply it with `bun run db:reset`.
3. Regenerate the types with `bun run db:types`, and commit them along with the migration.

Sample data belongs only in `supabase/seed.sql`, never in a migration.

## Project layout

| Path | Contents |
| --- | --- |
| `src/app/` | Pages and UI. They hold no business logic and make no database calls. |
| `src/server/` | Server-side business rules. This is the only code that talks to Supabase. |
| `src/lib/` | The pure sheet calculation (`sheet.ts`, `delivery.ts`) and shared helpers |
| `supabase/migrations/` | Schema migrations |
| `supabase/seed.sql` | Development sample data |
| `docs/adr/` | Architecture decision records |

The conventions contributors and coding agents must follow are in [CLAUDE.md](CLAUDE.md).

## Troubleshooting

- **`db:start` fails or hangs**: check that Docker Desktop is running. `bunx supabase status` shows which services are up.
- **Integration tests fail to connect**: local Supabase isn't running. Start it with `bun run db:start`.
- **Ports already in use**: another Supabase project may be running. Stop it with `bunx supabase stop --project-id <id>`, or stop its containers in Docker Desktop.
