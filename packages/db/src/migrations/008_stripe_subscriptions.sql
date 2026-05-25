-- User subscription profiles (Stripe integration)
-- Separated from auth.users because user_metadata is client-writable via supabase.auth.updateUser()
-- Only the service role (webhook handler) writes to this table via RLS.
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  -- null while subscription is active; set to period_end when cancel_at_period_end=true
  plan_expires_at timestamptz,
  updated_at timestamptz default now() not null
);

-- Users can read their own profile; only service role (webhook) can write
alter table user_profiles enable row level security;

create policy "users read own profile" on user_profiles
  for select using (auth.uid() = id);

-- Fast quota check: count user messages per month
create index if not exists chat_messages_user_month
  on chat_messages(user_id, created_at desc)
  where role = 'user';
