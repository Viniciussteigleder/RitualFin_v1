E2E smoke com Playwright.

Requer:
- Next app rodando em http://localhost:3000
- Variaveis E2E_EMAIL e E2E_PASSWORD
 - Para testar login invalido: defina E2E_RUN_INVALID=true

Comando:
- pnpm --filter apps-web test:e2e
