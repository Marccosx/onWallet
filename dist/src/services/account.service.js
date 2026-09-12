import prisma from "../lib/prisma.js";
export class AccountService {
    async getAccounts() {
        // Implement the logic to retrieve accounts from the database
        try {
            const accounts = await prisma.account.findMany();
            return accounts;
        }
        catch (error) {
            throw new Error("Error retrieving accounts");
        }
    }
    async createAccount(accountData) {
        // Implement the logic to create a new account in the database
        if (!accountData) {
            throw new Error("Account data is missing");
        }
        if (accountData.balance < 0) {
            throw new Error("Balance cannot be negative");
        }
        if (!accountData.name) {
            throw new Error("Name field cannot be null");
        }
        try {
            const account = await prisma.account.create({
                data: accountData,
            });
            return account;
        }
        catch (error) {
            throw new Error("Error creating account");
        }
    }
    async getAccountById(accountId) {
        if (!accountId) {
            throw new Error("Account ID is missing");
        }
        try {
            const account = await prisma.account.findUnique({ where: { id: accountId } });
            if (!account) {
                throw new Error("Account not found");
            }
            return account;
        }
        catch (error) {
            throw new Error("Error retrieving account");
        }
    }
    async updateAccount(accountId, accountData) {
        if (!accountId) {
            throw new Error("Account ID is missing");
        }
        let account = await this.getAccountById(accountId);
        if (!account) {
            throw new Error("Account not found");
        }
        try {
            account = await prisma.account.update({ where: { id: accountId }, data: accountData });
            return account;
        }
        catch (error) {
            throw new Error("Error updating account");
        }
    }
    async deleteAccount(accountId) {
        let account = await this.getAccountById(accountId);
        let transactionsCount = await prisma.transaction.count({ where: { accountId: accountId } });
        if (!account) {
            throw new Error("Account not found");
        }
        if (transactionsCount > 0) {
            throw new Error("Cannot delete account with existing transactions");
        }
        try {
            account = await prisma.account.delete({ where: { id: accountId } });
        }
        catch (error) {
            throw new Error("Error deleting account");
        }
    }
}
export default AccountService;
//# sourceMappingURL=account.service.js.map