-- Add Stripe Price ID to plans
alter table plans 
add column if not exists stripe_price_id text;

-- Add Stripe Customer fields to profiles
alter table profiles 
add column if not exists stripe_customer_id text,
add column if not exists subscription_status text default 'inactive',
add column if not exists stripe_subscription_id text,
add column if not exists current_period_end timestamp with time zone;

-- Optional: Create index on stripe_customer_id for webhook lookups
create index if not exists idx_profiles_stripe_customer_id on profiles(stripe_customer_id);
