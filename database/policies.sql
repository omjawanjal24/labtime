-- =========================
-- PROFILES RLS
-- =========================
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and role = 'user');

drop policy if exists "Users can update own profile (no role change)" on public.profiles;
create policy "Users can update own profile (no role change)"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles for update
to authenticated
using (public.is_current_user_super_admin())
with check (public.is_current_user_super_admin());

-- block deletes
drop policy if exists "No profile deletes" on public.profiles;
create policy "No profile deletes"
on public.profiles for delete
to authenticated
using (false);

grant select, insert, update on public.profiles to authenticated;

-- =========================
-- EQUIPMENT RLS
-- =========================
alter table public.equipment enable row level security;

create policy "Authenticated can view equipment"
on public.equipment for select
to authenticated
using (true);

create policy "Admins manage equipment"
on public.equipment for all
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin())
with check (public.is_current_user_admin() or public.is_current_user_super_admin());

grant select on public.equipment to authenticated;

-- =========================
-- SLOTS RLS
-- =========================
alter table public.slots enable row level security;

create policy "Authenticated can view slots"
on public.slots for select
to authenticated
using (true);

create policy "Admins manage slots"
on public.slots for all
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin())
with check (public.is_current_user_admin() or public.is_current_user_super_admin());

grant select on public.slots to authenticated;

-- =========================
-- BOOKINGS RLS (same flow as Courtside)
-- =========================
alter table public.bookings enable row level security;

create policy "Authenticated can view all bookings"
on public.bookings for select
to authenticated
using (true);

create policy "Users can create own bookings"
on public.bookings for insert
to authenticated
with check (user_id = auth.uid());

create policy "Admins can update any booking"
on public.bookings for update
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin())
with check (public.is_current_user_admin() or public.is_current_user_super_admin());

create policy "Users can delete own booking"
on public.bookings for delete
to authenticated
using (user_id = auth.uid());

create policy "Admins can delete any booking"
on public.bookings for delete
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin());

grant select, insert, update, delete on public.bookings to authenticated;


-- =========================
-- NOTIFICATIONS RLS
-- =========================
alter table public.notifications enable row level security;

create policy "Authenticated can view active notifications"
on public.notifications for select
to authenticated
using (is_active = true);

create policy "Admins can view all notifications"
on public.notifications for select
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin());

create policy "Admins can insert notifications"
on public.notifications for insert
to authenticated
with check (public.is_current_user_admin() or public.is_current_user_super_admin());

create policy "Admins can update notifications"
on public.notifications for update
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin())
with check (public.is_current_user_admin() or public.is_current_user_super_admin());

create policy "Admins can delete notifications"
on public.notifications for delete
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin());

grant select, insert, update, delete on public.notifications to authenticated;

-- =========================
-- FEEDBACK RLS
-- =========================
alter table public.user_feedback enable row level security;

create policy "Users can submit feedback"
on public.user_feedback for insert
to authenticated
with check (true);

create policy "Admins view feedback"
on public.user_feedback for select
to authenticated
using (public.is_current_user_admin() or public.is_current_user_super_admin());

grant insert on public.user_feedback to authenticated;