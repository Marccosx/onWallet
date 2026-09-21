export interface GoalPlan {
    remaining: number;
    progress: number;
    startMonth: string;
    status: 'COMPLETED' | 'OVERDUE' | 'PLANNED';
    months: number;
    monthlyAmount: number | null;
    lastContribution: number | null;
    completionMonth: string | null;
}

interface IAccount {
    id: string;
    name: string;
    tag?: string;
    balance: number;
    color: string;
    goalAmount?: number | null;
    goalMode?: 'DEADLINE' | 'MONTHLY' | null;
    goalStartMonth?: string | null;
    goalTargetMonth?: string | null;
    goalMonthlyAmount?: number | null;
    goalPlan?: GoalPlan | null;
}

interface ICategory{
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    icon?: string;
    budgetLimit?: number;
}

interface ITransaction {
    warning?: string;
    id: string;
    description: string;
    amount: number;
    create_at: string;
    accountId: string;
    destinationAccountId?: string;
    categoryId: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface IBudget{
    id: string;
    categoryId: string;
    month: string;
    limit: number;
    spent?: number;
} 

export type { IAccount, ICategory, ITransaction, IBudget };
