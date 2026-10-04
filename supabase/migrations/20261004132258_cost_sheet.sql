-- Cost Sheet (CONTEXT.md): a saved costing of one thing the seller sells.
create table public.cost_sheet (
  id uuid primary key default gen_random_uuid(),
  -- No login yet. Nullable so Discord login (Supabase Auth) can claim existing rows later.
  owner uuid references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  -- What one sale is called (แก้ว, กล่อง). Every per-sale figure is per one of these.
  sale_unit text not null default 'ชิ้น' check (btrim(sale_unit) <> ''),
  -- Baht per Sale Unit, exactly as typed: numeric with no scale, so it is never rounded.
  selling_price numeric not null default 0 check (selling_price >= 0),
  -- GP and the VAT on it, as typed percentages (33, 32.5).
  gp_percent numeric not null default 0 check (gp_percent >= 0),
  vat_percent numeric not null default 7 check (vat_percent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cost Line (CONTEXT.md): one cost on a Cost Sheet, a Unit Cost times the Quantity Used.
create table public.cost_line (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.cost_sheet (id) on delete cascade,
  -- Where the line sits on the sheet, from 0.
  position integer not null check (position >= 0),
  -- Units of this cost one Sale Unit uses.
  quantity_used numeric not null check (quantity_used >= 0),
  -- A Linked Line: takes its name, Unit Cost, Unit and Cost Category from this Cost Item.
  -- No cascade: deleting a Cost Item must first turn its lines into Manual Lines (ADR 0002).
  cost_item_id uuid references public.cost_item (id),
  -- A Manual Line: its own values, typed on the sheet.
  name text check (btrim(name) <> ''),
  unit_cost numeric check (unit_cost >= 0),
  unit text check (btrim(unit) <> ''),
  -- null is ไม่มีหมวด. Deleting a category leaves its lines uncategorised.
  cost_category_id uuid references public.cost_category (id) on delete set null,
  -- A line is exactly one of the two kinds.
  constraint cost_line_linked_or_manual check (
    (cost_item_id is not null
      and name is null and unit_cost is null and unit is null and cost_category_id is null)
    or (cost_item_id is null
      and name is not null and unit_cost is not null and unit is not null)
  ),
  unique (sheet_id, position)
);

create index cost_line_cost_item_id_idx on public.cost_line (cost_item_id);
create index cost_line_cost_category_id_idx on public.cost_line (cost_category_id);

-- No login yet (spec: no auth in v1). Only the server module reads these, with the secret key.
alter table public.cost_sheet enable row level security;
alter table public.cost_line enable row level security;

-- Saves a sheet as one unit: its own fields, and its lines replaced as a whole, in one
-- transaction. Numbers arrive as JSON strings so numeric keeps them exact.
--   p_sheet: { name, sale_unit, selling_price, gp_percent, vat_percent }
--   p_lines: [{ name, unit_cost, unit, quantity_used, cost_category_id }], in sheet order
-- Raises P0002 when the sheet does not exist.
create function public.save_cost_sheet(p_sheet_id uuid, p_sheet jsonb, p_lines jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.cost_sheet
  set name = p_sheet ->> 'name',
      sale_unit = p_sheet ->> 'sale_unit',
      selling_price = (p_sheet ->> 'selling_price')::numeric,
      gp_percent = (p_sheet ->> 'gp_percent')::numeric,
      vat_percent = (p_sheet ->> 'vat_percent')::numeric,
      updated_at = now()
  where id = p_sheet_id;
  if not found then
    raise exception 'cost sheet % not found', p_sheet_id using errcode = 'P0002';
  end if;

  delete from public.cost_line where sheet_id = p_sheet_id;

  insert into public.cost_line
    (sheet_id, position, quantity_used, name, unit_cost, unit, cost_category_id)
  select
    p_sheet_id,
    (line.ordinality - 1)::integer,
    (line.value ->> 'quantity_used')::numeric,
    line.value ->> 'name',
    (line.value ->> 'unit_cost')::numeric,
    line.value ->> 'unit',
    (line.value ->> 'cost_category_id')::uuid
  from jsonb_array_elements(p_lines) with ordinality as line(value, ordinality);
end;
$$;

revoke execute on function public.save_cost_sheet(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_cost_sheet(uuid, jsonb, jsonb) to service_role;
