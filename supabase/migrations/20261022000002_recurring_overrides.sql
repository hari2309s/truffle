-- The user's corrections to recurring-payment detection: move an item to
-- another group, or mark it "not recurring". Keyed by the detector's item
-- key (merchant + typical amount, e.g. "netflix|14").
--
-- Read and written only through /api/recurring with the service role, so RLS
-- is on with no policies: direct client access is denied.

create table if not exists recurring_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 300),
  choice text not null check (choice in ('fixed', 'investing', 'subscriptions', 'other', 'none')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table recurring_overrides enable row level security;
