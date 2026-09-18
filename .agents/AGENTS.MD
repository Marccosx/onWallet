# Contexto do projeto onWallet

## Objetivo
O onWallet é um projeto de estudo de backend e arquitetura.
A ideia é evoluir gradualmente o projeto para aprender:
- TypeScript/Node
- C#
- PHP
- RabbitMQ
- Redis
- Docker
- testes
- microsserviços
- CI/CD
- cloud
- observabilidade
- padrões de sistemas distribuídos

Evitar adicionar tecnologia sem uma necessidade real no domínio.

## Stack atual
Frontend:
- React
- TypeScript
- Zustand

Backend:
- Node.js
- Express
- TypeScript
- Prisma
- SQLite em desenvolvimento
- PostgreSQL como alvo de produção

## Funcionalidades já existentes
- autenticação
- usuários e roles
- contas
- categorias
- transações
- transferências
- compras parceladas
- orçamentos
- alertas de limite
- dashboard
- caixinhas/metas

## Autenticação atual
A autenticação usa sessão no servidor, não JWT.

Fluxo:
1. Login recebe e-mail e senha.
2. Senha é validada com Argon2.
3. Backend gera token aleatório.
4. O token real é enviado ao browser em cookie HttpOnly.
5. Apenas o hash do token é salvo na tabela Session.
6. Em requests seguintes o browser envia o cookie automaticamente.
7. requireAuth valida a sessão.
8. AsyncLocalStorage mantém o usuário atual no fluxo da request.
9. Services usam currentUserId() para isolar os dados por usuário.

Frontend:
- AuthContext guarda apenas o usuário autenticado.
- Axios usa withCredentials: true.
- Ao carregar a aplicação, GET /auth/me restaura a sessão.

## Backlog de autenticação
Revisar o payload de /auth/login e /auth/me.
Evitar enviar informações desnecessárias do usuário ao frontend.
Criar DTO específico com minimização de dados.

Também revisar futuramente:
- CSRF / Origin
- rate limiting
- limpeza de sessões expiradas
- estratégia de AsyncLocalStorage
- segurança de cookies

## Refatoração já realizada
Foi separado:

src/app.ts
- configuração do Express
- middlewares
- CORS
- checkOrigin
- Swagger
- health
- rotas

src/server.ts
- apenas app.listen()

Objetivo:
permitir testes com Supertest sem subir servidor numa porta.

## Testes
Instalado:
- Vitest
- Supertest
- @types/supertest

Scripts:
- npm test
- npm run teste:run

Primeiro teste implementado:

tests/health.test.ts

Resultado:
- 1 test passed
- GET /health retorna 200
- body retorna "OK"

## Testes de autenticação
- `backend/vitest.config.ts` define `DATABASE_URL` nos testes usando `DATABASE_URL_TESTE` do ambiente ou `file:./teste.db` como padrão.
- Banco SQLite `teste.db` criado e sincronizado com o schema via `prisma db push`, conforme resultado enviado pelo usuário.
- `/src/prisma/teste.db*` adicionado ao `backend/.gitignore`.
- `backend/tests/auth.test.ts` cria um usuário ativo com senha em hash e e-mail único no `beforeEach`; remove suas sessões e o usuário no `afterEach`.
- Cenário de senha incorreta implementado: verifica HTTP 401, ausência de `Set-Cookie` e zero sessões para o usuário. Código revisado e execução informada pelo usuário: 1 teste passou.
- Cenário de credenciais válidas verifica HTTP 200, presença do cookie `onwallet_session` com atributo HttpOnly e exatamente uma sessão para o usuário no banco.
- Primeiros testes de autenticação concluídos e código revisado. Execução da suíte completa informada pelo usuário: 3 testes passaram em 2 arquivos (health e autenticação).
- GET /auth/me sem cookie implementado em um describe separado, sem criação de usuário, verificando HTTP 401. Código revisado; usuário informou que os testes passaram após a inclusão.
- GET /auth/me com sessão válida usa um agente Supertest local ao teste para preservar o cookie e verifica HTTP 200 e o ID do usuário. Código revisado; execução da suíte completa informada pelo usuário: 5 testes passaram em 2 arquivos.
- Logout com agente autenticado verifica login 200, logout 204, GET /auth/me posterior 401 e zero sessões para o usuário. Código revisado; execução da suíte completa informada pelo usuário: 6 testes passaram em 2 arquivos.
- Sessão expirada: teste faz login com agente, altera expiresAt de exatamente uma sessão do usuário para uma data passada e verifica HTTP 401 em GET /auth/me. Código revisado; última execução da suíte completa informada pelo usuário: 7 testes passaram em 2 arquivos (6 de autenticação e 1 de health).

## Próxima tarefa
Iniciar o backlog de minimização do payload de /auth/login e /auth/me. Primeiro identificar os campos retornados por publicUser em backend/src/lib/auth.ts; depois verificar quais são consumidos pelo frontend antes de definir um DTO específico. Não remover campos antes de revisar seus usos, inclusive nas rotas administrativas que compartilham publicUser.

## Regra importante para testes
Os testes NÃO devem depender de usuários cadastrados manualmente no banco de desenvolvimento.

Cada teste deve criar seus próprios dados necessários e limpar o estado depois.

A intenção é deixar os testes reproduzíveis e preparados para CI/CD.

## Forma de trabalho desejada
Não implementar grandes blocos automaticamente sem explicação.

Preferência:
O objetivo principal do projeto é aprendizado.

Antes de implementar uma tarefa:
1. explique o conceito;
2. explique por que a mudança é necessária;
3. proponha uma pequena etapa;
4. permita que o usuário implemente quando possível;
5. revise a implementação;
6. não faça grandes alterações automaticamente sem solicitação explícita.

Ao finalizar uma etapa, atualize o estado e a próxima tarefa neste arquivo.

O objetivo principal é aprendizado.

## Regra de manutenção deste arquivo

Ao concluir uma tarefa relevante ou tomar uma decisão arquitetural importante, atualize este AGENTS.md automaticamente.

Atualize apenas informações duradouras, como:
- estado atual do projeto;
- tarefas concluídas;
- decisões de arquitetura;
- tecnologias adicionadas;
- backlog relevante;
- riscos ou pontos de atenção;
- próxima tarefa planejada.

Não registrar:
- tentativas temporárias;
- erros já resolvidos sem impacto futuro;
- logs de terminal;
- detalhes triviais de implementação;
- histórico passo a passo da conversa.

Antes de encerrar uma tarefa, verifique se este arquivo precisa ser atualizado.
