# 02: Cost List: Cost Item CRUD

**What to build:** The seller opens the Cost List page and can add, edit and delete Cost Items (name, Unit Cost, free-text Unit). Each item shows as "4 ฿/g". Names are unique, ignoring case and surrounding spaces. The list can be searched by name.

**Blocked by:** 01

**Status:** done

- [x] Cost Item table has a nullable owner, name, Unit Cost (numeric, never float) and Unit (text). A database constraint enforces uniqueness on the normalised name.
- [x] The server-side business rules module offers list, create, update and delete for Cost Items.
- [x] Adding or renaming to a duplicate name is rejected with a Thai message, in both the module and the UI.
- [x] Unit Cost accepts decimals and rejects non-numbers and negatives.
- [x] Editing happens in a form and takes effect on save.
- [x] Name search filters the list.
- [x] Integration tests against local Supabase (no mocks) cover create, update, delete, and duplicate rejection including case and space variants.

## Comments

**2026-10-04: implemented.**

- **Schema:** migration `20261004130805_cost_item.sql` adds `cost_item` (nullable `owner` → `auth.users`, `name`, `unit_cost numeric` with a `>= 0` check, `unit text`). The unique index `cost_item_owner_name_key` on `(owner, lower(btrim(name))) nulls not distinct` enforces the normalised-name rule, so ownerless rows (all rows until login) clash with each other too. Types regenerated.
- **Module:** `src/server/cost-items.ts` offers `listCostItems({ search })`, `getCostItem` (for the edit form), `createCostItem`, `updateCostItem` and `deleteCostItem`. Broken rules throw `CostListError` with a Thai message. Duplicates are caught from the database's unique violation, not a pre-check, so there is no race. Names are saved trimmed.
- **Unit Cost stays a decimal string end to end** (read as `unit_cost::text`, written as the typed string), so 0.075 is never a float. Plain decimals only: `1e3`, `0x10` and `4 บาท` are rejected as not a number.
- **UI:** `/cost-list` lists items as "4 ฿/g", has an add form and a name search (`?q=`). Each item links to `/cost-list/[id]`, an edit form that saves on submit and has a delete button. Errors from the module show under the form. The home page links to the Cost List.
- **Search** is a case-insensitive "contains" on the name, with `%` and `_` taken literally.
- **Decisions not spelled out in the ticket:**
  - Name and Unit are required: a blank one is rejected with a Thai message.
  - A Unit Cost of 0 is allowed. Only negatives are rejected.
  - Delete has no confirmation yet. Issue 06 adds the "ใช้อยู่ใน N ชีต" warning.
- **Not done:** issue 01 said to drop the `app_status` tracer table once 02 lands. That is outside this ticket's criteria, so it is left for a follow-up.
- **Tests:** `src/server/cost-items.test.ts`, 23 integration tests against local Supabase. They cover create, update, delete, get, search, Unit Cost validation, and duplicate rejection on both create and rename, with exact, case, space and combined variants.
- **Verified:**
  - `bun run check`, `bun run test` (24 tests) and `bun run build` pass.
  - On `next start`, these were exercised over HTTP: create, the duplicate message, the not-a-number message, search, edit with a redirect back to the list, and delete.
