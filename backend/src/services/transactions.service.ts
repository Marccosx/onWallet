import type { Transaction } from "@prisma/client";
import type { ITranscationService } from "../interfaces/ITransactionService.js";
import prisma from "../lib/prisma.js";

export class TransactionService implements ITranscationService{

    getAllTransactions(data: string): Promise<Transaction[]> {
        try{
            const transaction = await prisma.transaction.findMany({where: {type: data}})
            return transaction;
        }catch(error){
            throw new Error("Categories not founds")
        }
    }

    getTransactionById(): Promise<Transaction> {
        
    }
    
    createTransaction(): Promise<Transaction> {
        
    }

    updateTransaction(): Promise<Transaction> {
        
    }

    deleteTransaction(): Promise<void> {
        
    }

    searchLastTransaction(): Promise<[]> {
        
    }
}