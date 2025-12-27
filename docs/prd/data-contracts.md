# Data Contracts (RitualFin v1)

## Tabelas (schema atual)

### profiles
- PK: `id` (uuid) -> `auth.users(id)`
- Columns: `created_at`, `locale`, `currency`, `name`, `photo_url`
- RLS: select/update por `id = auth.uid()`

### accounts
- PK: `id`
- FK: `profile_id -> profiles.id`
- Columns: `source`, `created_at`
- RLS: all por `profile_id = auth.uid()`
- Uso v1: tabela nao consumida pelo app (reservada para multi-fonte/v2).

### uploads
- PK: `id`
- FK: `profile_id -> profiles.id`
- Columns: `filename`, `status` (processing|ready|duplicate|error), `rows_total`, `rows_imported`, `error_message`, `started_at`, `finished_at`
- RLS: all por `profile_id = auth.uid()`

### rules
- PK: `id`
- FK: `profile_id -> profiles.id`
- Columns: `type`, `fix_var`, `category_1`, `category_2`, `keywords`, `created_at`, `updated_at`
- RLS: all por `profile_id = auth.uid()`

### transactions
- PK: `id`
- FK: `profile_id -> profiles.id`, `rule_id_applied -> rules.id`
- Unique: `key`
- Columns: `payment_date` (truth date), `account_source`, `desc_raw`, `desc_norm`, `amount`, `amount_display`, `currency`, `foreign_amount`, `foreign_currency`, `exchange_rate`, `type`, `fix_var`, `category_1`, `category_2`, `manual_override`, `internal_transfer`, `exclude_from_budget`, `needs_review`, `rule_miss`, `rule_conflict`, `duplicate_suspect`, `status`, `created_at`
- RLS: all por `profile_id = auth.uid()`

### raw_mm_transactions
- PK: `id`
- FK: `upload_id -> uploads.id`, `profile_id -> profiles.id`
- Columns: `authorised_on`, `processed_on`, `amount`, `currency`, `description`, `payment_type`, `status`, `foreign_amount`, `foreign_currency`, `exchange_rate`, `fonte`, `key_mm_desc`, `key_mm`, `desc_raw`, `desc_norm`, `created_at`
- RLS: all por `profile_id = auth.uid()`

### budgets
- PK: `id`
- FK: `profile_id -> profiles.id`
- Columns: `month`, `category_1`, `amount`, `created_at`
- RLS: all por `profile_id = auth.uid()`

### audit_log
- PK: `id`
- FK: `profile_id -> profiles.id`
- Columns: `actor`, `action`, `payload` (jsonb), `created_at`
- RLS: all por `profile_id = auth.uid()`

## Indices (atuais)
- PKs por tabela.
- Unique: `transactions.key`.

## Indices recomendados (assumption)
- `transactions(profile_id, payment_date)` para filtros por mes.
- `transactions(profile_id, needs_review)` para Confirm Queue.
- `uploads(profile_id, started_at)` para historico.

## RLS (resumo)
- Todas as tabelas possuem RLS habilitado.
- Politicas por `profile_id = auth.uid()` (ou `profiles.id`).

## Storage (uploads)
- Bucket esperado: `uploads` (privado).
- Path: `user/{userId}/uploads/{uploadId}.csv`.
- Politicas: nao versionadas no repo (bloqueio para prod).

## Audit log schema
- `actor`: email ou `user`.
- `action`: `mm_import`, `confirm_single`, `confirm_batch`, `rule_created`, `export_ledger`.
- `payload`: contexto especifico (ids, contagens, parametros).

## Migration notes
- `000_init.sql` cria todas as tabelas, trigger de profiles, RLS.
- `001_review_flags.sql` adiciona flags de review (`rule_miss`, `rule_conflict`, `duplicate_suspect`).
