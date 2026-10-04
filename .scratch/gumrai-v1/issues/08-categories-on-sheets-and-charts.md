# 08: Cost Categories on sheets, and the two charts

**What to build:** A sheet breaks its cost down by Cost Category, including ไม่มีหมวด, and shows two TanStack charts: costs ranked dearest first (by line and by Cost Category), and the Selling Price split into Cost Categories, GP, VAT on GP and Net Profit. Manual Lines can carry a Cost Category.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] A Manual Line can pick one Cost Category or none. Linked Lines show their Cost Item's.
- [ ] A cost-by-Cost-Category breakdown is shown, with uncategorised costs as ไม่มีหมวด.
- [ ] The cost-ranking chart and the Selling Price split chart are built with TanStack Charts from the calculation module's output, using the Cost Category colours.
- [ ] On a loss, the split chart extends past 100% and shows the loss. With a zero price or no lines, the charts show an empty state instead of breaking.
- [ ] Seam 1 tests cover the category breakdown including uncategorised costs, ranking order, and the split summing to the price (or past it on a loss).

## Comments

- 2026-10-04 (orchestrator): The user approved adding `@tanstack/react-charts` with `bun add` (exact version, per bunfig). If the install hits the 7-day release-age floor, needs `bun pm trust`, or has a React peer-dependency conflict, stop and ask; do not work around it.
