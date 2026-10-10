# 05: /me: Display Name and password

**What to build:** A signed-in Seller opens /me to change their Display Name, change their password (entering the current one), or set a password if they have none (a Seller who only signed in with Discord; setting one lets them sign in with their Discord email and that password). /me also has the ออกจากระบบ button.

**Blocked by:** 02

**Status:** done

- [x] /me requires a signed-in Seller.
- [x] The business rules module gains an account module with operations to read the Seller's profile, rename the Display Name, change the password, and set a first password.
- [x] A Display Name cannot be blank; surrounding spaces are trimmed.
- [x] Changing the password fails with a Thai message if the current password is wrong; the new password must be at least 8 characters.
- [x] A Seller with no password sees ตั้งรหัสผ่าน instead of the change form, and needs no current password.
- [x] Tests (real Sellers, no mocks) cover renaming, changing the password with right and wrong current passwords, the new password working for sign-in, and setting a first password.
- [x] The sign-in document is updated.
