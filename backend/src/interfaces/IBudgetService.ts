import type {Budget} from "@prisma/client";


export interface IBudgetService{

    getBudgets(data: string): Promise<(Budget & {spent: number})[]>
    getBudgetById(id: string): Promise<Budget | null>
    createBudget(data: any): Promise<Budget>
    updateBudget(id: string, data: any): Promise<Budget>
    deleteBudget(id: string): Promise<void>
}