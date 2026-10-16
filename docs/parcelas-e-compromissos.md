# Parcelas e compromissos futuros

## O que mudou

### Exclusão individual ou do parcelamento

Ao excluir uma parcela, o modal oferece `Só esta parcela` (padrão) ou
`Todo o parcelamento`, além de cancelar. O grupo inclui parcelas de outros
meses, pagas, pendentes e históricas. A confirmação informa a reversão dos
valores que afetaram o saldo; pendentes e históricas presumidas não alteram saldo.

`DELETE /transactions/:id?scope=single|group` valida o escopo e usa `single`
quando omitido. O grupo é identificado pelo registro selecionado e restrito
ao usuário autenticado. Exclusão e reversão dos saldos ocorrem na mesma
transação do banco. Transação avulsa não aceita exclusão em grupo.

Validação: 53 testes em 4 arquivos passaram; cobertura de reversão única,
grupos mistos, preservação de outros grupos, escopo inválido e isolamento por
usuário. TypeScript backend e build frontend passaram. Validação visual pendente.

### Exclusão individual ou do parcelamento

Ao excluir uma parcela, o modal oferece `Só esta parcela` (padrão) ou
`Todo o parcelamento`, além de cancelar. O grupo inclui parcelas de outros
meses, pagas, pendentes e históricas. A confirmação informa a reversão dos
valores que afetaram o saldo; pendentes e históricas presumidas não alteram saldo.

`DELETE /transactions/:id?scope=single|group` valida o escopo e usa `single`
quando omitido. O grupo é identificado pelo registro selecionado e restrito
ao usuário autenticado. Exclusão e reversão dos saldos ocorrem na mesma
transação do banco. Transação avulsa não aceita exclusão em grupo.

Validação: 53 testes em 4 arquivos passaram; cobertura de reversão única,
grupos mistos, preservação de outros grupos, escopo inválido e isolamento por
usuário. TypeScript backend e build frontend passaram. Validação visual pendente.

### Cadastro retroativo

O formulário oferece a opção ativada por padrão para considerar pagas as parcelas
anteriores ao mês atual, com aviso antes de salvar e possibilidade de desmarcar
se estiverem em atraso. A API aceita `assumePastInstallmentsPaid` booleano,
assume true quando omitido e rejeita valores de outro tipo.

`historicalPayment=true` identifica pagamento histórico presumido. Mantém
`balanceApplied=false` e `paidAt=null`: não desconta saldo, não inventa uma data
nem entra nas despesas realizadas. Não representa confirmação para um futuro
InstallmentPaid.v1. A confirmação de pagamento é bloqueada no backend.

O frontend mostra `Pago (histórico presumido)`, oculta o botão de pagar e exclui
esses registros das pendências. Editar ou excluir não altera o saldo.
O mês atual é calculado no fuso America/Bahia; os meses previstos seguem os
componentes UTC das datas de parcelas usados pelo serviço existente.
Parcelas do mês atual e futuras continuam pendentes.

Registros existentes não são reclassificados. O pagamento já confirmado pelo
usuário precisa de revisão separada, sem correção automática.

Validação: 49 testes em 4 arquivos passaram, incluindo histórico, opção desmarcada,
entrada inválida, bloqueio de pagamento, edição/exclusão sem débito e virada do
ano no fuso de Bahia. TypeScript backend e build frontend passaram. Conferência
visual pendente. Migration SQLite: 20261016143252_add_account_type (nome reaproveitado);
equivalente PostgreSQL ainda pendente.

Uma compra parcelada cria uma transação para cada parcela. Todas compartilham
`installmentGroupId`; cada uma começa com `balanceApplied=false` e `paidAt=null`.
O cadastro não reduz o saldo da caixinha. O usuário confirma cada pagamento
manualmente em `POST /transactions/:id/pay`. Essa operação reduz o saldo uma
única vez, exige saldo suficiente e grava a data efetiva em `paidAt`.

`create_at` representa o mês previsto da parcela. O nome do campo é antigo,
mas sua função neste fluxo é servir como data prevista. Uma parcela paga antes
ou depois do previsto continua na lista do mês previsto; o gasto realizado
entra no dashboard e no orçamento do mês de `paidAt`.

Transações comuns continuam sendo aplicadas ao saldo no cadastro e entram nos
relatórios pelo mês de `create_at`. Registros antigos receberam
`balanceApplied=true` por padrão para preservar os saldos existentes. Como
`paidAt` é nulo nesses registros, a interface não afirma que houve uma
confirmação histórica de pagamento.

## Onde aparece

- A lista de transações mostra `Pendente` ou `Pago` nas parcelas novas e oferece
  `Marcar como paga` apenas nas pendentes.
- O dashboard mostra um mês por vez nas parcelas pendentes, com as opções
  `Este mês` (inicial) e `Próximo mês`, relativas à data atual. O total em
  aberto considera apenas o mês escolhido. O card mostra a compra e sua
  posição, por exemplo, `1ª parcela de 6`, e abre as transações daquele mês.
  Meses sem parcelas exibem uma mensagem com o período. Demais meses
  continuam acessíveis pelo filtro da lista de transações.
- Despesas realizadas do dashboard e valor gasto dos orçamentos ignoram
  parcelas pendentes. Ao pagar, a despesa passa a contar no mês efetivo.
- Se o pagamento ultrapassar o limite da categoria, a API devolve um aviso e
  o frontend o mostra. O aviso é complementar: um erro no seu cálculo não faz
  a API informar que um pagamento já confirmado falhou.

Não há débito automático por vencimento nem crédito automático de salário. A
visão de parcelas pendentes usa `GET /transactions` já existente e agrupa os
registros no frontend; não cria registros ou saldos adicionais.

## Banco e implantação

Foram acrescentados `installmentGroupId`, `balanceApplied`, `paidAt`,
`installmentNumber` e `installmentCount` ao model `Transaction`. As migrations
equivalentes existem nos históricos SQLite e PostgreSQL. O padrão
`balanceApplied=true` preserva a interpretação dos dados anteriores; novos
parcelamentos gravam `false` explicitamente. As migrations
PostgreSQL foram preparadas, mas não foram aplicadas em produção nesta entrega.
`prisma migrate status` confirmou que o SQLite local está atualizado.

Novos parcelamentos distribuem o valor em centavos entre as parcelas; R$ 1.000,00
em seis meses resulta em quatro parcelas de R$ 166,67 e duas de R$ 166,66.
Parcelamentos antigos não são reescritos, para preservar edições e pagamentos
já feitos. Na interface, a posição antiga é lida do sufixo `(n/total)` da
descrição quando os novos campos ainda estão vazios, e o total em aberto é
arredondado após somar os valores originais.

## Verificação

Os testes de integração criam seus próprios usuários e verificam criação de
parcelas, saldo inalterado enquanto pendentes, pagamento único, saldo
insuficiente, edição e exclusão, relatórios por mês efetivo, orçamentos e
avisos de limite e a listagem pelo mês previsto. A suíte completa passou com
86 testes em 8 arquivos. Os builds de backend e frontend passaram. A nova
seção do dashboard não teve
validação visual automatizada em navegador.
