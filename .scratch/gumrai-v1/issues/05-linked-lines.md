# 05: Linked Lines

**What to build:** On a Cost Sheet, the seller searches the Cost List and picks a Cost Item. It becomes a Linked Line that takes the item's name, Unit Cost, Unit and Cost Category, so the seller types only the Quantity Used. Changing the item's Unit Cost in the Cost List changes every sheet that links to it. A Linked Line can be unlinked into a Manual Line. The Cost Item form shows how many sheets use it.

**Blocked by:** 02, 04

**Status:** done

- [x] The add-line control searches the Cost List by name. Picking an item adds a Linked Line. Typing a name with no match still allows a Manual Line.
- [x] Loading a sheet resolves each Linked Line to its Cost Item's current values.
- [x] Linked and manual lines are visibly distinguished.
- [x] Unlink turns a Linked Line into a Manual Line holding its current values. It persists when the sheet is saved.
- [x] The Cost Item edit form shows "ใช้อยู่ใน N ชีต".
- [x] Integration tests cover a Unit Cost change being reflected on sheet load, unlink, and the "used in N sheets" count.

## Comments

- 2026-10-04 (agent): Built. New migration `20261004132801_linked_lines.sql` redefines `save_cost_sheet` (same signature, so `database.types.ts` is unchanged) to also write `cost_item_id`; a Linked Line is sent as `{ cost_item_id, quantity_used }`. `src/server/cost-sheets.ts`: `CostLine` is now `ManualLine | LinkedLine`; loading embeds `cost_item` and resolves each Linked Line to the item's current name, Unit Cost, Unit and Cost Category; save input lines are `ManualLineInput | LinkedLineInput { costItemId, quantityUsed }`; a missing or malformed Cost Item gives "ไม่พบรายการต้นทุนนี้ในลิสต์ อาจถูกลบไปแล้ว". `src/server/cost-items.ts`: `countSheetsUsingCostItem` (distinct sheets, so two lines on one sheet count once). `src/lib/cost-lines.ts`: pure `unlinkLine`, used by both the editor and the test. Editor: the add-line control filters the Cost List (loaded with the page) by name, case- and space-insensitive, up to 8 matches; picking adds a Linked Line, and a button always offers `+ เพิ่ม "<typed>" เป็นรายการพิมพ์เอง`. Linked rows have a "ลิงก์ลิสต์" pill and a tinted background, show name/Unit Cost/Unit read-only, and have "เลิกลิงก์"; manual rows have a "พิมพ์เอง" pill. Unlink is a draft edit, persisted on save. The Cost Item edit page shows "ใช้อยู่ใน N ชีต" (also when N is 0). Deviation: the Cost List search runs in the browser over the list passed to the page, rather than a server round trip per keystroke; it matches `listCostItems({ search })` semantics.
