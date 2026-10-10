-- Sign in with Discord (ticket 03).
--
-- 1. A new Seller from Discord starts with their Discord name as Display Name.
--
--    Supabase Auth's Discord provider (supabase/auth, internal/api/provider/discord.go) stores
--    the Discord user in raw_user_meta_data as:
--      custom_claims.global_name  the display name the Discord user chose ('' when unset)
--      full_name                  the username, e.g. "matcha.cafe"
--      name                       "<username>#<discriminator>", e.g. "matcha.cafe#0"
--      avatar_url, picture        the avatar on cdn.discordapp.com
--    The old fallback reached full_name first, so it took the username even when the Seller
--    has a display name on Discord. global_name now comes before it.
--
--    create_seller runs only when the auth user is inserted. Supabase Auth rewrites
--    raw_user_meta_data on every later Discord sign-in, but nothing copies it to
--    seller_profile again, so a changed Discord name never changes the Display Name.

create or replace function public.create_seller()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.seller_profile (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data -> 'custom_claims' ->> 'global_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'ผู้ขาย'
    )
  );

  insert into public.cost_category (owner, name, colour_slot, sort_order) values
    (new.id, 'วัตถุดิบ', 0, 0),
    (new.id, 'บรรจุภัณฑ์', 1, 1),
    (new.id, 'อื่น ๆ', 2, 2);

  return new;
end;
$$;

revoke execute on function public.create_seller() from public, anon, authenticated;

-- 2. The signed-in Seller's Discord avatar, or null when they have no Discord identity.
--
--    The header shows it. It is read from the Discord identity, not from the user's metadata:
--    Supabase Auth refreshes the identity on every Discord sign-in and when Discord is bound
--    later (ticket 06), while binding never touches the metadata, and a Seller can write their
--    own metadata. Reads only the caller's own identity.

create function public.seller_discord_avatar()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(btrim(i.identity_data ->> 'avatar_url'), '')
    from auth.identities i
   where i.user_id = (select auth.uid())
     and i.provider = 'discord'
   order by i.created_at
   limit 1;
$$;

revoke execute on function public.seller_discord_avatar() from public, anon;
grant execute on function public.seller_discord_avatar() to authenticated;
