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