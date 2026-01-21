-- 1. Add usage tracking columns
alter table profiles 
add column if not exists reports_usage int default 0,
add column if not exists audits_usage int default 0,
add column if not exists usage_reset_date timestamp with time zone default (now() + interval '30 days');

-- 2. Create RPC function to atomically check and reset usage
create or replace function check_and_reset_usage(user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  profile_record record;
  new_reset_date timestamp with time zone;
begin
  -- Lock the row for update to prevent race conditions
  select * into profile_record
  from profiles
  where id = user_id
  for update;

  -- If no profile found, return error
  if not found then
    return json_build_object('error', 'Profile not found');
  end if;

  -- Check if reset is needed
  if profile_record.usage_reset_date < now() then
    new_reset_date := now() + interval '30 days';
    
    update profiles
    set 
      reports_usage = 0,
      audits_usage = 0,
      credits_used = 0, -- Reset credits too
      usage_reset_date = new_reset_date
    where id = user_id;
    
    return json_build_object('reset', true, 'new_date', new_reset_date);
  else
    return json_build_object('reset', false, 'next_reset', profile_record.usage_reset_date);
  end if;
end;
$$;
