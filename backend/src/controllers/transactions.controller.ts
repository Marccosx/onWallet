import type { Request, Response } from "express";
import type {ITransactionService} from "../interfaces/ITransactionService.js";

export class TransactionController {

    constructor(private transactionService: ITransactionService) {}

    async getTransactions(req: Request, res: Response) {
        const data = req.query.create_at as string;

        try {
            const transactions = await this.transactionService.getAllTransactions(data);
            res.json(transactions);
        } catch (error) {
            res.status(404).json({ error: (error as Error).message });
        }
    }

    async getTransactionById(req: Request, res: Response) {
        const id = req.params.id as string;
        if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            const transaction = await this.transactionService.getTransactionById(id);
            res.json(transaction);
        } catch (error) {
            res.status(404).json({ error: (error as Error).message });
        }
    }

    async createTransaction(req: Request, res: Response) {
        const data = req.body;
        if(!data){
            res.status(400).json({error: "Request body is missing"});
            return;
        }
        try {
            const transaction = await this.transactionService.createTransaction(data);
            res.status(201).json(transaction);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    async updateTransaction(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = req.body;
        if(!data){
            res.status(400).json({error: "Request body is missing"});
            return;
        }else if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            const transaction = await this.transactionService.updateTransaction(id, data);
            res.json(transaction);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    async deleteTransaction(req: Request, res: Response) {
        const id = req.params.id as string;
        if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            await this.transactionService.deleteTransaction(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }   
    }
}

export default TransactionController;