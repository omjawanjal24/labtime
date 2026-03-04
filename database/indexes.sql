create index if not exists bookings_by_date on public.bookings (booking_date);
create index if not exists bookings_by_equipment_slot on public.bookings (equipment_id, slot_id, booking_date);
create index if not exists slots_by_equipment on public.slots (equipment_id);