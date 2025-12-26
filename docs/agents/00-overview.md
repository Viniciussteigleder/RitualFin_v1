# RitualFin v1 — Overview de Implementação

## Objetivo do v1
Login (Google + Email) + Upload CSV M&M (1 arquivo) + pipeline (parse/enrich/dedupe) + rules (keywords) + Confirm Queue + Dashboard mensal (spent, receitas, orçamento, remaining, projeção simples).

## Regras de ouro (não negociar)
- Truth date do mês = Authorised on.
- Nada automático para dedupe ambíguo: só sinalizar e mandar para Confirmar.
- Matching v1 = contains em desc_norm (sem regex).
- Interno é categoria visível e sempre exclude_from_budget=true.
- Saque = categoria Outros, mas com toggle exclude_from_budget.
- UI PT-BR, moeda EUR.

## Outputs principais
- Tabelas Supabase (uploads, raw_mm_transactions, transactions, rules, budgets, audit_log).
- Função server-side para importar CSV M&M.
- Regras aplicadas determinísticas.
- Confirmar: batch + cria/atualiza regra.
- Painel: totais confiáveis e drill-down.

## Definition of Done
- RLS ok, lint/typecheck ok, parser testado, smoke e2e: login → upload → painel.
