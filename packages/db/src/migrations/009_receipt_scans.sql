-- Track receipt/PDF parse calls per user for free tier quota (3/month)
create table if not exists receipt_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table receipt_scans enable row level security;

create policy "users read own scans" on receipt_scans
  for select using (auth.uid() = user_id);

-- Fast quota check: count scans per user per month
create index if not exists receipt_scans_user_month
  on receipt_scans(user_id, created_at desc);
