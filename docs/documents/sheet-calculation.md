# Sheet calculation

`src/lib/sheet.ts` and `src/lib/delivery.ts` compute a Cost Sheet's figures. Both are pure functions with no I/O, ported from `src/domain/` in the matcha-cafe project. They run in the browser on every keystroke. Their tests are `sheet.test.ts` and `delivery.test.ts`.

## Input

`computeSheet(sheet: SheetInput)` takes numbers, not decimal strings. The sheet editor converts each typed field with `toNumber`, which returns 0 for any text that is not yet a plain decimal. A half-typed field therefore gives 0, not an error. Each line arrives resolved, so a Linked Line already carries its Cost Item's Unit Cost and category.

## Formulas

All figures are per Sale Unit.

```
line.cost      = unitCost × quantityUsed
totalCost      = sum of line.cost

gpRate         = gpPercent / 100
vatRate        = vatPercent / 100
commission     = sellingPrice × gpRate
commissionVat  = commission × vatRate
platformTake   = commission + commissionVat
               = sellingPrice × gpRate × (1 + vatRate)
netReceipt     = sellingPrice − platformTake

netProfit      = netReceipt − totalCost
```

VAT applies to the commission, never to the Selling Price. A GP of 33% with 7% VAT therefore takes 35.31% of the price. A calculation that takes only 33% overstates the profit.

`netProfit` is not clamped. A negative value is a loss.

The module computes profit from a price only. It does not compute a price from a target profit.

## Shares

`Share` is `number | null`. A share is `null` when its whole is zero, for example on an empty sheet or at a price of 0. The UI shows `null` as a blank cell, never as 0% and never as `NaN`.

## Output

| Field | Used for |
| --- | --- |
| `lines`, each with `cost` and `shareOfCost` | The line table |
| `categories` | Cost per Cost Category, in the order each category first appears. `null` is ไม่มีหมวด. |
| `ranked` and `rankedCategories` | The cost ranking chart, dearest first. The sort is stable, so equal costs keep the order the seller typed them in. |
| `platform` | The rows for GP, VAT on GP, Platform Take, and Net Receipt |
| `netProfit` | The main figure. It is shown in `text-loss` when negative. |
| `priceSplit`, `barTotal`, `paidOut`, and `paidOutShare` | The chart of where the Selling Price goes |

## Price split

`priceSplit` always contains every segment, in drawing order. It has one segment per category, then `commission`, `commissionVat`, `profit`, and `loss`. A segment with an amount of 0 stays in the list, so the chart and its legend keep their layout when a figure drops to 0.

- When the sheet makes a profit, the categories, `commission`, `commissionVat`, and `profit` add up to the Selling Price, and `loss` is 0.
- When the sheet makes a loss, `profit` is 0, and the costs and the Platform Take add up to more than the Selling Price. `loss` is the amount by which they exceed the price. It is not drawn as an extra length. `barTotal` equals `paidOut + profit`, which exceeds the price by exactly the loss. The chart marks the price with a dashed, labelled line.

## Charts

`src/app/sheets/[id]/sheet-charts.tsx` draws both charts with TanStack Charts, using only the `SheetResult`. `categoryLooks(categories)` maps a category id to its name and colour. [Design system in code](design-system.md) describes the colours. No test covers chart rendering.
