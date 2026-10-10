-- Whether the signed-in Seller has a password (ticket 05, /me).
--
-- A Seller who only ever signed in with Discord has none, and /me offers to set one instead
-- of asking for the current one. Supabase Auth keeps the password hash in auth.users, which
-- the app cannot read, and a password set later does not add an "email" identity, so the
-- identities list cannot answer this. This function reads only the caller's own row and
-- returns only a yes or no, never the hash.

create function public.seller_has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select coalesce(u.encrypted_password, '') <> ''
       from auth.users u
      where u.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.seller_has_password() from public, anon;
grant execute on function public.seller_has_password() to authenticated;
