-- initial schema for RitualFin MVP v1
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  locale text not null default 'pt-BR',
  currency text not null default 'EUR',
  name text,
  photo_url text
);

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
