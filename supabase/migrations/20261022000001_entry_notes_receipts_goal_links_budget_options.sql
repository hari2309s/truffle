-- Entry notes, receipt attachments, goal links, budget options and all-time
-- totals. Idempotent: safe to run more than once.

-- ── Transactions ─────────────────────────────────────────────────────────────
alter table transactions
  add column if not exists note text;
alter table transactions
  drop constraint if exists transactions_note_length;
alter table transactions
  add constraint transactions_note_length check (note is null or char_length(note) <= 500);

-- Storage path of an attached receipt image/PDF (bucket "receipts").
alter table transactions
  add column if not exists receipt_path text;

-- Which savings goal a deposit/withdrawal belongs to (replaces name matching).
alter table transactions
  add column if not exists goal_id uuid references savings_goals(id) on delete set null;
create index if not exists transactions_goal_id
  on transactions (goal_id) where goal_id is not null;

-- Backfill: link existing "Saved to: …" / "Withdrawn from: …" rows to their
-- goal by name, only where the name is unambiguous for that user.
update transactions t
set goal_id = g.id
from savings_goals g
where t.goal_id is null
  and t.category = 'savings'
  and t.user_id = g.user_id
  and t.merchant = g.name
  and (
    select count(*) from savings_goals g2
    where g2.user_id = g.user_id and g2.name = g.name
  ) = 1;

-- ── Budgets ──────────────────────────────────────────────────────────────────
-- Carry last month's unused amount into this month's limit.
alter table monthly_budgets
  add column if not exists rollover boolean not null default false;
-- Percent of the limit that triggers the heads-up nudge; null turns it off.
alter table monthly_budgets
  add column if not exists alert_pct smallint default 80;
alter table monthly_budgets
  drop constraint if exists monthly_budgets_alert_pct_range;
alter table monthly_budgets
  add constraint monthly_budgets_alert_pct_range
  check (alert_pct is null or alert_pct between 1 and 100);

-- ── All-time totals ──────────────────────────────────────────────────────────
-- The API pages recent transactions to the client; the all-time balance is
-- summed here instead of shipping every row. Server (service role) only.
create or replace function transaction_totals(p_user_id uuid)
returns table (balance numeric, transaction_count bigint)
language sql
stable
as $$
  select coalesce(sum(amount), 0), count(*)
  from transactions
  where user_id = p_user_id;
$$;
revoke execute on function transaction_totals(uuid) from public, anon, authenticated;

-- ── Receipt storage ──────────────────────────────────────────────────────────
-- Private bucket; files are read and written only by the API (service role),
-- under "<user_id>/<transaction_id>.<ext>". No public or client policies.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;
