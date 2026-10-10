-- Unbinding a way of signing in at /me (ticket 06). See docs/documents/sign-in.md,
-- "Binding and unbinding ways to sign in".
--
-- A Seller signs in with "email and password" when they have a password, and with Discord when
-- they have a discord identity. Supabase Auth's own API covers binding and unbinding Discord
-- (linkIdentity, unlinkIdentity) but has two gaps, which these functions fill. Each acts only on
-- the caller's own auth user and re-checks that another way to sign in remains.

-- Unbinding "email and password": clears the Seller's password hash, so signing in with email
-- and password no longer works. Supabase Auth's API can change a password but never remove one.
-- Refused unless the Seller has Discord bound, so they can still sign in. Setting a password
-- again at /me binds the method back.
create function public.seller_clear_password()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from auth.identities i
     where i.user_id = (select auth.uid()) and i.provider = 'discord'
  ) then
    raise exception 'no other way to sign in' using errcode = 'P0001', hint = 'last_sign_in_method';
  end if;
  update auth.users
     set encrypted_password = '', updated_at = now()
   where id = (select auth.uid());
end;
$$;

revoke execute on function public.seller_clear_password() from public, anon;
grant execute on function public.seller_clear_password() to authenticated;

-- Before unbinding Discord from a Seller who signed up with Discord and set a password later:
-- Supabase Auth refuses to unlink a user's only identity, and setting a password adds no
-- "email" identity. This adds that identity, as Supabase Auth itself stores one for an email
-- sign-up (and as its own CreateEmailIdentityOnPasswordSet option would), so unlinkIdentity can
-- then remove Discord. It does nothing unless the Seller has a password and a confirmed email and
-- no "email" identity yet.
create function public.seller_add_email_identity()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select u.id::text,
         u.id,
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
         'email',
         null,
         now(),
         now()
    from auth.users u
   where u.id = (select auth.uid())
     and coalesce(u.encrypted_password, '') <> ''
     and coalesce(u.email, '') <> ''
     and u.email_confirmed_at is not null
     and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');
$$;

revoke execute on function public.seller_add_email_identity() from public, anon;
grant execute on function public.seller_add_email_identity() to authenticated;
