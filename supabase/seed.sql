-- Development sample data. Applied only by `supabase db reset`, never by a migration.
--
-- A test Seller who owns all of it. Sign in at /login with:
--   email:    seller@gumrai.test
--   password: gumrai-test-1234
-- Creating the auth user fires create_seller (migration 20261010075658_seller_sign_in), which
-- makes the Seller's profile and three starting Cost Categories (วัตถุดิบ, บรรจุภัณฑ์, อื่น ๆ).
-- This file then adds sample Cost Items and one sample sheet that uses them.

-- The auth user, as Supabase Auth itself would store an email sign-up with no confirmation
-- step. The token columns must be '' rather than null, or Auth fails to read the row.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '5e11e400-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'seller@gumrai.test',
  extensions.crypt('gumrai-test-1234', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "ร้านทดสอบ"}',
  now(),
  now(),
  '', '', '', ''
);

-- Its email sign-in method.
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '5e11e400-0000-4000-8000-000000000001',
  '5e11e400-0000-4000-8000-000000000001',
  'email',
  '{"sub": "5e11e400-0000-4000-8000-000000000001", "email": "seller@gumrai.test", "email_verified": true}',
  now(),
  now(),
  now()
);

-- Sample Cost Items, across every starting Cost Category and ไม่มีหมวด.
insert into public.cost_item (owner, name, unit_cost, unit, cost_category_id)
select '5e11e400-0000-4000-8000-000000000001', v.name, v.unit_cost, v.unit, c.id
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
left join public.cost_category c
  on c.name = v.category and c.owner = '5e11e400-0000-4000-8000-000000000001';

-- One sample sheet sold through a delivery platform, so its GP is not zero.
insert into public.cost_sheet (owner, name, sale_unit, selling_price, gp_percent, vat_percent)
values (
  '5e11e400-0000-4000-8000-000000000001',
  'มัทฉะลาเต้เย็น (แอปส่งอาหาร)', 'แก้ว', 89, 30, 7
);

-- Its Linked Lines read from the Cost List above.
insert into public.cost_line (owner, sheet_id, position, quantity_used, cost_item_id)
select s.owner, s.id, v.position, v.quantity_used, i.id
from (values
  (0, 4, 'มัทฉะเกรดพิธีชง'),
  (1, 150, 'นมสดพาสเจอร์ไรส์'),
  (2, 15, 'ไซรัปน้ำตาลอ้อย'),
  (3, 1, 'แก้วพลาสติก 16 oz'),
  (4, 1, 'ฝาโดม'),
  (5, 1, 'หลอดกระดาษ')
) as v(position, quantity_used, item)
join public.cost_sheet s
  on s.name = 'มัทฉะลาเต้เย็น (แอปส่งอาหาร)'
  and s.owner = '5e11e400-0000-4000-8000-000000000001'
join public.cost_item i on i.name = v.item and i.owner = s.owner;

-- And its Manual Lines, typed on the sheet itself.
insert into public.cost_line
  (owner, sheet_id, position, quantity_used, name, unit_cost, unit, cost_category_id)
select s.owner, s.id, v.position, v.quantity_used, v.name, v.unit_cost, v.unit, c.id
from (values
  (6, 120, 'น้ำแข็ง', 0.01, 'g', 'วัตถุดิบ'),
  (7, 1, 'ถุงหิ้วแก้วเดี่ยว', 0.5, 'ใบ', null)
) as v(position, quantity_used, name, unit_cost, unit, category)
join public.cost_sheet s
  on s.name = 'มัทฉะลาเต้เย็น (แอปส่งอาหาร)'
  and s.owner = '5e11e400-0000-4000-8000-000000000001'
left join public.cost_category c on c.name = v.category and c.owner = s.owner;
