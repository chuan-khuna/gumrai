-- Duplicating a Cost Sheet (to compare selling channels): a new, independent sheet with the
-- original's own fields and a copy of every line, in one transaction. Linked Lines stay linked
-- to the same Cost Items (ADR 0002); Manual Lines are copied with their values.
-- p_name is the copy's name, chosen by the caller. Returns the new sheet's id.
-- Raises P0002 when the sheet does not exist.
create function public.duplicate_cost_sheet(p_sheet_id uuid, p_name text)
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
    (sheet_id, position, quantity_used, cost_item_id, name, unit_cost, unit, cost_category_id)
  select new_id, position, quantity_used, cost_item_id, name, unit_cost, unit, cost_category_id
  from public.cost_line
  where sheet_id = p_sheet_id;

  return new_id;
end;
$$;

revoke execute on function public.duplicate_cost_sheet(uuid, text) from public, anon, authenticated;
grant execute on function public.duplicate_cost_sheet(uuid, text) to service_role;
