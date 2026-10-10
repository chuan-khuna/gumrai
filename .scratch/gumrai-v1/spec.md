# Spec: Gumrai v1: Cost List and Cost Sheets

**Status:** done

## Problem Statement

A seller who wants to know what to charge, and what they keep, works it out by hand or in a spreadsheet. The same costs (มัทฉะ, นมสด, แก้ว) are retyped for every thing they sell, so when a supplier changes a price the seller has to find and fix every calculation that used it, and usually doesn't. Delivery platforms make it worse: the GP commission has VAT on it, so a "33%" GP actually takes 35.31%, and a hand calculation that forgets this overstates profit.

The seller already has a working Cost Sheet in matcha-cafe's `/sheet`, but it is free-form (every cost is typed per sheet), lives in one browser's localStorage, and is tied to drinks ("ต่อแก้ว").

## Solution

Gumrai is a Thai-language web app with two parts:

1. **A Cost List** (ลิสต์ต้นทุน) where the seller keeps each Cost Item they buy once: its name, Unit Cost, free-text Unit and an optional, seller-named Cost Category.
2. **Cost Sheets** (ชีตต้นทุน), one per thing they sell. The seller names the Sale Unit (แก้ว, กล่อง, ชิ้น), types a Selling Price, sets GP and VAT, and adds Cost Lines. A Cost Line is either picked from the Cost List (a Linked Line, which follows the Cost Item's latest Unit Cost) or typed by hand (a Manual Line) when nothing fits. The sheet shows Net Profit per Sale Unit and two charts: where the cost goes, and where the Selling Price goes.

Changing a Cost Item's Unit Cost updates every sheet that links to it. Data lives in Supabase, running locally in Docker for now, with no login.

## User Stories

### Cost List

1. As a seller, I want to add a Cost Item with a name, Unit Cost and Unit, so that I only type each thing I buy once.
2. As a seller, I want the Unit to be free text (g, ml, ชิ้น, ซอง), so that I can describe how I actually count each cost.
3. As a seller, I want the Unit Cost shown as "4 ฿/g", so that I read it the way I think about it.
4. As a seller, I want to give a Cost Item one Cost Category or none, so that I can group my costs without being forced to.
5. As a seller, I want to see all my Cost Items in one list, so that I can review what I buy.
6. As a seller, I want the Cost List grouped or filterable by Cost Category, so that I can find items quickly.
7. As a seller, I want to search the Cost List by name, so that I can find an item in a long list.
8. As a seller, I want to edit a Cost Item in a form and save it, so that a price change is a deliberate act.
9. As a seller, I want the edit form to tell me how many Cost Sheets use this item, so that I know what a price change will affect before saving.
10. As a seller, I want a saved Unit Cost change to show up in every sheet that links to the item, so that I never fix the same price twice.
11. As a seller, I want to be stopped from adding a Cost Item whose name already exists (ignoring case and surrounding spaces), so that my list has no confusing duplicates.
12. As a seller, I want to tell similar items apart by naming them, such as "นมสด (Makro)" and "นมสด (CP)", so that I can keep two suppliers' prices.
13. As a seller, I want to delete a Cost Item, so that I can drop things I no longer buy.
14. As a seller, I want deleting a Cost Item that sheets use to warn me "ใช้อยู่ใน N ชีต" and then turn those lines into Manual Lines with their last values, so that no sheet silently loses a cost.
15. As a seller, I want Unit Cost to accept decimals (0.075 ฿/ml), so that cheap per-unit costs are exact.
16. As a seller, I want a Unit Cost that is not a number, or is negative, to be rejected, so that my figures stay valid.

### Cost Categories

17. As a seller, I want three starting Cost Categories (วัตถุดิบ, บรรจุภัณฑ์, อื่น ๆ), so that I can start without setting anything up.
18. As a seller, I want to create my own Cost Categories, so that the groups match my business.
19. As a seller, I want to rename a Cost Category, so that I can fix its wording without re-tagging items.
20. As a seller, I want to delete a Cost Category after a confirmation saying how many costs are in it, with those costs becoming ไม่มีหมวด, so that removing a group never removes a cost.
21. As a seller, I want each Cost Category to get a distinct colour automatically, so that the charts are readable without me choosing colours.
22. As a seller, I want costs with no Cost Category to appear as "ไม่มีหมวด" in charts and breakdowns, so that nothing is left out of the totals.

### Cost Sheets

23. As a seller, I want to create a Cost Sheet for a thing I sell, so that I can cost it.
24. As a seller, I want to name the sheet, so that I can tell my sheets apart.
25. As a seller, I want to name the sheet's Sale Unit (แก้ว, กล่อง), defaulting to ชิ้น, so that labels read naturally ("ใช้ต่อแก้ว", "กำไรต่อแก้ว").
26. As a seller, I want to keep many sheets and see them in a list, so that I can cost my whole menu.
27. As a seller, I want to open, rename, duplicate and delete sheets, with deletion confirmed first, so that I can manage them.
28. As a seller, I want to duplicate a sheet to compare channels (หน้าร้าน against Grab), so that each sheet can carry its own Selling Price and GP.
29. As a seller, I want to type the Selling Price exactly, never rounded, so that the sheet shows the price I charge.
30. As a seller, I want each sheet to have a GP %, defaulting to 0%, so that selling direct needs no setup and platform sales can set their commission.
31. As a seller, I want each sheet to have a VAT % on the commission, defaulting to 7%, so that the Platform Take is right.
32. As a seller, I want VAT applied to the GP commission, not to the Selling Price, so that a 33% GP correctly takes 35.31%.

### Cost Lines

33. As a seller, I want to add a Cost Line by searching the Cost List, so that I reuse what I already entered.
34. As a seller, I want a picked line to take the item's name, Unit Cost, Unit and Cost Category, so that I only type the Quantity Used.
35. As a seller, I want to enter the Quantity Used per Sale Unit (4 g per แก้ว), with decimals, so that each line's cost is Unit Cost × Quantity Used.
36. As a seller, I want each line to show its cost per Sale Unit, so that I see what each ingredient adds.
37. As a seller, I want to add a Manual Line by typing a name, Unit Cost, Unit and optional Cost Category when the search finds nothing, so that I'm never blocked by a missing item.
38. As a seller, I want a "บันทึกเข้าลิสต์" action on a Manual Line, so that a one-off cost I'll reuse goes into the Cost List without retyping.
39. As a seller, I want saving a Manual Line whose name already exists in the Cost List to offer linking to the existing item instead, so that I don't create a duplicate.
40. As a seller, I want saving a Manual Line into the list to turn it into a Linked Line, so that it follows future price changes.
41. As a seller, I want to unlink a Linked Line into a Manual Line holding its current values, so that I can use a one-off figure (a supplier promotion) without changing the Cost Item.
42. As a seller, I want to see which lines are linked and which are manual, so that I know which figures follow the Cost List.
43. As a seller, I want to edit and remove Cost Lines, so that I can correct the sheet.

### Results and charts

44. As a seller, I want the total cost per Sale Unit, so that I know what one sale costs me.
45. As a seller, I want the Platform Take, broken into GP commission and VAT on GP, so that I see what the platform keeps.
46. As a seller, I want the Net Receipt, so that I see what actually reaches me.
47. As a seller, I want the Net Profit per Sale Unit, shown as a loss when negative, so that I know whether this price works.
48. As a seller, I want figures to update as I type, so that I can try prices quickly.
49. As a seller, I want a chart of costs from dearest to cheapest, by line and by Cost Category, so that I know where to cut.
50. As a seller, I want a chart splitting the Selling Price into Cost Categories, GP, VAT on GP and Net Profit, extending past 100% when there is a loss, so that I see where my money goes.
51. As a seller, I want shares shown as blank rather than as errors when a total is zero, so that an empty sheet doesn't break.

### Saving

52. As a seller, I want sheet edits held until I press save, with a "● ยังไม่บันทึก" marker, so that I can try prices without overwriting the real one.
53. As a seller, I want to be asked before leaving a sheet with unsaved edits, so that I don't lose work.
54. As a seller, I want a saved sheet to show current linked Unit Costs when reopened, so that it reflects today's prices.
55. As a seller, I want saving a Manual Line into the Cost List to create the Cost Item at once, while the line's switch to Linked Line saves with the sheet, so that the sheet's explicit save still governs the sheet.

### First run

56. As a seller opening Gumrai for the first time, I want an empty Cost List and no sheets, with clear actions to add my first Cost Item and create my first sheet, so that I start from my own data.
57. As a developer, I want sample Cost Items and a sample sheet loaded by the local database seed, so that I can develop against realistic data without it reaching the seller's data.

## Implementation Decisions

- **Stack:** Next.js (App Router) with Tailwind CSS and OKLCH colour tokens, TanStack Charts for charts, Supabase (Postgres) for storage. No FastAPI (ADR 0001). bun is the package manager. Vitest for tests.
- **Supply-chain hardening** copied from matcha-cafe: bun refuses packages younger than 7 days and pins exact versions. npm is configured with `ignore-scripts`, exact saves and engine-strict. CLAUDE.md records that the release-age floor must not be lowered or excluded without asking.
- **Local development:** the Supabase CLI is a bun devDependency, run as `bunx supabase`. It was planned to come from Scoop, but that install failed. Its postinstall still runs under the hardening, because bun trusts `supabase` by default. `supabase start` runs Supabase in Docker. Schema changes are Supabase migrations committed to the repo. Database types are generated from the schema. Sample data lives only in the seed file.
- **No auth yet.** One seller, no login, no deployment. Every owned table carries a nullable owner reference so Discord login (through Supabase Auth) can claim existing rows later.
- **Module: sheet calculation** (pure TypeScript, no I/O, runs in the browser). Ported from matcha-cafe's sheet and delivery domain code and adapted:
  - Input: a resolved sheet. That is the Sale Unit name, Selling Price, GP %, VAT %, and Cost Lines, each with Unit Cost, Quantity Used and an optional Cost Category reference. Linked Lines are already resolved to their Cost Item's current values.
  - Output: per-line cost, total cost, commission, VAT on commission, Platform Take, Net Receipt, Net Profit (unclamped, negative for a loss), cost by Cost Category (including ไม่มีหมวด), lines and categories ranked dearest first, and the Selling Price split for the chart. Shares are null when their whole is zero.
  - Platform Take = GP × (1 + VAT), applied to the Selling Price.
  - Cost Categories are open-ended ids, not matcha-cafe's fixed three.
  - Computes only Net Profit from the Selling Price. Price-from-profit is out of scope.
- **Module: server-side business rules** (Next.js server code, kept apart from UI so it can move to an API service later, per ADR 0001). The only code that talks to Supabase. Operations:
  - Cost Items: list, create, update, delete, count of sheets using an item.
  - Cost Categories: list, create, rename, delete.
  - Cost Sheets: list, load, create, save, duplicate, rename, delete.
  - Save a Manual Line into the Cost List.
  - Rules it enforces:
    - Cost Item names are unique per owner, ignoring case and surrounding spaces. Back this with a database constraint on the normalised name, not only an application check.
    - Deleting a Cost Item converts every Linked Line referencing it into a Manual Line carrying the item's last name, Unit Cost, Unit and Cost Category, in one transaction.
    - Deleting a Cost Category sets it to none on every Cost Item and Manual Line that had it.
    - Loading a sheet resolves Linked Lines to their Cost Item's current values.
    - Saving a sheet replaces its lines as a whole (the sheet is saved explicitly, as one unit).
    - Saving a Manual Line into the list creates the Cost Item immediately and returns it. If the name clashes, it returns the existing item so the UI can offer to link.
- **Schema (shape, not DDL):**
  - Cost Category: id, owner, name, colour slot, sort order.
  - Cost Item: id, owner, name, Unit Cost (numeric), Unit (text), Cost Category (nullable).
  - Cost Sheet: id, owner, name, Sale Unit name, Selling Price, GP %, VAT %, timestamps.
  - Cost Line: id, sheet, position, Quantity Used, and either a Cost Item reference (Linked Line) or its own name, Unit Cost, Unit and Cost Category (Manual Line).
  - A check constraint makes a line exactly one of the two kinds.
  - Money and quantities are Postgres `numeric`, never float.
  - The three starting Cost Categories are created by a migration, not the seed.
- **Category colours** are assigned automatically from a fixed OKLCH palette by the category's colour slot. Sellers cannot pick colours in v1. ไม่มีหมวด has its own neutral colour.
- **UI:** Thai only, baht only, no i18n layer. Code and the glossary use English domain names (GLOSSARY.md). Pages: Cost List (with category management) and Cost Sheets (list, plus a sheet editor with results and two charts). Charts are rebuilt with TanStack Charts and fed from the calculation module's output. matcha-cafe's SVG chart components are not reused.
- **Editing model:** Cost Items are edited one at a time in a form and saved immediately. Sheets hold edits client-side until explicitly saved, and leaving with unsaved edits asks first.

## Testing Decisions

- **Good tests check behaviour through a module's public interface:** given these inputs or this stored state, expect these outputs or this resulting state. They do not assert on internal helpers, SQL text or component structure.
- **Seam 1: sheet calculation module.** Vitest, pure input → output. Cover:
  - Platform Take with VAT on commission (33% GP → 35.31%).
  - Net Profit positive, zero and negative.
  - Zero Selling Price and empty sheets giving null shares.
  - Category breakdown including ไม่มีหมวด.
  - Ranking order.
  - The Selling Price split summing to the price, or past it on a loss.
  - Prior art: matcha-cafe's sheet and delivery domain tests, ported with the module and adapted to open-ended categories.
- **Seam 2: server-side business rules module.** Integration tests against the real local Supabase (no database mocks), each test isolating its own data. Cover:
  - The duplicate-name rejection (case and space insensitive).
  - Delete Cost Item → Linked Lines become Manual Lines with identical values, and the sheet's computed totals are unchanged.
  - Delete Cost Category → costs become uncategorised.
  - A Unit Cost change reflected when a sheet is loaded.
  - Unlink.
  - Save Manual Line into the list, both new and clashing.
  - The "used in N sheets" count.
  - Duplicate sheet independence.
  - Prior art: none in matcha-cafe, which has no database. These are the first of their kind here.
- **Not tested in code:** React components, server actions and routes that only wire UI to Seam 2, and chart rendering. They are checked by running the app.

## Out of Scope

- Login (Discord through Supabase Auth), multiple users, row-level security policies, deployment.
- Computing a Selling Price from a target profit (matcha-cafe's `/calc`), and rounding prices.
- Several selling channels inside one sheet. Duplicate the sheet instead.
- Pack-size pricing (price per pack → Unit Cost) and unit conversion between Units.
- Fixed and monthly costs (rent, wages, equipment), break-evens, and matcha-cafe's `/pricing` model.
- Export and import (JSON or CSV). Back up with a database dump.
- Version history or undo for sheets.
- Choosing category colours by hand.
- English UI and currencies other than baht.
- A shared package with matcha-cafe. Its domain code is copied and diverges.

## Further Notes

- ADR 0001 (no FastAPI) and ADR 0002 (Cost Lines link to the Cost List) govern this spec. ADR 0002 deliberately reverses matcha-cafe's ADR 0001, which kept its cost sheet free-form.
- **A saved sheet's figures can change without the sheet being edited**, whenever a linked Cost Item changes. This is intended (ADR 0002).
- Two behaviours were settled by summary rather than asked outright. Revisit them if they feel wrong in use:
  - sheet create/rename/duplicate/delete, as in matcha-cafe;
  - saving a Manual Line into the list commits the Cost Item at once, while the line's link commits with the sheet.
- Source material: matcha-cafe's `CONTEXT.md`, its cost-sheet spec under `.scratch/cost-sheet/`, and its sheet-as-SaaS discussion note.
