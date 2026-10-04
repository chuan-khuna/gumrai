# 10: First-run empty states and dev seed

**What to build:** A seller opening Gumrai with no data sees an empty Cost List and no sheets, each with a clear first action: "เพิ่มรายการต้นทุนแรก" and "สร้างชีตแรก". Developers get realistic sample data from the local database seed only.

**Blocked by:** 05, 08

**Status:** ready-for-agent

- [ ] The empty Cost List and empty sheet list each show a single clear call to action.
- [ ] The seed loads sample Cost Items across Cost Categories and one sample sheet using Linked Lines, Manual Lines and a non-zero GP. It is applied only by `supabase db reset`.
- [ ] No migration inserts sample Cost Items or sheets. Only the three starting Cost Categories come from a migration.
