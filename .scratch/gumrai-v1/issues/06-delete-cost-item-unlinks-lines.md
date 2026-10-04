# 06: Deleting a Cost Item unlinks its lines

**What to build:** When the seller deletes a Cost Item that Cost Sheets use, they are warned "ใช้อยู่ใน N ชีต". On confirming, every Linked Line referencing the item becomes a Manual Line holding the item's last name, Unit Cost, Unit and Cost Category. No sheet's figures change (ADR 0002).

**Blocked by:** 05

**Status:** done

- [x] The delete confirmation names how many sheets use the item. Unused items still delete after a plain confirmation.
- [x] The conversion and the deletion happen in one transaction. A failure leaves both the item and its lines unchanged.
- [x] An integration test computes a sheet's totals before and after deleting a linked item and finds them identical, with the lines now manual.

## Comments

**2026-10-04:** Built. New migration `delete_cost_item.sql` adds `public.delete_cost_item(p_id)` (plpgsql, service_role only): it locks the item `for update`, rewrites every `cost_line` linked to it into a Manual Line with the item's current name, Unit Cost, Unit and Cost Category, then deletes the item, all in the function's single transaction. `deleteCostItem` (src/server/cost-items.ts) now calls it over RPC; an unknown or malformed id is a no-op (it used to throw 22P02 for a malformed id). The edit page's delete button is now `DeleteCostItemButton` (src/app/cost-list/cost-item-form.tsx), a `window.confirm` that says "ใช้อยู่ใน N ชีต" and what happens to the lines when sheets use the item, or a plain "ลบ ...?" when none do. The conversion is done in SQL rather than with `unlinkLine` (src/lib/cost-lines.ts), since it has to run inside the transaction. Integration tests in cost-items.test.ts compute two sheets' totals with `computeSheet` before and after the delete, and also check the lines hold the item's last values. Atomicity comes from the single function call; no test forces a mid-function failure, as nothing in the schema can be made to fail there without altering it.
