# Testing

This page describes what the tests cover, which interface each kind of test uses, and how database tests keep their data apart.

## Two kinds of test

| Kind | Files | Method |
| --- | --- | --- |
| Pure calculation | `src/lib/sheet.test.ts` and `src/lib/delivery.test.ts` | Input in, output checked. No database and no mocks. |
| Business rules | `src/server/*.test.ts` | Integration tests against the real local Supabase. The database is never mocked. |

Each test uses a module's public interface. It sets up inputs or stored data and checks the outputs or the resulting data. No test checks SQL text, internal helpers, or component structure.

No test covers React components, server actions, pages, or chart rendering. Actions and pages only connect the UI to `src/server/`.

## Commands

| Command | Behaviour |
| --- | --- |
| `bun run test` | Runs every test once |
| `bun run test:watch` | Runs the tests again on every file save |

The database tests need local Supabase, which `bun run db:start` starts.

Vitest does not read `.env.local` by default, so `vitest.config.ts` loads it. The config file also repeats the `@/*` alias from `tsconfig.json`, and the two copies must match.

## How database tests keep their data apart

All tests share one local database with the sample data and with each other. Each test file follows the same pattern:

1. It names every record it creates with a random suffix, `` `${label} ${randomUUID()}` ``. The unique-name rule ignores case, and a random suffix means no name clashes with the sample data or with another test.
2. It records each sheet, Cost Item, and category it creates in an array, such as `made`, `madeItems`, or `madeCategories`.
3. It deletes those records in `afterEach`, in this order: sheets, then Cost Items, then categories. With the sheets gone first, no line links to a Cost Item when the item is deleted. Each delete ignores its own errors, so a failed cleanup never hides the test's real failure.

No test assumes the database is empty, and no test runs `db:reset`.

Every operation takes its Supabase client as its first argument (see [Architecture](architecture.md#how-an-operation-gets-its-client)). Each test file makes one at the top with `const db = createServerClient()` and passes `db` to every call.

## What the business-rule tests cover

The tests in `src/server/` cover these rules:

- A duplicate Cost Item name is rejected, ignoring case and surrounding spaces.
- Deleting a Cost Item turns its Linked Lines into Manual Lines with the same values, and sheet totals stay the same.
- Deleting a category moves its costs to ไม่มีหมวด.
- A changed Unit Cost shows when a sheet is loaded.
- Unlinking a line keeps its values.
- Saving a Manual Line into the Cost List works for a new name and returns the existing item for a clashing name.
- The count of sheets that use a Cost Item is correct.
- A duplicated sheet is independent of the original.
