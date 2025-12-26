# Sub-agente: Confirm Queue

## Entregáveis
- Lista de transações needs_review=true com filtros e badges.
- Edição por linha (Tipo/FixoVar/CatI/CatII + exclude_from_budget).
- Batch confirm.
- Ao confirmar: criar/atualizar regra automaticamente (Tipo+FixoVar+CatI + sugestão CatII).

## Aceite
- Manual override nunca é sobrescrito por reclassificação.
- Batch funciona e registra audit_log.
