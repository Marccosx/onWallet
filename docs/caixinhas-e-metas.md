# Caixinhas com saldo zero e planejamento de metas

## O que mudou

Uma caixinha pode ser criada sem dinheiro: saldo vazio ou zero resulta em R$ 0,00.
Opcionalmente, ela pode ter uma meta de economia. Ao criar ou editar, marque
**Planejar uma meta** e escolha:

- **Informar contribuição e calcular prazo:** valor total desejado, contribuição mensal e mês da primeira contribuição.
- **Informar prazo e calcular contribuição:** valor total desejado, mês da primeira contribuição e mês limite.

O formulário mostra uma prévia. Depois de salvar, o cartão mostra saldo guardado,
meta, progresso, quanto falta, contribuição e previsão de conclusão. Também trata
meta alcançada e prazo encerrado. Para remover o planejamento, desmarque a opção
ao editar; isso não apaga o dinheiro nem as movimentações.

## Saldo, meta e contribuição são coisas diferentes

- **Saldo** é o dinheiro efetivamente registrado na caixinha.
- **Meta** é o total desejado, não uma dívida nem um saldo negativo.
- **Contribuição mensal** é uma hipótese de planejamento, não uma parcela cobrada automaticamente.

Planejar ou alterar uma meta não cria receitas, despesas, transferências ou depósitos
automáticos. Para adicionar dinheiro, registre uma entrada ou uma transferência
usando os recursos existentes. A edição direta do saldo já existia e foi mantida.
O total de dinheiro da tela continua somando somente os saldos.

Uma visão de dívidas/parcelas futuras não foi incluída nesta entrega: é um conceito
diferente e ainda precisa ter seu comportamento definido.

## Por que não era possível salvar zero

Em `frontend/src/pages/Accounts/index.tsx`, o input transformava saldo `0` em texto
vazio, mas tinha `required`. A validação do navegador impedia o envio.

O campo agora exibe zero, permite saldo inicial vazio e define limite mínimo zero.
No backend, saldo omitido ou nulo na criação assume zero; saldo negativo,
não numérico, infinito ou com mais de duas casas decimais é rejeitado.
Uma atualização que omite o saldo mantém o saldo existente.

## Cálculos e datas

As regras estão em `backend/src/lib/account-goal.ts`. Os valores são convertidos
para centavos durante os cálculos, evitando parcelas com frações de centavo.
Valores de entrada são limitados a R$ 10 bilhões e duas casas decimais.

```text
restante = máximo(0, meta − saldo atual)
progresso = saldo atual ÷ meta × 100, limitado entre 0% e 100%
```

### Meta + contribuição mensal → prazo

```text
meses = arredondar para cima(restante em centavos ÷ contribuição em centavos)
conclusão = mês inicial efetivo + meses − 1
última contribuição = restante − contribuição × (meses − 1)
```

Exemplo: meta de R$ 6.000, saldo de R$ 600 e contribuição de R$ 600.
Faltam R$ 5.400: nove contribuições. Começando em outubro/2026,
a previsão é junho/2027. Se faltarem R$ 1.000, serão duas contribuições:
R$ 600 e R$ 400.

### Meta + prazo → contribuição mensal

```text
meses disponíveis = diferença entre mês final e mês inicial efetivo + 1
contribuição em centavos = arredondar para cima(restante em centavos ÷ meses disponíveis)
```

Outubro/2026 a julho/2027 inclui dez contribuições. Para guardar R$ 6.000 a partir
de zero, são R$ 600 por mês. Para R$ 100 em três meses, são R$ 33,34, R$ 33,34
e R$ 33,32. A última contribuição é ajustada para não exceder a meta.
Para valores muito pequenos, o arredondamento pode permitir concluir antes do prazo.

### O que acontece quando o tempo passa

O mês inicial efetivo é o mais recente entre o mês escolhido e o mês atual do
servidor. Meses passados não são contados como oportunidades futuras de contribuição.
Não há projeção de juros, rendimentos ou inflação.

A previsão é recalculada quando a API consulta a caixinha, usando seu saldo atual.
Não fica congelada em um resultado salvo. Na modalidade por prazo, menos meses
disponíveis podem exigir uma contribuição maior; na modalidade mensal, a previsão
de conclusão pode mudar.

**Convenção:** ainda há uma contribuição planejada no mês inicial efetivo.
Se o depósito deste mês já entrou no saldo, escolha o próximo mês como início da
próxima contribuição para não contar uma oportunidade adicional neste mês.
Não tentamos inferir contribuições pelo histórico de transações nesta versão.

Se saldo ≥ meta, o resultado é **Meta alcançada**, sem contribuições restantes.
Se o prazo passou e ainda falta dinheiro, o resultado é **Prazo encerrado**;
o usuário pode editar a meta. Meses usam `AAAA-MM`, sem dia ou conversão de fuso.

## Persistência e responsabilidades

A tabela `account` ganhou cinco colunas opcionais:

| Campo | Papel |
|---|---|
| `goalAmount` | Valor total da meta |
| `goalMode` | `MONTHLY` ou `DEADLINE` |
| `goalStartMonth` | Mês inicial escolhido |
| `goalTargetMonth` | Mês limite, somente em `DEADLINE` |
| `goalMonthlyAmount` | Contribuição escolhida, somente em `MONTHLY` |

Contas antigas recebem `null` nesses campos e continuam sem meta.
Ao trocar de modalidade, o campo exclusivo da outra modalidade é limpo.
Enviar `goalAmount: null` remove todos os campos da meta. Omitir campos numa
atualização preserva a configuração existente.

- `backend/src/lib/account-goal.ts`: validação e função de cálculo independente de banco/HTTP.
- `backend/src/services/account.service.ts`: persistência dos campos permitidos, isolamento pelo usuário atual e inclusão de `goalPlan` nas respostas.
- `backend/src/routes/account.routes.ts`: `POST /accounts/goal-preview`, protegido pela autenticação das rotas de contas. Valida e calcula sem gravar dados.
- `frontend/src/pages/Accounts/GoalPlanner.tsx`: campos, resumo e prévia consultada após 350 ms; cancela requisições antigas para evitar resultados desatualizados.
- `frontend/src/pages/Accounts/index.tsx`: integração com criação, edição e cartões; modal com rolagem para telas pequenas.

`POST /accounts`, `PUT /accounts/:id`, `GET /accounts` e `GET /accounts/:id`
usam os novos campos. `goalPlan` é apenas saída calculada: não é persistido e
não é aceito como fonte de verdade. A prévia e o salvamento usam a mesma função.

Exemplo de corpo para criação ou prévia:

```json
{
  "name": "Viagem",
  "balance": 0,
  "goalAmount": 6000,
  "goalMode": "MONTHLY",
  "goalStartMonth": "2026-10",
  "goalMonthlyAmount": 600
}
```

Para calcular por prazo, use `goalMode: "DEADLINE"` e
`goalTargetMonth: "2027-07"` no lugar de `goalMonthlyAmount`.

## Banco e implantação

Foram adicionadas migrations equivalentes `20260921120000_account_goals` em
`backend/src/prisma/migrations` (SQLite) e `migrations-postgresql` (PostgreSQL).
São somente adições de colunas opcionais. A seleção de histórico por provider
já existe em `backend/prisma.config.ts`.

A migration SQLite foi aplicada no banco local de desenvolvimento, e o Prisma
Client foi regenerado. O banco de testes foi sincronizado antes da execução.
A alteração preexistente do schema para SQLite foi preservada.

Em outro ambiente, com o provider e `DATABASE_URL` corretos, execute dentro de `backend`:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
```

No PostgreSQL, configure `provider = "postgresql"` no schema antes de gerar o
cliente e aplicar migrations. Não execute o histórico SQLite no PostgreSQL.
Esta entrega não publica nem aplica migrations em produção.

## Verificação

- `backend/tests/account-goal.test.ts`: cálculos, centavos, última contribuição, datas inclusivas, virada do ano, meses passados, meta alcançada, prazo vencido e entradas inválidas.
- `backend/tests/accounts.test.ts`: saldo zero, persistência, edição parcial, troca/remoção de meta, prévia sem escrita, recálculo com saldo alterado e isolamento por usuário.
- Os testes de API criam e removem seus próprios usuários, sessões e caixinhas no banco de testes.
- Suíte completa executada: **38 testes passaram, em 6 arquivos**.
- Builds do backend e frontend passaram. O frontend emite o aviso de bundle acima de 500 kB.

Para repetir: `npm run teste:run` em `backend`; `npm run build` em cada projeto.
O banco de testes precisa estar sincronizado com o schema antes da suíte.
Não houve validação visual em navegador automatizado nesta sessão.
