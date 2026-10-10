-- The scaffold's status table (issue 01) goes: the root page is now the landing page and
-- reads only whether a Seller is signed in. Dropping the table drops its anon read policy too.
drop policy "Anyone reads the app status" on public.app_status;
drop table public.app_status;
