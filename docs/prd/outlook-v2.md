# Outlook v2 (RitualFin)

## Premissas
- V2 construcao incremental sobre Supabase + Next.js.
- PT-BR continua default, com base para i18n no v2.5.

## V2.1 (Qualidade e completude v1)
**Foco:** fechar gaps do MVP sem nova arquitetura.
- Edicao de regras (update/delete) e busca real.
- Filtros por tipo de conflito na Confirm Queue (conflito/sem match/duplicado).
- Paginacao/virtualizacao para `/confirmar` e `/painel`.
- UI de requisitos do CSV e pre-validacao de header no client.
- Storage policies versionadas.

**Dependencias:** nenhuma nova. Usa PostgREST + edge functions atuais.

## V2.2 (Orcamento por categoria + metas)
**Foco:** aprofundar orcamento.
- Orçamento por categoria com barras e limites (design dashboard).
- Alerta de estouro e saldo por categoria.
- Exportacao com colunas adicionais (exclude_from_budget, rule_id_applied).

**Dependencias:** indices de performance em `transactions` (payment_date, category_1).

## V2.3 (Fluxo de duplicados e reconciliacao)
**Foco:** melhorar dedupe e resolucao.
- Tela dedicada de duplicados (comparacao side-by-side).
- Regras de dedupe por `key_mm` + heuristicas por valor/data.
- Politica "nao auto-merge" mantida, com resolucao assistida.

**Dependencias:** novas colunas/indices, possivel tabela `duplicates_queue`.

## V2.4 (Importacao multi-fonte)
**Foco:** novos formatos CSV.
- Conectores CSV adicionais (ex: Nubank, Wise) com mapeamento de colunas.
- Configuracao de fonte em `accounts`.
- Pipeline de normalizacao por fonte.

**Dependencias:** nova arquitetura de parsers por fonte; storage paths por fonte.

## V2.5 (Preparar i18n e multi-account)
**Foco:** base para i18n e contas domesticas.
- Estruturar i18n (pt-BR default, en-US opt-in).
- Estrutura multi-account no `accounts` com filtros por conta.
- Ajustes de UI para switching de conta.

**Dependencias:** migrações (accounts usage real), ajustes de RLS por account.

## Sequenciamento recomendado
1) V2.1 (completeza MVP)
2) V2.2 (orçamento detalhado)
3) V2.3 (duplicados)
4) V2.4 (multi-fonte)
5) V2.5 (i18n + multi-account)
