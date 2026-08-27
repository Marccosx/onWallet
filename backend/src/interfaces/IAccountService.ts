import type { Account } from "@prisma/client";

export interface IAccountService{

    getAccounts(): Promise<Account[]>
    getAccountById(id: string): Promise<Account | null>
    createAccount(data: unknown): Promise<Account>
    updateAccount(id: string, data: unknown): Promise<Account>
    deleteAccount(id: string): Promise<void>
}