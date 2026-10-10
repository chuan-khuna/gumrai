# Testing

This page describes what the tests cover, which interface each kind of test uses, and how database tests keep their data apart.

## Two kinds of test

| Kind | Files | Method |
| --- | --- | --- |
| Pure logic | `src/lib/sheet.test.ts`, `src/lib/delivery.test.ts` and `src/lib/return-to.test.ts` | Input in, output checked. No database and no mocks. |
| Business rules | `src/server/**/*.test.ts` | Integration tests against the real local Supabase. The database is never mocked. |

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

All tests share one local database with the sample data and with each other. Each business-rule test runs as a Seller of its own, so row-level security keeps it apart from everything else:

```ts
let db: Db
beforeEach(async () => {
  db = (await createSeller()).db
})
afterEach(removeSellers)
```

`src/server/testing/test-sellers.ts` is the helper. It is test-only code and is never imported by the app.

1. `createSeller(displayName?)` makes a real auth user with the admin API (`createSecretClient()`), with a random email and password and its email already confirmed. The database gives the Seller a profile and the three starting Cost Categories, as for anyone signing up.
2. It then signs that Seller in with email and password on a fresh client (`createPublicClient()`, the publishable key) and returns `{ id, email, password, db }`. Every operation in the test gets that `db`, so it runs exactly as the app does for a signed-in Seller. Nothing is mocked.
3. `removeSellers()` in `afterEach` deletes every Seller the file made. Deleting the auth user deletes the profile and every row the Seller owns, so a test needs no cleanup of its own.
4. `createSellerWithoutPassword(displayName?)` makes a Seller like one who only signed in with Discord: no password. The Auth admin API always stores a password hash, so the helper makes an ordinary Seller, keeps their signed-in client, and then empties `auth.users.encrypted_password` through the local stack's postgres-meta endpoint (`/pg/query`, which only the secret key may call). This is set-up only; the operations under test still run as the Seller. Its `password` is `''`.
5. `signIn(email, password)` returns a fresh signed-in client, for checking that a password works.
6. A test that needs two Sellers (`seller-isolation.test.ts`) calls `createSeller` twice. A sign-up test, which makes its Seller through `signUpWithEmail`, records it with `trackSeller(id)` so that `removeSellers` deletes it too.

Names still get a random suffix, `` `${label} ${randomUUID()}` ``, so names never clash within a test. No test assumes anything about other Sellers' data, and no test runs `db:reset`.

Every operation takes its Supabase client as its first argument (see [Architecture](architecture.md#how-an-operation-gets-its-client)).

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
- Signing up needs no email confirmation, trims the Display Name and refuses a short password or a taken email in Thai. Signing in refuses a wrong password in Thai. Signing out ends the session.
- Renaming the Display Name trims it, refuses a blank one and changes only the signed-in Seller. Changing the password works with the right current password (the new one signs in, the old one stops working, this session stays) and refuses a wrong one, a short one or the same one in Thai. A Seller with no password sets a first one with no current password and can then sign in with their email and it; a Seller who has a password cannot use that path (`account.test.ts`). Deleting the account with any text but exactly `delete` deletes nothing; with `delete` it removes the auth user, the profile, Cost Categories, Cost Items, Cost Sheets and lines (counted past row-level security with `adminClient()`) and signs the Seller out, and another Seller's data is untouched.
- A new Seller starts with exactly the three starting Cost Categories and nothing else, and a signed-out client sees no data at all.
- Seller B cannot list, read, change or delete Seller A's Cost Items, Cost Categories or Cost Sheets, cannot link a Cost Line to A's Cost Item or put anything in A's Cost Category, and may reuse A's Cost Item names (`seller-isolation.test.ts`).
- The return-to page after sign-in is always a path on this site (`return-to.test.ts`).
