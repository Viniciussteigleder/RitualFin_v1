# API Contracts (RitualFin v1)

## Edge Functions (Supabase)

### POST /functions/v1/mm-import
- Auth/RLS assumptions: Bearer token valido; usa service role e valida `auth.getUser`.
- Idempotency strategy: `transactions.key` unique + pre-check; re-import nao duplica transacoes (mas cria novo `uploads`).
- Request schema:
```json
{
  "csv": "<string>",
  "filename": "<string>"
}
```
- Response schema (200):
```json
{
  "uploadId": "<uuid>",
  "rowsImported": 123,
  "rowsTotal": 456
}
```
- Error schema:
```json
{
  "error": "<mensagem>",
  "missing": ["<col>"],
  "expected": ["<col>"],
  "details": ["<linha>"]
}
```
- Pagination/filtering: n/a
- Rate/perf notes: processamento sincrono; ideal limitar a 10MB e 2k linhas.

### POST /functions/v1/rules-export-md
- Auth/RLS assumptions: Bearer token valido; service role + valida user.
- Idempotency strategy: leitura apenas.
- Request schema: vazio
- Response schema:
```json
{ "markdown": "# RitualFin — Regras..." }
```
- Error schema:
```json
{ "error": "<mensagem>" }
```
- Pagination/filtering: n/a
- Rate/perf notes: retorna markdown completo; limite pelo numero de regras.

## Next.js API

### GET /api/health
- Auth/RLS assumptions: sem auth; usa service role.
- Idempotency strategy: leitura apenas.
- Response schema:
```json
{ "status": "ok", "timestamp": "<iso>" }
```
- Error schema:
```json
{ "status": "error", "reason": "missing_env|supabase_error" }
```
- Pagination/filtering: n/a
- Rate/perf notes: baixa carga.

## Supabase PostgREST (via supabase-js)

### profiles
- GET /rest/v1/profiles?select=*
- PATCH /rest/v1/profiles?id=eq.<uuid>
- Auth/RLS assumptions: RLS por `id = auth.uid()`.
- Request/Response: `profiles` row.

### uploads
- GET /rest/v1/uploads?select=*&order=started_at.desc
- POST /rest/v1/uploads (feito pela edge function)
- PATCH /rest/v1/uploads?id=eq.<uuid>
- Auth/RLS assumptions: RLS por `profile_id`.
- Schema (row): `{ id, profile_id, filename, status, rows_total, rows_imported, error_message, started_at, finished_at }`.
- Pagination/filtering: `order`, `limit`, `offset`.

### raw_mm_transactions (server-side)
- POST /rest/v1/raw_mm_transactions (edge function)
- Schema (row): `{ upload_id, profile_id, authorised_on, processed_on, amount, currency, description, payment_type, status, foreign_amount, foreign_currency, exchange_rate, fonte, key_mm_desc, key_mm, desc_raw, desc_norm }`.

### transactions
- GET /rest/v1/transactions?select=...&payment_date=gte.<date>&payment_date=lte.<date>
- PATCH /rest/v1/transactions?id=eq.<uuid>
- Auth/RLS assumptions: RLS por `profile_id`.
- Schema (row): `{ id, profile_id, payment_date, account_source, desc_raw, desc_norm, amount, amount_display, currency, foreign_amount, foreign_currency, exchange_rate, key, type, fix_var, category_1, category_2, manual_override, internal_transfer, exclude_from_budget, needs_review, rule_miss, rule_conflict, duplicate_suspect, rule_id_applied, status, created_at }`.
- Pagination/filtering: `order`, `limit`, `offset`, `eq`, `gte`, `lte`, `in`.

### rules
- GET /rest/v1/rules?select=*
- POST /rest/v1/rules
- Auth/RLS assumptions: RLS por `profile_id`.
- Schema (row): `{ id, profile_id, type, fix_var, category_1, category_2, keywords, created_at, updated_at }`.

### budgets
- GET /rest/v1/budgets?month=eq.<date>
- POST /rest/v1/budgets
- DELETE /rest/v1/budgets?id=eq.<uuid>
- Auth/RLS assumptions: RLS por `profile_id`.
- Schema (row): `{ id, profile_id, month, category_1, amount, created_at }`.

### audit_log
- GET /rest/v1/audit_log?order=created_at.desc&limit=20
- POST /rest/v1/audit_log
- Auth/RLS assumptions: RLS por `profile_id`.
- Schema (row): `{ id, profile_id, actor, action, payload, created_at }`.
