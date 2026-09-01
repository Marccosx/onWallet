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
    const requiredFields = ['accountId', 'amount', 'type'];
    if (!data) {
      throw new Error("Transaction data is required");
    }
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing ${field} required transaction fields`);
      }
    }
    const type = data.type;
    try {
      const [transaction] = await prisma.$transaction([
         prisma.transaction.create({ data: data }),
         prisma.account.update({
            where: {id: data.accountId}, 
            data:{
                balance: type === "INCOME" 
                  ? { increment: data.amount } 
                  : { decrement: data.amount }
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

    // Mescla os dados antigos com os novos que vieram na requisição (Partial Update)
    const newData = { ...transaction, ...data };

    try {
      const [transactionRevert,updatedTransaction ] = await prisma.$transaction([
            prisma.account.update({
                where:{id: transaction.accountId},
                data:{
                    balance: transaction.type === "EXPENSE" 
                      ? { increment: transaction.amount } 
                      : { decrement: transaction.amount }
                }
            }),
            prisma.transaction.update({
                where: { id: id },
                data: data,
            }),
            prisma.account.update({where:{id: newData.accountId},
                data:{
                    balance: newData.type === "INCOME" 
                      ? { increment: newData.amount } 
                      : { decrement: newData.amount }
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
              balance: transaction.type === "EXPENSE" 
                ? { increment: transaction.amount } 
                : { decrement: transaction.amount }
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