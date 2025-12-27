-- initial schema for RitualFin MVP v1
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  locale text not null default 'pt-BR',
  currency text not null default 'EUR',
  name text,
  photo_url text
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, locale, currency, name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'locale', 'pt-BR'),
    coalesce(new.raw_user_meta_data ->> 'currency', 'EUR'),
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  source text not null default 'M&M',
  created_at timestamptz not null default now()
);

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  filename text not null,
  status text not null check (status in ('processing','ready','duplicate','error')),
  rows_total int not null default 0,
  rows_imported int not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  fix_var text not null,
  category_1 text not null,
  category_2 text,
  keywords text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  payment_date date not null,
  imported_at timestamptz not null default now(),
  account_source text not null,
  desc_raw text,
  desc_norm text,
  amount numeric not null,
  amount_display text,
  currency text default 'EUR',
  foreign_amount numeric,
  foreign_currency text,
  exchange_rate numeric,
  key text unique,
  type text,
  fix_var text,
  category_1 text,
  category_2 text,
  manual_override boolean not null default false,
  manual_note text,
  internal_transfer boolean not null default false,
  exclude_from_budget boolean not null default false,
  needs_review boolean not null default false,
  rule_id_applied uuid references rules(id),
  status text,
  created_at timestamptz not null default now()
);

create table if not exists raw_mm_transactions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references uploads(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  authorised_on date not null,
  processed_on date,
  amount text not null,
  currency text not null,
  description text not null,
  payment_type text not null,
  status text not null,
  foreign_amount text,
  foreign_currency text,
  exchange_rate numeric,
  fonte text,
  key_mm_desc text,
  key_mm text,
  desc_raw text,
  desc_norm text,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  month date not null,
  category_1 text,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  actor text not null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table uploads enable row level security;
alter table raw_mm_transactions enable row level security;
alter table transactions enable row level security;
alter table rules enable row level security;
alter table budgets enable row level security;
alter table audit_log enable row level security;

create policy "Profiles are viewable by owner"
on profiles for select
using (id = auth.uid());

create policy "Profiles are updatable by owner"
on profiles for update
using (id = auth.uid());

create policy "Accounts are scoped to owner"
on accounts for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Uploads are scoped to owner"
on uploads for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Raw transactions are scoped to owner"
on raw_mm_transactions for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Transactions are scoped to owner"
on transactions for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Rules are scoped to owner"
on rules for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Budgets are scoped to owner"
on budgets for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Audit log is scoped to owner"
on audit_log for all
using (profile_id = auth.uid())
with check (profile_id = auth.uid());
