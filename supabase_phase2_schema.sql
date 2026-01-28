-- Create plans table
create table if not exists plans (
    id text primary key, -- 'free', 'pro', 'premium', 'ultra'
    name text not null,
    monthly_credit_limit_usd float not null,
    features text[],
    created_at timestamp with time zone default now()
);

-- Enable RLS
alter table plans enable row level security;
create policy "Anyone can read plans" on plans for select using (true);
-- Only admins can modify (no policy for update/insert means default deny for authenticated)

-- Seed Data
insert into plans (id, name, monthly_credit_limit_usd, features) values
('free', 'Free Tier', 0.25, array['basic_scan']),
('pro', 'Pro Tier', 5.00, array['basic_scan', 'history']),
('premium', 'Premium Tier', 15.00, array['basic_scan', 'competitor_analysis', 'history']),
('ultra', 'Ultra Tier', 50.00, array['basic_scan', 'competitor_analysis', 'deep_insight', 'history'])
on conflict (id) do update 
set monthly_credit_limit_usd = excluded.monthly_credit_limit_usd;

-- Note: available_models table is assumed to already exist with cost columns.
