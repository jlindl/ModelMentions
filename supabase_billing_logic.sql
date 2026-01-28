-- Update the security trigger function to allow updates from RPC (postgres role)
create or replace function public.protect_sensitive_profile_columns()
returns trigger as $$
begin
  -- Allow updates if running as service_role or postgres (RPC with SECURITY DEFINER)
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;

  -- Check if sensitive columns are being modified by normal users
  if new.plan is distinct from old.plan then
    raise exception 'You are not allowed to update the plan directly.';
  end if;
  
  if new.credits_used is distinct from old.credits_used then
    raise exception 'You are not allowed to update credits_used directly.';
  end if;

  return new;
end;
$$ language plpgsql;
