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
Executar OW-001 (estabilizar descoberta e execução dos testes), conforme docs/backlog-microsservicos.md. Depois, validar visualmente parcelas e metas (OW-002) e apresentar o contrato InstallmentPaid.v1 como exercício guiado (OW-003). Minimização do payload de autenticação e salário confirmado manualmente permanecem no backlog.

## Compromissos futuros (estado atual e histórico)
- Exclusão de parcelas integrada: modal permite `Só esta parcela` (padrão) ou `Todo o parcelamento`. API aceita scope single/group, exclui apenas registros do usuário e reverte somente saldos aplicados, atomicamente. 53 testes em 4 arquivos passaram; TypeScript backend e build frontend passaram. Conferência visual pendente.
- Cadastro retroativo implementado: `historicalPayment` identifica parcelas presumidas pagas; opção `assumePastInstallmentsPaid` ativada por padrão e desmarcável no formulário. Meses anteriores ao atual (America/Bahia) são históricos sem débito nem paidAt; mês atual e futuros permanecem pendentes. Backend bloqueia pagamento histórico; frontend distingue o estado e exclui das pendências. 49 testes em 4 arquivos, TypeScript backend e build frontend passaram. Validação visual e migration PostgreSQL pendentes. Não reclassificar registros existentes. Detalhes em docs/parcelas-e-compromissos.md.
- Visualização das parcelas no dashboard: um mês por vez, alternando entre `Este mês` (padrão) e `Próximo mês`, relativos à data atual. Total restrito ao período escolhido; outros períodos permanecem na lista de transações. Build e lint do componente passaram; validação visual em navegador permanece pendente.
- A implementação atual está documentada em `docs/parcelas-e-compromissos.md`: parcelas pendentes não afetam saldo nem gastos realizados; pagamentos manuais afetam apenas a parcela confirmada. Dashboard, orçamento e aviso de limite usam `paidAt` para parcelas agrupadas e `create_at` para transações comuns/legadas. O dashboard mostra compromissos pendentes agrupados pelo mês previsto e a posição de cada parcela. Novos parcelamentos guardam `installmentNumber`/`installmentCount` e distribuem centavos sem aumentar o total; compras antigas usam o sufixo `(n/total)` como apoio visual e não são reescritas. Migrations equivalentes existem para SQLite e PostgreSQL; PostgreSQL não foi migrado em produção. SQLite local e banco de testes estão atualizados. Verificação: 86 testes em 8 arquivos e builds backend/frontend passaram; validação visual em navegador pendente.
- `backend/src/services/transactions.service.ts` cria uma transação por parcela, divide o valor igualmente, avança `create_at` em meses e anexa `(n/total)` à descrição.
- `Transaction` não tem identificador de compra parcelada nem estado de pagamento; parcelas só podem ser inferidas pela descrição, o que não é uma identificação confiável.
- Identificador escolhido: `installmentGroupId String?`, opcional e compartilhado entre parcelas da mesma compra. O usuário adicionou o campo ao schema e gerou a migration SQLite `20260923122504_add_installment_group`, que adiciona uma coluna TEXT opcional. Em `createTransaction`, o usuário gera um UUID uma vez por compra parcelada e o grava em cada parcela; transações à vista recebem null. Código revisado; ainda falta um teste de integração.
- O usuário decidiu que compras parceladas não devem descontar o total da caixinha no cadastro, para evitar saldo negativo e confusão nos gastos do mês. A mudança ainda não foi implementada.
- Confirmação de pagamento será manual. Parcelas novas devem começar pendentes e só alterar o saldo quando o usuário as marcar como pagas; nenhum desconto automático por vencimento. A ideia de salário padrão confirmado por botão será tratada como fluxo separado, também sem crédito automático.
- Atualmente `applyBalance` desconta o total uma vez na criação; `updateTransaction` e `deleteTransaction` revertem/aplicam o valor de uma parcela. Dashboard e orçamentos já agregam transações por `create_at`, independentemente do saldo. Alterar apenas a criação deixaria saldo e edição/exclusão inconsistentes.
- Dados antigos já tiveram o saldo alterado. Proposta de modelagem a revisar na mentoria: `balanceApplied Boolean @default(true)` para preservar esse histórico e `paidAt DateTime?` para registrar confirmação; novas parcelas seriam `balanceApplied=false` e `paidAt=null` até confirmação. Depois escrever testes com dados próprios e limpeza para criação, pagamento, edição, exclusão e evolução mensal.
- O usuário adicionou `balanceApplied Boolean @default(true)` e `paidAt DateTime?` ao model Transaction e gerou a migration SQLite `20260923124019_add_payment_state`. Migration revisada: recria a tabela preservando os campos antigos, aplica `true` aos registros antigos e deixa `paidAt` nulo. Confirmação histórica permanece desconhecida; a interface não deve rotular esses registros como pagos só por causa do booleano.
- Na criação, o usuário implementou `balanceApplied=false` e `paidAt=null` para parcelas novas e deixou o saldo inalterado; transações à vista continuam imediatas. O aviso inicial de orçamento só ocorre para despesa à vista e a soma exclui parcelas novas pendentes. Na edição, o saldo só é recalculado se o registro anterior já tiver `balanceApplied=true`; na exclusão, a transação é removida sempre e o saldo só é revertido nesse mesmo caso.
- O usuário preparou a limpeza de transações e categorias antes das caixinhas no `afterEach` de `backend/tests/accounts.test.ts` e adicionou teste de compra em três parcelas: mesmo grupo, meses sucessivos, `balanceApplied=false`, `paidAt=null` e saldo inalterado. O banco `teste.db` foi sincronizado com o schema usando `prisma db push --skip-generate`; a suíte então passou com 63 testes em 8 arquivos.
- O teste de POST /transactions/:id/pay verifica HTTP 200, `balanceApplied=true`, `paidAt` preenchido e saldo reduzido de R$ 1.200 para R$ 800; também tenta pagar a mesma parcela duas vezes, espera HTTP 400 e saldo ainda em R$ 800. O usuário implementou `payInstallment` na interface, serviço, controller e rota; código revisado: consulta isolada por usuário, débito condicionado a saldo suficiente e mudança de estado dentro de uma transação atômica. A documentação Swagger da rota e o esquema de cookie de sessão foram adicionados; a especificação gerada foi validada.
- O usuário autorizou o assistente a assumir toda implementação relacionada a testes. Foram adicionados testes de saldo insuficiente (sem desconto nem marcação de pagamento) e de edição/exclusão de parcelas pendentes (sem alteração do saldo). Resultado do teste focado: 9 testes passaram em `accounts.test.ts`. Próxima etapa de mentoria: expor confirmação manual no frontend e distinguir compromissos pendentes de despesas pagas no dashboard/orçamentos.
- O frontend já tipa `installmentGroupId`, `balanceApplied` e `paidAt` em `ITransaction` e oferece `TransactionService.payInstallment(id)`. A lista de transações mostra `Pendente` e `Pago` para parcelas novas em desktop e mobile; registros antigos com `balanceApplied=true` e `paidAt=null` não recebem rótulo de pagamento, pois a confirmação histórica é desconhecida. O usuário implementou `handlePayInstallment` com `await loadData()`, e o assistente conectou os botões "Marcar como paga" nas duas versões da lista, somente para parcelas pendentes. Build do frontend passou.
- Dashboard e orçamentos: o usuário adicionou `balanceApplied=true` aos agregados de despesas realizadas. Testes de parcelas pendentes passaram; suíte completa passou com 67 testes em 8 arquivos antes do próximo teste.
- Decisão de domínio: uma parcela paga em mês diferente do previsto entra nos gastos realizados do mês de `paidAt`; `create_at` continua sendo o mês previsto do compromisso. O usuário adaptou os agregados do dashboard, orçamento e `TransactionService.checkBudgetWarning` com `OR` por `installmentGroupId`, preservando transações comuns e legadas por `create_at`. A edição escolhe `paidAt` para parcela paga, `create_at` para comum/legada e não gera aviso para pendente. POST `/transactions/:id/pay` agora retorna aviso opcional após confirmar o débito; o frontend o mostra. A listagem `getAllTransactions` continua por `create_at`, pois mostra o mês previsto.
- Preferência atual do usuário: o assistente assume a implementação visual do frontend e todo trabalho relacionado a testes; o usuário quer participar da lógica funcional em etapas pequenas.

## Caixinhas e metas (setembro/2026)
- Tela de caixinhas organizada em seções `Sem meta` e `Com meta`, omitindo grupos vazios. Cartões usam altura natural e saldo sem margem automática para evitar espaços excessivos. Agrupamento independe de saldo disponível/investimento. Build frontend passou; conferência visual pendente.
- Classificação de caixinhas implementada: criação/edição validam `accountType` e edição parcial o preserva. Dashboard retorna `currentAmount`, `availableAmount` e `investmentAmount`. Frontend permite classificar caixinhas e mostra os três totais. 46 testes fonte em 4 arquivos passaram; TypeScript backend e build frontend passaram. Validação visual e migration equivalente PostgreSQL para o tipo ainda pendentes. Migration SQLite: `20261016122944_add_account_type`.
- Implementação completa autorizada pelo usuário para esta demanda, com documentação para estudo em `docs/caixinhas-e-metas.md`.
- Criação aceita saldo zero ou omitido. Metas são opcionais e separadas do saldo real.
- Duas modalidades: meta + contribuição mensal calcula prazo; meta + prazo calcula contribuição. Ambas consideram saldo atual e mês inicial.
- Cálculo centralizado no backend, em centavos, com prévia autenticada sem escrita em POST /accounts/goal-preview. Os cartões exibem progresso, restante e previsão.
- Planejamento não cria movimentações automaticamente. Meses inicial/final são inclusivos; meses passados são desconsiderados; quem já contribuiu no mês deve planejar a próxima contribuição a partir do mês seguinte.
- Cinco campos opcionais de meta no model Account. Migrations aditivas separadas para SQLite e PostgreSQL; SQLite local aplicado e Prisma Client regenerado. Produção não alterada.
- Caixinha de dívidas e visão de parcelas futuras continuam fora do escopo implementado.
- Validação desta entrega: 38 testes passaram em 6 arquivos; builds backend/frontend passaram. Validação visual em navegador pendente.

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

## PO e evolução para microsserviços (outubro/2026)
- Investimentos no backlog: acompanhar rendimento observado com histórico de aportes, resgates e saldos no Node; simular CDI e prazo das metas no futuro serviço Python. Projeções não alteram saldo real. Implementação posterior ao primeiro marco Node → RabbitMQ → Laravel; detalhes em docs/backlog-microsservicos.md.
- O usuário solicitou que o assistente assuma o papel de PO. Backlog priorizado, dependências e critérios de aceite estão em `docs/backlog-microsservicos.md`.
- Foco atual de aprendizado: Laravel/PHP, Java/Spring Boot, Python e mensageria. RabbitMQ primeiro; Kafka posteriormente para estudar retenção e replay.
- Primeiro marco planejado: pagamento confirmado gera notificação interna no Laravel, com outbox, consumidor idempotente e recuperação de falhas. Serviços novos ainda não implementados.
- Preservar Node durante a evolução; manter contas, saldo, transferências e pagamentos no mesmo limite transacional. Serviços possuem dados próprios e integram por APIs/eventos.
- O assistente prioriza e refina tarefas pequenas, explica conceitos e revisa; usuário participa da lógica funcional. Testes e frontend continuam com o assistente.
- OW-001 concluída: Vitest inclui apenas `tests/**/*.test.ts`; suíte executada com `DATABASE_URL_TESTE=file:./teste.db`, sincronizado com o schema. 46 testes passaram em 4 arquivos fonte, sem erros de workers. Contagens antigas de oito arquivos incluíam testes compilados e não são a referência atual.
- As seções históricas acima incluem etapas intermediárias já superadas. Para pagamentos, prevalecem o código atual e docs/parcelas-e-compromissos.md; a validação visual continua pendente.
