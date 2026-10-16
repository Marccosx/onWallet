# Backlog de evolução do onWallet

Atualizado em 15/10/2026. Planejamento; serviços novos ainda não implementados.

## Objetivo e forma de trabalho

Aprender sistemas distribuídos evoluindo um produto funcional. Primeiro marco:
ao confirmar uma parcela, registrar uma notificação no serviço Laravel, mesmo
que o consumidor ou o RabbitMQ fiquem temporariamente indisponíveis.

O assistente atua como PO e mentor: prioriza, explica o conceito, apresenta
uma tarefa pequena, revisa a implementação e registra as evidências de aceite.
O usuário participa da lógica funcional. Testes e frontend ficam com o assistente,
conforme preferência já registrada. Infraestrutura é construída em etapas guiadas.
Uma tarefa só termina quando seus critérios forem demonstrados; escrever código
ou atualizar um status não substitui validação.

## Direção arquitetural

- Preservar o backend Node durante a extração gradual.
- Manter contas, saldo, transferências e pagamentos no mesmo limite transacional.
- Começar por RabbitMQ e notificações em Laravel; adicionar relatórios em Python;
  migrar o núcleo financeiro para Java/Spring Boot posteriormente.
- Cada serviço possui dados, credenciais e migrations próprios. Uma instância
  PostgreSQL local pode hospedar bancos separados; serviços não acessam tabelas alheias.
- Preservar a sessão atual. Antes de expor APIs de serviços, definir autenticação
  interna e autorização por usuário; não confiar em identidade enviada pelo browser.
- Usar eventos JSON versionados, outbox transacional e consumidores idempotentes.
- Kafka entra depois como exercício de retenção e replay de relatórios.

## Etapa 0 — Base confiável

### OW-001 — Estabilizar a execução dos testes

Prioridade: P0. Estado: concluída. Responsável: assistente. Dependências: nenhuma.

Evidência: `include: ["tests/**/*.test.ts"]` no Vitest exclui cópias compiladas.
Após sincronizar `teste.db`, `npm run teste:run` com
`DATABASE_URL_TESTE=file:./teste.db` passou com 46 testes em 4 arquivos fonte,
código zero e sem erros não tratados. Os testes criam e removem seus dados.
Neste Windows, a execução exigiu permissão para iniciar subprocessos.

Como mantenedor, quero executar somente os testes fonte para ter uma referência
confiável antes de mudar a arquitetura.

Escopo: revisar descoberta do Vitest, excluir testes compilados, investigar os
workers que falham e confirmar isolamento do banco de testes.

Critérios de aceite:
- A execução descobre somente os quatro arquivos fonte atualmente em `backend/tests`.
- Nenhum arquivo em `dist/tests` é executado.
- A suíte completa termina com código zero e sem erros não tratados.
- Dados são criados e limpos pelos testes, sem depender de cadastros manuais.
- Documentar comando, quantidade real de testes e eventuais requisitos do ambiente.
- Se houver impedimento externo, registrar a evidência e manter a tarefa aberta.

Contexto: a revisão encontrou testes fonte e compilados na mesma execução. Houve
36 testes passando e seis erros de workers; isso não valida a suíte. As contagens
históricas de oito arquivos não devem ser usadas como referência atual.

### OW-002 — Validar parcelas e metas na interface

Prioridade: P0. Estado: backlog. Responsável: assistente, com aceite do usuário.
Dependência: OW-001.

Como usuário, quero distinguir dinheiro disponível de compromissos futuros.

Critérios de aceite:
- Criar três parcelas não reduz saldo; confirmar uma reduz somente seu valor.
- Atualizar a página preserva o estado e impede novo pagamento da mesma parcela.
- Dashboard e orçamento usam o mês efetivo do pagamento.
- Parcelas antigas sem confirmação conhecida não recebem rótulo de pagamento.
- Caixinha zerada e planejamento de meta funcionam em desktop e mobile.
- Registrar evidências e defeitos encontrados, usando dados dedicados de validação.

### OW-003 — Definir o contrato do primeiro evento

Prioridade: P1. Estado: backlog. Responsável: usuário com mentoria.
Dependência: OW-001; pode avançar enquanto OW-002 é validada.

Como consumidor de notificações, quero entender um pagamento sem consultar o banco financeiro.

Primeiro exercício: descrever um exemplo de `InstallmentPaid.v1` em JSON.

Critérios de aceite:
- Definir `eventId`, tipo/versão, `occurredAt`, `correlationId`, `userId`,
  `transactionId`, `installmentGroupId`, valor em centavos, moeda e `paidAt`.
- Explicar quais campos identificam o evento, o usuário e a parcela.
- Datas com convenção UTC explícita; valor inteiro positivo e moeda explícita.
- Não incluir senha, cookie, token ou e-mail sem necessidade.
- Documentar que o evento representa pagamento confirmado, não pedido de pagamento.
- Documentar duplicação possível, responsabilidade do produtor e compatibilidade.
- Revisar o exemplo antes de escrever produtor ou consumidor.

## Etapa 1 — Primeira integração distribuída

| ID | Tarefa | Dependências | Evidência mínima de aceite |
|---|---|---|---|
| OW-004 | Preparar PostgreSQL local com Docker Compose | OW-001 | Banco novo e isolado, migrations corretas, testes nele e instruções reproduzíveis; dados atuais preservados. |
| OW-005 | Subir RabbitMQ local | OW-004 | Healthcheck, credenciais externas ao código, volume e exercício de publicar/consumir uma mensagem. |
| OW-006 | Gravar pagamento e outbox atomicamente | OW-003, OW-004 | Sucesso grava ambos; falha reverte ambos; repetição não cria segundo pagamento/evento. |
| OW-007 | Publicar a outbox no RabbitMQ | OW-005, OW-006 | Confirmação do broker e tratamento de mensagem sem rota; falha mantém evento recuperável; reinício retoma publicação. |
| OW-008 | Criar consumidor Laravel e persistir notificação | OW-003, OW-005 | Banco próprio; evento JSON validado; evento processado e notificação gravados atomicamente; duplicação não cria nova notificação; ACK após commit. |
| OW-009 | Tratar tentativas e mensagens problemáticas | OW-007, OW-008 | Retentativas limitadas com espera, fila de falhas, inspeção e procedimento de reprocessamento sem ciclo infinito. |
| OW-010 | Exibir notificações com autorização | OW-008 | API autenticada por usuário, integração pela entrada atual, lista no frontend e teste de isolamento entre usuários. |
| OW-011 | Demonstrar recuperação de falhas ponta a ponta | OW-009, OW-010 | Pagamento com broker indisponível reaparece depois; consumidor parado retoma; duplicação não duplica notificação; saldo continua correto. |

OW-004 a OW-011 serão refinadas uma por vez antes da implementação. O usuário
participa da lógica; o assistente cobre testes e interface. Laravel precisará de
cliente AMQP ou integração compatível: um evento JSON externo não é automaticamente
um job serializado do Laravel. Cada serviço consumidor terá sua própria fila.

O primeiro marco estará concluído com OW-011. A notificação inicial será interna;
envio de e-mail não é necessário para demonstrar o fluxo.

## Próximos marcos — ainda não prontos para implementação

1. Python: resumo mensal com projeção própria, contratos para criação, edição e
   exclusão, carga inicial e reconciliação; demonstrar consistência eventual.
2. Java/Spring Boot: migrar o núcleo financeiro com testes de contrato, conferência
   de saldos, plano de retorno e um único responsável por escrita a cada etapa.
3. Kafka: reconstruir uma projeção com eventos retidos; estudar partições,
   ordenação por chave, offsets, grupos e comportamento durante replay.
4. Operação: CI desde a base estabilizada; evoluir logs de correlação, métricas
   de backlog/erros, tracing e implantação independente conforme os serviços entram.

## Backlog transversal preservado

### Investimentos: acompanhamento e simulação (planejado)

Implementar após o primeiro marco de notificações Node → RabbitMQ → Laravel.
O usuário quer acompanhar rendimento observado e estimar o prazo das metas.

- Node: registrar aportes, resgates e atualizações de saldo da instituição com
  data, distinguindo movimentações de rendimento. Definir tratamento de ajustes,
  taxas e impostos antes de calcular rendimento observado; apenas comparar
  saldos não basta. O núcleo financeiro continua responsável pelos saldos reais.
- Python: simular evolução e prazo da meta usando saldo atual, aporte mensal,
  meta, percentual contratado do CDI e taxa assumida para o cenário. Exibir
  premissas, referência temporal e indicação de valor bruto ou líquido;
  comparar prazo sem rendimento e prazo estimado com rendimento.
- Projeções não alteram automaticamente saldo disponível ou patrimônio.
  Contratos de integração e critérios detalhados serão refinados nessa etapa.

### Demais itens

### Investimentos: acompanhamento e simulação (planejado)

Implementar após o primeiro marco de notificações Node → RabbitMQ → Laravel.
O usuário quer acompanhar rendimento observado e estimar o prazo das metas.

- Node: registrar aportes, resgates e atualizações de saldo da instituição com
  data, distinguindo movimentações de rendimento. Definir tratamento de ajustes,
  taxas e impostos antes de calcular rendimento observado; apenas comparar
  saldos não basta. O núcleo financeiro continua responsável pelos saldos reais.
- Python: simular evolução e prazo da meta usando saldo atual, aporte mensal,
  meta, percentual contratado do CDI e taxa assumida para o cenário. Exibir
  premissas, referência temporal e indicação de valor bruto ou líquido;
  comparar prazo sem rendimento e prazo estimado com rendimento.
- Projeções não alteram automaticamente saldo disponível ou patrimônio.
  Contratos de integração e critérios detalhados serão refinados nessa etapa.

### Demais itens

- Dinheiro: migrar Float para representação exata com conferência de dados.
- Datas: separar criação, vencimento e pagamento; definir fim de mês e fuso.
- Saldo: substituir edição direta por movimentação de ajuste rastreável.
- Autenticação: revisar minimização do DTO existente, rate limiting, sessões e CSRF.
- Salário confirmado manualmente: demanda separada, sem crédito automático.
- Revisar alterações locais e organizar commits; publicação e migrations de
  produção não fazem parte deste marco local.

## Próxima ação

OW-001 concluída. Seguir com validação visual OW-002, incluindo classificação
de caixinhas e saldos separados; depois apresentar OW-003 como exercício guiado.
