# 07: Save a Manual Line into the Cost List

**What to build:** On a Manual Line, the seller presses "บันทึกเข้าลิสต์". A Cost Item is created at once from the line's values and the line becomes a Linked Line. If a Cost Item with that name already exists, the seller is offered linking to the existing item instead.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Saving creates the Cost Item immediately, even if the sheet is unsaved. The line's switch to Linked Line persists when the sheet is saved.
- [ ] A name clash (ignoring case and surrounding spaces) creates no item. It shows the existing item's values and offers to link the line to it.
- [ ] Integration tests cover a new save and a clashing save that returns the existing item.
