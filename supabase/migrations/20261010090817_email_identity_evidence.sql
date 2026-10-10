-- seller_add_email_identity (20261010084739_sign_in_methods.sql) marked the email identity it adds
-- as verified because the user's email_confirmed_at is set. With email confirmations off,
-- Supabase Auth sets email_confirmed_at at sign-up without anyone proving they own the email, so
-- that is no evidence. The identity now says verified only when one of the Seller's other
-- identities has the same email and its provider verified it (Discord reports `verified` for the
-- account's email, stored as identity_data.email_verified). Otherwise it says not verified.
--
-- Nothing in the app reads the flag. Supabase Auth reads it when picking a new primary email
-- after an identity is unlinked (UpdateUserEmailFromIdentities), but keeps the user's email as it
-- is when an identity has that same email, which this one always does.

create or replace function public.seller_add_email_identity()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select u.id::text,
         u.id,
         jsonb_build_object(
           'sub', u.id::text,
           'email', u.email,
           'email_verified', exists (
             select 1 from auth.identities v
              where v.user_id = u.id
                and v.provider <> 'email'
                and lower(v.identity_data ->> 'email') = lower(u.email)
                and v.identity_data -> 'email_verified' = 'true'::jsonb
           ),
           'phone_verified', false
         ),
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
