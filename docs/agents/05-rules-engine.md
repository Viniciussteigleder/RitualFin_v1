# Sub-agente: Rules Engine (keywords)

## Entregáveis
- CRUD de regras: Tipo, Fixo/Var, Categoria I, Categoria II (opcional), Keywords (;)
- Apply rules: contains em desc_norm

## Comportamento
- 1 match: aplica classificação
- 2+ matches: needs_review=true (não aplica)
- 0 match: needs_review=true

## Especiais
- Interno: internal_transfer=true e exclude_from_budget=true
- Saque: categoria Outros + toggle exclude_from_budget editável

## Export
- Gerar regras.md a partir do banco

## Aceite
- Determinístico.
- Conflitos vão para Confirmar.
