-- Add subject column to test_results to distinguish target brand
alter table test_results 
add column if not exists subject text;

-- Optional: index for faster filtering
create index if not exists idx_test_results_subject on test_results(subject);
