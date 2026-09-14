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
        throw new Error((error as Error).message);
      }
    } else {
      try {
        const transaction = await prisma.transaction.findMany();
        return transaction;
      } catch (error) {
       throw new Error((error as Error).message);
      }
    }
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: id },
    });
    if (!transaction) {
      throw new Error("Transaction data is required");
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
    const installments = data.installments || 1;

    if(type === 'TRANSFER'){
      try{
        const [transaction] = await prisma.$transaction([
          prisma.transaction.create({ data: data }),
          prisma.account.update({
              where: {id: data.accountId}, 
              data:{ 
                balance: {decrement: data.amount}
              }
              }),
          prisma.account.update({
              where: {id: data.destinationAccountId},
              data: {
                balance: {increment: data.amount}
              }
            }),
          ]);
        return transaction;  
      }catch(error){
         throw new Error((error as Error).message);
      }
    }
    if(installments > 1 ){
      const installmentAmount = data.amount / installments;
      const prismaOperations = [];

      for(let i = 1; i <= installments; i++){
        const targetDate = new Date(data.create_at);
        targetDate.setMonth(targetDate.getMonth() + (i - 1))
        prismaOperations.push(
          prisma.transaction.create({
            data: {
              ...data,
              amount: installmentAmount,
              description: `${data.description} (${i}/${installments})`,
              create_at: targetDate.toISOString(),
              installments: undefined
            }
          })
        );
        
      }
      prismaOperations.push(
        prisma.account.update({
          where: {id: data.accountId},
          data: { balance: {decrement: data.amount}}
        })
      );

      try{
        const result = await prisma.$transaction(prismaOperations);
        return result[0] as Transaction;
      }catch(error){
        throw new Error((error as Error).message);
      }
    }
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
        
        let warning: string | undefined = undefined;
        if (type === "EXPENSE") {
          warning = await this.checkBudgetWarning(data.categoryId, new Date(data.create_at));
        }

        return { ...transaction, warning } as any;  

    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  // Novo método para checar se estourou o orçamento (Task 5.1)
  private async checkBudgetWarning(categoryId: string, date: Date): Promise<string | undefined> {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    // 1. Achar o limite (busca no Orçamento explícito ou no padrão da Categoria)
    let limit = 0;
    const explicitBudget = await prisma.budget.findFirst({
        where: { categoryId, month: { gte: startDate, lt: endDate } }
    });
    
    if (explicitBudget) {
        limit = explicitBudget.limit;
    } else {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (category && category.budgetLimit && category.budgetLimit > 0) {
            limit = category.budgetLimit;
        }
    }

    if (limit === 0) return undefined; // Nenhuma meta/limite definido

    // 2. Somar gastos do mês
    const result = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { categoryId, type: "EXPENSE", create_at: { gte: startDate, lt: endDate } }
    });
    
    const spent = result._sum.amount || 0;

    if (spent > limit) {
        return `Atenção: Você estourou o orçamento desta categoria! (Gasto: R$ ${spent.toFixed(2)} / Limite: R$ ${limit.toFixed(2)})`;
    }

    return undefined;
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    let transaction = await this.getTransactionById(id);
    if (!transaction ) {
      throw new Error("Transaction data is required");
    }if(transaction.type === "TRANSFER" && !transaction.destinationAccountId || data.type === "TRANSFER" && !data.destinationAccountId){
      throw new Error("Transaction type tranfer needs a destination account")
    }

    // Mescla os dados antigos com os novos que vieram na requisição (Partial Update)
    const newData = { ...transaction, ...data };
    if(transaction.type === "TRANSFER" ){
      //Mapa para somar os saldos
      const balanceChanges: Record<string, number> ={}
      //Reverte a transacao antiga
      balanceChanges[transaction.accountId] = (balanceChanges[transaction.accountId] || 0) + transaction.amount;
      if(transaction.destinationAccountId){
        balanceChanges[transaction.destinationAccountId] = (balanceChanges[transaction.destinationAccountId] || 0) - transaction.amount
      }
      // Aplica a nova transacao
      balanceChanges[data.accountId] = (balanceChanges[data.accountId] || 0) - data.amount;
      if(data.destinationAccountId){
        balanceChanges[data.destinationAccountId] = (balanceChanges[data.destinationAccountId] || 0) + data.amount;
      }

      const accountUpdates = Object.entries(balanceChanges)
                             .filter(([id, amountChange])=> amountChange !== 0)
                             .map(([id, amountChange])=>{
                              return prisma.account.update({
                                where:{id},
                                data:{
                                  balance: amountChange > 0 
                                  ? {increment:amountChange}
                                  :{decrement:Math.abs(amountChange)}
                                }
                              });
                            });
      try{
        const [updateTransaction] = await prisma.$transaction([
            prisma.transaction.update({
              where: {id},
              data: data
            }),
            ...accountUpdates
        ]);
        return updateTransaction;
      }catch(error){
        throw new Error((error as Error).message);
      }
    }
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
       throw new Error((error as Error).message);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    let transaction = await this.getTransactionById(id);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    if(transaction.type === "TRANSFER" && transaction.destinationAccountId){
      try{
        await prisma.$transaction([
           //reverte o valor da conta remetente
           prisma.account.update({
             where:{id: transaction.accountId},
             data:{
               balance: {increment: transaction.amount}
              }
            }),
            //reverte o valor da conta destino
            prisma.account.update({
              where: {id: transaction.destinationAccountId },
              data:{
                balance: {decrement: transaction.amount}
              }
            }),
            prisma.transaction.delete({
              where:{id: id}
            }),
          ])
          return;
      }catch(error){
        throw new Error((error as Error).message);
      }

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
      return;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

}

export default TransactionService;