-- Linked Lines (ADR 0002): save_cost_sheet now writes a line's Cost Item reference as well,
-- so a sheet can hold Linked Lines beside its Manual Lines. Same signature as before.
--   p_sheet: { name, sale_unit, selling_price, gp_percent, vat_percent }
--   p_lines: in sheet order, each either
--     a Linked Line { cost_item_id, quantity_used }, or
--     a Manual Line { name, unit_cost, unit, quantity_used, cost_category_id }.
--   A key a line leaves out is stored as null; cost_line_linked_or_manual rejects a mix.
-- Raises P0002 when the sheet does not exist, and 23503 when a Cost Item or Cost Category
-- does not.
create or replace function public.save_cost_sheet(p_sheet_id uuid, p_sheet jsonb, p_lines jsonb)
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
    (sheet_id, position, quantity_used, cost_item_id, name, unit_cost, unit, cost_category_id)
  select
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
