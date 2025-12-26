# RitualFin MVP v1

MVP full-stack com Next.js + Supabase para importar CSVs Miles & More, aplicar regras de keyword e manter um painel mensal com orçamento.

## Estrutura
- `apps/web`: Next.js 13 app com roteamento/app directories, páginas e libs.
- `supabase`: migrations, functions e tipos para o banco Supabase/Postgres.
- `packages/shared`: utilitários e tipos reutilizáveis entre backend e frontend.
- `docs`: PRDs, sub-agentes e prompts para orientar a implementação.
- `design`: protótipos HTML/CSS + tokens de cor/typography/spacing.

## Setup
1. `pnpm install` (usa `pnpm` como gerenciador de pacotes).
2. Copie `.env.example` para `.env` e configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` etc.
3. Crie `apps/web/.env.local` com:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
   NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
   ```
   e, apenas for local/E2E, set:
   ```
   ENABLE_DEV_AUTOLOGIN=true
   E2E_EMAIL=<dev user email>
   E2E_PASSWORD=<dev password>
   E2E_MODE=true
   ```
   This enables the `/dev/autologin` route and dev button (never enable in prod).
3. Use `pnpm dev:web` ou `./scripts/dev.sh` para iniciar o app Next.

## Supabase
- Migrations estão em `supabase/migrations/000_init.sql`.
- Funções edge: `supabase/functions/mm-import` e `rules-export-md`.
- Tipos compartilhados em `supabase/types/database.ts`.
 
### Storage (Uploads)
- Crie o bucket `uploads` (privado) e aplique as policies para `storage.objects`.
- A UI faz upload em `user/{userId}/uploads/{uploadId}.csv`.

## Scripts úteis
- `pnpm dev:web` – starta o Next.js app.
- `scripts/dev.sh` / `scripts/dev.ps1` – atalhos para o mesmo comando.
- `pnpm lint`, `pnpm test` – executam scripts recursivos.
- `pnpm typecheck` – executa `tsc` em todos os workspaces.

## Testes
- Unitários (parser + regras) e e2e smoke estão em `apps/web/tests` e usam `vitest`.
- Futuramente esses testes cobrirão login, upload e painel.
 
### E2E (Playwright)
- Configure the same server envs shown above (ENABLE_DEV_AUTOLOGIN/E2E_*).  
- Run the dev server (`pnpm dev:web`) and execute `pnpm --filter apps-web test:e2e`.
- The suite now calls `/dev/autologin` (dev-only). Set `E2E_RUN_INVALID=true` if you want the invalid-login test.

### Dev Auto-Login Cleanup
- Remove `apps/web/app/dev/autologin/route.ts` and the `ENABLE_DEV_AUTOLOGIN`/`E2E_*` vars when hardening for production.
- Confirm `NEXT_PUBLIC_ENABLE_DEV_LOGIN` is unset before deploying.

## Design & processo
- Referências em `design/prototypes/*` e tokens em `design/tokens`.
- Instruções de trabalho no `docs/agents/*.md`.

## Próximos passos
1. Implementar autenticação Supabase + middleware de rotas protegidas.
2. Construir pipeline mm-import e tabelas auxiliares.
3. Criar regras de keyword, Confirm Queue e dashboard conforme PRD.
