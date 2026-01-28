-- Add status tracking to test_results for async processing
alter table test_results 
add column if not exists status text default 'pending' check (status in ('pending', 'completed', 'failed')),
add column if not exists error_message text;

-- Index for faster lookup of pending items
create index if not exists idx_test_results_status_run_id on test_results(run_id, status);
