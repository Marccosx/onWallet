import type { Request, Response } from "express";
import type { ITransactionService } from "../interfaces/ITransactionService.js";
export declare class TransactionController {
    private transactionService;
    constructor(transactionService: ITransactionService);
    getTransactions(req: Request, res: Response): Promise<void>;
    getTransactionById(req: Request, res: Response): Promise<void>;
    createTransaction(req: Request, res: Response): Promise<void>;
    updateTransaction(req: Request, res: Response): Promise<void>;
    deleteTransaction(req: Request, res: Response): Promise<void>;
}
export default TransactionController;
//# sourceMappingURL=transactions.controller.d.ts.map