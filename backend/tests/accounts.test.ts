import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import PasswordService from "../src/services/Password.service.js";

describe("Caixinhas e metas pela API", () => {
  let userId: string;
  let agent: ReturnType<typeof request.agent>;
  const goal = { goalAmount: 6000, goalMode: "MONTHLY", goalStartMonth: "2030-10", goalMonthlyAmount: 600 };
  async function createInstallments(balance: number, startDate = "2027-01-15T00:00:00.000Z") {
    const accountResponse = await agent.post("/accounts").send({ name: "Compras", balance }).expect(201);
    const accountId = accountResponse.body.id as string;
    const category = await prisma.category.create({ data: { name: "Compras", type: "EXPENSE", userId } });
    await agent.post("/transactions").send({
      description: "Passagens", amount: 1200, type: "EXPENSE", accountId,
      categoryId: category.id, create_at: startDate, installments: 3,
    }).expect(201);
    const installments = await prisma.transaction.findMany({ where: { accountId }, orderBy: { create_at: "asc" } });
    expect(installments).toHaveLength(3);
    return { accountId, installments };
  }
  beforeEach(async () => {
    const email = `${randomUUID()}@example.com`;
    const user = await prisma.user.create({ data: { name: "Teste caixinha", email,
      passwordHash: await new PasswordService().generateHash("SenhaTeste123!") } });
    userId = user.id;
    agent = request.agent(app);
    await agent.post("/auth/login").send({ email, password: "SenhaTeste123!" }).expect(200);
  });
  afterEach(async () => {
    vi.useRealTimers();
    if (!userId) return;
    await prisma.transaction.deleteMany({where: {account: {userId}}});
    await prisma.category.deleteMany({where: {userId}});
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });
  it('exclui somente a parcela paga por padrão e devolve seu valor uma única vez', async () => {
    const { accountId, installments } = await createInstallments(1200, `${new Date().getFullYear() + 1}-01-15T12:00:00Z`);
    const first = installments[0]!;
    await agent.post(`/transactions/${first.id}/pay`).expect(200);
    await agent.delete(`/transactions/${first.id}`).expect(204);
    expect(await prisma.transaction.count({ where: { accountId } })).toBe(2);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
    await agent.delete(`/transactions/${first.id}`).expect(400);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
  });
  it('exclui todo o grupo com parcelas pagas, pendentes e históricas sem afetar outro grupo', async () => {
    const start = `${new Date().getFullYear() + 1}-01-15T12:00:00Z`;
    const { accountId, installments } = await createInstallments(1200, start);
    const unrelated = await createInstallments(500, start);
    await agent.post(`/transactions/${installments[0]!.id}/pay`).expect(200);
    await prisma.transaction.update({ where: { id: installments[2]!.id }, data: { historicalPayment: true } });
    await agent.delete(`/transactions/${installments[1]!.id}?scope=group`).expect(204);
    expect(await prisma.transaction.count({ where: { accountId } })).toBe(0);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
    expect(await prisma.transaction.count({ where: { accountId: unrelated.accountId } })).toBe(3);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: unrelated.accountId } })).balance).toBe(500);
  });
  it('rejeita escopo inválido e exclusão de grupo em transação avulsa sem alterar dados', async () => {
    const { accountId, installments } = await createInstallments(1200);
    const first = installments[0]!;
    for (const query of ['scope=invalid', 'scope=single&scope=group']) {
      await agent.delete(`/transactions/${first.id}?${query}`).expect(400);
    }
    const standalone = await agent.post('/transactions').send({ description: 'Avulsa', amount: 50,
      type: 'EXPENSE', accountId, categoryId: first.categoryId }).expect(201);
    await agent.delete(`/transactions/${standalone.body.id}?scope=group`).expect(400);
    expect(await prisma.transaction.count({ where: { accountId } })).toBe(4);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1150);
  });
  it('isola exclusão em grupo mesmo se outro usuário tiver o mesmo identificador de grupo', async () => {
    const { accountId, installments } = await createInstallments(1200);
    const first = installments[0]!;
    const other = await prisma.user.create({ data: { name: 'Outro', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
    try {
      const account = await prisma.account.create({ data: { name: 'Privada', balance: 100, userId: other.id } });
      const category = await prisma.category.create({ data: { name: 'Privada', type: 'EXPENSE', userId: other.id } });
      const foreign = await prisma.transaction.create({ data: { description: 'Privada', amount: 20, type: 'EXPENSE',
        accountId: account.id, categoryId: category.id, installmentGroupId: first.installmentGroupId, balanceApplied: true } });
      await agent.delete(`/transactions/${foreign.id}?scope=group`).expect(400);
      expect(await prisma.transaction.count({ where: { accountId } })).toBe(3);
      await agent.delete(`/transactions/${first.id}?scope=group`).expect(204);
      expect(await prisma.transaction.findUnique({ where: { id: foreign.id } })).not.toBeNull();
      expect((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).balance).toBe(100);
    } finally {
      await prisma.transaction.deleteMany({ where: { account: { userId: other.id } } });
      await prisma.category.deleteMany({ where: { userId: other.id } });
      await prisma.account.deleteMany({ where: { userId: other.id } });
      await prisma.user.delete({ where: { id: other.id } });
    }
  });
  it("registra histórico retroativo sem débito, pagamento ou despesas realizadas", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T15:00:00Z'));
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await agent.post('/auth/login').send({ email: user.email, password: 'SenhaTeste123!' }).expect(200);
    const { accountId, installments } = await createInstallments(1200, '2026-09-15T12:00:00Z');
    expect(installments.map(item => item.historicalPayment)).toEqual([true, false, false]);
    expect(installments.every(item => item.paidAt === null && item.balanceApplied === false)).toBe(true);
    await agent.post(`/transactions/${installments[0]!.id}/pay`).expect(400);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
    for (const month of ['2026-09', '2026-10']) {
      expect((await agent.get(`/dashboards?month=${month}`).expect(200)).body.monthExpense).toBe(0);
    }
    await agent.put(`/transactions/${installments[0]!.id}`).send({ description: 'Histórico corrigido', amount: 450 }).expect(200);
    expect((await prisma.transaction.findUniqueOrThrow({ where: { id: installments[0]!.id } })).historicalPayment).toBe(true);
    await agent.delete(`/transactions/${installments[0]!.id}`).expect(204);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
    await agent.post(`/transactions/${installments[1]!.id}/pay`).expect(200);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(800);
  });
  it("permite manter parcelas antigas pendentes e rejeita opção que não seja booleana", async () => {
    const account = await agent.post('/accounts').send({ name: 'Retroativo', balance: 1200 }).expect(201);
    const category = await prisma.category.create({ data: { name: 'Compras', type: 'EXPENSE', userId } });
    const input = { description: 'Compra antiga', amount: 1200, type: 'EXPENSE', accountId: account.body.id,
      categoryId: category.id, create_at: '2000-01-15T12:00:00Z', installments: 3 };
    for (const value of ['false', 0, null]) {
      await agent.post('/transactions').send({ ...input, assumePastInstallmentsPaid: value }).expect(400);
    }
    expect(await prisma.transaction.count({ where: { accountId: account.body.id } })).toBe(0);
    await agent.post('/transactions').send({ ...input, assumePastInstallmentsPaid: false }).expect(201);
    const saved = await prisma.transaction.findMany({ where: { accountId: account.body.id } });
    expect(saved).toHaveLength(3);
    expect(saved.every(item => !item.historicalPayment && !item.balanceApplied && !item.paidAt)).toBe(true);
    await agent.post(`/transactions/${saved[0]!.id}/pay`).expect(200);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: account.body.id } })).balance).toBe(800);
  });
  it("usa o mês de Bahia na virada do ano, sem presumir paga parcela do mês atual", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-01-01T01:00:00Z'));
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await agent.post('/auth/login').send({ email: user.email, password: 'SenhaTeste123!' }).expect(200);
    const { installments } = await createInstallments(1200, '2026-11-15T12:00:00Z');
    expect(installments.map(item => item.historicalPayment)).toEqual([true, false, false]);
  });
  it("classifica contas e preserva o tipo em edição parcial sem movimentar saldo", async () => {
    const cash = await agent.post('/accounts').send({ name: 'Conta', balance: 380 }).expect(201);
    expect(cash.body.accountType).toBe('AVAILABLE_CASH');
    const investment = await agent.post('/accounts').send({ name: 'Reserva', balance: 940, accountType: 'INVESTMENT', ...goal }).expect(201);
    expect(investment.body.accountType).toBe('INVESTMENT');
    await agent.put(`/accounts/${investment.body.id}`).send({ name: 'Reserva editada' }).expect(200);
    const saved = await agent.get(`/accounts/${investment.body.id}`).expect(200);
    expect(saved.body).toMatchObject({ accountType: 'INVESTMENT', balance: 940, goalAmount: 6000 });
    await agent.put(`/accounts/${cash.body.id}`).send({ accountType: 'INVESTMENT' }).expect(200);
    expect((await agent.get(`/accounts/${cash.body.id}`)).body).toMatchObject({ accountType: 'INVESTMENT', balance: 380 });
    expect(await prisma.transaction.count({ where: { account: { userId } } })).toBe(0);
  });
  it("rejeita tipos inválidos na criação e edição", async () => {
    const saved = await agent.post('/accounts').send({ name: 'Reserva', accountType: 'INVESTMENT' }).expect(201);
    for (const accountType of ['OTHER', '', null, 12]) {
      await agent.post('/accounts').send({ name: 'Inválida', accountType }).expect(400);
      await agent.put(`/accounts/${saved.body.id}`).send({ accountType }).expect(400);
    }
    expect(await prisma.account.count({ where: { userId } })).toBe(1);
    expect((await agent.get(`/accounts/${saved.body.id}`)).body.accountType).toBe('INVESTMENT');
  });
  it("separa os saldos no dashboard e ignora contas de outro usuário", async () => {
    const empty = await agent.get('/dashboards?month=2026-10').expect(200);
    expect(empty.body).toMatchObject({ currentAmount: 0, availableAmount: 0, investmentAmount: 0 });
    const other = await prisma.user.create({ data: { name: 'Outro', email: `${randomUUID()}@example.com`, passwordHash: 'unused' } });
    try {
      await prisma.account.createMany({ data: [
        { name: 'Conta', balance: 380, userId },
        { name: 'Investimento 1', balance: 400, accountType: 'INVESTMENT', userId },
        { name: 'Investimento 2', balance: 540, accountType: 'INVESTMENT', userId },
        { name: 'Privada', balance: 1000, userId: other.id },
        { name: 'Investimento privado', balance: 2000, accountType: 'INVESTMENT', userId: other.id },
      ] });
      const summary = await agent.get('/dashboards?month=2026-10').expect(200);
      expect(summary.body).toMatchObject({ currentAmount: 1320, availableAmount: 380, investmentAmount: 940, monthRecipe: 0, monthExpense: 0 });
    } finally {
      await prisma.account.deleteMany({ where: { userId: other.id } });
      await prisma.user.delete({ where: { id: other.id } });
    }
  });
  it("cria caixinha zerada com saldo omitido ou zero explícito", async () => {
    for (const data of [{ name: "Sem saldo" }, { name: "Zero", balance: 0 }]) {
      const response = await agent.post("/accounts").send(data).expect(201);
      expect(response.body.balance).toBe(0);
      expect(response.body.goalPlan).toBeNull();
    }
  });
  it("persiste meta, preserva em edição parcial e recalcula após mudança de saldo", async () => {
    const created = await agent.post("/accounts").send({ name: "Viagem", ...goal }).expect(201);
    expect(created.body.balance).toBe(0);
    expect(created.body.goalPlan.months).toBe(10);
    const id = created.body.id;
    await agent.put(`/accounts/${id}`).send({ tag: "Férias" }).expect(200);
    const saved = await agent.get(`/accounts/${id}`).expect(200);
    expect(saved.body.goalMonthlyAmount).toBe(600);
    // Simulate the real persisted balance changing through a movement.
    await prisma.account.update({ where: { id }, data: { balance: { increment: 600 } } });
    const list = await agent.get("/accounts").expect(200);
    expect(list.body[0].goalPlan).toMatchObject({ remaining: 5400, months: 9 });
    const removed = await agent.put(`/accounts/${id}`).send({ goalAmount: null }).expect(200);
    expect(removed.body.goalPlan).toBeNull();
    expect(removed.body.goalMonthlyAmount).toBeNull();
    expect(removed.body.balance).toBe(600);
  });
  it("calcula por prazo e permite mudar a modalidade sem movimentar dinheiro", async () => {
    const created = await agent.post("/accounts").send({ name: "Viagem", ...goal, balance: 600 }).expect(201);
    const updated = await agent.put(`/accounts/${created.body.id}`).send({ goalMode: "DEADLINE", goalTargetMonth: "2031-06" }).expect(200);
    expect(updated.body.goalPlan).toMatchObject({ months: 9, monthlyAmount: 600 });
    expect(updated.body.goalMonthlyAmount).toBeNull();
    expect(updated.body.balance).toBe(600);
  });
  it("prévia não cria caixinha e coincide com o resultado salvo", async () => {
    const input = { name: "Meta", ...goal, balance: 600 };
    const preview = await agent.post("/accounts/goal-preview").send(input).expect(200);
    expect(await prisma.account.count({ where: { userId } })).toBe(0);
    const saved = await agent.post("/accounts").send(input).expect(201);
    expect(saved.body.goalPlan).toEqual(preview.body);
  });
  it("rejeita saldo e meta inválidos sem persistir dados", async () => {
    for (const input of [{ balance: -1 }, { balance: "zero" }, { ...goal, goalMonthlyAmount: 0 }, { ...goal, goalStartMonth: "inválido" }]) {
      await agent.post("/accounts").send({ name: "Inválida", ...input }).expect(400);
    }
    expect(await prisma.account.count({ where: { userId } })).toBe(0);
  });
  it("isola leitura e edição da meta de outro usuário", async () => {
    const other = await prisma.user.create({ data: { name: "Outro", email: `${randomUUID()}@example.com`, passwordHash: "unused" } });
    try {
      const foreign = await prisma.account.create({ data: { name: "Privada", userId: other.id, ...goal } });
      expect((await agent.get("/accounts").expect(200)).body).toEqual([]);
      await agent.get(`/accounts/${foreign.id}`).expect(404);
      await agent.put(`/accounts/${foreign.id}`).send({ goalAmount: null }).expect(400);
      expect((await prisma.account.findUniqueOrThrow({ where: { id: foreign.id } })).goalAmount).toBe(6000);
    } finally {
      await prisma.account.deleteMany({ where: { userId: other.id } });
      await prisma.user.delete({ where: { id: other.id } });
    }
  });
  it("cria parcelas pendentes sem descontar o saldo da caixinha", async () => {
  const accountResponse = await agent
    .post("/accounts")
    .send({ name: "Compras", balance: 1200 })
    .expect(201);

  const accountId = accountResponse.body.id;

  const category = await prisma.category.create({
    data: {
      name: "Compras",
      type: "EXPENSE",
      userId,
    },
  });

  const response = await agent
    .post("/transactions")
    .send({
      description: "Passagens",
      amount: 1200,
      type: "EXPENSE",
      accountId,
      categoryId: category.id,
      create_at: "2027-01-15T00:00:00.000Z",
      installments: 3,
    })
    .expect(201);

  expect(response.body.installmentGroupId).toEqual(expect.any(String));

  const parcelas = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: { create_at: "asc" },
  });

  expect(parcelas).toHaveLength(3);
  expect(parcelas.map((parcela) => parcela.create_at.toISOString().slice(0, 7)))
    .toEqual(["2027-01", "2027-02", "2027-03"]);

  for (const parcela of parcelas) {
    expect(parcela.installmentGroupId).toBe(response.body.installmentGroupId);
    expect(parcela.amount).toBe(400);
    expect(parcela.balanceApplied).toBe(false);
    expect(parcela.paidAt).toBeNull();
  }

  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
  });

  expect(account.balance).toBe(1200);

  const primeiraParcelaId = parcelas[0]!.id;

  await agent
    .post(`/transactions/${primeiraParcelaId}/pay`)
    .expect(200);

  const parcelaPaga = await prisma.transaction.findUniqueOrThrow({
  where: { id: primeiraParcelaId },
});

expect(parcelaPaga.balanceApplied).toBe(true);
expect(parcelaPaga.paidAt).not.toBeNull();

const saldoAposPagamento = await prisma.account.findUniqueOrThrow({
  where: { id: accountId },
});

expect(saldoAposPagamento.balance).toBe(800);

await agent
  .post(`/transactions/${primeiraParcelaId}/pay`)
  .expect(400);

const saldoAposSegundaTentativa = await prisma.account.findUniqueOrThrow({
  where: { id: accountId },
});

expect(saldoAposSegundaTentativa.balance).toBe(800);
});

  it("numera parcelas e distribui centavos sem aumentar o total da compra", async () => {
    const account = await agent.post("/accounts").send({ name: "Compras", balance: 0 }).expect(201);
    const category = await prisma.category.create({ data: { name: "Compras", type: "EXPENSE", userId } });

    await agent.post("/transactions").send({
      description: "Compra parcelada", amount: 1000, type: "EXPENSE",
      accountId: account.body.id, categoryId: category.id,
      create_at: "2026-09-15T00:00:00.000Z", installments: 6,
    }).expect(201);

    const installments = await prisma.transaction.findMany({
      where: { accountId: account.body.id }, orderBy: { installmentNumber: "asc" },
    });
    expect(installments.map((item) => item.installmentNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(installments.every((item) => item.installmentCount === 6)).toBe(true);
    expect(installments.map((item) => item.amount)).toEqual([166.67, 166.67, 166.67, 166.67, 166.66, 166.66]);
    expect(installments.reduce((sum, item) => sum + Math.round(item.amount * 100), 0)).toBe(100000);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: account.body.id } })).balance).toBe(0);
  });

  it("recusa pagamento sem saldo sem alterar a parcela", async () => {
    const { accountId, installments } = await createInstallments(100);
    const firstId = installments[0]!.id;

    const response = await agent.post(`/transactions/${firstId}/pay`).expect(400);
    expect(response.body.error).toBe("Saldo insuficiente para pagar a parcela");

    const [account, installment] = await Promise.all([
      prisma.account.findUniqueOrThrow({ where: { id: accountId } }),
      prisma.transaction.findUniqueOrThrow({ where: { id: firstId } }),
    ]);
    expect(account.balance).toBe(100);
    expect(installment.balanceApplied).toBe(false);
    expect(installment.paidAt).toBeNull();
  });

  it("não conta parcelas pendentes como despesas realizadas no dashboard", async () => {
    const { accountId } = await createInstallments(1200);

    const response = await agent.get("/dashboards?month=2027-01").expect(200);

    expect(response.body.currentAmount).toBe(1200);
    expect(response.body.monthExpense).toBe(0);
    expect(response.body.ExpensePerCategory).toEqual([]);
    expect(await prisma.transaction.count({ where: { accountId, balanceApplied: false } })).toBe(3);
  });

  it("lista compromissos no mês previsto mesmo após pagar antecipadamente", async () => {
    const { installments } = await createInstallments(1200);

    const all = await agent.get("/transactions").expect(200);
    expect(all.body).toHaveLength(3);
    expect(all.body.every((transaction: { balanceApplied: boolean }) => transaction.balanceApplied === false)).toBe(true);

    const february = await agent.get("/transactions?create_at=2027-02").expect(200);
    expect(february.body).toHaveLength(1);
    expect(february.body[0]).toMatchObject({ id: installments[1]!.id, balanceApplied: false });

    await agent.post(`/transactions/${installments[0]!.id}/pay`).expect(200);
    const january = await agent.get("/transactions?create_at=2027-01").expect(200);
    expect(january.body).toHaveLength(1);
    expect(january.body[0]).toMatchObject({ id: installments[0]!.id, balanceApplied: true });
    expect(january.body[0].paidAt).toEqual(expect.any(String));
  });

  it("conta parcela paga no mês do pagamento, não no mês previsto", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const scheduledDate = new Date(futureYear, 0, 15).toISOString();
    const { installments } = await createInstallments(1200, scheduledDate);
    const first = installments[0]!;

    const payment = await agent.post(`/transactions/${first.id}/pay`).expect(200);
    const paidAt = new Date(payment.body.paidAt as string);
    const paymentMonth = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
    const scheduledMonth = `${futureYear}-01`;

    const actual = await agent.get(`/dashboards?month=${paymentMonth}`).expect(200);
    expect(actual.body.monthExpense).toBe(400);
    expect(actual.body.ExpensePerCategory).toMatchObject([
      { categoryId: first.categoryId, _sum: { amount: 400 } },
    ]);

    const future = await agent.get(`/dashboards?month=${scheduledMonth}`).expect(200);
    expect(future.body.monthExpense).toBe(0);
    expect(future.body.ExpensePerCategory).toEqual([]);
  });

  it("não conta parcelas pendentes como valor gasto do orçamento", async () => {
    const { installments } = await createInstallments(1200);
    const categoryId = installments[0]!.categoryId;
    await prisma.category.update({ where: { id: categoryId }, data: { budgetLimit: 500 } });

    const response = await agent.get("/budgets?month=2027-01").expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({ categoryId, limit: 500, spent: 0 });
  });

  it("conta parcela paga no orçamento do mês do pagamento", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const scheduledDate = new Date(futureYear, 0, 15).toISOString();
    const { installments } = await createInstallments(1200, scheduledDate);
    const first = installments[0]!;
    await prisma.category.update({ where: { id: first.categoryId }, data: { budgetLimit: 500 } });

    const payment = await agent.post(`/transactions/${first.id}/pay`).expect(200);
    const paidAt = new Date(payment.body.paidAt as string);
    const paymentMonth = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;

    const actual = await agent.get(`/budgets?month=${paymentMonth}`).expect(200);
    expect(actual.body).toHaveLength(1);
    expect(actual.body[0]).toMatchObject({ categoryId: first.categoryId, spent: 400 });

    const future = await agent.get(`/budgets?month=${futureYear}-01`).expect(200);
    expect(future.body).toHaveLength(1);
    expect(future.body[0]).toMatchObject({ categoryId: first.categoryId, spent: 0 });
  });

  it("inclui parcelas pagas no mês ao calcular o aviso de orçamento", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const { accountId, installments } = await createInstallments(1200, new Date(futureYear, 0, 15).toISOString());
    const categoryId = installments[0]!.categoryId;
    await prisma.category.update({ where: { id: categoryId }, data: { budgetLimit: 500 } });
    await agent.post(`/transactions/${installments[0]!.id}/pay`).expect(200);

    const response = await agent.post("/transactions").send({
      description: "Outra compra", amount: 150, type: "EXPENSE", accountId,
      categoryId, create_at: new Date().toISOString(), installments: 1,
    }).expect(201);

    expect(response.body.warning).toContain("Gasto: R$ 550.00");
  });

  it("usa o mês pago ao recalcular o aviso após editar uma parcela paga", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const { installments } = await createInstallments(1200, new Date(futureYear, 0, 15).toISOString());
    const first = installments[0]!;
    await prisma.category.update({ where: { id: first.categoryId }, data: { budgetLimit: 300 } });
    await agent.post(`/transactions/${first.id}/pay`).expect(200);

    const response = await agent.put(`/transactions/${first.id}`).send({ description: "Passagens corrigidas" }).expect(200);

    expect(response.body.warning).toContain("Gasto: R$ 400.00");
  });

  it("avisa quando o pagamento da parcela ultrapassa o orçamento do mês", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const { installments } = await createInstallments(1200, new Date(futureYear, 0, 15).toISOString());
    const first = installments[0]!;
    await prisma.category.update({ where: { id: first.categoryId }, data: { budgetLimit: 300 } });

    const response = await agent.post(`/transactions/${first.id}/pay`).expect(200);

    expect(response.body.balanceApplied).toBe(true);
    expect(response.body.warning).toContain("Gasto: R$ 400.00");
  });

  it("editar e excluir parcelas pendentes não altera o saldo", async () => {
    const { accountId, installments } = await createInstallments(1200);
    const firstId = installments[0]!.id;
    const secondId = installments[1]!.id;

    await agent.put(`/transactions/${firstId}`).send({ amount: 450 }).expect(200);
    const edited = await prisma.transaction.findUniqueOrThrow({ where: { id: firstId } });
    expect(edited.amount).toBe(450);
    expect(edited.balanceApplied).toBe(false);
    expect(edited.installmentNumber).toBe(1);
    expect(edited.installmentCount).toBe(3);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);

    await agent.delete(`/transactions/${secondId}`).expect(204);
    expect(await prisma.transaction.count({ where: { accountId } })).toBe(2);
    const remaining = await prisma.transaction.findMany({ where: { accountId }, orderBy: { installmentNumber: "asc" } });
    expect(remaining.map((item) => item.installmentNumber)).toEqual([1, 3]);
    expect(remaining.every((item) => item.installmentCount === 3)).toBe(true);
    expect((await prisma.account.findUniqueOrThrow({ where: { id: accountId } })).balance).toBe(1200);
  });
});
