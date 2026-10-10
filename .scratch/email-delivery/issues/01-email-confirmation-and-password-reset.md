# 01: Email confirmation and password reset

**What to build:** Once the app can send email, a Seller who signs up with email and password confirms their address before signing in, and a Seller who forgets their password resets it from a link sent to their email.

**Blocked by:** an email delivery setup (SMTP or a provider) for every environment that has real Sellers.

**Status:** needs-triage

## Why it waits

Discord login shipped without email confirmation and without a forgot-password flow, because nothing can send email yet (decided 2026-10-10 while planning Discord login). The cost of that choice:

- Anyone can sign up with an address that is not theirs.
- Supabase only links identities automatically when both emails are confirmed, so today binding email/password and Discord to one Seller is manual, from `/me`.
- A Seller who forgets their password and has not bound Discord cannot get back in, except by an administrator resetting it in Supabase Studio.

## What to decide when picked up

- Turn on `enable_confirmations` in `[auth.email]` and the production equivalent.
- What happens to Sellers who signed up before confirmation existed: ask them to confirm on next sign-in, or leave them as they are.
- Whether automatic identity linking by confirmed email is wanted once it becomes possible.
- Add the forgot-password link to the login page and a reset-password page.
- Whether changing a password should require reauthentication (`secure_password_change`), which also sends email.

## Comments
