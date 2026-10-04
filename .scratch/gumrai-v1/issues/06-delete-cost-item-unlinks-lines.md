# 06: Deleting a Cost Item unlinks its lines

**What to build:** When the seller deletes a Cost Item that Cost Sheets use, they are warned "ใช้อยู่ใน N ชีต". On confirming, every Linked Line referencing the item becomes a Manual Line holding the item's last name, Unit Cost, Unit and Cost Category. No sheet's figures change (ADR 0002).

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] The delete confirmation names how many sheets use the item. Unused items still delete after a plain confirmation.
- [ ] The conversion and the deletion happen in one transaction. A failure leaves both the item and its lines unchanged.
- [ ] An integration test computes a sheet's totals before and after deleting a linked item and finds them identical, with the lines now manual.
