create or replace function public.is_current_user_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

create or replace function public.is_current_user_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1
    from public.super_admins sa
    where sa.profile_id = auth.uid()
      and sa.is_active = true
  );
end;
$$;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.is_current_user_super_admin() to authenticated;

-- =========================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Runs as security definer so it bypasses RLS
-- (needed when email confirmation is enabled and no session exists yet)
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    student_id,
    department,
    year,
    mobile_no,
    user_type,
    role
  ) values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'year',
    new.raw_user_meta_data->>'mobile_no',
    coalesce(new.raw_user_meta_data->>'user_type', 'student'),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();