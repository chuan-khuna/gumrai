# Project documents

These documents describe how Gumrai is built and how its harder parts work. Domain terms are defined in [GLOSSARY.md](../../GLOSSARY.md). Design decisions are recorded in [docs/adr/](../adr/).

- [Onboarding](ONBOARDING.md) lists the prerequisites, tech stack, and tools, and walks you through running the app locally. Start here if you are new.
- [Architecture](architecture.md) explains how the code is layered, which code calls which, where each rule is enforced, and why there is no API service.
- [Sign-in, sessions and row-level security](sign-in.md) explains email sign-up and sign-in, signing in with Discord through the OAuth callback and its Thai errors, why a Discord sign-in that Supabase Auth linked to an existing Seller by email is refused, the header avatar, how the session travels in cookies through the proxy and `requestClient()`, which pages need a Seller, how a Seller changes their Display Name and password, binds and unbinds Discord or email and password, and deletes their account at `/me`, and how row-level security keeps each Seller to their own data.
- [Data model](data-model.md) describes the tables, the constraints that enforce rules, the Postgres functions, and how numbers move between the database and the app.
- [Linked and Manual Lines](linked-and-manual-lines.md) explains how a Cost Line follows the Cost List, and each way a line changes kind.
- [Sheet calculation](sheet-calculation.md) describes the profit formulas, VAT on GP, blank shares, and the price split chart.
- [Sheet editor](sheet-editor.md) explains how the editor holds unsaved edits, detects changes, saves, and warns before you leave.
- [Design system in code](design-system.md) describes the theme preset, role utilities, UI components, and Cost Category colours.
- [Testing](testing.md) describes the two kinds of test and how database tests keep their data apart.
