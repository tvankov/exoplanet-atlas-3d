-- Tests of the access rules (row level security) and of the account deletion. Run after 00_mock_supabase.sql and schema.sql with
-- psql -v ON_ERROR_STOP=1: the first failed check stops the run with an error message. "As user a" means the role "authenticated" with the
-- user a as the signed in person, the same as a request of the browser with a login.

\set a '00000000-0000-0000-0000-00000000000a'
\set b '00000000-0000-0000-0000-00000000000b'

insert into auth.users (id) values (:'a'), (:'b');

-- ---------------------------------------------------------------- user a creates a profile and a state
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'a', true);
insert into public.profiles (id, username) values (:'a', 'alice_1');
insert into public.explorer_state (user_id, state) values (:'a', '{"xp": 10}');
commit;

-- ---------------------------------------------------------------- user b sees nothing of a, and cannot write as a
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'b', true);

do $$
declare n int;
begin
  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'FAIL: b sees % profile(s) of others', n; end if;
  select count(*) into n from public.explorer_state;
  if n <> 0 then raise exception 'FAIL: b sees % state(s) of others', n; end if;
end $$;

-- b changes the state of a: no row is touched (the row is invisible to b)
do $$
declare n int;
begin
  update public.explorer_state set state = '{"xp": 999999}' where user_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: b changed the state of a'; end if;
  update public.profiles set username = 'hacked' where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: b changed the profile of a'; end if;
end $$;

-- b creates a row in the name of a: refused by the rule (42501)
do $$
declare refused boolean := false;
begin
  begin
    insert into public.profiles (id, username) values ('00000000-0000-0000-0000-00000000000a', 'mallory');
  exception when sqlstate '42501' then refused := true;
  end;
  if not refused then raise exception 'FAIL: b created a profile in the name of a'; end if;
  refused := false;
  begin
    insert into public.explorer_state (user_id, state) values ('00000000-0000-0000-0000-00000000000a', '{}');
  exception when sqlstate '42501' then refused := true;
  end;
  if not refused then raise exception 'FAIL: b created a state in the name of a'; end if;
end $$;

-- b may not delete rows directly (no delete right), and may not take the user name of a (unique)
do $$
declare refused boolean := false;
begin
  begin
    delete from public.explorer_state;
  exception when sqlstate '42501' then refused := true;
  end;
  if not refused then raise exception 'FAIL: delete on the state table was allowed'; end if;
  refused := false;
  begin
    insert into public.profiles (id, username) values ('00000000-0000-0000-0000-00000000000b', 'alice_1');
  exception when sqlstate '23505' then refused := true;
  end;
  if not refused then raise exception 'FAIL: a user name was given twice'; end if;
end $$;
rollback;

-- ---------------------------------------------------------------- a visitor may ask whether a user name is free (and nothing more)
begin;
set local role anon;
do $$
begin
  if public.username_available('alice_1') then raise exception 'FAIL: a taken name was reported free'; end if;
  if public.username_available('ALICE_1') then raise exception 'FAIL: a taken name was reported free in another case'; end if;
  if not public.username_available('somebody_else') then raise exception 'FAIL: a free name was reported taken'; end if;
end $$;
rollback;

-- ---------------------------------------------------------------- the checks of the data
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'b', true);
do $$
declare refused boolean := false;
begin
  begin
    insert into public.profiles (id, username) values ('00000000-0000-0000-0000-00000000000b', 'a b');
  exception when sqlstate '23514' then refused := true;
  end;
  if not refused then raise exception 'FAIL: a user name with a space was accepted'; end if;
  refused := false;
  begin
    insert into public.explorer_state (user_id, state) values ('00000000-0000-0000-0000-00000000000b', to_jsonb(repeat('x', 300000)));
  exception when sqlstate '23514' then refused := true;
  end;
  if not refused then raise exception 'FAIL: a state that is not an object, and far too big, was accepted'; end if;
end $$;
rollback;

-- ---------------------------------------------------------------- a visitor without a login can do nothing
begin;
set local role anon;
do $$
declare refused boolean := false;
begin
  begin
    perform count(*) from public.profiles;
  exception when sqlstate '42501' then refused := true;
  end;
  if not refused then raise exception 'FAIL: a visitor without a login could read the profiles'; end if;
  refused := false;
  begin
    perform public.delete_my_account();
  exception when sqlstate '42501' then refused := true;
  end;
  if not refused then raise exception 'FAIL: a visitor without a login could call delete_my_account'; end if;
end $$;
rollback;

-- ---------------------------------------------------------------- user a updates the own state
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'a', true);
update public.explorer_state set state = '{"xp": 20}' where user_id = :'a';
do $$
declare xp int;
begin
  select (state ->> 'xp')::int into xp from public.explorer_state;
  if xp <> 20 then raise exception 'FAIL: a could not change the own state'; end if;
end $$;
commit;

-- ---------------------------------------------------------------- deleting the account takes the profile and the state with it, and only those of a
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'a', true);
select public.delete_my_account();
commit;

do $$
declare n int;
begin
  select count(*) into n from auth.users where id = '00000000-0000-0000-0000-00000000000a';
  if n <> 0 then raise exception 'FAIL: the account of a is still there'; end if;
  select count(*) into n from public.profiles;
  if n <> 0 then raise exception 'FAIL: the profile of a is still there'; end if;
  select count(*) into n from public.explorer_state;
  if n <> 0 then raise exception 'FAIL: the state of a is still there'; end if;
  select count(*) into n from auth.users where id = '00000000-0000-0000-0000-00000000000b';
  if n <> 1 then raise exception 'FAIL: the account of b was deleted too'; end if;
end $$;

select 'all checks passed' as result;
