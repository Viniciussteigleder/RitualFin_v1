# Sub-agente: Upload CSV M&M

## Entregáveis
- Tela Uploads: drag&drop + botão, 1 arquivo por vez.
- Histórico com status: processing/ready/error + contagem de linhas.
- Armazenar arquivo original no storage.

## Validação
- Rejeitar com erro claro se faltar coluna obrigatória.
- Mostrar header esperado.
- Parsing suporta dd.MM.yyyy e números com vírgula decimal.

## UX/UI (MVP)
- Header com status global e contagem de pendencias.
- Dropzone grande com instrucoes curtas e botao de arquivo.
- Bloco "Requisitos do CSV" visivel para reduzir erro.
- Historico em tabela densa (arquivo, data, linhas, status).
- Exibir base do mes: "Authorised on".

## Estados
- Vazio: "Nenhum arquivo enviado ainda."
- Valido: "Upload recebido. Processando..."
- Erro header: "Header invalido. Use o modelo Miles & More."
- Erro processamento: "Falha ao processar. Tente novamente."

## Microcopy PT-BR
- "Arraste um CSV Miles & More ou clique para selecionar."
- "Base do mes: 'Authorised on'."
- "Somente 1 arquivo por vez."

## Aceite
- CSV válido vira upload ready e inicia pipeline.
- CSV inválido mostra erro com instrução de correção.
