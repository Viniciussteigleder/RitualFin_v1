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

## Aceite
- Totais corretos e rastreáveis.
- Drill-down rápido.
