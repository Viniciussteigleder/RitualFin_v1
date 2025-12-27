# Sub-agente: Confirm Queue

## Entregáveis
- Lista de transações needs_review=true com filtros e badges.
- Edição por linha (Tipo/FixoVar/CatI/CatII + exclude_from_budget).
- Batch confirm.
- Ao confirmar: criar/atualizar regra automaticamente (Tipo+FixoVar+CatI + sugestão CatII).

## UX/UI (MVP)
- Filtros horizontais: Conflito, Sem match, Duplicata suspeita.
- Busca e chips de categoria para leitura rapida.
- Tabela densa com edicao inline (popover).
- Resumo lateral com contagem e impacto total.
- Bloquear override de ajustes manuais (badge + desabilitar).

## Estados
- Vazio: "Nada para confirmar. Seu painel esta pronto."
- Erro salvar: "Nao foi possivel salvar. Tente novamente."
- Alerta: "Nada sera aplicado automaticamente. Revise e confirme."

## Microcopy PT-BR
- "Confirmar altera a categoria e pode criar regra."
- "Ajuste manual detectado. Esta linha nao sera sobrescrita."

## Aceite
- Manual override nunca é sobrescrito por reclassificação.
- Batch funciona e registra audit_log.
