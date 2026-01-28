-- Add requests_per_hour column to plans
alter table plans 
add column if not exists requests_per_hour int default 10;

-- Update existing plans with sensible defaults
update plans set requests_per_hour = 5 where id = 'free';
update plans set requests_per_hour = 20 where id = 'pro';
update plans set requests_per_hour = 50 where id = 'premium';
update plans set requests_per_hour = 100 where id = 'ultra';
