# 07: Save a Manual Line into the Cost List

**What to build:** On a Manual Line, the seller presses "บันทึกเข้าลิสต์". A Cost Item is created at once from the line's values and the line becomes a Linked Line. If a Cost Item with that name already exists, the seller is offered linking to the existing item instead.

**Blocked by:** 05

**Status:** done

- [x] Saving creates the Cost Item immediately, even if the sheet is unsaved. The line's switch to Linked Line persists when the sheet is saved.
- [x] A name clash (ignoring case and surrounding spaces) creates no item. It shows the existing item's values and offers to link the line to it.
- [x] Integration tests cover a new save and a clashing save that returns the existing item.

## Comments

- 2026-10-04 (agent): Built. No schema change: the existing unique index `cost_item_owner_name_key` (owner, lower(btrim(name))) decides the clash. `src/server/cost-items.ts`: `saveManualLineToCostList(line)` validates like `createCostItem`, inserts the line's name, Unit Cost, Unit and Cost Category, and returns `{ outcome: 'created', item }`; on a unique violation it creates nothing and returns `{ outcome: 'clash', item }` with the existing item, found by a case-insensitive exact name match (LIKE wildcards escaped). Invalid values still throw `CostListError`. `src/lib/cost-lines.ts`: pure `linkLine(line, item)` turns a Manual Line into a Linked Line keeping its Quantity Used. `src/app/sheets/actions.ts`: `saveManualLineToCostListAction` (wiring only; revalidates `/cost-list` on create). Editor: each Manual Line has "บันทึกเข้าลิสต์". On create the line becomes a Linked Line in the draft (persisted when the sheet is saved) and the item joins the add-line search. On a clash a notice under the line shows the existing item's name and Unit Cost/Unit with "ลิงก์กับรายการนี้แทน" and "ไม่ต้อง"; an error shows under the line. Tests in `cost-items.test.ts`: a new save (values, then linking and saving the sheet reloads as a Linked Line), a clashing save (different case and spaces) returning the existing item and creating nothing, wildcard names, and invalid values. Deviation: the clash notice does not show the existing item's Cost Category, since the sheet editor has no category names yet (ticket 08 brings categories to sheets). Checked by rendering a sheet page on the dev server; the click flow was not driven in a browser.
