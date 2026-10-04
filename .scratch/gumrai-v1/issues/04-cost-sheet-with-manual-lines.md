# 04: Cost Sheet with Manual Lines

**What to build:** The seller creates a Cost Sheet, names it and its Sale Unit (default ชิ้น), types a Selling Price, sets GP (default 0%) and VAT (default 7%), and adds Manual Lines (name, Unit Cost, Unit, Quantity Used). The sheet shows its results live as figures. Edits are saved explicitly.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The sheet calculation module is ported from matcha-cafe's sheet and delivery domain code, with its tests (Seam 1). It is adapted to open-ended Cost Category ids, and its tests pass.
- [ ] Platform Take = GP × (1 + VAT) on the Selling Price. A test shows that 33% GP takes 35.31%.
- [ ] Results show cost per line, total cost, GP commission, VAT on GP, Net Receipt and Net Profit, all labelled per Sale Unit (e.g. กำไรต่อแก้ว). Net Profit is shown as a loss when negative.
- [ ] Figures update as the seller types, with no server round trip. The Selling Price is never rounded.
- [ ] Shares are blank rather than errors when their whole is zero.
- [ ] Cost Sheet and Cost Line tables exist. A check constraint makes each line either linked or manual, and only manual is used here.
- [ ] Sheets list and open. Saving replaces the sheet's lines as one unit.
- [ ] A "● ยังไม่บันทึก" marker shows while there are unsaved edits, and the seller is asked before leaving with unsaved edits.
- [ ] Integration tests cover create, save, reload, and round-tripping decimal values exactly.

## Comments

- 2026-10-04 (orchestrator): Source for the port confirmed by the user: `D:\code\matcha-cafe\src\domain\` — `sheet.ts`, `delivery.ts` and their tests (`sheet.test.ts`, `delivery.test.ts`). Use them as references and port the code into this repo (copied, then adapted; no shared package).
