-- BillGuard MVP schema
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency_code text not null default 'USD' check (currency_code in ('USD', 'PHP', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists currency_code text not null default 'USD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_currency_code_check'
  ) then
    alter table public.profiles
      add constraint profiles_currency_code_check
      check (currency_code in ('USD', 'PHP', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'));
  end if;
end $$;

create table if not exists public.bill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.bill_categories(id) on delete set null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  is_recurring boolean not null default true,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null,
  amount_paid numeric(12,2) not null check (amount_paid > 0),
  paid_at timestamptz not null default now(),
  month_reference date not null,
  notes text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bills_user_id_id_unique'
  ) then
    alter table public.bills
      add constraint bills_user_id_id_unique unique (user_id, id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_user_bill_fkey'
  ) then
    alter table public.payments
      add constraint payments_user_bill_fkey
      foreign key (user_id, bill_id)
      references public.bills (user_id, id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_user_bill_month_unique'
  ) then
    alter table public.payments
      add constraint payments_user_bill_month_unique unique (user_id, bill_id, month_reference);
  end if;
end $$;

create index if not exists idx_bills_user_id on public.bills(user_id);
create index if not exists idx_bills_due_day on public.bills(due_day);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_bill_id on public.payments(bill_id);
create index if not exists idx_payments_month_reference on public.payments(month_reference);

alter table public.profiles enable row level security;
alter table public.bill_categories enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "bill_categories_read_all" on public.bill_categories;
create policy "bill_categories_read_all"
  on public.bill_categories
  for select
  to authenticated
  using (true);

drop policy if exists "bills_select_own" on public.bills;
create policy "bills_select_own"
  on public.bills
  for select
  using (auth.uid() = user_id);

drop policy if exists "bills_insert_own" on public.bills;
create policy "bills_insert_own"
  on public.bills
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "bills_update_own" on public.bills;
create policy "bills_update_own"
  on public.bills
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bills_delete_own" on public.bills;
create policy "bills_delete_own"
  on public.bills
  for delete
  using (auth.uid() = user_id);

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments
  for select
  using (auth.uid() = user_id);

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
  on public.payments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own"
  on public.payments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "payments_delete_own" on public.payments;
create policy "payments_delete_own"
  on public.payments
  for delete
  using (auth.uid() = user_id);

insert into public.bill_categories (name)
values
  ('Utilities'),
  ('Rent'),
  ('Subscriptions'),
  ('Loans'),
  ('Insurance'),
  ('Credit Cards')
on conflict (name) do nothing;
