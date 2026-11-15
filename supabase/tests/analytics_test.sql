-- Runs the queries of supabase/analytics.sql on a few sample accounts, so that they are known to work. Run after schema.sql, from the root of the
-- repository (the path of \\i is relative to it): psql -v ON_ERROR_STOP=1 -f supabase/tests/analytics_test.sql

truncate auth.users cascade;
insert into auth.users (id, created_at, email_confirmed_at, last_sign_in_at) values
  ('00000000-0000-0000-0000-0000000000c1', now() - interval '3 days', now() - interval '3 days', now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000c2', now() - interval '40 days', null, now() - interval '40 days');
insert into public.explorer_state (user_id, state) values
  ('00000000-0000-0000-0000-0000000000c1',
   '{"xp": 160, "badges": [{"id": "first-look", "t": 1}], "favourites": [{"name": "Proxima Cen b", "t": 1}], "total": {"missions": 4}}'),
  ('00000000-0000-0000-0000-0000000000c2', '{"xp": 20, "badges": [], "favourites": [], "total": {}}');

\i supabase/analytics.sql

do $$
declare level_of_c1 int;
begin
  select floor((1 + sqrt(1 + 4 * (state ->> 'xp')::numeric / 25)) / 2)::int into level_of_c1
  from public.explorer_state where user_id = '00000000-0000-0000-0000-0000000000c1';
  if level_of_c1 <> 3 then raise exception 'FAIL: 160 XP should be level 3, got %', level_of_c1; end if;
end $$;
select 'analytics queries ran' as result;
