import type { IAccountService } from "../interfaces/IAccountService.js";
import  prisma  from "../lib/prisma.js";
import { currentUserId } from "../lib/auth.js";


export class AccountService implements IAccountService{

    async getAccounts(){
        // Implement the logic to retrieve accounts from the database
        try{
            const  accounts = await prisma.account.findMany({ where: { userId: currentUserId() } });
            return accounts;
        }catch(error){
            throw new Error("Error retrieving accounts");
        }
    }

    async createAccount(accountData: any){
        // Implement the logic to create a new account in the database
        if(!accountData) {
            throw new Error("Account data is missing");
        }
        if (accountData.balance < 0){
            throw new Error("Balance cannot be negative")
        }
        if(!accountData.name){
            throw new Error("Name field cannot be null")
        }
        try{
            const { name, tag, balance, color } = accountData;
            const account = await prisma.account.create({
                data: { name, tag, balance, color, userId: currentUserId() },
            });
            return account;
        }catch(error){
            throw new Error("Error creating account");
        }
    }

    async getAccountById(accountId: string){
        if(!accountId) {
            throw new Error("Account ID is missing");
        }
        try{
            const account = await prisma.account.findFirst({where: {id: accountId, userId: currentUserId()}});
            return account;
        }catch(error){
            throw new Error("Error retrieving account");
        }
    }

    async updateAccount(accountId: string, accountData:any){
        if(!accountId) {
            throw new Error("Account ID is missing");
        }
        let account = await this.getAccountById(accountId)
        if(!account){
            throw new Error("Account not found")
        }
        try{
            const { name, tag, color, balance } = accountData;
            if (balance !== undefined && (typeof balance !== "number" || !Number.isFinite(balance) || balance < 0)) {
                throw new Error("Saldo inválido");
            }
            account = await prisma.account.update({where: {id: accountId, userId: currentUserId()}, data: { name, tag, color, balance }})
            return account;
            
        }catch(error){
            throw new Error("Error updating account");
        }
    }

    async deleteAccount(accountId: string){
        let account = await this.getAccountById(accountId);
        let transactionsCount = await prisma.transaction.count({where: {OR: [{accountId: accountId}, {destinationAccountId: accountId}]}})
        if(!account){
            throw new Error("Account not found")
        }
        if(transactionsCount > 0){
            throw new Error("Cannot delete account with existing transactions")
        }
        try{
            account = await prisma.account.delete({where: {id: accountId, userId: currentUserId()}})
        }catch (error){
            throw new Error ("Error deleting account")
        }
    }
}

export default AccountService;
