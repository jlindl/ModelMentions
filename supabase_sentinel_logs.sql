-- Create monitor_logs table
create table if not exists monitor_logs (
  id uuid default gen_random_uuid() primary key,
  monitor_id uuid references monitors(id) on delete cascade not null,
  status text not null, -- 'success', 'warning', 'fail'
  visibility_score int default 0,
  message text,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table monitor_logs enable row level security;

create policy "Users can view logs for their monitors"
  on monitor_logs for select
  using (
    exists (
      select 1 from monitors
      where monitors.id = monitor_logs.monitor_id
      and monitors.user_id = auth.uid()
    )
  );
