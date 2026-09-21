import type { Account } from "@prisma/client";
import type { IAccountService } from "../interfaces/IAccountService.js";
import prisma from "../lib/prisma.js";
import { currentUserId } from "../lib/auth.js";
import { calculateGoal, parseGoal, validateMoney } from "../lib/account-goal.js";

function inputObject(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Informe os dados da caixinha.");
    return input as Record<string, unknown>;
}

function optionalText(value: unknown, field: string): string | null | undefined {
    if (value === undefined || value === null) return value;
    if (typeof value !== "string") throw new Error(`${field} deve ser um texto.`);
    return value.trim();
}

function withGoal(account: Account) {
    return { ...account, goalPlan: calculateGoal(account, account.balance) };
}

export class AccountService implements IAccountService {
    async getAccounts() {
        const accounts = await prisma.account.findMany({ where: { userId: currentUserId() } });
        return accounts.map(withGoal);
    }

    async createAccount(input: unknown) {
        const data = inputObject(input);
        const name = optionalText(data.name, "Nome");
        if (!name) throw new Error("Informe o nome da caixinha.");
        const balance = validateMoney(data.balance ?? 0, "Saldo");
        const goal = parseGoal(data);
        calculateGoal(goal, balance);
        const account = await prisma.account.create({ data: {
            name, balance, tag: optionalText(data.tag, "Tag") ?? null,
            color: optionalText(data.color, "Cor") ?? null, ...goal, userId: currentUserId(),
        } });
        return withGoal(account);
    }

    async getAccountById(id: string) {
        const account = await prisma.account.findFirst({ where: { id, userId: currentUserId() } });
        return account ? withGoal(account) : null;
    }

    async updateAccount(id: string, input: unknown) {
        const account = await this.getAccountById(id);
        if (!account) throw new Error("Caixinha não encontrada.");
        const data = inputObject(input);
        const goal = parseGoal(data, account);
        const name = data.name === undefined ? account.name : optionalText(data.name, "Nome");
        if (!name) throw new Error("Informe o nome da caixinha.");
        const balance = data.balance === undefined ? undefined : validateMoney(data.balance, "Saldo");
        calculateGoal(goal, balance ?? account.balance);
        const updated = await prisma.account.update({ where: { id, userId: currentUserId() }, data: {
            name, ...goal,
            ...(balance === undefined ? {} : { balance }),
            ...(data.tag === undefined ? {} : { tag: optionalText(data.tag, "Tag") ?? null }),
            ...(data.color === undefined ? {} : { color: optionalText(data.color, "Cor") ?? null }),
        } });
        return withGoal(updated);
    }

    async deleteAccount(id: string) {
        const account = await this.getAccountById(id);
        if (!account) throw new Error("Caixinha não encontrada.");
        const count = await prisma.transaction.count({ where: { OR: [{ accountId: id }, { destinationAccountId: id }] } });
        if (count > 0) throw new Error("Não é possível excluir uma caixinha com movimentações.");
        await prisma.account.delete({ where: { id, userId: currentUserId() } });
    }
}

export default AccountService;
