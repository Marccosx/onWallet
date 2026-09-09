interface IAccount {
    id: string;
    name: string;
    tag?: string;
    balance: number;
    color: string;
}

interface ICategory {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: string;
}

interface ITransaction {
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