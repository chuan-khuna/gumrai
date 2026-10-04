# 02: Cost List: Cost Item CRUD

**What to build:** The seller opens the Cost List page and can add, edit and delete Cost Items (name, Unit Cost, free-text Unit). Each item shows as "4 ฿/g". Names are unique, ignoring case and surrounding spaces. The list can be searched by name.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Cost Item table has a nullable owner, name, Unit Cost (numeric, never float) and Unit (text). A database constraint enforces uniqueness on the normalised name.
- [ ] The server-side business rules module offers list, create, update and delete for Cost Items.
- [ ] Adding or renaming to a duplicate name is rejected with a Thai message, in both the module and the UI.
- [ ] Unit Cost accepts decimals and rejects non-numbers and negatives.
- [ ] Editing happens in a form and takes effect on save.
- [ ] Name search filters the list.
- [ ] Integration tests against local Supabase (no mocks) cover create, update, delete, and duplicate rejection including case and space variants.
