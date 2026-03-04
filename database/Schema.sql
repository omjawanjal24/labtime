-- Enable extension used for uuid generation
create extension if not exists "pgcrypto";

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid not null,
  first_name text null,
  last_name text null,
  student_id text null,
  email text null,
  department text null,
  role text not null default 'user',
  user_type text not null default 'student', -- student | staff | researcher
  created_at timestamptz not null default timezone('utc'::text, now()),
  avatar_url text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);

-- =========================
-- ADMINS (optional but useful)
-- =========================
create table if not exists public.super_admins (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  is_active boolean not null default true,
  permissions jsonb null default '{"all": true}'::jsonb,
  constraint super_admins_pkey primary key (id),
  constraint super_admins_profile_id_fkey foreign key (profile_id) references public.profiles (id) on delete cascade
);

-- =========================
-- EQUIPMENT
-- =========================
create table if not exists public.equipment (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text null,
  location text null,
  image_url text null,
  capacity integer not null default 1, -- how many parallel bookings per slot (like seats)
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint equipment_pkey primary key (id)
);

-- =========================
-- SLOTS
-- =========================
create table if not exists public.slots (
  id uuid not null default gen_random_uuid(),
  equipment_id uuid not null,
  start_time time not null,
  end_time time not null,
  allowed_user_type text not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint slots_pkey primary key (id),
  constraint slots_equipment_id_fkey foreign key (equipment_id) references public.equipment (id) on delete cascade
);

-- =========================
-- BOOKINGS (active)
-- =========================
create table if not exists public.bookings (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  equipment_id uuid not null,
  slot_id uuid not null,
  booking_date date not null,
  status text not null default 'booked', -- booked | checked-in | checked-out | cancelled
  unit_number integer null, -- 1..capacity (like seat number)
  created_at timestamptz not null default timezone('utc'::text, now()),
  checked_in_at timestamptz null,
  checked_out_at timestamptz null,
  constraint bookings_pkey primary key (id),
  constraint bookings_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint bookings_equipment_id_fkey foreign key (equipment_id) references public.equipment (id) on delete cascade,
  constraint bookings_slot_id_fkey foreign key (slot_id) references public.slots (id) on delete cascade,
  constraint unique_unit_booking unique (equipment_id, slot_id, booking_date, unit_number)
);

-- =========================
-- NOTIFICATIONS
-- =========================
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'general', -- general | maintenance | urgent
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid null,
  constraint notifications_pkey primary key (id),
  constraint notifications_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null
);

-- =========================
-- USER FEEDBACK
-- =========================
create table if not exists public.user_feedback (
  id uuid not null default gen_random_uuid(),
  note text not null,
  created_at timestamptz not null default now(),
  email text null,
  profile_id uuid null,
  user_name text null,
  user_student_id text null,
  constraint user_feedback_pkey primary key (id),
  constraint user_feedback_profile_id_fkey foreign key (profile_id) references public.profiles (id)
);