# 09: Sheet management: rename, duplicate, delete

**What to build:** From the sheet list, the seller can rename, duplicate and delete Cost Sheets. Duplicating is how they compare selling channels: the copy has its own Selling Price, GP and lines, while its Linked Lines still link to the same Cost Items.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Rename works from the list and from the open sheet.
- [ ] Duplicate creates an independent sheet named with a "(สำเนา)" suffix. Its Linked Lines stay linked, and its Manual Lines are copied.
- [ ] Delete asks for confirmation first.
- [ ] Integration tests show that editing a duplicate leaves the original untouched, and that a duplicate's Linked Lines still follow Unit Cost changes.
