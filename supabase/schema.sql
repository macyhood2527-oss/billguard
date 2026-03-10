-- BillGuard schema with household collaboration.
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency_code text not null default 'USD' check (currency_code in ('USD', 'PHP', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD')),
  theme_color text not null default 'rose' check (theme_color in ('rose', 'ocean', 'forest', 'amber')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists currency_code text not null default 'USD';

alter table public.profiles
  add column if not exists theme_color text not null default 'rose';

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

update public.profiles
set theme_color = case
  when theme_color = 'rose-light' then 'rose'
  when theme_color = 'amber-light' then 'amber'
  else theme_color
end
where theme_color in ('rose-light', 'amber-light');

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_theme_color_check'
  ) then
    alter table public.profiles
      drop constraint profiles_theme_color_check;
  end if;

  alter table public.profiles
    add constraint profiles_theme_color_check
    check (theme_color in ('rose', 'ocean', 'forest', 'amber'));
end $$;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'invited')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  token text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists active_household_id uuid references public.households(id) on delete set null;

create table if not exists public.bill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  category_id uuid references public.bill_categories(id) on delete set null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  is_recurring boolean not null default true,
  reminder_enabled boolean not null default false,
  reminder_days_before smallint not null default 1,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.bills
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.bills
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

alter table public.bills
  add column if not exists reminder_enabled boolean not null default false;

alter table public.bills
  add column if not exists reminder_days_before smallint not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bills_reminder_days_before_check'
  ) then
    alter table public.bills
      add constraint bills_reminder_days_before_check
      check (reminder_days_before in (0, 1, 3));
  end if;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  paid_by_user_id uuid references auth.users(id) on delete set null,
  bill_id uuid not null,
  bill_name_snapshot text,
  bill_category_snapshot text,
  amount_paid numeric(12,2) not null check (amount_paid > 0),
  paid_at timestamptz not null default now(),
  month_reference date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.payments
  add column if not exists paid_by_user_id uuid references auth.users(id) on delete set null;

alter table public.payments
  add column if not exists bill_name_snapshot text;

alter table public.payments
  add column if not exists bill_category_snapshot text;

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
    where conname = 'bills_household_id_id_unique'
  ) then
    alter table public.bills
      add constraint bills_household_id_id_unique unique (household_id, id);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'payments_user_bill_fkey'
  ) then
    alter table public.payments
      drop constraint payments_user_bill_fkey;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'payments_user_bill_month_unique'
  ) then
    alter table public.payments
      drop constraint payments_user_bill_month_unique;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_household_bill_fkey'
  ) then
    alter table public.payments
      add constraint payments_household_bill_fkey
      foreign key (household_id, bill_id)
      references public.bills (household_id, id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_household_bill_month_unique'
  ) then
    alter table public.payments
      add constraint payments_household_bill_month_unique unique (household_id, bill_id, month_reference);
  end if;
end $$;

create index if not exists idx_household_members_user_id on public.household_members(user_id);
create index if not exists idx_household_members_household_id on public.household_members(household_id);
create index if not exists idx_household_invites_household_id on public.household_invites(household_id);
create index if not exists idx_household_invites_email on public.household_invites(email);
create index if not exists idx_bills_user_id on public.bills(user_id);
create index if not exists idx_bills_household_id on public.bills(household_id);
create index if not exists idx_bills_due_day on public.bills(due_day);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_household_id on public.payments(household_id);
create index if not exists idx_payments_bill_id on public.payments(bill_id);
create index if not exists idx_payments_month_reference on public.payments(month_reference);

insert into public.households (id, name, created_by)
select gen_random_uuid(), coalesce(nullif(trim(p.full_name), ''), 'My Household'), p.id
from public.profiles p
where not exists (
  select 1
  from public.household_members hm
  where hm.user_id = p.id
);

insert into public.household_members (household_id, user_id, role, status)
select h.id, h.created_by, 'owner', 'active'
from public.households h
where not exists (
  select 1
  from public.household_members hm
  where hm.household_id = h.id
    and hm.user_id = h.created_by
);

update public.profiles p
set active_household_id = hm.household_id
from public.household_members hm
where hm.user_id = p.id
  and hm.status = 'active'
  and p.active_household_id is null;

update public.bills b
set household_id = hm.household_id,
    created_by_user_id = coalesce(b.created_by_user_id, b.user_id)
from public.household_members hm
where hm.user_id = b.user_id
  and hm.status = 'active'
  and b.household_id is null;

update public.payments p
set household_id = hm.household_id,
    paid_by_user_id = coalesce(p.paid_by_user_id, p.user_id)
from public.household_members hm
where hm.user_id = p.user_id
  and hm.status = 'active'
  and p.household_id is null;

update public.payments p
set bill_name_snapshot = b.name,
    bill_category_snapshot = coalesce(bc.name, 'Uncategorized')
from public.bills b
left join public.bill_categories bc on bc.id = b.category_id
where p.bill_id = b.id
  and p.household_id = b.household_id
  and (p.bill_name_snapshot is null or p.bill_category_snapshot is null);

do $$
begin
  if exists (
    select 1
    from public.bills
    where household_id is null
  ) then
    raise exception 'Backfill failed: some bills are still missing household_id.';
  end if;

  if exists (
    select 1
    from public.payments
    where household_id is null
  ) then
    raise exception 'Backfill failed: some payments are still missing household_id.';
  end if;
end $$;

alter table public.bills
  alter column household_id set not null;

alter table public.payments
  alter column household_id set not null;

alter table public.bills
  alter column created_by_user_id set default auth.uid();

alter table public.payments
  alter column paid_by_user_id set default auth.uid();

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role = 'owner'
  );
$$;

create or replace function public.delete_household_bill(target_bill_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select household_id
  into target_household_id
  from public.bills
  where id = target_bill_id;

  if target_household_id is null then
    return false;
  end if;

  if not public.is_household_member(target_household_id) then
    raise exception 'Not allowed to delete this bill.';
  end if;

  delete from public.payments
  where household_id = target_household_id
    and bill_id = target_bill_id;

  delete from public.bills
  where id = target_bill_id
    and household_id = target_household_id;

  return found;
end;
$$;

create or replace function public.undo_household_bill_payment(target_bill_id uuid, target_month_reference date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select household_id
  into target_household_id
  from public.bills
  where id = target_bill_id;

  if target_household_id is null then
    return false;
  end if;

  if not public.is_household_member(target_household_id) then
    raise exception 'Not allowed to undo payment for this bill.';
  end if;

  delete from public.payments
  where household_id = target_household_id
    and bill_id = target_bill_id
    and month_reference = target_month_reference;

  return found;
end;
$$;

create or replace function public.leave_household(target_household_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_role text;
  other_owner_count integer;
  next_household_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'You must be logged in to leave a household.';
  end if;

  select hm.role
  into current_role
  from public.household_members hm
  where hm.household_id = target_household_id
    and hm.user_id = current_user_id
    and hm.status = 'active';

  if current_role is null then
    raise exception 'You are not an active member of this household.';
  end if;

  if current_role = 'owner' then
    select count(*)
    into other_owner_count
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id <> current_user_id
      and hm.status = 'active'
      and hm.role = 'owner';

    if other_owner_count = 0 then
      raise exception 'Transfer ownership before leaving this household.';
    end if;
  end if;

  delete from public.household_members
  where household_id = target_household_id
    and user_id = current_user_id;

  select hm.household_id
  into next_household_id
  from public.household_members hm
  where hm.user_id = current_user_id
    and hm.status = 'active'
  order by hm.created_at asc
  limit 1;

  update public.profiles
  set active_household_id = next_household_id
  where id = current_user_id
    and active_household_id = target_household_id;

  return true;
end;
$$;

create or replace function public.transfer_household_ownership(
  target_household_id uuid,
  new_owner_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_member_exists boolean;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'You must be logged in to transfer ownership.';
  end if;

  if not public.is_household_owner(target_household_id) then
    raise exception 'Only household owners can transfer ownership.';
  end if;

  if new_owner_user_id is null or new_owner_user_id = current_user_id then
    raise exception 'Choose another household member as the new owner.';
  end if;

  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = new_owner_user_id
      and hm.status = 'active'
  )
  into target_member_exists;

  if not target_member_exists then
    raise exception 'Selected user is not an active household member.';
  end if;

  update public.household_members
  set role = case
    when user_id = current_user_id then 'member'
    when user_id = new_owner_user_id then 'owner'
    else role
  end
  where household_id = target_household_id
    and user_id in (current_user_id, new_owner_user_id)
    and status = 'active';

  update public.households
  set created_by = new_owner_user_id
  where id = target_household_id;

  return true;
end;
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.delete_household_bill(uuid) to authenticated;
grant execute on function public.undo_household_bill_payment(uuid, date) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.transfer_household_ownership(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.bill_categories enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.household_members viewer
      join public.household_members subject
        on subject.household_id = viewer.household_id
      where viewer.user_id = auth.uid()
        and viewer.status = 'active'
        and subject.user_id = public.profiles.id
        and subject.status = 'active'
    )
  );

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

drop policy if exists "households_select_member" on public.households;
create policy "households_select_member"
  on public.households
  for select
  using (
    public.is_household_member(id)
    or created_by = auth.uid()
  );

drop policy if exists "households_insert_authenticated" on public.households;
create policy "households_insert_authenticated"
  on public.households
  for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "households_update_owner" on public.households;
create policy "households_update_owner"
  on public.households
  for update
  using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

drop policy if exists "households_delete_owner" on public.households;
create policy "households_delete_owner"
  on public.households
  for delete
  using (public.is_household_owner(id));

drop policy if exists "household_members_select_member" on public.household_members;
create policy "household_members_select_member"
  on public.household_members
  for select
  using (public.is_household_member(household_id));

drop policy if exists "household_members_insert_owner" on public.household_members;
create policy "household_members_insert_owner"
  on public.household_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or public.is_household_owner(household_id)
  );

drop policy if exists "household_members_update_owner" on public.household_members;
create policy "household_members_update_owner"
  on public.household_members
  for update
  using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));

drop policy if exists "household_members_delete_owner" on public.household_members;
create policy "household_members_delete_owner"
  on public.household_members
  for delete
  using (public.is_household_owner(household_id));

drop policy if exists "household_invites_select_owner" on public.household_invites;
create policy "household_invites_select_owner"
  on public.household_invites
  for select
  using (
    public.is_household_owner(household_id)
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

drop policy if exists "household_invites_insert_owner" on public.household_invites;
create policy "household_invites_insert_owner"
  on public.household_invites
  for insert
  to authenticated
  with check (
    public.is_household_owner(household_id)
    and invited_by = auth.uid()
  );

drop policy if exists "household_invites_update_owner_or_invited" on public.household_invites;
create policy "household_invites_update_owner_or_invited"
  on public.household_invites
  for update
  using (
    public.is_household_owner(household_id)
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  )
  with check (
    public.is_household_owner(household_id)
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

drop policy if exists "household_invites_delete_owner" on public.household_invites;
create policy "household_invites_delete_owner"
  on public.household_invites
  for delete
  using (public.is_household_owner(household_id));

drop policy if exists "bill_categories_read_all" on public.bill_categories;
create policy "bill_categories_read_all"
  on public.bill_categories
  for select
  to authenticated
  using (true);

drop policy if exists "bills_select_own" on public.bills;
drop policy if exists "bills_insert_own" on public.bills;
drop policy if exists "bills_update_own" on public.bills;
drop policy if exists "bills_delete_own" on public.bills;

drop policy if exists "bills_select_member" on public.bills;
create policy "bills_select_member"
  on public.bills
  for select
  using (public.is_household_member(household_id));

drop policy if exists "bills_insert_member" on public.bills;
create policy "bills_insert_member"
  on public.bills
  for insert
  to authenticated
  with check (
    public.is_household_member(household_id)
    and coalesce(created_by_user_id, auth.uid()) = auth.uid()
  );

drop policy if exists "bills_update_member" on public.bills;
create policy "bills_update_member"
  on public.bills
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "bills_delete_member" on public.bills;
create policy "bills_delete_member"
  on public.bills
  for delete
  using (public.is_household_member(household_id));

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_own" on public.payments;
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_delete_own" on public.payments;

drop policy if exists "payments_select_member" on public.payments;
create policy "payments_select_member"
  on public.payments
  for select
  using (public.is_household_member(household_id));

drop policy if exists "payments_insert_member" on public.payments;
create policy "payments_insert_member"
  on public.payments
  for insert
  to authenticated
  with check (
    public.is_household_member(household_id)
    and coalesce(paid_by_user_id, auth.uid()) = auth.uid()
  );

drop policy if exists "payments_update_member" on public.payments;
create policy "payments_update_member"
  on public.payments
  for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "payments_delete_member" on public.payments;
create policy "payments_delete_member"
  on public.payments
  for delete
  using (public.is_household_member(household_id));

insert into public.bill_categories (name)
values
  ('Utilities'),
  ('Rent'),
  ('Subscriptions'),
  ('Loans'),
  ('Insurance'),
  ('Credit Cards')
on conflict (name) do nothing;
