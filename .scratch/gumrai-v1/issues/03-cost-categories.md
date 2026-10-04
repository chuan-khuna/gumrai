# 03: Cost Categories

**What to build:** The seller manages their own Cost Categories and gives each Cost Item one Cost Category or none. A fresh database starts with วัตถุดิบ, บรรจุภัณฑ์ and อื่น ๆ. The Cost List can be grouped or filtered by Cost Category, and each Cost Category has an automatic colour.

**Blocked by:** 02

**Status:** done

- [x] Cost Category table has a nullable owner, name, colour slot and sort order. The three starting Cost Categories are created by a migration, not by the seed.
- [x] The seller can create, rename and delete Cost Categories.
- [x] Deleting a Cost Category asks first, showing how many Cost Items are in it, and then sets those items to no category (ไม่มีหมวด).
- [x] A Cost Item's form lets the seller pick one Cost Category or none.
- [x] Colours come from a fixed OKLCH palette indexed by colour slot. ไม่มีหมวด uses a neutral colour, and the seller cannot pick colours.
- [x] The Cost List can be grouped or filtered by Cost Category.
- [x] Integration tests cover create, rename, delete-to-uncategorised, and the starting three existing after `db reset`.

## Comments

**2026-10-04: implemented.**

- **Schema:** migration `20261004131315_cost_category.sql` adds `cost_category` (nullable `owner`, `name`, `colour_slot smallint`, `sort_order integer`) and inserts the three starting categories (slots and order 0, 1, 2). It also adds `cost_item.cost_category_id`, a nullable foreign key with `ON DELETE SET NULL`, so deleting a category moves its items to ไม่มีหมวด in the same statement. Types regenerated.
- **Module:** `src/server/cost-categories.ts` offers `listCostCategories` (by sort order), `createCostCategory`, `renameCostCategory`, `countCostItemsIn` (for the delete confirmation) and `deleteCostCategory`. Broken rules throw `CostCategoryError` with a Thai message (blank name, category gone). A new category goes last and gets the lowest colour slot no category holds, so colours stay distinct while the palette lasts and a deleted category's colour is reused first.
- **Cost Items:** `CostItem` gains `categoryId` (null for ไม่มีหมวด). `CostItemInput.categoryId` is optional: left out, a new item has none and an update keeps the current one. A missing or malformed category id is rejected with "ไม่พบหมวดนี้ อาจถูกลบไปแล้ว". `listCostItems` takes `categoryId` (an id, or null for ไม่มีหมวด).
- **Colours:** eight OKLCH tokens `--color-category-0…7` plus `--color-category-none` in an `@theme static` block in `globals.css` (`static` so all are emitted, since they are looked up by number rather than named in a class). `src/lib/category-colours.ts` maps a slot to `var(--color-category-N)`, wrapping past the eighth. Hues avoid the profit green and loss red. There is no colour picker.
- **UI:** `/cost-list/categories` (linked from the Cost List as "จัดการหมวดต้นทุน") adds, renames and deletes categories and shows each one's colour and item count. Delete asks first with `window.confirm`, naming how many Cost Items will become ไม่มีหมวด. The Cost Item form has a หมวด select with ไม่มีหมวด first. The Cost List has a category filter (ทุกหมวด, each category, ไม่มีหมวด) and a "จัดกลุ่มตามหมวด" toggle in its search form, kept in the URL (`?category=`, `?group=1`). Grouped, it shows one section per category in order, then ไม่มีหมวด, and leaves out empty groups.
- **Decisions not spelled out in the ticket:**
  - Category names are not required to be unique. Neither the ticket nor the spec asks for it. If wanted, it is a follow-up migration like `cost_item_owner_name_key`.
  - Categories cannot be reordered yet. `sort_order` exists, but nothing sets it except creation.
- **Tests:** `src/server/cost-categories.test.ts` (8) covers the starting three after `db reset`, create (trimmed, listed after existing ones, a fresh colour), blank name, rename (keeps colour and place, rejects blank and missing), item counts, and delete-to-uncategorised. `src/server/cost-items.test.ts` gains 4 tests: no category by default, pick, change and clear, a missing category rejected, and filtering by a category or by ไม่มีหมวด.
- **Verified:** `bun run check`, `bun run test` (36 tests) and `bun run build` pass. On `next start`, the categories page, the grouped view, the filter by category and by ไม่มีหมวด, and the item count were checked over HTTP. The create, rename and delete server actions were not clicked through in a browser.
