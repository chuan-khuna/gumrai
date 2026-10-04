# 08: Cost Categories on sheets, and the two charts

**What to build:** A sheet breaks its cost down by Cost Category, including ไม่มีหมวด, and shows two TanStack charts: costs ranked dearest first (by line and by Cost Category), and the Selling Price split into Cost Categories, GP, VAT on GP and Net Profit. Manual Lines can carry a Cost Category.

**Blocked by:** 03, 04

**Status:** done

- [x] A Manual Line can pick one Cost Category or none. Linked Lines show their Cost Item's.
- [x] A cost-by-Cost-Category breakdown is shown, with uncategorised costs as ไม่มีหมวด.
- [x] The cost-ranking chart and the Selling Price split chart are built with TanStack Charts from the calculation module's output, using the Cost Category colours.
- [x] On a loss, the split chart extends past 100% and shows the loss. With a zero price or no lines, the charts show an empty state instead of breaking.
- [x] Seam 1 tests cover the category breakdown including uncategorised costs, ranking order, and the split summing to the price (or past it on a loss).

## Comments

- 2026-10-04 (orchestrator): The user approved adding `@tanstack/react-charts` with `bun add` (exact version, per bunfig). If the install hits the 7-day release-age floor, needs `bun pm trust`, or has a React peer-dependency conflict, stop and ask; do not work around it.
- 2026-10-04 (implementer): Built. `bun add @tanstack/react-charts` installed 0.18.0 cleanly (no release-age, trust or peer-dependency issue). That package is now a compatibility wrapper: it exports only `Chart`, and the chart grammar (`defineChart`, `barX`, `text`, `ruleX`, scales) comes from its own dependency `@tanstack/charts` 0.18.0, imported transitively. If you want that import to be a declared dependency, `bun add @tanstack/charts` is the follow-up (not done, as only react-charts was approved).
  - Sheet editor: Manual Lines get a หมวด picker (one Cost Category or ไม่มีหมวด); Linked Lines show their Cost Item's category with its colour dot. The page now loads Cost Categories, so the ticket-07 clash notice also names the existing item's category.
  - New "ต้นทุนต่อ… แยกตามหมวด" breakdown, dearest first, ไม่มีหมวด included.
  - `src/app/sheets/[id]/sheet-charts.tsx`: the Selling Price split (one stacked bar of shares of the price, a solid rule at 100%, and on a loss a dashed outline from 100% to how far the paid-out parts run, plus a legend with amounts) and the cost ranking (horizontal bars, switchable ตามรายการ / ตามหมวด). Both are fed only from `computeSheet` and coloured from the Cost Category tokens; GP and VAT-on-GP got two new OKLCH tokens in globals.css (`--color-commission`, `--color-commission-vat`, in a `@theme static` block since they are referenced by variable).
  - Empty states: the split chart shows a message when the price is zero or there are no lines; the ranking chart when there are no lines or every line costs nothing. Checked in the running app: a profit sheet, a loss sheet (axis runs to 120% with the dashed loss) and a zero-price sheet all render; an all-zero ranking had crashed the linear scale and is guarded.
  - Tests: the Seam 1 calculation already covered breakdown, ranking and the split (ported in #02). Added two cases: an all-uncategorised sheet gathers into one ไม่มีหมวด, and a split with ไม่มีหมวด sums to exactly the price. Server-side category save on Manual Lines was already tested (#04). No chart or component tests, per CLAUDE.md.
