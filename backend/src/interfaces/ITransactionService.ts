import type { Transaction } from "@prisma/client";

export interface ITranscationService{

    getAllTransactions(): Promise<Transaction[]>
    getTransactionById(): Promise<Transaction>
    createTransaction(): Promise<Transaction>
    updateTransaction(): Promise<Transaction>
    deleteTransaction(): Promise<void>
    searchLastTransaction(): Promise<[]>
}