import type { Category, Transaction,Account } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type { dashBoardDTO } from "../Dtos/dashboardDTO.js";
import type { IDashboardService } from "../interfaces/IDashboardService.js";

export class DashboardService implements IDashboardService {

    public async getSumary(data:string): Promise<dashBoardDTO>{
        if(!data){
            throw new Error ("Error, data is missing to get sumary")
        }
        const cA = await this.getAmountAccountsByMonth();
        const TotalIncome = await this.getIncomesTransactions(data);
        const mExpense = await this.getExpenseTransactions(data);
        const ExpensePerCategory= await this.getExpenseTransactionsPerCategory(data);

        const monthRecipe = TotalIncome._sum.amount || 0;
        const currentAmount = cA._sum.balance || 0;
        const monthExpense = mExpense._sum.amount || 0;
        


        const Dashboard: dashBoardDTO = 
        {currentAmount, monthExpense, monthRecipe, ExpensePerCategory: ExpensePerCategory ?? []}

        return Dashboard;

    }

    private async getAmountAccountsByMonth(){
        try{
            const AmountAccounts = await prisma.account.aggregate({
                _sum: {balance:true},
            });
            return AmountAccounts;
        }catch(error){
            throw new Error ("Error for searching accounts balance")
        }
    }

    private async getIncomesTransactions(data: any){
        if(!data){
            throw new Error ("Error, data is missing for income transactions")
        }
        const date = this.getDate(data)
        try{
            const IncomeTransactions = await prisma.transaction.aggregate({
                _sum: {amount:true},
                where:{create_at: {lte:date[1], gte:date[0]}, type:'INCOME'}
            });
            return IncomeTransactions;
        }catch(error){
            throw new Error ("Error for searching accounts balance")
        }
    }
    private async getExpenseTransactions(data: any){
        if(!data){
            throw new Error ("Error, data is missing for get expense transactions")
        }
        const date = this.getDate(data)
        try{
            const ExpenseTransactions = await prisma.transaction.aggregate({
                _sum: {amount:true},
                where:{create_at: {lte:date[1], gte:date[0]}, type:'EXPENSE'}
            });
            return ExpenseTransactions;
        }catch(error){
            throw new Error ("Error for searching accounts balance")
        }

    }

    private async  getExpenseTransactionsPerCategory(data: any){
        if(!data){
            throw new Error ("Error, data is missing for get expense transactions")
        }
        const date = this.getDate(data)
        try{
            const CategoriesTransactions = await prisma.transaction.groupBy({
                by:['categoryId'],
                _sum:{amount:true},
                where:{create_at: {lte:date[1], gte:date[0]}, type:'EXPENSE'},
                orderBy: {_count: {amount: 'desc'}}
        });
        return CategoriesTransactions || null;
        }catch(error){

        }
    }

    private getDate(data:string): [Date, Date]{
        if(!data){
            throw new Error ("Error, data is missing for get Date")
        }
        const [year, month] = data.split("-");
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 1);
        return [startDate, endDate]
    }
}export default DashboardService;