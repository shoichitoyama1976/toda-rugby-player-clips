create table if not exists profile_requests (
  id text primary key,
  created_at timestamptz not null default now(),
  player_slug text not null,
  player_name text not null,
  field_key text not null,
  current_value text not null default '',
  proposed_value text not null,
  note text not null default '',
  status text not null default 'checked',
  check_verdict text,
  check_summary text,
  check_sources text,
  checked_at timestamptz,
  reviewed_at timestamptz
);

create index if not exists profile_requests_status_idx on profile_requests (status, created_at desc);

create table if not exists player_overrides (
  player_slug text not null,
  field_key text not null,
  value text not null,
  request_id text,
  updated_at timestamptz not null default now(),
  primary key (player_slug, field_key)
);
