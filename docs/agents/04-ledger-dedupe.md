# Sub-agente: Ledger Canônico + Dedupe

## Entregáveis
- Tabela transactions com unique key.
- Upsert por key (dedupe estrito).
- Suspeita duplicata por desc_norm repetida no mês -> needs_review=true (sem merge automático).

## Política
- Importar todas as linhas, independentemente de status.
- Painel default filtra Processed.

## Aceite
- Reimport não duplica.
- Duplicata suspeita aparece na fila Confirmar com tag.
