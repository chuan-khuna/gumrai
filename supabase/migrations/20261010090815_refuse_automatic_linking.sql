-- Refusing Supabase Auth's automatic linking by email, in the database (ticket 06). See
-- docs/documents/sign-in.md, "Refusing automatic linking".
--
-- On a first Discord sign-in whose email matches an existing user, Supabase Auth attaches the
-- Discord identity to that user (supabase/auth v2.197.0, internal/api/external.go,
-- createAccountFromExternalIdentity, case LinkAccount), and with email confirmations off it
-- trusts even an unverified Discord email. Whoever puts a Seller's email on a Discord account
-- would then sign in as that Seller. Binding at /me is the only way Discord may join an existing
-- Seller. An app-side check after the code exchange is not enough: Supabase Auth has already
-- linked the identity and issued the code, which can be exchanged without the app (POST
-- /auth/v1/token?grant_type=pkce) or skipped (the implicit flow). So the insert itself fails.
--
-- A non-email identity may be inserted only in a transaction that
--   1. created its user (a first sign-in: signupNewUser and createNewIdentity run in one
--      transaction), or
--   2. claimed a bind of that user to that provider: Supabase Auth's callback for manual linking
--      (linkIdentityToUser) runs in the transaction that also marks the flow state used. The flow
--      state was written by GET /user/identities/authorize, which needs the user's own session,
--      with linking_target_id set to them; on a PKCE callback the same transaction sets its
--      user_id to them (internalExternalProviderCallback). Only the flow state that this
--      transaction wrote counts, so a bind the Seller has started but not finished lets nothing
--      else through.
-- Anything else (automatic linking by email, an invite accepted with a provider) is refused.
-- Email identities are left alone: Supabase Auth writes them for email sign-up, and
-- seller_add_email_identity adds one before Discord is unbound.
--
-- The check runs at commit (a deferred constraint trigger), after the flow state is marked used.
-- Its error, SQLSTATE PT403 with the message 'automatic_link_refused', fails Supabase Auth's
-- transaction, so no identity, session or code exists. Supabase Auth passes a Postgres error it
-- did not raise itself back to the redirect URL as ?error=access_denied (PT403 maps to HTTP 403)
-- and ?error_description=automatic_link_refused, which the app's callback shows in Thai
-- (src/server/auth/oauth.ts).
--
-- Fails closed: a bind through the implicit flow (whose callback deletes the flow state instead
-- of marking it) is refused, as is any change in Supabase Auth that stops writing the flow state
-- in the linking transaction.

-- 1. Remembers, for this transaction only, the auth users it inserted.
create function public.note_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config(
    'gumrai.users_created',
    coalesce(current_setting('gumrai.users_created', true), '') || new.id::text || ',',
    true
  );
  return null;
end;
$$;

revoke execute on function public.note_auth_user_created() from public, anon, authenticated;

create trigger note_auth_user_created
  after insert on auth.users
  for each row execute function public.note_auth_user_created();

-- 2. At commit, refuses a non-email identity on a user the transaction neither created nor
--    claimed a bind for.
create function public.refuse_automatic_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if position(new.user_id::text || ',' in coalesce(current_setting('gumrai.users_created', true), '')) > 0 then
    return null;
  end if;

  if exists (
    select 1 from auth.flow_state f
     where f.linking_target_id = new.user_id
       and f.user_id = new.user_id
       and f.provider_type = new.provider
       -- Written by this transaction.
       and f.xmin = pg_current_xact_id()::xid
  ) then
    return null;
  end if;

  raise exception 'automatic_link_refused'
    using errcode = 'PT403',
          detail = format('A %s identity may join an existing user only by binding it from the account page.', new.provider);
end;
$$;

revoke execute on function public.refuse_automatic_link() from public, anon, authenticated;

create constraint trigger refuse_automatic_link
  after insert on auth.identities
  deferrable initially deferred
  for each row
  when (new.provider <> 'email')
  execute function public.refuse_automatic_link();
