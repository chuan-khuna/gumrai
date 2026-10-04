-- Cost Category (CONTEXT.md): a group the seller names themselves. A Cost Item belongs to
-- at most one, or to none (shown as ไม่มีหมวด).
create table public.cost_category (
  id uuid primary key default gen_random_uuid(),
  -- No login yet. Nullable so Discord login (Supabase Auth) can claim existing rows later.
  owner uuid references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  -- Index into the fixed OKLCH category palette (globals.css). Assigned automatically;
  -- the seller never picks a colour.
  colour_slot smallint not null check (colour_slot >= 0),
  -- Where the category is listed. New categories go last.
  sort_order integer not null,
  created_at timestamptz not null default now()
);

-- No login yet (spec: no auth in v1). Only the server module reads this, with the secret key.
alter table public.cost_category enable row level security;

-- The three starting Cost Categories. These are part of the product, not sample data, so a
-- migration makes them rather than the seed.
insert into public.cost_category (name, colour_slot, sort_order) values
  ('วัตถุดิบ', 0, 0),
  ('บรรจุภัณฑ์', 1, 1),
  ('อื่น ๆ', 2, 2);

-- A Cost Item's Cost Category, or null for ไม่มีหมวด. Deleting a category leaves its items
-- uncategorised rather than deleting them.
alter table public.cost_item
  add column cost_category_id uuid references public.cost_category (id) on delete set null;

create index cost_item_cost_category_id_idx on public.cost_item (cost_category_id);
