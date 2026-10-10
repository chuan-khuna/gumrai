# 07: /me: delete account

**What to build:** A Seller deletes their account from /me. The confirmation (through ConfirmAction) states how many Cost Sheets and Cost Items will be lost, and the Seller must type `delete` to confirm. The Seller and all their data are removed, they are signed out and land on the landing page.

**Blocked by:** 05

**Status:** done

- [x] The account module offers deleting the signed-in Seller, refusing unless the confirmation text is exactly `delete`; deleting the user is an admin-only operation and is the only place the secret key is used outside tests.
- [x] Deleting removes the Seller's profile, Cost Categories, Cost Items and Cost Sheets with their lines.
- [x] The confirmation shows the counts and the rest of its text in Thai.
- [x] Tests cover: wrong confirmation text deletes nothing; a deletion removes all of the Seller's data; another Seller's data is untouched.
- [x] The sign-in and Data model documents are updated.
