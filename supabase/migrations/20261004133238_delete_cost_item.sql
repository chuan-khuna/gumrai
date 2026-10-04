-- Deleting a Cost Item unlinks its lines (ADR 0002): every Linked Line to it becomes a Manual
-- Line holding the item's last name, Unit Cost, Unit and Cost Category, so no sheet's figures
-- move, and then the item goes. One function, so one transaction: if anything fails, the item
-- and its lines are both left as they were. Deleting an item that does not exist does nothing.
create function public.delete_cost_item(p_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  item public.cost_item;
begin
  -- Lock the item so no sheet can link a new line to it until it is gone.
  select * into item from public.cost_item where id = p_id for update;
  if not found then
    return;
  end if;

  update public.cost_line
  set cost_item_id = null,
      name = item.name,
      unit_cost = item.unit_cost,
      unit = item.unit,
      cost_category_id = item.cost_category_id
  where cost_item_id = p_id;

  delete from public.cost_item where id = p_id;
end;
$$;

revoke execute on function public.delete_cost_item(uuid) from public, anon, authenticated;
grant execute on function public.delete_cost_item(uuid) to service_role;
