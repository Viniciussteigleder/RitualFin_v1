# Backlog (RitualFin v1)

## Epic E1 — Auth e Perfil

### RF-001 Login com email/senha
- Description: permitir login por email/senha no `/login`.
- Dependencies: Supabase Auth configurado.
- Acceptance criteria: login valido redireciona `/painel`; erro invalido exibido.
- DoD: UI testado manualmente, evento `auth_login_succeeded` logado.
- Screens: `/login`
- APIs: Supabase Auth
- Tables: `profiles`

### RF-002 Login com Google
- Description: permitir OAuth Google via Supabase.
- Dependencies: OAuth provider configurado.
- Acceptance criteria: login Google cria sessao e redireciona para `/painel`.
- DoD: fluxo validado com conta real.
- Screens: `/login`
- APIs: Supabase Auth OAuth
- Tables: `profiles`

## Epic E2 — Upload e Importacao

### RF-010 Upload de CSV Miles & More
- Description: enviar CSV e invocar `mm-import`.
- Dependencies: edge function `mm-import` deployada.
- Acceptance criteria: upload valido cria `uploads` e status `ready`.
- DoD: upload com CSV valido e invalido validado.
- Screens: `/uploads`
- APIs: POST `/functions/v1/mm-import`
- Tables: `uploads`, `raw_mm_transactions`, `transactions`

### RF-011 Validacao de header e parse
- Description: validar header e campos obrigatorios.
- Dependencies: parser atual no edge function.
- Acceptance criteria: header invalido retorna 400 com colunas faltantes.
- DoD: teste unitario cobre casos de header e parse.
- Screens: `/uploads`
- APIs: POST `/functions/v1/mm-import`
- Tables: `uploads`

### RF-012 Idempotencia de importacao
- Description: evitar duplicacao em re-import.
- Dependencies: unique `transactions.key`.
- Acceptance criteria: re-import nao cria novas transacoes para mesmas keys.
- DoD: teste com re-import e contagem invariavel.
- Screens: `/uploads`
- APIs: POST `/functions/v1/mm-import`
- Tables: `transactions`

## Epic E3 — Confirm Queue

### RF-020 Lista de transacoes pendentes
- Description: listar `needs_review=true`.
- Dependencies: flags de review em `transactions`.
- Acceptance criteria: tabela mostra tags `Sem match`, `Conflito`, `Duplicado?`.
- DoD: teste manual com dados seed.
- Screens: `/confirmar`
- APIs: GET `/rest/v1/transactions`
- Tables: `transactions`

### RF-021 Confirmacao individual
- Description: atualizar categoria de uma linha e limpar flags.
- Dependencies: update RLS.
- Acceptance criteria: linha some da fila; audit log criado.
- DoD: audit log verificavel.
- Screens: `/confirmar`
- APIs: PATCH `/rest/v1/transactions`, POST `/rest/v1/audit_log`
- Tables: `transactions`, `audit_log`

### RF-022 Confirmacao em lote
- Description: aplicar tipo/fixo-var/categoria/excluir em lote.
- Dependencies: selecao de linhas.
- Acceptance criteria: todas as linhas selecionadas atualizadas e flags limpas.
- DoD: batch confirmado com 2+ linhas.
- Screens: `/confirmar`
- APIs: PATCH `/rest/v1/transactions`, POST `/rest/v1/audit_log`
- Tables: `transactions`, `audit_log`

### RF-023 Criacao de regra a partir do lote
- Description: criar regra opcional na confirmacao.
- Dependencies: tabela `rules`.
- Acceptance criteria: regra criada e `rule_id_applied` gravado.
- DoD: regra aparece em `/regras`.
- Screens: `/confirmar`, `/regras`
- APIs: POST `/rest/v1/rules`
- Tables: `rules`, `transactions`

## Epic E4 — Regras

### RF-030 Criar regra manual
- Description: formulario para criar regra com keywords.
- Dependencies: `rules`.
- Acceptance criteria: regra aparece na tabela.
- DoD: keywords com `;` aceitas.
- Screens: `/regras`
- APIs: POST `/rest/v1/rules`
- Tables: `rules`

### RF-031 Exportar regras em Markdown
- Description: exportar regras via edge function.
- Dependencies: `rules-export-md`.
- Acceptance criteria: download `regras.md`.
- DoD: arquivo contem categorias e tabela.
- Screens: `/regras`
- APIs: POST `/functions/v1/rules-export-md`
- Tables: `rules`

## Epic E5 — Painel e Orcamento

### RF-040 KPIs mensais
- Description: calcular gastos, receitas, orcamento, remaining e projecao.
- Dependencies: `transactions` e `budgets`.
- Acceptance criteria: KPIs refletem apenas mes selecionado e `exclude_from_budget`.
- DoD: validacao manual com dados seed.
- Screens: `/painel`
- APIs: GET `/rest/v1/transactions`, GET `/rest/v1/budgets`
- Tables: `transactions`, `budgets`

### RF-041 Gastos por categoria e drill-down
- Description: listar categorias com gastos e permitir filtro.
- Dependencies: `transactions`.
- Acceptance criteria: categoria selecionada filtra tabela de transacoes.
- DoD: filtro funcionando com busca.
- Screens: `/painel`
- APIs: GET `/rest/v1/transactions`
- Tables: `transactions`

### RF-042 Gerenciar orcamentos
- Description: adicionar/remover orcamentos por categoria.
- Dependencies: `budgets`.
- Acceptance criteria: lista atualiza e total reflete mudanca.
- DoD: create/delete validado.
- Screens: `/painel`
- APIs: POST/DELETE `/rest/v1/budgets`
- Tables: `budgets`

## Epic E6 — Configuracoes e Exportacao

### RF-050 Exportar ledger CSV
- Description: exportar transacoes do mes para CSV.
- Dependencies: `transactions`.
- Acceptance criteria: arquivo contem colunas definidas e valores corretos.
- DoD: arquivo validado com amostra.
- Screens: `/configuracoes`
- APIs: GET `/rest/v1/transactions`
- Tables: `transactions`

### RF-051 Audit log
- Description: listar ultimas entradas de auditoria.
- Dependencies: `audit_log`.
- Acceptance criteria: tabela mostra 20 entradas mais recentes.
- DoD: entries visiveis apos acoes.
- Screens: `/configuracoes`
- APIs: GET `/rest/v1/audit_log`
- Tables: `audit_log`

## Epic E7 — Observabilidade e Seguranca

### RF-060 Logs estruturados na importacao
- Description: registrar eventos de importacao com contagens e duracao.
- Dependencies: edge function `mm-import`.
- Acceptance criteria: logs incluem `upload_id`, `rows_total`, `rows_imported`.
- DoD: logs visiveis no provedor.
- Screens: n/a
- APIs: POST `/functions/v1/mm-import`
- Tables: `audit_log`

### RF-061 Politicas de storage
- Description: definir policies para bucket `uploads`.
- Dependencies: Supabase Storage.
- Acceptance criteria: usuario so acessa seus arquivos.
- DoD: politica testada com dois usuarios.
- Screens: `/uploads`
- APIs: Storage API
- Tables: n/a

## Epic E8 — Performance e A11y

### RF-070 Paginacao para Confirm Queue
- Description: paginar transacoes quando > 500 linhas.
- Dependencies: ajustes de UI.
- Acceptance criteria: pagina muda sem travar; tempo < 2s.
- DoD: teste com dataset grande.
- Screens: `/confirmar`
- APIs: GET `/rest/v1/transactions` com `limit/offset`
- Tables: `transactions`

### RF-071 Acessibilidade basica
- Description: foco visivel, aria-labels, navegacao por teclado.
- Dependencies: componentes UI.
- Acceptance criteria: navega com teclado e leitores de tela.
- DoD: checklist a11y aplicada.
- Screens: `/login`, `/uploads`, `/confirmar`, `/regras`, `/painel`, `/configuracoes`
- APIs: n/a
- Tables: n/a
