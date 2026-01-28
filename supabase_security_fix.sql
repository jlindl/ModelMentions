-- Revoke the overly permissive UPDATE policy
drop policy if exists "Users can update own profile." on profiles;

-- Create a stricter UPDATE policy
create policy "Users can update own profile details."
  on profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );
  
-- NOTE: Supabase RLS is row-based, not column-based natively in the policy syntax for specific columns easily without triggers or complex checks.
-- However, we can use a BEFORE UPDATE trigger to prevent changes to 'plan' and 'credits_used' if we want to be very strict,
-- or just trust that the policy allows update but we rely on the API to not expose those fields?
-- NO, for security, we must ensure they CANNOT update 'plan'.
-- The 'using' clause selects the rows. The 'with check' clause validates the *new* row state.

-- A better way for column-level security in Postgres RLS is to rely on the fact that if you don't grant permission they can't do it, but here we are in the 'authenticated' role context.
-- We will use a Trigger to protect sensitive columns.

create or replace function public.protect_sensitive_profile_columns()
returns trigger as $$
begin
  -- Check if sensitive columns are being modified
  if new.plan is distinct from old.plan then
    raise exception 'You are not allowed to update the plan directly.';
  end if;
  
  if new.credits_used is distinct from old.credits_used then
    raise exception 'You are not allowed to update credits_used directly.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists protect_profile_changes on profiles;

create trigger protect_profile_changes
  before update on profiles
  for each row
  execute procedure public.protect_sensitive_profile_columns();

-- Lock down available_models
-- Users should never be able to INSERT, UPDATE, or DELETE available_models.
-- Only select is allowed (which we already have: "Anyone can read active models").

drop policy if exists "Authenticated users can sync models" on available_models;
drop policy if exists "Authenticated users can update models" on available_models;

-- If admins need to update, they should use the Service Role key or a specific admin function.
-- For now, we remove all write access for the 'authenticated' role.
