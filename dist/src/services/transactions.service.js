import prisma from "../lib/prisma.js";
export class TransactionService {
    async getAllTransactions(data) {
        if (data) {
            try {
                const [year, month] = data.split("-");
                const startDate = new Date(Number(year), Number(month) - 1, 1);
                const endDate = new Date(Number(year), Number(month), 1);
                const transaction = await prisma.transaction.findMany({
                    where: { create_at: { lte: endDate, gte: startDate } },
                });
                return transaction;
            }
            catch (error) {
                throw new Error(error.message);
            }
        }
        else {
            try {
                const transaction = await prisma.transaction.findMany();
                return transaction;
            }
            catch (error) {
                throw new Error(error.message);
            }
        }
    }
    async getTransactionById(id) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: id },
        });
        if (!transaction) {
            throw new Error("Transaction data is required");
        }
        return transaction;
    }
    async createTransaction(data) {
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
        if (type === 'TRANSFER') {
            try {
                const [transaction] = await prisma.$transaction([
                    prisma.transaction.create({ data: data }),
                    prisma.account.update({
                        where: { id: data.accountId },
                        data: {
                            balance: { decrement: data.amount }
                        }
                    }),
                    prisma.account.update({
                        where: { id: data.destinationAccountId },
                        data: {
                            balance: { increment: data.amount }
                        }
                    }),
                ]);
                return transaction;
            }
            catch (error) {
                throw new Error(error.message);
            }
        }
        if (installments > 1) {
            const installmentAmount = data.amount / installments;
            const prismaOperations = [];
            for (let i = 1; i <= installments; i++) {
                const targetDate = new Date(data.create_at);
                targetDate.setMonth(targetDate.getMonth() + (i - 1));
                prismaOperations.push(prisma.transaction.create({
                    data: {
                        ...data,
                        amount: installmentAmount,
                        description: `${data.description} (${i}/${installments})`,
                        create_at: targetDate.toISOString(),
                        installments: undefined
                    }
                }));
            }
            prismaOperations.push(prisma.account.update({
                where: { id: data.accountId },
                data: { balance: { decrement: data.amount } }
            }));
            try {
                const result = await prisma.$transaction(prismaOperations);
                return result[0];
            }
            catch (error) {
                throw new Error(error.message);
            }
        }
        try {
            const [transaction] = await prisma.$transaction([
                prisma.transaction.create({ data: data }),
                prisma.account.update({
                    where: { id: data.accountId },
                    data: {
                        balance: type === "INCOME"
                            ? { increment: data.amount }
                            : { decrement: data.amount }
                    }
                }),
            ]);
            return transaction;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async updateTransaction(id, data) {
        let transaction = await this.getTransactionById(id);
        if (!transaction) {
            throw new Error("Transaction data is required");
        }
        if (transaction.type === "TRANSFER" && !transaction.destinationAccountId || data.type === "TRANSFER" && !data.destinationAccountId) {
            throw new Error("Transaction type tranfer needs a destination account");
        }
        // Mescla os dados antigos com os novos que vieram na requisição (Partial Update)
        const newData = { ...transaction, ...data };
        if (transaction.type === "TRANSFER") {
            //Mapa para somar os saldos
            const balanceChanges = {};
            //Reverte a transacao antiga
            balanceChanges[transaction.accountId] = (balanceChanges[transaction.accountId] || 0) + transaction.amount;
            if (transaction.destinationAccountId) {
                balanceChanges[transaction.destinationAccountId] = (balanceChanges[transaction.destinationAccountId] || 0) - transaction.amount;
            }
            // Aplica a nova transacao
            balanceChanges[data.accountId] = (balanceChanges[data.accountId] || 0) - data.amount;
            if (data.destinationAccountId) {
                balanceChanges[data.destinationAccountId] = (balanceChanges[data.destinationAccountId] || 0) + data.amount;
            }
            const accountUpdates = Object.entries(balanceChanges)
                .filter(([id, amountChange]) => amountChange !== 0)
                .map(([id, amountChange]) => {
                return prisma.account.update({
                    where: { id },
                    data: {
                        balance: amountChange > 0
                            ? { increment: amountChange }
                            : { decrement: Math.abs(amountChange) }
                    }
                });
            });
            try {
                const [updateTransaction] = await prisma.$transaction([
                    prisma.transaction.update({
                        where: { id },
                        data: data
                    }),
                    ...accountUpdates
                ]);
                return updateTransaction;
            }
            catch (error) {
                throw new Error(error.message);
            }
        }
        try {
            const [transactionRevert, updatedTransaction] = await prisma.$transaction([
                prisma.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: transaction.type === "EXPENSE"
                            ? { increment: transaction.amount }
                            : { decrement: transaction.amount }
                    }
                }),
                prisma.transaction.update({
                    where: { id: id },
                    data: data,
                }),
                prisma.account.update({ where: { id: newData.accountId },
                    data: {
                        balance: newData.type === "INCOME"
                            ? { increment: newData.amount }
                            : { decrement: newData.amount }
                    }
                }),
            ]);
            return updatedTransaction;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async deleteTransaction(id) {
        let transaction = await this.getTransactionById(id);
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (transaction.type === "TRANSFER" && transaction.destinationAccountId) {
            try {
                await prisma.$transaction([
                    //reverte o valor da conta remetente
                    prisma.account.update({
                        where: { id: transaction.accountId },
                        data: {
                            balance: { increment: transaction.amount }
                        }
                    }),
                    //reverte o valor da conta destino
                    prisma.account.update({
                        where: { id: transaction.destinationAccountId },
                        data: {
                            balance: { decrement: transaction.amount }
                        }
                    }),
                    prisma.transaction.delete({
                        where: { id: id }
                    }),
                ]);
                return;
            }
            catch (error) {
                throw new Error(error.message);
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
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
}
export default TransactionService;
//# sourceMappingURL=transactions.service.js.map