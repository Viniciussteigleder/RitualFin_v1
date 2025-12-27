# RitualFin v1 — Redesign UX/UI (MVP)

## Direcao e principios
- Clareza Apple-like: tipografia forte, pouco chrome, espacos consistentes.
- Wroblewski: menos passos e friccao, revelar detalhes so quando necessario.
- Aarron Walter: microcopy amigavel e orientado a confianca.
- Steve Krug: caminhos obvios, nenhuma duvida do que fazer a seguir.
- MVP estrito: sem onboarding, sem automacao ambigua, sem features fora do escopo.

## Tokens e ajustes minimos (proposta)
Respeitar `design/tokens/colors.css`, `design/tokens/typography.css`, `design/tokens/spacing.css`.
- Adicoes minimas sugeridas (mantem paleta atual):
  - `--color-slate-50` (fundo), `--color-slate-300` (bordas suaves)
  - `--color-emerald-500` (sucesso), `--color-rose-500` (erro)
  - Justificativa: estados claros de sistema e leitura em tabelas.
- Tipografia: manter `Inter` para MVP e reduzir variacoes (2 pesos).

## Arquitetura de layout
- App shell com barra superior fina (logo + estado + ajuda) e barra lateral curta.
- Navegacao principal: Uploads, Confirmar, Regras, Painel, Configuracoes.
- Status global (chip): "Processando", "Aguardando confirmacao", "Sem pendencias".
- Layout responsivo: sidebar vira menu inferior em mobile; tabelas viram cards densos.

## Fluxo end-to-end (MVP)
1) Login rapido (Google ou Email) -> 2) Upload CSV -> 3) Validacao -> 4) Processamento com status -> 5) Confirmar conflitos -> 6) Atualizar/confirmar regra -> 7) Painel mensal confiavel.

## Wireframes (texto) e interacoes chave

### 1) Auth (login + sessao)
Wireframe:
- Logo + titulo curto + botoes grandes (Google, Email/Senha)
- Link pequeno "Esqueci minha senha"
- Mensagem de seguranca curta
Interacoes:
- Persistencia de sessao; apos login, ir direto para Uploads.
Estados:
- Loading: "Entrando..."
- Erro: "Nao foi possivel entrar. Verifique seus dados."
Microcopy:
- "Entrar para ver suas transacoes."
- "Continuar com Google"

### 2) Uploads (drag & drop + historico)
Wireframe:
- Header: "Uploads" + status global
- Card dropzone grande + botao "Selecionar arquivo"
- Bloco "Requisitos do CSV" (header valido + data "Authorised on")
- Historico: tabela com arquivo, data, status, linhas validas
Interacoes:
- Validacao imediata do header; mostrar erro com exemplo correto.
- Mostrar contagem de linhas validas/invalidas.
Estados:
- Vazio: "Nenhum arquivo enviado ainda."
- Erro CSV: "Header invalido. Use o modelo Miles & More."
- Sucesso: "Upload recebido. Processando..."
Microcopy:
- "Arraste um CSV Miles & More ou clique para selecionar."
- "Base do mes: 'Authorised on'."

### 3) Processamento (status)
Wireframe:
- Stepper compacto: Importar -> Enriquecer -> Deduplicar -> Confirmar
- Contador de conflitos e duplicatas suspeitas
Interacoes:
- Ao finalizar, CTA direto para "Revisar Confirmacoes".
Microcopy:
- "Encontramos 6 conflitos. Revise antes de consolidar."

### 4) Confirmar (queue)
Wireframe:
- Filtros horizontais: Conflito, Sem match, Duplicata suspeita
- Barra de busca + chips de categoria
- Tabela densa com linhas editaveis (categoria, excluir do orcamento, notas)
- Lateral "Resumo da fila" com contagem e impacto total
Interacoes:
- Inline edit abre popover simples; salvar por linha.
- Batch confirm com resumo do que sera aplicado.
- Bloquear override: se manual, mostrar badge "Ajuste manual" e desabilitar auto.
Estados:
- Vazio: "Nada para confirmar. Seu painel esta pronto."
- Erro: "Nao foi possivel salvar. Tente novamente."
Microcopy:
- "Confirmar altera a categoria e pode criar regra."
- "Ajuste manual detectado. Esta linha nao sera sobrescrita."

### 5) Regras (CRUD + keywords)
Wireframe:
- Lista de regras com categoria, keywords, ultima atualizacao
- Botao "Nova regra" + exportar Markdown
- Drawer lateral para editar keywords e prioridade
Interacoes:
- CRUD simples; validar keywords duplicadas.
Estados:
- Vazio: "Sem regras ainda. Crie a primeira ao confirmar transacoes."
Microcopy:
- "Keywords sao comparadas em desc_norm (contains)."

### 6) Dashboard mensal
Wireframe:
- Seletor de mes (base: Authorised on)
- KPIs: Gastos, Receitas, Orcamento, Remaining, Projecao simples
- Grafico leve de breakdown por categoria
- Drill-down por categoria + busca
Interacoes:
- Clique em categoria filtra tabela de transacoes.
- Projecao simples: mostrar formula em tooltip.
Estados:
- Vazio: "Sem transacoes neste mes."
Microcopy:
- "Gastos excluem itens com exclude_from_budget."
- "Projecao: gasto atual + fixos restantes + taxa variavel."

### 7) Settings + Audit
Wireframe:
- Perfil (nome, email, logout visivel)
- Exportar ledger por mes (CSV)
- Audit log: tabela com acao, usuario, data, origem
Interacoes:
- Exportacao com seletor de mes.
Estados:
- Vazio audit: "Sem mudancas registradas ainda."
Microcopy:
- "Logout"
- "Exportar CSV do mes"
- "Historico de alteracoes manuais e regras"

## Componentes e padroes de interacao
- App shell (top bar + sidebar)
- Dropzone com estados (idle/hover/valid/erro)
- Stepper compacto de pipeline
- Tabela densa com linhas editaveis
- Chips de status e categorias
- Badge "Conflito", "Sem match", "Duplicata"
- Drawer de edicao (Regras)
- Tooltip de explicacao curta
- Empty states claros e consistentes

## Microcopy PT-BR (acao e estado)
- Acoes: "Confirmar", "Salvar regra", "Editar", "Exportar CSV", "Ver detalhes"
- Estados: "Processando...", "Sem pendencias", "Erro ao validar arquivo"
- Alertas: "Nada sera aplicado automaticamente. Revise e confirme."

## Before/After por tela
- Auth: antes sem hierarquia -> depois CTA claro + mensagem de seguranca e menos friccao.
- Uploads: antes apenas titulo -> depois dropzone, requisitos, historico, erros explicitos.
- Confirmar: antes generico -> depois filtros, badges, resumo de impacto e bloqueio de override.
- Regras: antes lista basica -> depois CRUD com drawer e validacao de keywords.
- Dashboard: antes cards simples -> depois KPIs com definicoes, drill-down e busca.
- Settings/Audit: antes nao definido -> depois logout visivel, export por mes e audit log.

## Escalabilidade para v2 (sem mudar MVP agora)
- Multi-source uploads: adicionar seletor de fonte no Uploads e pipeline por origem.
- AI categorizacao: inserir etapa "Sugestoes" antes de Confirmar.
- OCR: novo tipo de upload com preview de extracao.
- Couple account: filtro de membros e split no dashboard.
- Recorrencias/calendario: aba de "Fixos" com previsao detalhada.
