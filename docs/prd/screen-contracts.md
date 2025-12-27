# Screen Contracts (RitualFin v1)

## Login (/login)
1) Purpose (one sentence)
Permitir autenticar e iniciar sessao no RitualFin.
2) Primary user question it answers
"Como acesso minha conta?"
3) Entry points (routes and navigation)
`/login` (rota publica); redirect de `/painel` e rotas protegidas.
4) Permissions (auth required? roles?)
Nao requer auth.
5) Data dependencies
- queries: `auth.getSession()`
- commands: `auth.signInWithPassword`, `auth.signInWithOAuth`, `auth.signUp`
6) UI composition
- Card de login com logo, inputs email/senha, botoes Google, Entrar e Cadastre-se.
- Empty/loading/error: estado de submit `Processando...`; erro inline.
7) Interaction model
- primary actions: Entrar (email/senha), Continuar com Google
- secondary actions: Cadastre-se, Esqueceu?
- bulk actions: n/a
8) Validation rules
- email valido e senha obrigatoria.
9) System feedback
- erro de auth como texto vermelho; sucesso com mensagem de redirecionamento.
10) Analytics/telemetry events (v1 minimal)
- `auth_login_started`, `auth_login_succeeded`, `auth_login_failed`
11) Acceptance criteria
- login bem-sucedido redireciona para `/painel` e sidebar exibe email.

## Uploads (/uploads)
1) Purpose (one sentence)
Receber CSV Miles & More, iniciar importacao e exibir historico.
2) Primary user question it answers
"Meu CSV foi enviado e processado?"
3) Entry points (routes and navigation)
Sidebar -> Uploads; CTA no painel.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `uploads` (listagem)
- commands: edge function `mm-import` (POST)
6) UI composition
- Card dropzone + botao Enviar; tabela de historico.
- Tabela: colunas `Status`, `Arquivo`, `Data do upload`, `Mes ref.`, `Linhas`.
- Empty/loading/error: "Nenhum upload ainda."; badge por status; erro inline.
7) Interaction model
- primary actions: Selecionar Arquivo, Enviar CSV
- secondary actions: Filtrar (placeholder)
- bulk actions: n/a
8) Validation rules
- aceitar apenas `.csv`.
9) System feedback
- sucesso: "Upload enviado e processado"; erro com mensagem do backend.
10) Analytics/telemetry events (v1 minimal)
- `upload_started`, `upload_ready`, `upload_error`
11) Acceptance criteria
- ao enviar CSV valido, criar `uploads` e atualizar tabela com status.

## Confirmar (/confirmar)
1) Purpose (one sentence)
Revisar transacoes ambíguas para garantir o orcamento.
2) Primary user question it answers
"Quais transacoes precisam de confirmacao?"
3) Entry points (routes and navigation)
Sidebar -> Confirmar.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `transactions` com `needs_review=true` e filtros por mes/status
- commands: update `transactions`, insert `rules`, insert `audit_log`
6) UI composition
- KPIs: Total pendente, Sem categoria, Conflitos.
- Formulario de lote: tipo, fixo/var, categoria, categoria II, excluir.
- Tabela: colunas ``, `Data`, `Descricao`, `Valor`, `Status`, `Categoria`, `Tags`, `Confirmar`.
- Empty/loading/error: "Nenhuma excecao encontrada."; erro inline.
7) Interaction model
- primary actions: Confirmar itens em lote, Salvar linha
- secondary actions: busca, filtro de mes, filtro de status
- bulk actions: aplicar lote + criar regra
8) Validation rules
- se categoria_1 = Interno => `exclude_from_budget=true`.
9) System feedback
- mensagens de sucesso/erro; badges de tags (Sem match, Conflito, Duplicado?).
10) Analytics/telemetry events (v1 minimal)
- `confirm_batch`, `confirm_single`, `rule_created`
11) Acceptance criteria
- transacao confirmada limpa flags e sai da fila.

## Regras (/regras)
1) Purpose (one sentence)
Gerenciar regras de categorizacao por keyword.
2) Primary user question it answers
"Como automatizar categorizacao no import?"
3) Entry points (routes and navigation)
Sidebar -> Regras.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `rules` (list)
- commands: insert `rules`, edge function `rules-export-md`
6) UI composition
- Formulario com Tipo, Fixo/Var, Categoria, Categoria II, Keywords.
- Tabela: colunas `Keywords`, `Categoria aplicada`, `Tipo`, `Recorrencia`.
- Empty/loading/error: "Nenhuma regra cadastrada."; erro inline.
7) Interaction model
- primary actions: Nova Regra, Exportar Markdown
- secondary actions: filtros (nao funcionais no v1)
- bulk actions: n/a
8) Validation rules
- keywords obrigatorias; separadas por `;`.
9) System feedback
- mensagens de sucesso/erro.
10) Analytics/telemetry events (v1 minimal)
- `rule_created`, `rules_exported`
11) Acceptance criteria
- nova regra aparece na tabela e exportacao gera `regras.md`.

## Painel (/painel)
1) Purpose (one sentence)
Exibir KPIs mensais e detalhar gastos por categoria.
2) Primary user question it answers
"Qual meu gasto e orcamento no mes?"
3) Entry points (routes and navigation)
Sidebar -> Painel; redirect apos login.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `transactions` por mes, `budgets` por mes
- commands: insert/delete `budgets`
6) UI composition
- KPIs: gasto, receitas, orcamento, remaining, projecao.
- Donut de categorias + lista.
- Tabela "Transacoes recentes".
- Drill-down com busca.
- Orcamentos (form + lista).
- Empty/loading/error: EmptyState com CTA para upload.
7) Interaction model
- primary actions: Upload CSV, Adicionar orcamento
- secondary actions: filtro de mes/status, busca, remover orcamento
- bulk actions: n/a
8) Validation rules
- orcamento exige valor numerico.
9) System feedback
- mensagens de sucesso/erro.
10) Analytics/telemetry events (v1 minimal)
- `dashboard_viewed`, `budget_added`, `budget_deleted`
11) Acceptance criteria
- KPIs calculados com `exclude_from_budget=false` e data do mes.

## Configuracoes (/configuracoes)
1) Purpose (one sentence)
Exibir perfil, exportar ledger e mostrar auditoria.
2) Primary user question it answers
"Como exporto e vejo historico de acoes?"
3) Entry points (routes and navigation)
Sidebar -> Configuracoes.
4) Permissions (auth required? roles?)
Auth required.
5) Data dependencies
- queries: `profiles`, `transactions`, `audit_log`
- commands: insert `audit_log`
6) UI composition
- Cards: Informacoes pessoais, Exportar CSV, Preferencias regionais, Audit Log.
- Tabela audit log: colunas `Quando`, `Acao`, `Quem`.
- Empty/loading/error: "Nenhuma alteracao registrada ainda."; erro inline.
7) Interaction model
- primary actions: Exportar Ledger
- secondary actions: n/a
- bulk actions: n/a
8) Validation rules
- mes valido no seletor.
9) System feedback
- mensagens de sucesso/erro.
10) Analytics/telemetry events (v1 minimal)
- `ledger_exported`
11) Acceptance criteria
- exportacao gera CSV com colunas definidas e audit log registra evento.
