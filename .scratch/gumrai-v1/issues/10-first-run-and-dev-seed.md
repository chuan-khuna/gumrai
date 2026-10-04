# 10: First-run empty states and dev seed

**What to build:** A seller opening Gumrai with no data sees an empty Cost List and no sheets, each with a clear first action: "เพิ่มรายการต้นทุนแรก" and "สร้างชีตแรก". Developers get realistic sample data from the local database seed only.

**Blocked by:** 05, 08

**Status:** done

- [x] The empty Cost List and empty sheet list each show a single clear call to action.
- [x] The seed loads sample Cost Items across Cost Categories and one sample sheet using Linked Lines, Manual Lines and a non-zero GP. It is applied only by `supabase db reset`.
- [x] No migration inserts sample Cost Items or sheets. Only the three starting Cost Categories come from a migration.

## Comments

**2026-10-04:** Built. `/cost-list` on first run (an empty Cost List with no search or filter) shows only the add form, headed "เพิ่มรายการต้นทุนแรก", and hides the search/filter bar; a search or filter with no match still says nothing was found. `/sheets` with no sheets shows only the create form, headed "สร้างชีตแรก". `supabase/seed.sql` adds 8 Cost Items (3 วัตถุดิบ, 3 บรรจุภัณฑ์, 1 อื่น ๆ, 1 ไม่มีหมวด) and one sheet "มัทฉะลาเต้เย็น (แอปส่งอาหาร)" (89 ฿/แก้ว, GP 30%) with 6 Linked Lines and 2 Manual Lines. It looks up the starting categories by name, which stay in their migration. No migration changed. Seed names differ from every fixed name the tests save into the Cost List, so all 107 tests pass after `db:reset`. The empty states have no tests, because CLAUDE.md says not to test React components.
