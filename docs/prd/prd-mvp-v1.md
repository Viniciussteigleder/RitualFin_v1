# PRD RitualFin MVP v1

## Contexto e fontes
- Fonte primária de intenção: PRD curto existente + contexto do pedido (MVP v1, Miles & More, Confirm Queue, dashboard mensal).
- Fonte primária de UI: `design/prototypes/*` + `design/assets/uploads/stitch_painel_dashboard.zip` + `design/tokens/*`.
- Fonte primária de realidade: `apps/web`, `supabase`, `packages/shared`.

## Visao e problema
Pessoas que concentram gastos no Miles & More precisam transformar um extrato mensal em um painel de orcamento confiavel, com regras simples de categorizacao e uma fila de confirmacao para ambiguidade, sem depender de planilhas manuais.

## Publico-alvo e JTBD
- Usuario-alvo: pessoa fisica que importa extratos Miles & More, quer visao mensal e controle de orcamento.
- JTBD principal: "Quando eu importar meu CSV do M&M, quero categorizar automaticamente com regras simples e revisar apenas o que esta ambíguo, para acompanhar gastos e orcamento do mes." 

## Metricas de sucesso e "must be true"
- Sucesso:
  - >= 90% das linhas importadas sem erro de parse.
  - <= 10% das transacoes em Confirm Queue apos importacao (depende de regras).
  - Tempo de importacao percebido: <= 30s para 1.500 linhas.
  - Retencao: usuario consegue fechar um mes (painel + orcamento) sem sair para planilha.
- Must be true:
  - Data de referencia do mes = `Authorised on` (truth date).
  - Match v1: `desc_norm` contains (case-insensitive), sem regex.
  - Dedupe ambiguo: nunca auto-merge; marcar e enviar para Confirm Queue.
  - Categoria `Interno` sempre `exclude_from_budget = true`.
  - Categoria `Saque`: default `Outros` com toggle manual de `exclude_from_budget`.
  - UI e textos em PT-BR, moeda EUR.

## Escopo
### In-scope
- Autenticacao (email/senha + Google) via Supabase.
- Upload e processamento de CSV Miles & More.
- Dedupe por descricao normalizada no mes e por `key` unica.
- Regras de keyword (contains em `desc_norm`).
- Confirm Queue para conflitos, misses e duplicados suspeitos.
- Dashboard mensal (KPIs, gastos por categoria, transacoes recentes e drill-down).
- Orçamento por categoria.
- Exportacao de ledger CSV.
- Audit log basico.

### Out-of-scope (v1)
- Multi-conta/household.
- Conectores bancarios automaticos.
- ML/AI de categorizacao.
- Revisao em lote com workflow multi-etapas/aprovacoes.
- Regras com regex ou fuzzy matching.

## Requisitos funcionais (ANTI-SHALL)
Cada requisito abaixo inclui: acao do usuario, resposta do sistema, criterio de aceite, e referencia de dados.

### FR-001 Autenticacao basica
- Acao: usuario entra com email/senha ou Google.
- Resposta: sistema cria sessao Supabase e redireciona para `/painel`.
- Aceite: login bem-sucedido deve carregar `Sidebar` com email e navegar para painel.
- Dados: Supabase Auth + tabela `profiles`.

### FR-002 Criacao de perfil
- Acao: usuario faz sign-up.
- Resposta: trigger cria `profiles` com `locale=pt-BR`, `currency=EUR`.
- Aceite: apos cadastro, existe linha em `profiles` com `id = auth.uid()`.
- Dados: `profiles`, trigger `handle_new_user`.

### FR-003 Upload CSV Miles & More
- Acao: usuario seleciona CSV e confirma upload.
- Resposta: edge function `mm-import` valida header, persiste `uploads`, grava arquivo no bucket e processa linhas.
- Aceite: se header invalido, retorna 400 com lista de colunas faltantes; se valido, cria `uploads` com `status=processing` e depois `ready`.
- Dados: `uploads`, `raw_mm_transactions`, `transactions`, storage bucket `uploads`.

### FR-004 Validacao e parse de linhas
- Acao: usuario envia CSV com datas/valores.
- Resposta: parser converte data `dd.MM.yyyy` para ISO e valor com virgula decimal.
- Aceite: linhas invalidas retornam erro com ate 10 detalhes; upload passa para `error`.
- Dados: `raw_mm_transactions`, `uploads.error_message`.

### FR-005 Dedupe e idempotencia de importacao
- Acao: usuario re-importa o mesmo CSV.
- Resposta: sistema nao cria `transactions` duplicadas para `key` existente, mas cria novo `uploads`.
- Aceite: `transactions.key` permanece unica; contagem de `rows_imported` nao cresce para chaves duplicadas.
- Dados: `transactions.key` unique, `uploads`.

### FR-006 Normalizacao e matching de regras
- Acao: usuario define regra com keywords.
- Resposta: sistema normaliza `desc_norm` e aplica `contains` em keywords separadas por `;`.
- Aceite: 1 match => aplica categoria; 0 ou >1 => `needs_review=true`.
- Dados: `rules`, `transactions.desc_norm`, `transactions.rule_*`.

### FR-007 Confirm Queue
- Acao: usuario abre `/confirmar`.
- Resposta: sistema lista transacoes `needs_review=true` com tags `rule_miss`, `rule_conflict`, `duplicate_suspect`.
- Aceite: filtro de mes e status funciona; ao salvar, linha deixa de aparecer.
- Dados: `transactions`.

### FR-008 Confirmacao individual
- Acao: usuario altera categoria e confirma linha.
- Resposta: sistema atualiza categoria e limpa flags de review, marcando `manual_override=true`.
- Aceite: linha some da fila e audit log registra `confirm_single`.
- Dados: `transactions`, `audit_log`.

### FR-009 Confirmacao em lote
- Acao: usuario seleciona multiplas linhas e aplica lote (tipo/fixo-var/categoria/excluir).
- Resposta: sistema atualiza transacoes e, se solicitado, cria regra.
- Aceite: transacoes atualizadas em massa, flags limpas e audit log com `confirm_batch`.
- Dados: `transactions`, `rules`, `audit_log`.

### FR-010 Regra por lote
- Acao: usuario cria regra via Confirm Queue.
- Resposta: sistema salva regra e referencia `rule_id_applied` nos itens confirmados.
- Aceite: regra aparece em `/regras` e aplicada em futuras importacoes.
- Dados: `rules`, `transactions.rule_id_applied`.

### FR-011 Gestao de regras
- Acao: usuario cria regra manual.
- Resposta: sistema salva e lista na tabela.
- Aceite: nova regra aparece na lista e exportacao gera arquivo `regras.md`.
- Dados: `rules`, edge function `rules-export-md`.

### FR-012 Painel mensal
- Acao: usuario abre `/painel` e escolhe mes.
- Resposta: sistema agrega transacoes por mes, calcula KPIs e categorias.
- Aceite: KPIs refletem apenas `payment_date` do mes e respeitam `exclude_from_budget`.
- Dados: `transactions`, `budgets`.

### FR-013 Orcamento por categoria
- Acao: usuario adiciona/remover orcamento.
- Resposta: sistema cria/remove registros em `budgets` para o mes.
- Aceite: total e lista de orcamentos atualizam no painel.
- Dados: `budgets`.

### FR-014 Exportacao de ledger CSV
- Acao: usuario escolhe mes e exporta.
- Resposta: sistema gera CSV client-side com transacoes do mes.
- Aceite: arquivo `ritualfin-ledger-YYYY-MM.csv` contem colunas padrao.
- Dados: `transactions`.

### FR-015 Preferencias regionais
- Acao: usuario abre configuracoes.
- Resposta: sistema exibe locale e moeda atuais (somente leitura no v1).
- Aceite: `profile.locale` e `profile.currency` exibidos.
- Dados: `profiles`.

### FR-016 Auditoria
- Acao: usuario realiza importacao/confirmacao/exportacao.
- Resposta: sistema grava `audit_log` com ator e payload.
- Aceite: tabela de audit log lista ultimas 20 entradas.
- Dados: `audit_log`.

## Screen contracts (ver tambem `docs/prd/screen-contracts.md`)

### Login (`/login`)
1) Purpose (one sentence)
Permitir autenticacao do usuario no RitualFin.
2) Primary user question it answers
"Como entro na minha conta para ver minhas transacoes?"
3) Entry points (routes and navigation)
`/login` (acesso direto ou redirect de rotas protegidas).
4) Permissions (auth required? roles?)
Nao requer auth.
5) Data dependencies
- queries: `supabase.auth.getSession()`
- commands: `auth.signInWithPassword`, `auth.signInWithOAuth`, `auth.signUp`
6) UI composition
- card de login, inputs email/senha, botoes Google e cadastro
- empty/loading/error states
7) Interaction model
- primary actions: Entrar, Continuar com Google
- secondary actions: Cadastre-se, Esqueceu?
- bulk actions: n/a
8) Validation rules
- email e senha obrigatorios
9) System feedback
- erro do Supabase exibido inline
10) Analytics/telemetry events (v1 minimal)
- `auth_login_success`, `auth_login_error`
11) Acceptance criteria
- login valido redireciona para `/painel`.

### Uploads (`/uploads`)
1) Purpose (one sentence)
Receber CSV Miles & More e iniciar processamento.
2) Primary user question it answers
"Como envio meu extrato para importar transacoes?"
3) Entry points (routes and navigation)
Sidebar -> Uploads, CTA no painel.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `uploads` (historico)
- commands: `mm-import` edge function
6) UI composition
- dropzone, card de status e tabela de historico
- empty/loading/error states
7) Interaction model
- primary actions: Selecionar arquivo, Enviar CSV
- secondary actions: Filtrar (placeholder)
- bulk actions: n/a
8) Validation rules
- arquivo CSV, tamanho <= 10MB (UI)
9) System feedback
- toast texto de sucesso/erro; badge de status por upload
10) Analytics/telemetry events (v1 minimal)
- `upload_started`, `upload_succeeded`, `upload_failed`
11) Acceptance criteria
- upload valido cria registro `uploads` e aparece no historico.

### Confirmar (`/confirmar`)
1) Purpose (one sentence)
Revisar transacoes ambíguas e confirmar categorizacao.
2) Primary user question it answers
"Quais transacoes precisam de revisao manual?"
3) Entry points (routes and navigation)
Sidebar -> Confirmar.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `transactions` com `needs_review=true`
- commands: update `transactions`, insert `rules`, insert `audit_log`
6) UI composition
- KPIs de fila, filtros, formulario de lote, tabela de transacoes
- empty/loading/error states
7) Interaction model
- primary actions: Confirmar lote, Salvar linha
- secondary actions: filtros de mes/status, busca
- bulk actions: atualizar lote + criar regra
8) Validation rules
- se `category_1=Interno`, forcar `exclude_from_budget=true`
9) System feedback
- mensagens de sucesso/erro
10) Analytics/telemetry events (v1 minimal)
- `confirm_batch`, `confirm_single`, `rule_created`
11) Acceptance criteria
- itens confirmados saem da fila e flags de review sao limpas.

### Regras (`/regras`)
1) Purpose (one sentence)
Criar e visualizar regras de keyword.
2) Primary user question it answers
"Como automatizo categorias para descricoes recorrentes?"
3) Entry points (routes and navigation)
Sidebar -> Regras.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `rules`
- commands: insert `rules`, invoke `rules-export-md`
6) UI composition
- formulario de nova regra, tabela de regras, filtros placeholder
7) Interaction model
- primary actions: Nova Regra, Exportar Markdown
- secondary actions: filtros (nao ativos)
- bulk actions: n/a
8) Validation rules
- keywords obrigatorias e separadas por `;`
9) System feedback
- mensagens de sucesso/erro
10) Analytics/telemetry events (v1 minimal)
- `rule_created`, `rules_exported`
11) Acceptance criteria
- nova regra aparece na lista e exportacao gera arquivo.

### Painel (`/painel`)
1) Purpose (one sentence)
Mostrar visao mensal de gastos, receitas e orcamento.
2) Primary user question it answers
"Como estou no mes e onde estou gastando mais?"
3) Entry points (routes and navigation)
Sidebar -> Painel, redirect apos login.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `transactions` por mes, `budgets` por mes
- commands: insert/delete `budgets`
6) UI composition
- KPIs, donut de categorias, tabela recentes, drill-down, orcamentos
- empty/loading/error states
7) Interaction model
- primary actions: Upload CSV, adicionar/remover orcamento
- secondary actions: filtro de mes/status, busca drill-down
- bulk actions: n/a
8) Validation rules
- orcamento requer valor numerico
9) System feedback
- mensagens de sucesso/erro
10) Analytics/telemetry events (v1 minimal)
- `budget_added`, `budget_deleted`, `dashboard_viewed`
11) Acceptance criteria
- KPIs refletem apenas transacoes do mes e respeitam exclusoes.

### Configuracoes (`/configuracoes`)
1) Purpose (one sentence)
Exibir perfil, exportar ledger e auditar acoes.
2) Primary user question it answers
"Como exporto meus dados e vejo meu historico?"
3) Entry points (routes and navigation)
Sidebar -> Configuracoes.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `profiles`, `transactions`, `audit_log`
- commands: insert `audit_log`
6) UI composition
- cards de perfil, exportacao, preferencias, audit log
- empty/loading/error states
7) Interaction model
- primary actions: Exportar Ledger
- secondary actions: n/a
- bulk actions: n/a
8) Validation rules
- mes valido no seletor
9) System feedback
- mensagens de sucesso/erro
10) Analytics/telemetry events (v1 minimal)
- `ledger_exported`
11) Acceptance criteria
- exportacao gera CSV com colunas definidas.

## Data model e API (resumo)
- Data model atual: `profiles`, `accounts`, `uploads`, `raw_mm_transactions`, `transactions`, `rules`, `budgets`, `audit_log`.
- API atual: Supabase PostgREST para CRUD e edge functions `mm-import` e `rules-export-md`.
- Referencias detalhadas: `docs/prd/api-contracts.md` e `docs/prd/data-contracts.md`.

## Requisitos nao-funcionais
- Performance: pagina `/confirmar` deve suportar 500+ linhas com paginacao ou virtualizacao (atualmente nao implementado).
- Confiabilidade: importacao deve ser idempotente em `transactions.key`.
- Seguranca: RLS por `profile_id`, storage isolado por `user/{id}`.
- A11y: foco visivel, navegacao via teclado, labels e aria para inputs.
- Observabilidade: `audit_log` basico + logs estruturados nas edge functions.
- I18n: PT-BR fixo no v1; path para i18n no v2.

## Assumptions e open questions
### Assumptions
- A fonte de verdade do mes e `Authorised on` (implementado).
- CSV segue Miles & More original com headers em ingles.
- `Saque` sera tratado via regra manual ou confirmacao (nao existe regra automatica).

### Open questions (bloqueios reais)
- Necessario adicionar politicas de storage para bucket `uploads` (nao versionadas).
- Confirm Queue precisa de filtros por tipo de conflito (design) ou manter apenas mes/status?

## Plano de release
- Fase 0: completar politicas de storage, revisar RLS, envs.
- Fase 1: estabilizar importacao e Confirm Queue (ux + erros).
- Fase 2: completar dashboard e orcamento (performance e paginacao).
- Fase 3: hardening (a11y, observabilidade, docs).

## Risk register
1) Importacao de CSV falha por variacao de header.
2) Confirm Queue sem paginacao gera lentidao com 500+ linhas.
3) Idempotencia parcial gera confusao (novos uploads sem novas transacoes).
4) Storage sem RLS permite vazamento de arquivo.
5) Regras com keywords amplas geram conflitos recorrentes.
6) Campos `status` dependem do CSV e podem divergir.
7) Dedupe por `desc_norm` pode gerar falsos positivos.
8) `Saque` sem regra automatica gera classificacao inconsistente.
9) Falta de observabilidade dificulta debug de importacao.
10) Falta de acessibilidade pode gerar regressao de UX.

## Implementation Readiness
- Score: 68/100
- Top 10 riscos: ver Risk register acima.
