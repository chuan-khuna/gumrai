-- Cost Item (CONTEXT.md): one thing the seller buys, with a name, a Unit Cost and a Unit.
create table public.cost_item (
  id uuid primary key default gen_random_uuid(),
  -- No login yet. Nullable so Discord login (Supabase Auth) can claim existing rows later.
  owner uuid references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  -- Baht per one Unit. numeric, never float, so 0.075 stays exact.
  unit_cost numeric not null check (unit_cost >= 0),
  -- Free-text label (g, ml, ชิ้น). Nothing converts between Units.
  unit text not null check (btrim(unit) <> ''),
  created_at timestamptz not null default now()
);

-- A name is unique per owner, ignoring case and surrounding spaces. NULLS NOT DISTINCT so
-- ownerless rows (all rows, until login) still clash with each other.
create unique index cost_item_owner_name_key
  on public.cost_item (owner, lower(btrim(name))) nulls not distinct;

-- No login yet (spec: no auth in v1). Only the server module reads this, with the secret key.
alter table public.cost_item enable row level security;
