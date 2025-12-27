# Sub-agente: Dashboard Mensal

## Entregáveis
- Painel por mês:
  - Spent (despesas excluindo exclude_from_budget)
  - Receitas
  - Orçamento total e por categoria
  - Remaining
  - Projeção simples com breakdown
  - Drill-down por categoria + search

## Projeção v1
projection = spent_so_far + expected_fixed_remaining + variable_run_rate * days_remaining
Mostrar componentes claramente.

## UX/UI (MVP)
- Seletor de mes (base: Authorised on) com resumo do periodo.
- KPIs em cards densos com definicoes curtas.
- Breakdown por categoria com barras horizontais e porcentagem.
- Drill-down por categoria abre tabela filtrada.
- Busca persistente no topo da tabela.

## Estados
- Vazio: "Sem transacoes neste mes."
- Loading: "Carregando painel..."

## Microcopy PT-BR
- "Gastos excluem itens com exclude_from_budget."
- "Projecao: gasto atual + fixos restantes + taxa variavel."

## Aceite
- Totais corretos e rastreáveis.
- Drill-down rápido.
