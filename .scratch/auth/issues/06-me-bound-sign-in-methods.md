# 06: /me: bind and unbind ways of signing in

**What to build:** /me lists the ways the Seller can sign in (email and password, Discord). A Seller can bind Discord to their account, and unbind a way of signing in as long as one remains. If the Discord account already belongs to another Seller, binding fails with a Thai message explaining how to fix it: sign in with Discord, delete that other account at /me, then bind again. Data is never merged. A Seller with no Discord bound sees a note recommending it, since there is no password reset yet.

**Blocked by:** 03, 05

**Status:** needs hand verification. Built and tested; the Discord round trip (binding at /me, a first Discord sign-in, and a refused sign-in linked by email) needs real Discord credentials and is checked by hand.

- [x] Manual identity linking is enabled; there is no automatic linking. (Supabase Auth's automatic linking by email cannot be turned off, so the database refuses it: the refuse_automatic_link trigger on auth.identities fails Supabase Auth's transaction unless it made a new user or claimed a bind from /me, and the callback shows the Thai email_in_use message. Decided by the user; see docs/documents/sign-in.md, "Refusing automatic linking".)
- [x] The account module offers listing bound sign-in methods and unbinding one; unbinding the last one is refused.
- [ ] Binding Discord goes through the Discord OAuth flow and returns to /me with success or the already-bound error. (Built: bindDiscordAction, the `bind` flow and its /me messages, tested up to the Discord redirect and from the callback's query. Tick after the hand check with a real Discord Application.)
- [x] Tests cover listing methods and refusing to unbind the last one. The Discord redirect itself is verified by hand.
- [x] The sign-in document describes binding, with a Mermaid diagram of the bind flow and the conflict case.

## Notes

Merging two Sellers' data is out of scope; if it is ever wanted, it needs its own design (clashing Cost Item names, duplicate starting Cost Categories).
