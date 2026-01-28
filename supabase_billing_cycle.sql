-- Add billing_cycle_start to profiles
alter table profiles 
add column if not exists billing_cycle_start timestamp with time zone default now();

-- Ensure all existing profiles have a start date
update profiles 
set billing_cycle_start = created_at 
where billing_cycle_start is null;
