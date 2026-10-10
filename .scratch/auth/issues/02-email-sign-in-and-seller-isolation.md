# 02: Sign up and sign in with email, each Seller sees only their own data

**What to build:** A visitor signs up at the login page with email, password and Display Name, or signs in with email and password. Once signed in they reach the Cost List and Cost Sheets, which show only what they made themselves, starting with the three starting Cost Categories (วัตถุดิบ, บรรจุภัณฑ์, อื่น ๆ). Signed-out visitors who open those pages are sent to the login page and brought back after signing in. The header shows the Seller's Display Name and an ออกจากระบบ button. This is the tracer bullet for login: schema, row-level security, session handling, UI and tests in one slice.

**Blocked by:** 01

**Status:** done

- [x] A new migration (existing migrations untouched) deletes every row with no owner, makes owner required and default to the signed-in Seller, and adds row-level security policies so a Seller can read and change only rows they own, on every owned table.
- [x] Cost Item names stay unique per owner, ignoring case and surrounding spaces; two Sellers may each have the same name.
- [x] The database functions for saving, duplicating and deleting keep working under row-level security and cannot touch another Seller's rows.
- [x] A Seller profile holding the Display Name is created by the database when a user is created, together with that Seller's three starting Cost Categories. No ownerless starting categories remain.
- [x] Email sign-up needs no email confirmation; passwords are at least 8 characters. Errors (wrong password, email taken, short password) show in Thai.
- [x] Pages and actions act through a per-request client carrying the Seller's session from cookies; the secret key is used only by tests and admin-only operations.
- [x] The Cost List and Cost Sheet pages require a signed-in Seller; the return-to page is kept through sign-in, defaulting to the Cost Sheets page.
- [x] Sign out ends the session and returns to the landing page path.
- [x] Tests create real Sellers in local Supabase (admin API, then email/password sign-in) and call operations as that Seller; every existing business-rule test runs this way, and each test removes its Sellers afterwards.
- [x] A test shows Seller B cannot list, read, change or delete Seller A's Cost Items, Cost Categories or Cost Sheets, and cannot link a Cost Line to A's Cost Item.
- [x] A test shows a new Seller starts with exactly the three starting Cost Categories.
- [x] The seed creates a test Seller who can sign in with a documented email and password, and owns the sample data.
- [x] Architecture, Data model, Testing and Onboarding documents are updated, and a new document describing sign-in, sessions and row-level security (with a Mermaid flow) is added to the documents index.
- [x] Generated database types are regenerated and committed.
