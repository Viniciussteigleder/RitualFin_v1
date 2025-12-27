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

## UX/UI (MVP)
- Lista de regras com categoria, keywords e ultima atualizacao.
- Botao "Nova regra" e "Exportar Markdown".
- Edicao em drawer lateral com campos essenciais.
- Validar keywords duplicadas antes de salvar.

## Estados
- Vazio: "Sem regras ainda. Crie a primeira ao confirmar transacoes."
- Erro salvar: "Nao foi possivel salvar. Tente novamente."

## Microcopy PT-BR
- "Keywords sao comparadas em desc_norm (contains)."
- "Separar keywords por ponto e virgula."

## Aceite
- Determinístico.
- Conflitos vão para Confirmar.
