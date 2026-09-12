import type { Transaction } from "@prisma/client";
import type { ITransactionService } from "../interfaces/ITransactionService.js";
export declare class TransactionService implements ITransactionService {
    getAllTransactions(data: string): Promise<Transaction[]>;
    getTransactionById(id: string): Promise<Transaction>;
    createTransaction(data: any): Promise<Transaction>;
    updateTransaction(id: string, data: any): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
}
export default TransactionService;
//# sourceMappingURL=transactions.service.d.ts.map