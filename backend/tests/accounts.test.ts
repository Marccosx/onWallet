import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import PasswordService from "../src/services/Password.service.js";

describe("Caixinhas e metas pela API", () => {
  let userId: string;
  let agent: ReturnType<typeof request.agent>;
  const goal = { goalAmount: 6000, goalMode: "MONTHLY", goalStartMonth: "2030-10", goalMonthlyAmount: 600 };
  beforeEach(async () => {
    const email = `${randomUUID()}@example.com`;
    const user = await prisma.user.create({ data: { name: "Teste caixinha", email,
      passwordHash: await new PasswordService().generateHash("SenhaTeste123!") } });
    userId = user.id;
    agent = request.agent(app);
    await agent.post("/auth/login").send({ email, password: "SenhaTeste123!" }).expect(200);
  });
  afterEach(async () => {
    if (!userId) return;
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
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
});
