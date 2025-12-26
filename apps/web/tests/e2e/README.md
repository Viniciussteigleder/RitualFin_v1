E2E smoke com Playwright.

Requer:
- Next app rodando em http://localhost:3000
- ENVs: `ENABLE_DEV_AUTOLOGIN=true`, `E2E_EMAIL`, `E2E_PASSWORD`, plus `E2E_MODE=true`
- Para invalid login: defina `E2E_RUN_INVALID=true`

Fluxo:
- A suíte aciona `/dev/autologin`; configure as descrito no README para garantir o route handler can run.

Comando:
- pnpm --filter apps-web test:e2e
