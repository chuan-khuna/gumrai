-- Tracer-bullet table for the project scaffold (issue 01): one row the home page reads
-- to prove Next.js → server module → Supabase is wired end to end.
-- Not part of the domain. Drop it once a real page reads real data.
create table public.app_status (
  id smallint primary key default 1 check (id = 1),
  message text not null
);

insert into public.app_status (message) values ('เชื่อมต่อฐานข้อมูลแล้ว');

-- No login yet (spec: no auth in v1). Only the server module reads this, with the secret key.
alter table public.app_status enable row level security;
