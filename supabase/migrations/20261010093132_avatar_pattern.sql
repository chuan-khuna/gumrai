-- The Seller's avatar is a generated pattern (Boring Avatars) from a seed they can shuffle at
-- /me. The Discord avatar is no longer shown.
--
-- 1. The seed. Each Seller starts with a random one, and สุ่มลายใหม่ at /me writes a new one.
--    The default is volatile, so every existing row gets its own.

alter table public.seller_profile
  add column avatar_seed text not null default gen_random_uuid()::text
  check (btrim(avatar_seed) <> '');

-- 2. The header no longer shows the Discord avatar, so nothing reads it.

drop function public.seller_discord_avatar();
