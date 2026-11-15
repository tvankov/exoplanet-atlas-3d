-- Only for the test run (GitHub Actions, see .github/workflows/database-tests.yml): a plain PostgreSQL does not have what Supabase provides, so this
-- file makes the small part that schema.sql needs: the roles "anon" and "authenticated", the schema "auth" with a table of users, and auth.uid(),
-- which reads the user from a setting the way Supabase does it. Never run it on a Supabase project.

create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
