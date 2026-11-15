-- Space Explorer: accounts and the explorer's state. Plain PostgreSQL, written for Supabase (it provides the schema "auth", the function
-- auth.uid() and the roles "anon" and "authenticated"). Run it once in the SQL editor of the project; the file can be run again (it is
-- written so that nothing is lost). There are no secrets in it.
--
-- What is stored, and nothing else:
--   profiles        the user name that a person chose (the e-mail and the password are kept by Supabase Auth, not here)
--   explorer_state  the explorer's log of that person as one JSON document: favourites, history, mission progress, XP, badges
--
-- The XP rules run in the browser, so the server cannot check them. That is why the state is one document that only its owner can read and
-- write: whoever changes their own numbers changes nothing for anybody else. This is fine as long as there is no public ranking (phase 5 of
-- the plan would need a different design, with the points counted on the server).

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.explorer_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 200000), -- 200 KB is far more than a log needs
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists explorer_state_touch on public.explorer_state;
create trigger explorer_state_touch before update on public.explorer_state
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- row level security: everybody sees and changes only their own rows
alter table public.profiles enable row level security;
alter table public.explorer_state enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles: create own" on public.profiles;
create policy "profiles: create own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles: change own" on public.profiles;
create policy "profiles: change own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "state: read own" on public.explorer_state;
create policy "state: read own" on public.explorer_state for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "state: create own" on public.explorer_state;
create policy "state: create own" on public.explorer_state for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "state: change own" on public.explorer_state;
create policy "state: change own" on public.explorer_state for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- rights: the project does not expose new tables by itself, so they are given here
revoke all on public.profiles, public.explorer_state from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.explorer_state to authenticated;
-- no delete on the tables: an account is deleted as a whole, see below (the rows go with it)

-- ---------------------------------------------------------------- deleting the own account
-- A browser cannot delete a row of auth.users. This function deletes the account of the person who calls it, and nobody else's; profile and
-- state go with it (on delete cascade).
create or replace function public.delete_my_account() returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
