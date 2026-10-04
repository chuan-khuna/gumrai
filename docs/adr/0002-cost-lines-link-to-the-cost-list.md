# Cost Lines link to the Cost List

A Cost Line picked from the Cost List is a Linked Line: it reads its name, Unit Cost, Unit and Cost Category from the Cost Item, so changing an item's Unit Cost updates every Cost Sheet that uses it. This deliberately reverses matcha-cafe's ADR 0001, which kept its cost sheet free-form because shared data would make every line an override of a number the sheet does not own. Gumrai answers that objection by letting any line be unlinked into a Manual Line, which holds its own values.

## Considered Options

- **Copy values into the sheet when picked.** Rejected: the point of a Cost List is to update a price once, and copies would leave every saved sheet stale.
- **Link with no way out.** Rejected: a sheet sometimes needs a one-off figure, such as a supplier's promotional price, without changing the Cost Item.

## Consequences

- **A saved Cost Sheet's figures can change without the sheet being edited**, whenever a Cost Item it links to changes. Explicit saving covers the sheet's own inputs, not its linked costs.
- **Deleting a Cost Item unlinks its lines** into Manual Lines holding the last values, after a confirmation that says how many sheets use it. No sheet loses a cost silently.
- **The database links a sheet's lines to Cost Items by reference**, so switching to copies later needs a data migration.
