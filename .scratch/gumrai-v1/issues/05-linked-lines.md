# 05: Linked Lines

**What to build:** On a Cost Sheet, the seller searches the Cost List and picks a Cost Item. It becomes a Linked Line that takes the item's name, Unit Cost, Unit and Cost Category, so the seller types only the Quantity Used. Changing the item's Unit Cost in the Cost List changes every sheet that links to it. A Linked Line can be unlinked into a Manual Line. The Cost Item form shows how many sheets use it.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] The add-line control searches the Cost List by name. Picking an item adds a Linked Line. Typing a name with no match still allows a Manual Line.
- [ ] Loading a sheet resolves each Linked Line to its Cost Item's current values.
- [ ] Linked and manual lines are visibly distinguished.
- [ ] Unlink turns a Linked Line into a Manual Line holding its current values. It persists when the sheet is saved.
- [ ] The Cost Item edit form shows "ใช้อยู่ใน N ชีต".
- [ ] Integration tests cover a Unit Cost change being reflected on sheet load, unlink, and the "used in N sheets" count.
