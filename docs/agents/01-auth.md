# Sub-agente: Auth (Google + Email)

## Entregáveis
- Supabase Auth configurado com Google OAuth e Email/Password.
- Rotas protegidas.
- Profile criado no primeiro login (locale pt-BR, currency EUR).
- UI de login simples, com hierarquia clara e sem onboarding.

## Requisitos
- Sem onboarding.
- Logout visível em Configurações.

## UX/UI (MVP)
- Layout centrado com logo, titulo curto e dois CTAs grandes.
- Alternar Email/Senha em painel inferior simples (sem multiplas telas).
- Mostrar politica de dados em uma linha curta (confianca).
- Redirecionar direto para Uploads apos login.

## Componentes
- Card de login com titulo + descricao.
- Botoes primarios (Google, Entrar).
- Link secundario: "Esqueci minha senha".
- Feedback inline para erro de credenciais.

## Estados
- Loading: "Entrando..."
- Erro: "Nao foi possivel entrar. Verifique seus dados."
- Sessao expirada: "Sua sessao expirou. Entre novamente."

## Microcopy PT-BR
- "Entrar para ver suas transacoes."
- "Continuar com Google"
- "Entrar com email e senha"
- "Seus dados ficam protegidos na sua conta."

## Aceite
- Login Google e Email funcionam.
- Sessão persiste.
- RLS impede acesso cross-user.
