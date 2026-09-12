import type { Transaction } from "@prisma/client";
export interface ITransactionService {
    getAllTransactions(data: string): Promise<Transaction[]>;
    getTransactionById(id: string): Promise<Transaction>;
    createTransaction(data: any): Promise<Transaction>;
    updateTransaction(id: string, data: any): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
}
//# sourceMappingURL=ITransactionService.d.ts.map