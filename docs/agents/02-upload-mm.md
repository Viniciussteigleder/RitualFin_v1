# Sub-agente: Upload CSV M&M

## Entregáveis
- Tela Uploads: drag&drop + botão, 1 arquivo por vez.
- Histórico com status: processing/ready/error + contagem de linhas.
- Armazenar arquivo original no storage.

## Validação
- Rejeitar com erro claro se faltar coluna obrigatória.
- Mostrar header esperado.
- Parsing suporta dd.MM.yyyy e números com vírgula decimal.

## Aceite
- CSV válido vira upload ready e inicia pipeline.
- CSV inválido mostra erro com instrução de correção.
