alter table profile_requests
  add column if not exists published_at timestamptz;
