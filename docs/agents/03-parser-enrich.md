# Sub-agente: Parser + Enrichment M&M

## Parser
- Ler CSV do M&M com colunas:
  Authorised on, Processed on, Amount, Currency, Description, Payment type, Status,
  Amount in foreign currency, Currency (foreign), Exchange rate (quando existirem)

- Converter:
  - data dd.MM.yyyy -> ISO date
  - amount com vírgula -> número interno

## Enrichment
- Fonte = "M&M"
- Key_MM_Desc = "Description -- Payment type -- Status -- M&M - Description [-- compra internacional em {CurrencyForeign}]"
- Key_MM = "{Key_MM_Desc} -- {Amount} -- {AuthorisedOn_ISO}"
- Guardar desc_raw e desc_norm:
  - desc_norm: lowercase, remove acentos, normaliza whitespace

## Aceite
- Campos gerados iguais em 100% das linhas.
- "compra internacional" aparece quando foreign amount existir.
