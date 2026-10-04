-- Development sample data. Applied only by `supabase db reset`, never by a migration.
-- The three starting Cost Categories (วัตถุดิบ, บรรจุภัณฑ์, อื่น ๆ) come from a migration;
-- this file only adds sample Cost Items and one sample sheet that uses them.

-- Sample Cost Items, across every starting Cost Category and ไม่มีหมวด.
insert into public.cost_item (name, unit_cost, unit, cost_category_id)
select v.name, v.unit_cost, v.unit, c.id
from (values
  ('มัทฉะเกรดพิธีชง', 4.5, 'g', 'วัตถุดิบ'),
  ('นมสดพาสเจอร์ไรส์', 0.075, 'ml', 'วัตถุดิบ'),
  ('ไซรัปน้ำตาลอ้อย', 0.12, 'ml', 'วัตถุดิบ'),
  ('แก้วพลาสติก 16 oz', 2.8, 'ชิ้น', 'บรรจุภัณฑ์'),
  ('ฝาโดม', 1.2, 'ชิ้น', 'บรรจุภัณฑ์'),
  ('หลอดกระดาษ', 0.9, 'ชิ้น', 'บรรจุภัณฑ์'),
  ('ทิชชู่', 0.25, 'แผ่น', 'อื่น ๆ'),
  ('สติกเกอร์โลโก้', 0.6, 'ดวง', null)
) as v(name, unit_cost, unit, category)
left join public.cost_category c on c.name = v.category and c.owner is null;

-- One sample sheet sold through a delivery platform, so its GP is not zero.
insert into public.cost_sheet (name, sale_unit, selling_price, gp_percent, vat_percent)
values ('มัทฉะลาเต้เย็น (แอปส่งอาหาร)', 'แก้ว', 89, 30, 7);

-- Its Linked Lines read from the Cost List above.
insert into public.cost_line (sheet_id, position, quantity_used, cost_item_id)
select s.id, v.position, v.quantity_used, i.id
from (values
  (0, 4, 'มัทฉะเกรดพิธีชง'),
  (1, 150, 'นมสดพาสเจอร์ไรส์'),
  (2, 15, 'ไซรัปน้ำตาลอ้อย'),
  (3, 1, 'แก้วพลาสติก 16 oz'),
  (4, 1, 'ฝาโดม'),
  (5, 1, 'หลอดกระดาษ')
) as v(position, quantity_used, item)
join public.cost_item i on i.name = v.item and i.owner is null
cross join public.cost_sheet s
where s.name = 'มัทฉะลาเต้เย็น (แอปส่งอาหาร)';

-- And its Manual Lines, typed on the sheet itself.
insert into public.cost_line
  (sheet_id, position, quantity_used, name, unit_cost, unit, cost_category_id)
select s.id, v.position, v.quantity_used, v.name, v.unit_cost, v.unit, c.id
from (values
  (6, 120, 'น้ำแข็ง', 0.01, 'g', 'วัตถุดิบ'),
  (7, 1, 'ถุงหิ้วแก้วเดี่ยว', 0.5, 'ใบ', null)
) as v(position, quantity_used, name, unit_cost, unit, category)
left join public.cost_category c on c.name = v.category and c.owner is null
cross join public.cost_sheet s
where s.name = 'มัทฉะลาเต้เย็น (แอปส่งอาหาร)';
