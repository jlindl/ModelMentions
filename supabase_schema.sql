-- Create a table for public profiles using Supabase Auth
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  company_name text,
  industry text,
  website_url text,
  keywords text[],
  competitors text[],
  onboarding_completed boolean default false,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Auto-create profile on signup (Trigger)
-- This assumes you want to automatically create a profile entry when a new user signs up via Supabase Auth.
-- You can run this in the SQL Editor in Supabase Dashboard.

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Testing Engine Tables

create table test_runs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    status text check (status in ('running', 'completed', 'failed')),
    created_at timestamp with time zone default now()
);

alter table test_runs enable row level security;
create policy "Users can view own test runs" on test_runs for select using (auth.uid() = user_id);
create policy "Users can insert own test runs" on test_runs for insert with check (auth.uid() = user_id);
create policy "Users can update own test runs" on test_runs for update using (auth.uid() = user_id);

create table test_results (
    id uuid default gen_random_uuid() primary key,
    run_id uuid references test_runs on delete cascade not null,
    model_name text,
    prompt_text text,
    response_text text,
    is_mentioned boolean,
    sentiment_score float,
    rank_position int,
    created_at timestamp with time zone default now()
);

alter table test_results enable row level security;
create policy "Users can view results of own runs" on test_results for select using (
    exists (select 1 from test_runs where id = test_results.run_id and user_id = auth.uid())
);
create policy "Users can insert results for own runs" on test_results for insert with check (
    exists (select 1 from test_runs where id = run_id and user_id = auth.uid())
);

-- Usage Tracking
alter table profiles 
add column if not exists plan text default 'free' check (plan in ('free', 'pro', 'premium', 'ultra')),

-- Model Selection System
create table available_models (
    id text primary key, -- 'gpt-4o', 'claude-3-5-sonnet'
    name text not null, -- 'GPT-4o', 'Claude 3.5 Sonnet'
    provider text not null, -- 'OpenAI', 'Anthropic'
    cost_per_input_token float,
    cost_per_output_token float,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);

alter table available_models enable row level security;
create policy "Anyone can read active models" on available_models for select using (is_active = true);
create policy "Authenticated users can sync models" on available_models for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update models" on available_models for update using (auth.role() = 'authenticated');

-- Reports System
create table reports (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    title text not null,
    content text not null,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone default now()
);

alter table reports enable row level security;
create policy "Users can view own reports" on reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on reports for insert with check (auth.uid() = user_id);
create policy "Users can delete own reports" on reports for delete using (auth.uid() = user_id);

-- Add selected models to profile
alter table profiles 
add column selected_models text[] default array['openai/gpt-4o', 'anthropic/claude-3-5-sonnet', 'google/gemini-1.5-pro']::text[];

-- Seed Data (Run this manually in SQL Editor if needed, or via migration)
insert into available_models (id, name, provider, is_active) values 
('openai/gpt-4o', 'GPT-4o', 'OpenAI', true),
('openai/gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', true),
('anthropic/claude-3-opus', 'Claude 3 Opus', 'Anthropic', true),
('anthropic/claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', true),
('google/gemini-1.5-flash', 'Gemini 1.5 Flash', 'Google', true),
('google/gemini-1.5-pro', 'Gemini 1.5 Pro', 'Google', true),
('meta-llama/llama-3-70b-instruct', 'Llama 3 70B', 'Meta', true),
('mistralai/mistral-large', 'Mistral Large', 'Mistral', true)
on conflict (id) do nothing;

