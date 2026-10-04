# 09: Sheet management: rename, duplicate, delete

**What to build:** From the sheet list, the seller can rename, duplicate and delete Cost Sheets. Duplicating is how they compare selling channels: the copy has its own Selling Price, GP and lines, while its Linked Lines still link to the same Cost Items.

**Blocked by:** 05

**Status:** done

- [x] Rename works from the list and from the open sheet.
- [x] Duplicate creates an independent sheet named with a "(สำเนา)" suffix. Its Linked Lines stay linked, and its Manual Lines are copied.
- [x] Delete asks for confirmation first.
- [x] Integration tests show that editing a duplicate leaves the original untouched, and that a duplicate's Linked Lines still follow Unit Cost changes.

## Comments

**2026-10-04:** Built. Server: `renameCostSheet` and `duplicateCostSheet` in `src/server/cost-sheets.ts`, beside the existing `deleteCostSheet`. Duplicating runs in one transaction through a new `duplicate_cost_sheet` SQL function (migration `20261004134424_duplicate_cost_sheet.sql`); the copy's name, with the " (สำเนา)" suffix, is chosen in TypeScript and passed in. Linked Lines are copied with the same `cost_item_id`, Manual Lines with their values. UI: each row of `/sheets` (`src/app/sheets/sheet-row.tsx`) has เปลี่ยนชื่อ (inline form), ทำสำเนา and ลบ, which asks with `window.confirm` first. Rename from the open sheet was already there (the ชื่อชีต field, saved with the sheet), so nothing new was added to the editor. Duplicating keeps the seller on the list, where the copy appears first (newest change first); a copy of a sheet deleted meanwhile is silently skipped. Integration tests cover rename, duplicate contents, duplicate independence, a duplicate following Unit Cost changes, and delete.
