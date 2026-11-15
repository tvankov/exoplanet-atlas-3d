-- Numbers about the accounts, for the owner of the project: paste a query into the SQL editor of the Supabase dashboard and run it. The editor
-- works with the rights of the owner, so it sees all rows; the page itself (a visitor, or a signed-in person) can never run these queries or see
-- other accounts (see schema.sql). The queries count, they do not look at single people. Tested in GitHub Actions on sample data
-- (supabase/tests/analytics_test.sql), so that they run.

-- Registrations per day
select created_at::date as day, count(*) as registered
from auth.users
group by 1
order by 1 desc;

-- Accounts, confirmed ones (the address was confirmed by the link in the mail), and the share
select count(*) as accounts,
       count(*) filter (where email_confirmed_at is not null) as confirmed,
       round(100.0 * count(*) filter (where email_confirmed_at is not null) / nullif(count(*), 0), 1) as confirmed_percent
from auth.users;

-- Accounts that signed in during the last 7 days, and the last 30 days
select count(*) filter (where last_sign_in_at > now() - interval '7 days') as active_7_days,
       count(*) filter (where last_sign_in_at > now() - interval '30 days') as active_30_days
from auth.users;

-- Levels of the accounts (the level follows from the XP: level n starts at 25 n (n - 1) XP, see explorer.js)
select floor((1 + sqrt(1 + 4 * (state ->> 'xp')::numeric / 25)) / 2)::int as level, count(*) as accounts
from public.explorer_state
group by 1
order by 1;

-- XP: average and median
select round(avg((state ->> 'xp')::numeric), 1) as average_xp,
       percentile_cont(0.5) within group (order by (state ->> 'xp')::numeric) as median_xp
from public.explorer_state;

-- How often each badge was earned
select b ->> 'id' as badge, count(*) as accounts
from public.explorer_state, jsonb_array_elements(state -> 'badges') as b
group by 1
order by 2 desc;

-- The planets that were saved as favourites most often
select f ->> 'name' as planet, count(*) as accounts
from public.explorer_state, jsonb_array_elements(state -> 'favourites') as f
group by 1
order by 2 desc, 1
limit 10;

-- Missions finished per account (average)
select round(avg(coalesce((state -> 'total' ->> 'missions')::int, 0)), 1) as average_missions_finished
from public.explorer_state;
