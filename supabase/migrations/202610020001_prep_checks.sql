create table public.prep_checks (
  id uuid primary key,
  run_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.prep_checks enable row level security;
revoke all on table public.prep_checks from public, anon, authenticated;
grant select, insert, delete on table public.prep_checks to service_role;
