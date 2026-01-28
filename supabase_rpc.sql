-- Secure RPC function to increment user credits
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres/admin),
-- bypassing the RLS and Triggers that might block the user.

create or replace function increment_credits(user_uuid uuid, amount float)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set credits_used = coalesce(credits_used, 0) + amount
  where id = user_uuid;
end;
$$;

-- Revoke execute from public to be safe, then grant to authenticated
revoke execute on function increment_credits(uuid, float) from public;
grant execute on function increment_credits(uuid, float) to authenticated;
grant execute on function increment_credits(uuid, float) to service_role;
