# 04: Cost Sheet with Manual Lines

**What to build:** The seller creates a Cost Sheet, names it and its Sale Unit (default ชิ้น), types a Selling Price, sets GP (default 0%) and VAT (default 7%), and adds Manual Lines (name, Unit Cost, Unit, Quantity Used). The sheet shows its results live as figures. Edits are saved explicitly.

**Blocked by:** 01

**Status:** done

- [x] The sheet calculation module is ported from matcha-cafe's sheet and delivery domain code, with its tests (Seam 1). It is adapted to open-ended Cost Category ids, and its tests pass.
- [x] Platform Take = GP × (1 + VAT) on the Selling Price. A test shows that 33% GP takes 35.31%.
- [x] Results show cost per line, total cost, GP commission, VAT on GP, Net Receipt and Net Profit, all labelled per Sale Unit (e.g. กำไรต่อแก้ว). Net Profit is shown as a loss when negative.
- [x] Figures update as the seller types, with no server round trip. The Selling Price is never rounded.
- [x] Shares are blank rather than errors when their whole is zero.
- [x] Cost Sheet and Cost Line tables exist. A check constraint makes each line either linked or manual, and only manual is used here.
- [x] Sheets list and open. Saving replaces the sheet's lines as one unit.
- [x] A "● ยังไม่บันทึก" marker shows while there are unsaved edits, and the seller is asked before leaving with unsaved edits.
- [x] Integration tests cover create, save, reload, and round-tripping decimal values exactly.

## Comments

- 2026-10-04 (orchestrator): Source for the port confirmed by the user: `D:\code\matcha-cafe\src\domain\` — `sheet.ts`, `delivery.ts` and their tests (`sheet.test.ts`, `delivery.test.ts`). Use them as references and port the code into this repo (copied, then adapted; no shared package).
- 2026-10-04 (agent): Built. Sheet calculation in `src/lib/sheet.ts` + `src/lib/delivery.ts` (ported from matcha-cafe with tests: categories are open-ended ids with null = ไม่มีหมวด, listed in order of first appearance; per Sale Unit instead of per cup). Migration `20261004132258_cost_sheet.sql` adds `cost_sheet`, `cost_line` (check `cost_line_linked_or_manual`; `cost_item_id` FK has no cascade so ticket 06 must unlink first) and `save_cost_sheet(uuid, jsonb, jsonb)`, which saves the sheet and replaces its lines in one transaction. Server module `src/server/cost-sheets.ts` (list, get, create, save, delete) with integration tests. Pages `/sheets` (list + create) and `/sheets/[id]` (client editor: live figures, "● ยังไม่บันทึก", beforeunload + Link `onNavigate` confirm). Deviations: (1) dropped matcha-cafe's `deliveryPlan`/`listedPriceFor`/`costBudgetFor` (price-from-profit is out of scope) and the chart axes `priceAxis`/`rankAxis`/`axis` (charts are rebuilt with TanStack in 08; re-add there if needed). (2) `deleteCostSheet` exists in the server module only, for test cleanup; no delete UI (that is 09). (3) GP/VAT are validated as non-negative decimals only; no upper bound was specified. Lines carry `categoryId` through save/load but there is no picker (08).
