import type { Transaction } from "@prisma/client";
import type { ITransactionService } from "../interfaces/ITransactionService.js";
import prisma from "../lib/prisma.js";
import { currentUserId } from "../lib/auth.js";

type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER";
type TransactionInput = {
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  destinationAccountId: string | null;
  create_at: Date;
  notes: string | null;
};

function parseInput(data: any, previous?: Transaction): TransactionInput {
  const type = data.type ?? previous?.type;
  const amount = data.amount ?? previous?.amount;
  const description = data.description ?? previous?.description;
  const accountId = data.accountId ?? previous?.accountId;
  const categoryId = data.categoryId ?? previous?.categoryId;
  const destinationAccountId = type === "TRANSFER" ? (data.destinationAccountId ?? previous?.destinationAccountId ?? null) : null;
  const create_at = new Date(data.create_at ?? previous?.create_at ?? new Date());
  const notes = data.notes ?? previous?.notes ?? null;

  if (!["EXPENSE", "INCOME", "TRANSFER"].includes(type) || typeof description !== "string" || !description.trim() ||
      typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 ||
      typeof accountId !== "string" || !accountId || typeof categoryId !== "string" || !categoryId ||
      Number.isNaN(create_at.getTime())) {
    throw new Error("Dados da transação inválidos");
  }
  if (type === "TRANSFER" && (!destinationAccountId || destinationAccountId === accountId)) {
    throw new Error("Selecione uma caixinha de destino diferente da origem");
  }
  return { description: description.trim(), amount, type, accountId, categoryId, destinationAccountId, create_at, notes };
}

export class TransactionService implements ITransactionService {
  private async checkReferences(tx: any, input: TransactionInput): Promise<void> {
    const userId = currentUserId();
    const [account, category, destination] = await Promise.all([
      tx.account.findFirst({ where: { id: input.accountId, userId } }),
      tx.category.findFirst({ where: { id: input.categoryId, userId } }),
      input.destinationAccountId ? tx.account.findFirst({ where: { id: input.destinationAccountId, userId } }) : Promise.resolve(null),
    ]);
    if (!account || !category || (input.destinationAccountId && !destination)) {
      throw new Error("Caixinha ou categoria não encontrada para este usuário");
    }
    if (input.type !== "TRANSFER" && category.type !== input.type) {
      throw new Error("A categoria não corresponde ao tipo da transação");
    }
  }

  private addBalance(changes: Map<string, number>, id: string, amount: number): void {
    changes.set(id, (changes.get(id) ?? 0) + amount);
  }

  private applyBalance(changes: Map<string, number>, input: TransactionInput, direction: 1 | -1): void {
    const sourceChange = input.type === "INCOME" ? input.amount : -input.amount;
    this.addBalance(changes, input.accountId, sourceChange * direction);
    if (input.type === "TRANSFER" && input.destinationAccountId) {
      this.addBalance(changes, input.destinationAccountId, input.amount * direction);
    }
  }

  private async persistBalance(tx: any, changes: Map<string, number>): Promise<void> {
    for (const [id, amount] of changes) {
      if (amount !== 0) {
        await tx.account.update({
          where: { id, userId: currentUserId() },
          data: { balance: amount > 0 ? { increment: amount } : { decrement: -amount } },
        });
      }
    }
  }

  async getAllTransactions(data: string): Promise<Transaction[]> {
    let dateFilter = {};
    if (data) {
      const [year, month] = data.split("-").map(Number);
      if (!year || !month || month < 1 || month > 12) throw new Error("Mês inválido");
      dateFilter = { create_at: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } };
    }
    return prisma.transaction.findMany({ where: { account: { userId: currentUserId() }, ...dateFilter } });
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await prisma.transaction.findFirst({ where: { id, account: { userId: currentUserId() } } });
    if (!transaction) throw new Error("Transação não encontrada");
    return transaction;
  }

  async createTransaction(data: any): Promise<Transaction> {
    const input = parseInput(data);
    const installments = data.installments ?? 1;
    if (!Number.isInteger(installments) || installments < 1 || installments > 24 || (installments > 1 && input.type !== "EXPENSE")) {
      throw new Error("Parcelas inválidas");
    }
    const transaction = await prisma.$transaction(async (tx) => {
      await this.checkReferences(tx, input);
      let first: Transaction | undefined;
      for (let i = 0; i < installments; i++) {
        const date = new Date(input.create_at);
        date.setUTCMonth(date.getUTCMonth() + i);
        const created = await tx.transaction.create({
          data: {
            ...input,
            amount: input.amount / installments,
            description: installments > 1 ? `${input.description} (${i + 1}/${installments})` : input.description,
            create_at: date,
          },
        });
        if (!first) first = created;
      }
      const changes = new Map<string, number>();
      this.applyBalance(changes, input, 1);
      await this.persistBalance(tx, changes);
      return first!;
    });
    const warning = input.type === "EXPENSE" ? await this.checkBudgetWarning(input.categoryId, input.create_at) : undefined;
    return { ...transaction, warning } as Transaction;
  }

  private async checkBudgetWarning(categoryId: string, date: Date): Promise<string | undefined> {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: currentUserId() } });
    if (!category) return undefined;
    const budget = await prisma.budget.findFirst({ where: { categoryId, month: { gte: start, lt: end } } });
    const limit = budget?.limit ?? category.budgetLimit ?? 0;
    if (limit <= 0) return undefined;
    const result = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { categoryId, type: "EXPENSE", account: { userId: currentUserId() }, create_at: { gte: start, lt: end } },
    });
    const spent = result._sum.amount ?? 0;
    return spent > limit ? `Atenção: Você estourou o orçamento desta categoria! (Gasto: R$ ${spent.toFixed(2)} / Limite: R$ ${limit.toFixed(2)})` : undefined;
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findFirst({ where: { id, account: { userId: currentUserId() } } });
      if (!previous) throw new Error("Transação não encontrada");
      const input = parseInput(data, previous);
      await this.checkReferences(tx, input);
      const changes = new Map<string, number>();
      this.applyBalance(changes, parseInput(previous), -1);
      this.applyBalance(changes, input, 1);
      const transaction = await tx.transaction.update({ where: { id, account: { userId: currentUserId() } }, data: input });
      await this.persistBalance(tx, changes);
      return transaction;
    });
    const warning = updated.type === "EXPENSE" ? await this.checkBudgetWarning(updated.categoryId, updated.create_at) : undefined;
    return { ...updated, warning } as Transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findFirst({ where: { id, account: { userId: currentUserId() } } });
      if (!previous) throw new Error("Transação não encontrada");
      const changes = new Map<string, number>();
      this.applyBalance(changes, parseInput(previous), -1);
      await tx.transaction.delete({ where: { id, account: { userId: currentUserId() } } });
      await this.persistBalance(tx, changes);
    });
  }
}

export default TransactionService;
