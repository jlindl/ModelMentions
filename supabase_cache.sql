-- Cache table for LLM responses
create table if not exists llm_cache (
    hash text primary key, -- SHA256 of model + prompt
    model text not null,
    response_text text not null,
    usage jsonb,
    created_at timestamp with time zone default now()
);

-- Index is implicit on primary key, but we can add one for cleanup if needed
create index if not exists idx_llm_cache_created_at on llm_cache(created_at);

-- RLS: Only service_role should access this usually, but enabling RLS is good practice
alter table llm_cache enable row level security;
create policy "Authenticated can read cache" on llm_cache for select using (true);
create policy "Authenticated can insert buffer" on llm_cache for insert with check (true);
