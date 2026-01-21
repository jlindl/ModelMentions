-- Create monitors table for Sentinel Mode
create table if not exists monitors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  query text not null,
  frequency text default 'daily', -- 'daily', 'weekly'
  alert_threshold int default 50, -- Notify if visibility < X%
  last_run timestamp with time zone,
  next_run timestamp with time zone default now(),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table monitors enable row level security;

create policy "Users can view their own monitors"
  on monitors for select
  using (auth.uid() = user_id);

create policy "Users can insert their own monitors"
  on monitors for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own monitors"
  on monitors for update
  using (auth.uid() = user_id);

create policy "Users can delete their own monitors"
  on monitors for delete
  using (auth.uid() = user_id);
