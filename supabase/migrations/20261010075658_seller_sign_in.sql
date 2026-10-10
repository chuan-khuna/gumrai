-- Sign-in (ticket 02): every row belongs to a Seller, and row-level security lets a Seller
-- read and change only their own. Pages and actions now run as the signed-in Seller
-- (the authenticated role), not with the secret key.

-- 1. Rows made before sign-in have no owner and no Seller to give them to, so they go.
--    Sheets first: their lines go with them, so no line still links to an ownerless item.
delete from public.cost_sheet where owner is null;
delete from public.cost_line
where cost_item_id in (select id from public.cost_item where owner is null);
delete from public.cost_item where owner is null;
delete from public.cost_category where owner is null;

-- 2. Owner is required, and defaults to the signed-in Seller, so the app never sends it.
alter table public.cost_category
  alter column owner set not null,
  alter column owner set default auth.uid();
alter table public.cost_item
  alter column owner set not null,
  alter column owner set default auth.uid();
alter table public.cost_sheet
  alter column owner set not null,
  alter column owner set default auth.uid();

-- (owner, id) is what the same-owner foreign keys below point at.
alter table public.cost_category add constraint cost_category_owner_id_key unique (owner, id);
alter table public.cost_item add constraint cost_item_owner_id_key unique (owner, id);
alter table public.cost_sheet add constraint cost_sheet_owner_id_key unique (owner, id);

-- 3. A Cost Item name is unique per owner, ignoring case and surrounding spaces. Owner can
--    no longer be null, so NULLS NOT DISTINCT has nothing left to do.
drop index public.cost_item_owner_name_key;
create unique index cost_item_owner_name_key
  on public.cost_item (owner, lower(btrim(name)));

-- 4. A reference never crosses Sellers. A foreign key is checked without row-level
--    security, so a plain one would let Seller B point at Seller A's Cost Category or Cost
--    Item by id. Each one now includes owner, so it can only match a row of the same owner.
--    The constraint names stay the same: src/server/ reads them from the error.
--    ON DELETE SET NULL (column) clears only the reference, never owner.
alter table public.cost_item
  drop constraint cost_item_cost_category_id_fkey,
  add constraint cost_item_cost_category_id_fkey
    foreign key (owner, cost_category_id) references public.cost_category (owner, id)
    on delete set null (cost_category_id);

-- A Cost Line has the owner of its sheet, so its own references can be checked the same way.
alter table public.cost_line add column owner uuid;
update public.cost_line l set owner = s.owner from public.cost_sheet s where s.id = l.sheet_id;
alter table public.cost_line
  alter column owner set not null,
  alter column owner set default auth.uid();

alter table public.cost_line
  drop constraint cost_line_sheet_id_fkey,
  drop constraint cost_line_cost_item_id_fkey,
  drop constraint cost_line_cost_category_id_fkey,
  add constraint cost_line_sheet_id_fkey
    foreign key (owner, sheet_id) references public.cost_sheet (owner, id)
    on delete cascade,
  -- Still no cascade: deleting a Cost Item first unlinks its lines (ADR 0002).
  add constraint cost_line_cost_item_id_fkey
    foreign key (owner, cost_item_id) references public.cost_item (owner, id),
  add constraint cost_line_cost_category_id_fkey
    foreign key (owner, cost_category_id) references public.cost_category (owner, id)
    on delete set null (cost_category_id);

-- 5. Row-level security: a Seller reads and changes only rows they own. RLS was already
--    enabled on every table, with no policies, so until now only the secret key could reach
--    them. (select auth.uid()) is evaluated once per statement, not once per row.
create policy "Sellers use only their own Cost Categories"
  on public.cost_category for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

create policy "Sellers use only their own Cost Items"
  on public.cost_item for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

create policy "Sellers use only their own Cost Sheets"
  on public.cost_sheet for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

create policy "Sellers use only their own Cost Lines"
  on public.cost_line for all to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

-- The scaffold's status row is public: the root page reads it before anyone signs in.
create policy "Anyone reads the app status"
  on public.app_status for select to anon, authenticated
  using (true);

-- 6. Seller profile: the Display Name. One row per auth user, made by the trigger below.
create table public.seller_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now()
);

alter table public.seller_profile enable row level security;

-- No insert or delete policy: the trigger makes the row and deleting the user removes it.
create policy "Sellers read their own profile"
  on public.seller_profile for select to authenticated
  using (id = (select auth.uid()));

create policy "Sellers change their own profile"
  on public.seller_profile for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- A new Seller: their profile and their three starting Cost Categories, made in the same
-- transaction as the auth user, so a Seller never exists without them. The Display Name is
-- what they typed when signing up (display_name), else the provider's name, else the part
-- of the email before @.
-- security definer: it runs as the auth server's insert, which has no Seller session.
create function public.create_seller()
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

create trigger create_seller_on_signup
  after insert on auth.users
  for each row execute function public.create_seller();

-- Deleting a Seller (an auth user) deletes everything they own through the owner foreign
-- keys. Postgres runs those cascades one table at a time, and if it reached cost_item while
-- a line still linked to it, cost_line_cost_item_id_fkey would refuse. So the Seller's sheets,
-- and with them every line, go first.
create function public.delete_seller_sheets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.cost_sheet where owner = old.id;
  return old;
end;
$$;

revoke execute on function public.delete_seller_sheets() from public, anon, authenticated;

create trigger delete_seller_sheets_on_user_delete
  before delete on auth.users
  for each row execute function public.delete_seller_sheets();

-- 7. The multi-statement functions run as the caller (security invoker, the default), so
--    row-level security applies inside them: a Seller's call sees only their own rows, and
--    another Seller's sheet or item is "not found". They now write each line's owner.

-- Same contract as before (see 20261004132801_linked_lines.sql). A Linked Line to another
-- Seller's Cost Item fails cost_line_cost_item_id_fkey, as a missing item does.
create or replace function public.save_cost_sheet(p_sheet_id uuid, p_sheet jsonb, p_lines jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  sheet_owner uuid;
begin
  update public.cost_sheet
  set name = p_sheet ->> 'name',
      sale_unit = p_sheet ->> 'sale_unit',
      selling_price = (p_sheet ->> 'selling_price')::numeric,
      gp_percent = (p_sheet ->> 'gp_percent')::numeric,
      vat_percent = (p_sheet ->> 'vat_percent')::numeric,
      updated_at = now()
  where id = p_sheet_id
  returning owner into sheet_owner;
  if not found then
    raise exception 'cost sheet % not found', p_sheet_id using errcode = 'P0002';
  end if;

  delete from public.cost_line where sheet_id = p_sheet_id;

  insert into public.cost_line
    (owner, sheet_id, position, quantity_used, cost_item_id, name, unit_cost, unit,
     cost_category_id)
  select
    sheet_owner,
    p_sheet_id,
    (line.ordinality - 1)::integer,
    (line.value ->> 'quantity_used')::numeric,
    (line.value ->> 'cost_item_id')::uuid,
    line.value ->> 'name',
    (line.value ->> 'unit_cost')::numeric,
    line.value ->> 'unit',
    (line.value ->> 'cost_category_id')::uuid
  from jsonb_array_elements(p_lines) with ordinality as line(value, ordinality);
end;
$$;

-- Same contract as before (see 20261004134424_duplicate_cost_sheet.sql).
create or replace function public.duplicate_cost_sheet(p_sheet_id uuid, p_name text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.cost_sheet (owner, name, sale_unit, selling_price, gp_percent, vat_percent)
  select owner, p_name, sale_unit, selling_price, gp_percent, vat_percent
  from public.cost_sheet
  where id = p_sheet_id
  returning id into new_id;
  if new_id is null then
    raise exception 'cost sheet % not found', p_sheet_id using errcode = 'P0002';
  end if;

  insert into public.cost_line
    (owner, sheet_id, position, quantity_used, cost_item_id, name, unit_cost, unit,
     cost_category_id)
  select owner, new_id, position, quantity_used, cost_item_id, name, unit_cost, unit,
         cost_category_id
  from public.cost_line
  where sheet_id = p_sheet_id;

  return new_id;
end;
$$;

-- delete_cost_item is unchanged: it already writes nothing but the item's own lines, and
-- row-level security keeps another Seller's item out of its reach.

-- Signed-in Sellers call the functions now. anon still cannot.
grant execute on function public.save_cost_sheet(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.duplicate_cost_sheet(uuid, text) to authenticated;
grant execute on function public.delete_cost_item(uuid) to authenticated;
