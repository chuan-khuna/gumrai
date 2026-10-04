# 03: Cost Categories

**What to build:** The seller manages their own Cost Categories and gives each Cost Item one Cost Category or none. A fresh database starts with วัตถุดิบ, บรรจุภัณฑ์ and อื่น ๆ. The Cost List can be grouped or filtered by Cost Category, and each Cost Category has an automatic colour.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Cost Category table has a nullable owner, name, colour slot and sort order. The three starting Cost Categories are created by a migration, not by the seed.
- [ ] The seller can create, rename and delete Cost Categories.
- [ ] Deleting a Cost Category asks first, showing how many Cost Items are in it, and then sets those items to no category (ไม่มีหมวด).
- [ ] A Cost Item's form lets the seller pick one Cost Category or none.
- [ ] Colours come from a fixed OKLCH palette indexed by colour slot. ไม่มีหมวด uses a neutral colour, and the seller cannot pick colours.
- [ ] The Cost List can be grouped or filtered by Cost Category.
- [ ] Integration tests cover create, rename, delete-to-uncategorised, and the starting three existing after `db reset`.
