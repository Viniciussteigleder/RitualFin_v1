alter table transactions
add column if not exists rule_miss boolean not null default false,
add column if not exists rule_conflict boolean not null default false,
add column if not exists duplicate_suspect boolean not null default false;
