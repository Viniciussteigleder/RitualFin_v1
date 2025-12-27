# Sub-agente: Settings + Audit

## Entregáveis
- Configurações: perfil, logout, export CSV ledger (mês).
- Audit log para:
  - mudanças manuais
  - batch confirm
  - criação/atualização de regra

## UX/UI (MVP)
- Perfil simples com nome e email.
- Logout visivel no topo da pagina.
- Exportar ledger com seletor de mes e botao claro.
- Audit log em tabela densa (acao, usuario, data, origem).

## Estados
- Vazio audit: "Sem mudancas registradas ainda."
- Erro export: "Nao foi possivel exportar. Tente novamente."

## Microcopy PT-BR
- "Logout"
- "Exportar CSV do mes"
- "Historico de alteracoes manuais e regras"

## Aceite
- Toda mudança relevante gera um evento de audit.
