import type { Transaction } from "@prisma/client";
import type { ITransactionService } from "../interfaces/ITransactionService.js";
import prisma from "../lib/prisma.js";

export class TransactionService implements ITransactionService {

  async getAllTransactions(data: string): Promise<Transaction[]> {
    if (data) {
        
      try {
        const [year, month] = data.split("-");
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 1);
        const transaction = await prisma.transaction.findMany({
          where: { create_at: { lte: endDate, gte: startDate } },
        });
        return transaction;
      } catch (error) {
        throw new Error("Transactions not founds");
      }
    } else {
      try {
        const transaction = await prisma.transaction.findMany();
        return transaction;
      } catch (error) {
        throw new Error("Transactions not founds");
      }
    }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: id },
    });
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return transaction;
  }

  async createTransaction(data: any): Promise<Transaction> {
    if (!data) {
      throw new Error("Transaction data is required");
    }else if (!data.accountId ) {
      throw new Error("Missing accountId required transaction fields");
    }else if (!data.amount) {
      throw new Error("Missing amount required transaction fields");
    }else if (!data.type) {
      throw new Error("Missing type required transaction fields");
    }
    const type = data.type;
    try {
      const [transaction] = await prisma.$transaction([
         prisma.transaction.create({ data: data }),
         prisma.account.update({
            where: {id: data.accountId}, 
            data:{
                balance:{
                     increment: type === "INCOME" ? data.amount : 0,
                     decrement: type === "EXPENSE" ? data.amount : 0,
                    }
                }
            }),
        ]);
        return transaction;  

    } catch (error) {
      throw new Error("Error creating transaction");
    }
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    let transaction = await this.getTransactionById(id);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    try {
      const [transactionRevert,updatedTransaction ] = await prisma.$transaction([
            prisma.account.update({
                where:{id: transaction.accountId},
                data:{
                    balance:{
                        increment: transaction.type === "EXPENSE" ? transaction.amount : 0,
                        decrement: transaction.type === "INCOME" ? transaction.amount : 0,
                    }
                }
            }),
            prisma.transaction.update({
                where: { id: id },
                data: data,
            }),
            prisma.account.update({where:{id: data.accountId},
                data:{
                    balance:{
                        increment: data.type === "INCOME" ? data.amount : 0,
                        decrement: data.type === "EXPENSE" ? data.amount : 0,
                    }
                }
            }),
        ]);
    return updatedTransaction;
    } catch (error) {
        throw new Error("Error updating transaction");
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    let transaction = await this.getTransactionById(id);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    try {
      await prisma.$transaction(async (prisma) => {
          await prisma.account.update({
            where: { id: transaction.accountId },
            data: {
              balance: {
                increment: transaction.type === "EXPENSE" ? transaction.amount : 0,
                decrement: transaction.type === "INCOME" ? transaction.amount : 0,
              }
            }
        });
        await prisma.transaction.delete({ where: { id: id } });
      });
    } catch (error) {
      throw new Error("Error deleting transaction");
    }
  }

}

export default TransactionService;