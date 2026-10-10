# Project documents

These documents describe how Gumrai is built and how its harder parts work. Domain terms are defined in [GLOSSARY.md](../../GLOSSARY.md). Design decisions are recorded in [docs/adr/](../adr/).

- [Onboarding](ONBOARDING.md) lists the prerequisites, tech stack, and tools, and walks you through running the app locally. Start here if you are new.
- [Architecture](architecture.md) explains how the code is layered, which code calls which, where each rule is enforced, and why there is no API service.
- [Data model](data-model.md) describes the tables, the constraints that enforce rules, the Postgres functions, and how numbers move between the database and the app.
- [Linked and Manual Lines](linked-and-manual-lines.md) explains how a Cost Line follows the Cost List, and each way a line changes kind.
- [Sheet calculation](sheet-calculation.md) describes the profit formulas, VAT on GP, blank shares, and the price split chart.
- [Sheet editor](sheet-editor.md) explains how the editor holds unsaved edits, detects changes, saves, and warns before you leave.
- [Design system in code](design-system.md) describes the theme preset, role utilities, UI components, and Cost Category colours.
- [Testing](testing.md) describes the two kinds of test and how database tests keep their data apart.
