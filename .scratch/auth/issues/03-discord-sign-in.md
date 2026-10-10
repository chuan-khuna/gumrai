# 03: Sign in with Discord

**What to build:** The login page has a "เข้าสู่ระบบด้วย Discord" button. A visitor signs in with Discord and lands where they were going. A first Discord sign-in creates a new Seller whose Display Name starts as their Discord name, with the starting Cost Categories. The header shows the Seller's Discord avatar.

**Blocked by:** 02

**Status:** needs hand verification (built and tested by the agent; the real Discord redirect is not yet checked by hand)

- [x] The Discord provider is enabled in local Supabase; client ID and secret come from environment variables in an untracked file, never committed. The example env file lists them with empty values.
- [x] The OAuth callback completes the session and honours the return-to page.
- [x] A Discord sign-in with no email on the Discord account, or a cancelled consent, returns to the login page with a Thai message.
- [x] A new Seller from Discord gets their Discord name as Display Name; later changes to the Discord name do not change it.
- [x] The header shows the Discord avatar when the Seller has Discord bound, and the first letter of the Display Name otherwise.
- [x] Onboarding documents how to create the Discord Application, the redirect URL to register, where to put the secret, and that the app must be opened at 127.0.0.1, not localhost.
- [ ] Verified by hand on the dev server with a real Discord account (the OAuth redirect cannot be tested automatically).
